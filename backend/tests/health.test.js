import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';

afterAll(() => pool.end());

describe('API base', () => {
  it('GET /api/health responde ok com o banco conectado', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', banco: 'ok' });
  });

  it('rota inexistente retorna 404 em JSON', async () => {
    const res = await request(app).get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBeDefined();
  });

  it('JSON malformado retorna 400 sem expor detalhes internos', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ruim');
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/formato inválido/);
  });

  it('não expõe o cabeçalho X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
