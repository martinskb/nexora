import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

async function criarProduto(agente, dados) {
  const res = await agente.post('/api/produtos').send({ preco: 1, quantidade: 10, ...dados });
  if (res.status !== 201) throw new Error(`falha ao criar produto: ${JSON.stringify(res.body)}`);
  return res.body.produto;
}
const saldo = async (agente, id) => (await agente.get(`/api/produtos/${id}`)).body.produto.quantidade;
const movimentacoes = async (produtoId) =>
  (await pool.query('SELECT tipo, quantidade, saldo_apos, venda_id, motivo FROM movimentacoes_estoque WHERE produto_id = ? ORDER BY id', [produtoId]))[0];

describe('Registrar venda com baixa automática (F2)', () => {
  it('registra a venda, calcula o total e desconta o estoque', async () => {
    const { agente } = await criarLojaLogada();
    const arroz = await criarProduto(agente, { nome: 'Arroz', preco: 6.5, quantidade: 20 });
    const feijao = await criarProduto(agente, { nome: 'Feijão', preco: 8.99, quantidade: 5 });

    const res = await agente.post('/api/vendas').send({
      itens: [
        { produtoId: arroz.id, quantidade: 3 },
        { produtoId: feijao.id, quantidade: 2 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.venda).toMatchObject({ total: 37.48, status: 'concluida', canal: 'balcao' });
    expect(res.body.venda.itens).toEqual([
      { produtoId: arroz.id, nome: 'Arroz', quantidade: 3, precoUnitario: 6.5, subtotal: 19.5 },
      { produtoId: feijao.id, nome: 'Feijão', quantidade: 2, precoUnitario: 8.99, subtotal: 17.98 },
    ]);
    expect(await saldo(agente, arroz.id)).toBe(17);
    expect(await saldo(agente, feijao.id)).toBe(3);
  });

  it('registra cada saída no histórico de estoque, ligada à venda', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 20 });
    const { body } = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 4 }] });
    const movs = await movimentacoes(p.id);
    expect(movs[1]).toMatchObject({ tipo: 'venda', quantidade: -4, saldo_apos: 16, venda_id: body.venda.id });
  });

  it('aceita o canal WhatsApp e uma observação', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Batom' });
    const res = await agente
      .post('/api/vendas')
      .send({ itens: [{ produtoId: p.id, quantidade: 1 }], canal: 'whatsapp', observacao: 'Cliente Maria' });
    expect(res.body.venda).toMatchObject({ canal: 'whatsapp', observacao: 'Cliente Maria' });
  });

  it('usa sempre o preço cadastrado (ignora preço enviado pelo navegador)', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', preco: 10 });
    const res = await agente
      .post('/api/vendas')
      .send({ itens: [{ produtoId: p.id, quantidade: 1, preco: 0.01 }], total: 0.01 });
    expect(res.body.venda.total).toBe(10);
  });

  it('soma em centavos sem erro de arredondamento', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Bala', preco: 0.1 });
    const res = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 3 }] });
    expect(res.body.venda.total).toBe(0.3);
  });

  it('agrupa o mesmo produto repetido em um único item', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 10 });
    const res = await agente.post('/api/vendas').send({
      itens: [
        { produtoId: p.id, quantidade: 2 },
        { produtoId: p.id, quantidade: 3 },
      ],
    });
    expect(res.body.venda.itens).toHaveLength(1);
    expect(res.body.venda.itens[0].quantidade).toBe(5);
    expect(await saldo(agente, p.id)).toBe(5);
  });

  it('permite vender todo o estoque (saldo chega a zero)', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 2 });
    expect((await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 2 }] })).status).toBe(201);
    expect(await saldo(agente, p.id)).toBe(0);
  });

  it('valida a venda', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.post('/api/vendas').send({ itens: [] })).status).toBe(400);
    expect((await agente.post('/api/vendas').send({})).status).toBe(400);
    const p = await criarProduto(agente, { nome: 'Arroz' });
    expect((await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 0 }] })).status).toBe(400);
    expect((await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1.5 }] })).status).toBe(400);
    expect(
      (await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }], canal: 'telefone' })).status,
    ).toBe(400);
  });
});

