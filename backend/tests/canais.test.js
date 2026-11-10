import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

async function criarCanal(agente, nome) {
  const res = await agente.post('/api/canais').send({ nome });
  if (res.status !== 201) throw new Error(`falha ao criar canal: ${JSON.stringify(res.body)}`);
  return res.body.canal;
}

describe('Canais de venda da loja', () => {
  it('lista vazia para loja nova', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.get('/api/canais');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ canais: [] });
  });

  it('cria canal com nome aparado', async () => {
    const { agente } = await criarLojaLogada();
    const res = await agente.post('/api/canais').send({ nome: '  Instagram ' });
    expect(res.status).toBe(201);
    expect(res.body.canal).toMatchObject({ nome: 'Instagram', ativo: true, temVendas: false });
    expect(res.body.canal.id).toEqual(expect.any(Number));
  });

  it('lista em ordem alfabética', async () => {
    const { agente } = await criarLojaLogada();
    await criarCanal(agente, 'Zap');
    await criarCanal(agente, 'Encomenda');
    const { body } = await agente.get('/api/canais');
    expect(body.canais.map((c) => c.nome)).toEqual(['Encomenda', 'Zap']);
  });

  it('recusa nome vazio e nome com 41 caracteres', async () => {
    const { agente } = await criarLojaLogada();
    expect((await agente.post('/api/canais').send({ nome: '   ' })).status).toBe(400);
    expect((await agente.post('/api/canais').send({ nome: 'x'.repeat(41) })).status).toBe(400);
    expect((await agente.post('/api/canais').send({ nome: 'x'.repeat(40) })).status).toBe(201);
  });

  it('recusa duplicado ignorando maiúsculas e espaços', async () => {
    const { agente } = await criarLojaLogada();
    await criarCanal(agente, 'Instagram');
    const res = await agente.post('/api/canais').send({ nome: ' instagram ' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Já existe um canal com esse nome.');
  });

  it('recusa renomear para o nome de outro canal', async () => {
    const { agente } = await criarLojaLogada();
    await criarCanal(agente, 'Instagram');
    const outro = await criarCanal(agente, 'Encomenda');
    const res = await agente.put(`/api/canais/${outro.id}`).send({ nome: 'INSTAGRAM' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Já existe um canal com esse nome.');
  });

  it('renomeia o canal', async () => {
    const { agente } = await criarLojaLogada();
    const c = await criarCanal(agente, 'Insta');
    const res = await agente.put(`/api/canais/${c.id}`).send({ nome: 'Instagram' });
    expect(res.status).toBe(200);
    expect(res.body.canal).toMatchObject({ id: c.id, nome: 'Instagram', ativo: true });
  });

  it('recusa alteração vazia', async () => {
    const { agente } = await criarLojaLogada();
    const c = await criarCanal(agente, 'Insta');
    const res = await agente.put(`/api/canais/${c.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('limite de 20 canais por loja', async () => {
    const { agente } = await criarLojaLogada();
    for (let i = 1; i <= 20; i++) await criarCanal(agente, `Canal ${i}`);
    const res = await agente.post('/api/canais').send({ nome: 'Canal 21' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('Limite de 20 canais por loja.');
  });

  it('arquiva e reativa', async () => {
    const { agente } = await criarLojaLogada();
    const c = await criarCanal(agente, 'Instagram');
    expect((await agente.put(`/api/canais/${c.id}`).send({ ativo: false })).body.canal.ativo).toBe(false);
    expect((await agente.put(`/api/canais/${c.id}`).send({ ativo: true })).body.canal.ativo).toBe(true);
  });

  it('apaga canal sem vendas', async () => {
    const { agente } = await criarLojaLogada();
    const c = await criarCanal(agente, 'Instagram');
    expect((await agente.delete(`/api/canais/${c.id}`)).status).toBe(204);
    expect((await agente.get('/api/canais')).body.canais).toEqual([]);
  });

  it('não apaga canal com vendas', async () => {
    const { agente, loja } = await criarLojaLogada();
    const c = await criarCanal(agente, 'Instagram');
    await pool.query('INSERT INTO vendas (loja_id, total, canal_id) VALUES (?, 10, ?)', [loja.id, c.id]);

    const res = await agente.delete(`/api/canais/${c.id}`);
    expect(res.status).toBe(409);
    expect(res.body.erro).toBe('Este canal já tem vendas. Arquive em vez de apagar.');
    expect((await agente.get('/api/canais')).body.canais[0]).toMatchObject({ id: c.id, temVendas: true });
  });

  it('isolamento entre lojas', async () => {
    const a = await criarLojaLogada();
    const b = await criarLojaLogada();
    const c = await criarCanal(a.agente, 'Instagram');

    expect((await b.agente.put(`/api/canais/${c.id}`).send({ nome: 'Roubado' })).status).toBe(404);
    expect((await b.agente.delete(`/api/canais/${c.id}`)).status).toBe(404);
    expect((await b.agente.get('/api/canais')).body.canais).toEqual([]);
    // a loja B pode ter um canal com o mesmo nome
    expect((await b.agente.post('/api/canais').send({ nome: 'Instagram' })).status).toBe(201);
  });

  it('exige login', async () => {
    expect((await request(app).get('/api/canais')).status).toBe(401);
  });
});
