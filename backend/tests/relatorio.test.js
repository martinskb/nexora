import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { pool } from '../src/config/db.js';
import { intervaloDoDia } from '../src/services/relatorioService.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

const DIA = '2026-11-22';
const FUSO = -180; // Brasil (UTC-3)

async function produto(agente, dados) {
  const { body } = await agente.post('/api/produtos').send({ quantidade: 50, ...dados });
  return body.produto;
}
async function vender(agente, itens, pagamentos, quando = '2026-11-22T15:00:00Z') {
  const { body } = await agente.post('/api/vendas').send({ itens, pagamentos });
  await pool.query('UPDATE vendas SET criado_em = ? WHERE id = ?', [new Date(quando), body.venda.id]);
  return body.venda;
}
const relatorio = async (agente, dia = DIA) => (await agente.get(`/api/relatorio?dia=${dia}&fuso=${FUSO}`)).body;

describe('intervaloDoDia', () => {
  it('meia-noite local em UTC, por 24h', () => {
    const { de, ate } = intervaloDoDia(DIA, FUSO);
    expect(de.toISOString()).toBe('2026-11-22T03:00:00.000Z');
    expect(ate.toISOString()).toBe('2026-11-23T03:00:00.000Z');
  });
});

describe('Relatório do dia', () => {
  it('venda às 23:30 no Brasil (02:30 UTC do dia seguinte) entra no dia local certo', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, { nome: 'Pão', preco: 10 });
    await vender(agente, [{ produtoId: p.id, quantidade: 1 }], undefined, '2026-11-23T02:30:00Z');
    expect((await relatorio(agente)).vendido).toBe(10);
    expect((await relatorio(agente, '2026-11-23')).vendido).toBe(0);
  });

  it('soma por forma de pagamento, incluindo não informado', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, { nome: 'Arroz', preco: 10 });
    const um = [{ produtoId: p.id, quantidade: 1 }];
    await vender(agente, [{ produtoId: p.id, quantidade: 2 }], [{ forma: 'pix', valor: 15 }, { forma: 'dinheiro', valor: 5 }]);
    await vender(agente, um, [{ forma: 'cartao' }]);
    await vender(agente, um);
    const r = await relatorio(agente);
    expect(r).toMatchObject({ dia: DIA, vendido: 40, vendas: 3 });
    expect(r.porForma).toEqual({ dinheiro: 5, pix: 15, cartao: 10, naoInformado: 10 });
  });

  it('lucro só dos itens com custo; marca parcial e lista os produtos sem custo', async () => {
    const { agente } = await criarLojaLogada();
    const com = await produto(agente, { nome: 'Café', preco: 12, custo: 8 });
    const sem = await produto(agente, { nome: 'Bolo', preco: 20 });
    await vender(agente, [
      { produtoId: com.id, quantidade: 2 },
      { produtoId: sem.id, quantidade: 1 },
    ]);
    const { lucro } = await relatorio(agente);
    expect(lucro).toEqual({
      valor: 8,
      receitaComCusto: 24,
      margem: 33,
      parcial: true,
      produtosSemCusto: [{ id: sem.id, nome: 'Bolo' }],
    });
  });

  it('mudar o custo depois não muda o lucro daquele dia', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, { nome: 'Leite', preco: 6, custo: 4 });
    await vender(agente, [{ produtoId: p.id, quantidade: 1 }]);
    await agente.put(`/api/produtos/${p.id}`).send({ nome: 'Leite', preco: 6, custo: 5.5 });
    expect((await relatorio(agente)).lucro.valor).toBe(2);
  });

  it('venda cancelada fica fora de tudo', async () => {
    const { agente } = await criarLojaLogada();
    const p = await produto(agente, { nome: 'Sal', preco: 3, custo: 1 });
    const v = await vender(agente, [{ produtoId: p.id, quantidade: 1 }], [{ forma: 'pix' }]);
    await agente.post(`/api/vendas/${v.id}/cancelar`).send({ motivo: 'Desistiu' });
    const r = await relatorio(agente);
    expect(r).toMatchObject({ vendido: 0, vendas: 0, porForma: { dinheiro: 0, pix: 0, cartao: 0, naoInformado: 0 } });
    expect(r.lucro).toMatchObject({ valor: 0, margem: null, parcial: false, produtosSemCusto: [] });
    const lista = await agente.get(`/api/vendas/produtos?de=2026-11-22T03:00:00Z&ate=2026-11-23T03:00:00Z`);
    expect(lista.body.produtos).toEqual([]);
  });

  it('dia inválido é recusado', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.get('/api/relatorio?dia=22/11/2026&fuso=-180')).status).toBe(400);
  });
});

describe('Produtos vendidos no período', () => {
  it('quantidade e valor por produto, do mais vendido para o menos', async () => {
    const { agente } = await criarLojaLogada();
    const a = await produto(agente, { nome: 'Arroz', preco: 10 });
    const b = await produto(agente, { nome: 'Feijão', preco: 8 });
    await vender(agente, [{ produtoId: a.id, quantidade: 1 }, { produtoId: b.id, quantidade: 3 }]);
    await vender(agente, [{ produtoId: a.id, quantidade: 1 }]);
    const { body } = await agente.get('/api/vendas/produtos?de=2026-11-22T03:00:00Z&ate=2026-11-23T03:00:00Z');
    expect(body.produtos).toEqual([
      { produtoId: b.id, nome: 'Feijão', quantidade: 3, valor: 24 },
      { produtoId: a.id, nome: 'Arroz', quantidade: 2, valor: 20 },
    ]);
  });
});