describe('Consistência entre venda e estoque', () => {
  it('bloqueia venda acima do estoque e informa o saldo disponível', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 2 });
    const res = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 3 }] });
    expect(res.status).toBe(409);
    expect(res.body.detalhes.estoqueInsuficiente).toEqual([
      { produtoId: p.id, nome: 'Arroz', disponivel: 2, solicitado: 3 },
    ]);
  });

  it('é tudo ou nada: se um item falha, nenhum estoque muda e nenhuma venda é gravada', async () => {
    const { agente } = await criarLojaLogada();
    const ok = await criarProduto(agente, { nome: 'Arroz', quantidade: 10 });
    const falta = await criarProduto(agente, { nome: 'Feijão', quantidade: 1 });
    const res = await agente.post('/api/vendas').send({
      itens: [
        { produtoId: ok.id, quantidade: 5 },
        { produtoId: falta.id, quantidade: 2 },
      ],
    });
    expect(res.status).toBe(409);
    expect(await saldo(agente, ok.id)).toBe(10);
    expect(await saldo(agente, falta.id)).toBe(1);
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM vendas');
    expect(n).toBe(0);
  });

  it('vendas simultâneas não vendem a mesma unidade duas vezes', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 8 });
    const venda = () => agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 5 }] });
    const resultados = await Promise.all([venda(), venda(), venda()]);
    const status = resultados.map((r) => r.status).sort();
    expect(status).toEqual([201, 409, 409]);
    expect(await saldo(agente, p.id)).toBe(3);
  });

  it('recusa produto removido', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz' });
    await agente.delete(`/api/produtos/${p.id}`);
    const res = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }] });
    expect(res.status).toBe(404);
  });
});

describe('Cancelamento de venda', () => {
  async function vendaPronta() {
    const ctx = await criarLojaLogada();
    const p = await criarProduto(ctx.agente, { nome: 'Arroz', quantidade: 10 });
    const { body } = await ctx.agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 4 }] });
    return { ...ctx, produto: p, venda: body.venda };
  }

  it('cancela, devolve ao estoque e registra no histórico', async () => {
    const { agente, produto, venda } = await vendaPronta();
    const res = await agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: 'Cliente desistiu' });
    expect(res.status).toBe(200);
    expect(res.body.venda).toMatchObject({ status: 'cancelada', motivoCancelamento: 'Cliente desistiu' });
    expect(res.body.venda.canceladaEm).toBeTruthy();
    expect(await saldo(agente, produto.id)).toBe(10);
    const movs = await movimentacoes(produto.id);
    expect(movs.at(-1)).toMatchObject({ tipo: 'cancelamento', quantidade: 4, saldo_apos: 10, venda_id: venda.id });
  });

  it('exige motivo', async () => {
    const { agente, venda } = await vendaPronta();
    const res = await agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: '' });
    expect(res.status).toBe(400);
  });

  it('não cancela duas vezes (estoque não é devolvido em dobro)', async () => {
    const { agente, produto, venda } = await vendaPronta();
    await agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: 'Erro de registro' });
    const segunda = await agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: 'Erro de registro' });
    expect(segunda.status).toBe(409);
    expect(await saldo(agente, produto.id)).toBe(10);
  });

  it('cancelamentos simultâneos devolvem o estoque uma única vez', async () => {
    const { agente, produto, venda } = await vendaPronta();
    const cancelar = () => agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: 'Duplicada' });
    const status = (await Promise.all([cancelar(), cancelar()])).map((r) => r.status).sort();
    expect(status).toEqual([200, 409]);
    expect(await saldo(agente, produto.id)).toBe(10);
  });

  it('devolve ao estoque mesmo se o produto foi removido da lista', async () => {
    const { agente, produto, venda } = await vendaPronta();
    await agente.delete(`/api/produtos/${produto.id}`);
    await agente.post(`/api/vendas/${venda.id}/cancelar`).send({ motivo: 'Devolução' });
    const [[row]] = await pool.query('SELECT quantidade FROM produtos WHERE id = ?', [produto.id]);
    expect(row.quantidade).toBe(10);
  });

  it('o detalhe da venda mostra o nome do produto mesmo após removido', async () => {
    const { agente, produto, venda } = await vendaPronta();
    await agente.delete(`/api/produtos/${produto.id}`);
    const res = await agente.get(`/api/vendas/${venda.id}`);
    expect(res.body.venda.itens[0].nome).toBe('Arroz');
  });
});

