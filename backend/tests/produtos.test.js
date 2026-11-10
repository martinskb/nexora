import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

const arroz = { nome: 'Arroz 1kg', preco: 6.5, quantidade: 20, estoqueMinimo: 5 };

describe('Produtos — cadastro (F1)', () => {
  it('cria produto com poucos campos e devolve o saldo', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/produtos').send(arroz);
    expect(res.status).toBe(201);
    expect(res.body.produto).toMatchObject({ nome: 'Arroz 1kg', preco: 6.5, quantidade: 20, estoqueMinimo: 5 });
  });

  it('estoque mínimo é opcional (padrão 0)', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/produtos').send({ nome: 'Sabão', preco: 3, quantidade: 0 });
    expect(res.status).toBe(201);
    expect(res.body.produto.estoqueMinimo).toBe(0);
  });

  it('arredonda o preço para centavos', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/produtos').send({ ...arroz, preco: 6.499 });
    expect(res.body.produto.preco).toBe(6.5);
  });

  it('registra a quantidade inicial no histórico de estoque', async () => {
    const { agente, loja } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    const [movs] = await pool.query('SELECT * FROM movimentacoes_estoque WHERE produto_id = ?', [body.produto.id]);
    expect(movs).toHaveLength(1);
    expect(movs[0]).toMatchObject({ loja_id: loja.id, tipo: 'cadastro', quantidade: 20, saldo_apos: 20 });
  });

  it('valida os campos', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/produtos').send({ nome: ' ', preco: -1, quantidade: 1.5 });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.detalhes).sort()).toEqual(['nome', 'preco', 'quantidade']);
  });

  it('recusa preço enviado como texto', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/produtos').send({ ...arroz, preco: '6,50' });
    expect(res.status).toBe(400);
    expect(res.body.detalhes.preco).toBeDefined();
  });

  it('recusa nome repetido na mesma loja (ignorando maiúsculas e acentos)', async () => {
    const { agente } = await criarLojaLogada();
    await agente.post('/api/produtos').send({ ...arroz, nome: 'Açúcar' });
    const res = await agente.post('/api/produtos').send({ ...arroz, nome: 'ACUCAR' });
    expect(res.status).toBe(409);
    expect(res.body.detalhes.nome).toBeDefined();
  });
});

