import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

async function produto(agente, quantidade = 10) {
  const { body } = await agente.post('/api/produtos').send({ nome: 'Arroz', preco: 5, quantidade });
  return body.produto;
}

describe('Ajuste de estoque — dois modos (F4)', () => {
  it('entrada: soma as unidades que chegaram e registra como "entrada"', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 3);
    const res = await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 24 });
    expect(res.status).toBe(200);
    expect(res.body.produto.quantidade).toBe(27);
    const { body } = await agente.get(`/api/produtos/${p.id}/movimentacoes`);
    expect(body.movimentacoes[0]).toMatchObject({ tipo: 'entrada', quantidade: 24, saldoApos: 27, motivo: 'Chegou mercadoria' });
  });

  it('entrada aceita motivo próprio', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente);
    await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 5, motivo: 'Fornecedor Silva' });
    const { body } = await agente.get(`/api/produtos/${p.id}/movimentacoes`);
    expect(body.movimentacoes[0].motivo).toBe('Fornecedor Silva');
  });

  it('entrada exige pelo menos 1 unidade', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente);
    const res = await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 0 });
    expect(res.status).toBe(400);
  });

  it('contagem: define o saldo e registra a diferença como "ajuste"', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 10);
    const res = await agente
      .post(`/api/produtos/${p.id}/ajustes`)
      .send({ modo: 'contagem', quantidade: 7, motivo: 'Perda ou avaria' });
    expect(res.body.produto.quantidade).toBe(7);
    const { body } = await agente.get(`/api/produtos/${p.id}/movimentacoes`);
    expect(body.movimentacoes[0]).toMatchObject({ tipo: 'ajuste', quantidade: -3, saldoApos: 7, motivo: 'Perda ou avaria' });
  });

  it('sem "modo", vale contagem (compatível com o ajuste rápido da venda)', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 0);
    const res = await agente.post(`/api/produtos/${p.id}/ajustes`).send({ quantidade: 4, motivo: 'Correção' });
    expect(res.body.produto.quantidade).toBe(4);
  });

  it('recusa modo desconhecido e contagem sem motivo', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente);
    expect((await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'roubo', quantidade: 1 })).status).toBe(400);
    expect((await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'contagem', quantidade: 1 })).status).toBe(400);
  });

  it('não deixa o estoque passar do limite', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 999_999);
    const res = await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 10 });
    expect(res.status).toBe(400);
  });
});

describe('Histórico de movimentações', () => {
  it('explica o saldo: cadastro, venda, cancelamento, entrada e ajuste (mais recentes primeiro)', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 10);
    const { body: v } = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 2 }] });
    await agente.post(`/api/vendas/${v.venda.id}/cancelar`).send({ motivo: 'Cliente desistiu' });
    await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 5 });
    await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'contagem', quantidade: 14, motivo: 'Contagem' });

    const { body } = await agente.get(`/api/produtos/${p.id}/movimentacoes`);
    expect(body.movimentacoes.map((m) => [m.tipo, m.quantidade, m.saldoApos])).toEqual([
      ['ajuste', -1, 14],
      ['entrada', 5, 15],
      ['cancelamento', 2, 10],
      ['venda', -2, 8],
      ['cadastro', 10, 10],
    ]);
    expect(body.movimentacoes[3].vendaId).toBe(v.venda.id);
    expect(body.temMais).toBe(false);
  });

  it('pagina o histórico', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, 1);
    for (let i = 0; i < 4; i++) await agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 1 });
    const pag1 = (await agente.get(`/api/produtos/${p.id}/movimentacoes?limite=3`)).body;
    expect(pag1.movimentacoes).toHaveLength(3);
    expect(pag1.temMais).toBe(true);
    const pag2 = (await agente.get(`/api/produtos/${p.id}/movimentacoes?limite=3&antesDe=${pag1.movimentacoes.at(-1).id}`)).body;
    expect(pag2.movimentacoes).toHaveLength(2);
    expect(pag2.temMais).toBe(false);
  });

  it('isolamento: uma loja não vê nem ajusta o estoque de outra', async () => {
    const lojaA = await criarLojaLogada();
    const lojaB = await criarLojaLogada();
    const p = await produto(lojaA.agente, 10);
    expect((await lojaB.agente.get(`/api/produtos/${p.id}/movimentacoes`)).status).toBe(404);
    expect((await lojaB.agente.post(`/api/produtos/${p.id}/ajustes`).send({ modo: 'entrada', quantidade: 5 })).status).toBe(404);
    expect((await lojaA.agente.get(`/api/produtos/${p.id}`)).body.produto.quantidade).toBe(10);
  });
});