describe('Listagem de vendas', () => {
  it('lista as mais recentes primeiro, com resumo dos itens', async () => {
    const { agente } = await criarLojaLogada();
    const a = await criarProduto(agente, { nome: 'Arroz' });
    const b = await criarProduto(agente, { nome: 'Feijão' });
    await agente.post('/api/vendas').send({ itens: [{ produtoId: a.id, quantidade: 1 }] });
    await agente.post('/api/vendas').send({
      itens: [
        { produtoId: a.id, quantidade: 2 },
        { produtoId: b.id, quantidade: 1 },
      ],
    });
    const res = await agente.get('/api/vendas');
    expect(res.status).toBe(200);
    expect(res.body.vendas).toHaveLength(2);
    expect(res.body.vendas[0]).toMatchObject({ quantidadeItens: 3, resumo: 'Arroz, Feijão' });
    expect(res.body.temMais).toBe(false);
  });

  it('filtra por canal, situação e período', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 50 });
    const vender = (canal) => agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }], canal });
    await vender('balcao');
    const zap = (await vender('whatsapp')).body.venda;
    await agente.post(`/api/vendas/${zap.id}/cancelar`).send({ motivo: 'Teste' });

    expect((await agente.get('/api/vendas?canal=whatsapp')).body.vendas).toHaveLength(1);
    expect((await agente.get('/api/vendas?status=concluida')).body.vendas).toHaveLength(1);
    expect((await agente.get('/api/vendas?status=cancelada')).body.vendas[0].id).toBe(zap.id);

    const amanha = new Date(Date.now() + 86_400_000).toISOString();
    const ontem = new Date(Date.now() - 86_400_000).toISOString();
    expect((await agente.get(`/api/vendas?de=${ontem}&ate=${amanha}`)).body.vendas).toHaveLength(2);
    expect((await agente.get(`/api/vendas?de=${amanha}`)).body.vendas).toHaveLength(0);
  });

  it('pagina os resultados', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 50 });
    for (let i = 0; i < 5; i++) await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }] });
    const pag1 = (await agente.get('/api/vendas?limite=3')).body;
    expect(pag1.vendas).toHaveLength(3);
    expect(pag1.temMais).toBe(true);
    const pag2 = (await agente.get(`/api/vendas?limite=3&antesDe=${pag1.vendas.at(-1).id}`)).body;
    expect(pag2.vendas).toHaveLength(2);
    expect(pag2.temMais).toBe(false);
  });

  it('recusa filtro inválido', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.get('/api/vendas?de=ontem')).status).toBe(400);
  });

  it('a data da venda é gravada no horário correto (UTC)', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz' });
    const { body } = await agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }] });
    const diferencaMs = Math.abs(new Date(body.venda.criadoEm).getTime() - Date.now());
    expect(diferencaMs).toBeLessThan(60_000);
  });
});

describe('Ajuste de estoque', () => {
  it('define a quantidade real e registra a diferença com o motivo', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 0 });
    const res = await agente.post(`/api/produtos/${p.id}/ajustes`).send({ quantidade: 7, motivo: 'Contagem no balcão' });
    expect(res.status).toBe(200);
    expect(res.body.produto.quantidade).toBe(7);
    expect((await movimentacoes(p.id)).at(-1)).toMatchObject({
      tipo: 'ajuste',
      quantidade: 7,
      saldo_apos: 7,
      motivo: 'Contagem no balcão',
    });
  });

  it('registra diferença negativa quando sobra menos que o sistema mostra', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 10 });
    await agente.post(`/api/produtos/${p.id}/ajustes`).send({ quantidade: 8, motivo: 'Produto avariado' });
    expect((await movimentacoes(p.id)).at(-1)).toMatchObject({ quantidade: -2, saldo_apos: 8 });
  });

  it('recusa quantidade igual à atual, sem motivo ou negativa', async () => {
    const { agente } = await criarLojaLogada();
    const p = await criarProduto(agente, { nome: 'Arroz', quantidade: 10 });
    const url = `/api/produtos/${p.id}/ajustes`;
    expect((await agente.post(url).send({ quantidade: 10, motivo: 'Contagem' })).status).toBe(400);
    expect((await agente.post(url).send({ quantidade: 5 })).status).toBe(400);
    expect((await agente.post(url).send({ quantidade: -1, motivo: 'Contagem' })).status).toBe(400);
  });
});

describe('Vendas — segurança', () => {
  it('exige login', async () => {
    expect((await request(app).get('/api/vendas')).status).toBe(401);
    expect((await request(app).post('/api/vendas').send({ itens: [] })).status).toBe(401);
  });

  it('uma loja não vende, vê, cancela nem ajusta dados de outra', async () => {
    const lojaA = await criarLojaLogada();
    const lojaB = await criarLojaLogada();
    const p = await criarProduto(lojaA.agente, { nome: 'Arroz', quantidade: 10 });
    const { body } = await lojaA.agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }] });

    expect((await lojaB.agente.post('/api/vendas').send({ itens: [{ produtoId: p.id, quantidade: 1 }] })).status).toBe(404);
    expect((await lojaB.agente.get('/api/vendas')).body.vendas).toHaveLength(0);
    expect((await lojaB.agente.get(`/api/vendas/${body.venda.id}`)).status).toBe(404);
    expect((await lojaB.agente.post(`/api/vendas/${body.venda.id}/cancelar`).send({ motivo: 'Invasão' })).status).toBe(404);
    expect((await lojaB.agente.post(`/api/produtos/${p.id}/ajustes`).send({ quantidade: 0, motivo: 'Invasão' })).status).toBe(404);

    expect(await saldo(lojaA.agente, p.id)).toBe(9);
  });
});