describe('Produtos — listagem, edição e remoção', () => {
  it('lista em ordem alfabética', async () => {
    const { agente } = await criarLojaLogada();
    await agente.post('/api/produtos').send({ ...arroz, nome: 'Feijão' });
    await agente.post('/api/produtos').send({ ...arroz, nome: 'Arroz' });
    const res = await agente.get('/api/produtos');
    expect(res.body.produtos.map((p) => p.nome)).toEqual(['Arroz', 'Feijão']);
  });

  it('informa quanto cada produto vendeu nos últimos 30 dias (sem contar canceladas nem vendas antigas)', async () => {
    const { agente } = await criarLojaLogada();
    const { body: a } = await agente.post('/api/produtos').send(arroz);
    const { body: f } = await agente.post('/api/produtos').send({ ...arroz, nome: 'Feijão' });
    const id = a.produto.id;
    await agente.post('/api/vendas').send({ itens: [{ produtoId: id, quantidade: 3 }] });
    await agente.post('/api/vendas').send({ itens: [{ produtoId: id, quantidade: 2 }] });
    const cancelada = await agente.post('/api/vendas').send({ itens: [{ produtoId: id, quantidade: 4 }] });
    await agente.post(`/api/vendas/${cancelada.body.venda.id}/cancelar`).send({ motivo: 'Cliente desistiu' });
    const antiga = await agente.post('/api/vendas').send({ itens: [{ produtoId: id, quantidade: 7 }] });
    await pool.execute('UPDATE vendas SET criado_em = NOW() - INTERVAL 31 DAY WHERE id = ?', [antiga.body.venda.id]);

    const res = await agente.get('/api/produtos');
    const porId = Object.fromEntries(res.body.produtos.map((p) => [p.id, p]));
    expect(porId[id].vendidos30d).toBe(5);
    expect(porId[f.produto.id].vendidos30d).toBe(0);
  });

  it('edita nome, preço e estoque mínimo', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    const res = await agente
      .put(`/api/produtos/${body.produto.id}`)
      .send({ nome: 'Arroz Tipo 1', preco: 7.25, estoqueMinimo: 3 });
    expect(res.status).toBe(200);
    expect(res.body.produto).toMatchObject({ nome: 'Arroz Tipo 1', preco: 7.25, estoqueMinimo: 3, quantidade: 20 });
  });

  it('não permite alterar a quantidade pela edição', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    const res = await agente.put(`/api/produtos/${body.produto.id}`).send({ ...arroz, quantidade: 999 });
    expect(res.status).toBe(400);
    expect(res.body.detalhes.quantidade).toMatch(/ajuste de estoque/);
    const atual = await agente.get(`/api/produtos/${body.produto.id}`);
    expect(atual.body.produto.quantidade).toBe(20);
  });

  it('pode manter o próprio nome ao editar', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    const res = await agente.put(`/api/produtos/${body.produto.id}`).send({ nome: 'Arroz 1kg', preco: 8 });
    expect(res.status).toBe(200);
  });

  it('remover tira o produto da lista, mas preserva o registro no banco', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    const del = await agente.delete(`/api/produtos/${body.produto.id}`);
    expect(del.status).toBe(204);
    expect((await agente.get('/api/produtos')).body.produtos).toHaveLength(0);
    expect((await agente.get(`/api/produtos/${body.produto.id}`)).status).toBe(404);
    const [rows] = await pool.query('SELECT ativo FROM produtos WHERE id = ?', [body.produto.id]);
    expect(rows[0].ativo).toBe(0);
  });

  it('após remover, o nome pode ser reutilizado', async () => {
    const { agente } = await criarLojaLogada();
    const { body } = await agente.post('/api/produtos').send(arroz);
    await agente.delete(`/api/produtos/${body.produto.id}`);
    expect((await agente.post('/api/produtos').send(arroz)).status).toBe(201);
  });

  it('id inválido retorna 404', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.get('/api/produtos/abc')).status).toBe(404);
    expect((await agente.get('/api/produtos/999999')).status).toBe(404);
  });
});

describe('Produtos — segurança', () => {
  it('exige login', async () => {
    expect((await request(app).get('/api/produtos')).status).toBe(401);
    expect((await request(app).post('/api/produtos').send(arroz)).status).toBe(401);
  });

  it('uma loja não vê, edita nem remove produtos de outra', async () => {
    const lojaA = await criarLojaLogada();
    const lojaB = await criarLojaLogada();
    const { body } = await lojaA.agente.post('/api/produtos').send(arroz);
    const id = body.produto.id;

    expect((await lojaB.agente.get('/api/produtos')).body.produtos).toHaveLength(0);
    expect((await lojaB.agente.get(`/api/produtos/${id}`)).status).toBe(404);
    expect((await lojaB.agente.put(`/api/produtos/${id}`).send({ nome: 'Invadido', preco: 0 })).status).toBe(404);
    expect((await lojaB.agente.delete(`/api/produtos/${id}`)).status).toBe(404);

    const original = await lojaA.agente.get(`/api/produtos/${id}`);
    expect(original.body.produto.nome).toBe('Arroz 1kg');
  });

  it('lojas diferentes podem ter produtos com o mesmo nome', async () => {
    const lojaA = await criarLojaLogada();
    const lojaB = await criarLojaLogada();
    expect((await lojaA.agente.post('/api/produtos').send(arroz)).status).toBe(201);
    expect((await lojaB.agente.post('/api/produtos').send(arroz)).status).toBe(201);
  });
});
