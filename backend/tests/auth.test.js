import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { limparBanco, criarLojaLogada } from './helpers.js';

beforeEach(limparBanco);
afterAll(() => pool.end());

const dadosValidos = { nome: 'Mercadinho Andorinhas', email: 'Contato@Andorinhas.com ', senha: 'senha-segura-123' };

function cookieDe(res) {
  return (res.headers['set-cookie'] || []).find((c) => c.startsWith('nexora_sessao='));
}

describe('POST /api/auth/cadastro', () => {
  it('cria a loja, normaliza o e-mail e inicia a sessão com cookie seguro', async () => {
    const res = await request(app).post('/api/auth/cadastro').send(dadosValidos);
    expect(res.status).toBe(201);
    expect(res.body.loja).toMatchObject({
      nome: 'Mercadinho Andorinhas',
      email: 'contato@andorinhas.com',
      onboardingConcluido: false,
    });
    expect(res.body.loja.senha_hash).toBeUndefined();

    const cookie = cookieDe(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('não guarda a senha em texto puro', async () => {
    await request(app).post('/api/auth/cadastro').send(dadosValidos);
    const [rows] = await pool.query('SELECT senha_hash FROM lojas');
    expect(rows[0].senha_hash).not.toContain('senha-segura-123');
    expect(rows[0].senha_hash).toMatch(/^\$2[aby]\$/);
  });

  it('recusa e-mail já cadastrado (sem diferenciar maiúsculas)', async () => {
    await request(app).post('/api/auth/cadastro').send(dadosValidos);
    const res = await request(app)
      .post('/api/auth/cadastro')
      .send({ ...dadosValidos, email: 'CONTATO@andorinhas.com' });
    expect(res.status).toBe(409);
    expect(res.body.detalhes.email).toBeDefined();
  });

  it('valida os campos e informa o erro de cada um', async () => {
    const res = await request(app).post('/api/auth/cadastro').send({ nome: 'A', email: 'invalido', senha: '123' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.detalhes).sort()).toEqual(['email', 'nome', 'senha']);
  });

  it('recusa corpo vazio', async () => {
    const res = await request(app).post('/api/auth/cadastro').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/cadastro').send(dadosValidos);
  });

  it('entra com e-mail e senha corretos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'contato@andorinhas.com', senha: 'senha-segura-123' });
    expect(res.status).toBe(200);
    expect(res.body.loja.nome).toBe('Mercadinho Andorinhas');
    expect(cookieDe(res)).toBeDefined();
  });

  it('recusa senha errada com mensagem genérica', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'contato@andorinhas.com', senha: 'errada-123' });
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('E-mail ou senha incorretos.');
    expect(cookieDe(res)).toBeUndefined();
  });

  it('e-mail inexistente recebe a mesma mensagem (não revela cadastros)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@teste.com', senha: 'qualquer-123' });
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe('E-mail ou senha incorretos.');
  });
});

describe('Sessão: /api/auth/me e /api/auth/logout', () => {
  it('sem sessão, /me responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('com sessão, /me devolve a loja logada', async () => {
    const { agente, loja } = await criarLojaLogada();
    const res = await agente.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.loja.id).toBe(loja.id);
  });

  it('logout encerra a sessão', async () => {
    const { agente } = await criarLojaLogada();
    const sair = await agente.post('/api/auth/logout');
    expect(sair.status).toBe(204);
    const res = await agente.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('recusa token adulterado ou assinado com outro segredo', async () => {
    const falso = jwt.sign({}, 'outro-segredo-qualquer-com-tamanho-suficiente', { subject: '1' });
    const res = await request(app).get('/api/auth/me').set('Cookie', `nexora_sessao=${falso}`);
    expect(res.status).toBe(401);
  });

  it('se a loja foi removida, a sessão deixa de valer', async () => {
    const { agente } = await criarLojaLogada();
    await limparBanco();
    const res = await agente.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
