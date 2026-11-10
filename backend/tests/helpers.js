import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';

/** Apaga todos os dados do banco de testes (as demais tabelas caem em cascata). */
export async function limparBanco() {
  await pool.query('DELETE FROM lojas');
}

let contador = 0;

/** Cria uma loja e devolve um "agente" já logado (guarda o cookie de sessão). */
export async function criarLojaLogada(dados = {}) {
  contador += 1;
  const agente = request.agent(app);
  const corpo = {
    nome: `Loja Teste ${contador}`,
    email: `loja${contador}-${Date.now()}@teste.com`,
    senha: 'senha-segura-123',
    ...dados,
  };
  const res = await agente.post('/api/auth/cadastro').send(corpo);
  if (res.status !== 201) throw new Error(`Falha ao criar loja de teste: ${res.status}`);
  return { agente, loja: res.body.loja, credenciais: corpo };
}
