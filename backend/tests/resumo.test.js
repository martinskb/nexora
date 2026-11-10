import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

// Período local de Belém (UTC-3): 01/11 00:00 até 04/11 00:00 → 3 dias.
const PERIODO = 'de=2026-11-01T03:00:00.000Z&ate=2026-11-04T03:00:00.000Z&fuso=-180';

async function cenario() {
  const ctx = await criarLojaLogada();
  const { agente } = ctx;
  const criar = async (dados) => (await agente.post('/api/produtos').send({ preco: 1, quantidade: 100, ...dados })).body.produto;
  const arroz = await criar({ nome: 'Arroz', preco: 5 });
  const feijao = await criar({ nome: 'Feijão', preco: 8 });
  const oleo = await criar({ nome: 'Óleo', preco: 7 });

  async function vender(itens, canal, quando) {
    const { body } = await agente.post('/api/vendas').send({ itens, canal });
    await pool.query('UPDATE vendas SET criado_em = ? WHERE id = ?', [new Date(quando), body.venda.id]);
    return body.venda;
  }

  // 01/11 09:00 local — balcão: 3 arroz (15) + 1 feijão (8) = 23
  await vender([{ produtoId: arroz.id, quantidade: 3 }, { produtoId: feijao.id, quantidade: 1 }], 'balcao', '2026-11-01T12:00:00Z');
  // 01/11 23:00 local (02/11 02:00 UTC) — WhatsApp: 2 feijão = 16
  await vender([{ produtoId: feijao.id, quantidade: 2 }], 'whatsapp', '2026-11-02T02:00:00Z');
  // 03/11 local — cancelada: 10 óleo = 70 (não entra nos totais)
  const cancelada = await vender([{ produtoId: oleo.id, quantidade: 10 }], 'balcao', '2026-11-03T15:00:00Z');
  await agente.post(`/api/vendas/${cancelada.id}/cancelar`).send({ motivo: 'Teste' });
  // 31/10 local — fora do período
  await vender([{ produtoId: oleo.id, quantidade: 50 }], 'balcao', '2026-10-31T12:00:00Z');

  return { ...ctx, arroz, feijao, oleo };
}

describe('Resumo de vendas (F5)', () => {
  it('soma só as vendas concluídas do período e calcula o ticket médio', async () => {
    const { agente } = await cenario();
    const res = await agente.get(`/api/resumo?${PERIODO}`);
    expect(res.status).toBe(200);
    expect(res.body.totais).toEqual({ valor: 39, vendas: 2, ticketMedio: 19.5, canceladas: 1, valorCancelado: 70 });
  });

  it('separa o valor por origem (Balcão × WhatsApp)', async () => {
    const { agente } = await cenario();
    const { body } = await agente.get(`/api/resumo?${PERIODO}`);
    expect(body.porCanal).toEqual([
      { canal: 'balcao', vendas: 1, valor: 23 },
      { canal: 'whatsapp', vendas: 1, valor: 16 },
    ]);
  });

  it('agrupa por dia no horário local (23h de Belém conta no mesmo dia) e inclui dias sem venda', async () => {
    const { agente } = await cenario();
    const { body } = await agente.get(`/api/resumo?${PERIODO}`);
    expect(body.porDia).toEqual([
      { dia: '2026-11-01', vendas: 2, valor: 39 },
      { dia: '2026-11-02', vendas: 0, valor: 0 },
      { dia: '2026-11-03', vendas: 0, valor: 0 },
    ]);
  });

  it('lista os mais vendidos por quantidade, sem contar canceladas', async () => {
    const { agente } = await cenario();
    const { body } = await agente.get(`/api/resumo?${PERIODO}`);
    expect(body.maisVendidos).toEqual([
      { produtoId: expect.any(Number), nome: 'Arroz', quantidade: 3, valor: 15 },
      { produtoId: expect.any(Number), nome: 'Feijão', quantidade: 3, valor: 24 },
    ].sort((a, b) => b.quantidade - a.quantidade || b.valor - a.valor));
  });

  it('traz os alertas de estoque (zerados e acabando)', async () => {
    const { agente } = await criarLojaLogada();
    await agente.post('/api/produtos').send({ nome: 'Zerado', preco: 1, quantidade: 0 });
    await agente.post('/api/produtos').send({ nome: 'Acabando', preco: 1, quantidade: 2, estoqueMinimo: 3 });
    await agente.post('/api/produtos').send({ nome: 'Tranquilo', preco: 1, quantidade: 50, estoqueMinimo: 3 });
    const { body } = await agente.get(`/api/resumo?${PERIODO}`);
    expect(body.alertasEstoque.zerados).toBe(1);
    expect(body.alertasEstoque.acabando).toBe(1);
    expect(body.alertasEstoque.produtos.map((p) => p.nome)).toEqual(['Zerado', 'Acabando']);
  });

  it('loja sem vendas recebe zeros (sem erros de divisão)', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.get(`/api/resumo?${PERIODO}`);
    expect(body.totais).toEqual({ valor: 0, vendas: 0, ticketMedio: 0, canceladas: 0, valorCancelado: 0 });
    expect(body.porDia).toHaveLength(3);
    expect(body.maisVendidos).toEqual([]);
  });

  it('valida o período', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.get('/api/resumo')).status).toBe(400);
    expect((await agente.get('/api/resumo?de=2026-11-05T00:00:00Z&ate=2026-11-01T00:00:00Z')).status).toBe(400);
    expect((await agente.get('/api/resumo?de=2020-01-01T00:00:00Z&ate=2026-01-01T00:00:00Z')).status).toBe(400);
    expect((await agente.get(`/api/resumo?${PERIODO.replace('-180', '9999')}`)).status).toBe(400);
  });

  it('exige login e isola as lojas', async () => {
    expect((await request(app).get(`/api/resumo?${PERIODO}`)).status).toBe(401);
    await cenario();
    const outra = await criarLojaLogada();
    const { body } = await outra.agente.get(`/api/resumo?${PERIODO}`);
    expect(body.totais.vendas).toBe(0);
    expect(body.maisVendidos).toEqual([]);
  });
});
