import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const CUSTO_HASH = 10;
// Hash "falso" usado quando o e-mail não existe, para que a resposta demore
// o mesmo tempo e não revele quais e-mails estão cadastrados.
const HASH_FICTICIO = bcrypt.hashSync('nexora-senha-inexistente', CUSTO_HASH);

function paraLojaPublica(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    onboardingConcluido: Boolean(row.onboarding_concluido),
  };
}

export async function cadastrarLoja({ nome, email, senha }) {
  const senhaHash = await bcrypt.hash(senha, CUSTO_HASH);
  try {
    const [res] = await pool.execute(
      'INSERT INTO lojas (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash],
    );
    return buscarLoja(res.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('Já existe uma loja cadastrada com este e-mail.', 409, {
        email: 'Este e-mail já está em uso.',
      });
    }
    throw err;
  }
}

export async function autenticar({ email, senha }) {
  const [rows] = await pool.execute(
    'SELECT id, nome, email, senha_hash, onboarding_concluido FROM lojas WHERE email = ?',
    [email],
  );
  const loja = rows[0];
  const senhaOk = await bcrypt.compare(senha, loja?.senha_hash ?? HASH_FICTICIO);
  if (!loja || !senhaOk) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }
  return paraLojaPublica(loja);
}

export async function buscarLoja(id) {
  const [rows] = await pool.execute(
    'SELECT id, nome, email, onboarding_concluido FROM lojas WHERE id = ?',
    [id],
  );
  return rows[0] ? paraLojaPublica(rows[0]) : null;
}

export function gerarToken(lojaId) {
  return jwt.sign({}, env.sessao.segredo, {
    subject: String(lojaId),
    expiresIn: `${env.sessao.dias}d`,
    algorithm: 'HS256',
  });
}

/** Retorna o id da loja do token, ou null se o token for inválido/expirado. */
export function lerToken(token) {
  try {
    const payload = jwt.verify(token, env.sessao.segredo, { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
