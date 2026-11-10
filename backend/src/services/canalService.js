import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const NAO_ENCONTRADO = 'Canal não encontrado.';
const DUPLICADO = 'Já existe um canal com esse nome.';
export const LIMITE_CANAIS = 20;

// Toda consulta filtra por loja_id: uma loja nunca vê nem usa canal de outra.
const SELECT_CANAL = `
  SELECT c.id, c.nome, c.ativo,
         EXISTS (SELECT 1 FROM vendas v WHERE v.canal_id = c.id) AS tem_vendas
  FROM canais c`;

function paraCanalPublico(row) {
  return { id: row.id, nome: row.nome, ativo: Boolean(row.ativo), temVendas: Boolean(row.tem_vendas) };
}

/** Traduz o erro de nome duplicado (UNIQUE loja_id + nome, sem diferenciar maiúsculas). */
async function semDuplicado(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new AppError(DUPLICADO, 400, { nome: DUPLICADO });
    throw err;
  }
}

export async function listar(lojaId) {
  const [rows] = await pool.execute(`${SELECT_CANAL} WHERE c.loja_id = ? ORDER BY c.nome`, [lojaId]);
  return rows.map(paraCanalPublico);
}

export async function buscar(lojaId, id) {
  const [rows] = await pool.execute(`${SELECT_CANAL} WHERE c.loja_id = ? AND c.id = ?`, [lojaId, id]);
  if (!rows.length) throw new AppError(NAO_ENCONTRADO, 404);
  return paraCanalPublico(rows[0]);
}

export async function criar(lojaId, { nome }) {
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM canais WHERE loja_id = ?', [lojaId]);
  if (total >= LIMITE_CANAIS) throw new AppError(`Limite de ${LIMITE_CANAIS} canais por loja.`, 400);
  const [res] = await semDuplicado(() =>
    pool.execute('INSERT INTO canais (loja_id, nome) VALUES (?, ?)', [lojaId, nome]),
  );
  return buscar(lojaId, res.insertId);
}

export async function atualizar(lojaId, id, { nome, ativo }) {
  await buscar(lojaId, id); // 404 se não for da loja
  const campos = [];
  const valores = [];
  if (nome !== undefined) {
    campos.push('nome = ?');
    valores.push(nome);
  }
  if (ativo !== undefined) {
    campos.push('ativo = ?');
    valores.push(ativo);
  }
  await semDuplicado(() =>
    pool.execute(`UPDATE canais SET ${campos.join(', ')} WHERE id = ? AND loja_id = ?`, [...valores, id, lojaId]),
  );
  return buscar(lojaId, id);
}

export async function remover(lojaId, id) {
  const canal = await buscar(lojaId, id);
  if (canal.temVendas) throw new AppError('Este canal já tem vendas. Arquive em vez de apagar.', 409);
  await pool.execute('DELETE FROM canais WHERE id = ? AND loja_id = ?', [id, lojaId]);
}

/**
 * Canal ativo da loja, ou null. Usado dentro da transação de registro de venda.
 * @param {import('mysql2/promise').PoolConnection} conn
 */
export async function buscarAtivo(conn, lojaId, id) {
  const [rows] = await conn.execute('SELECT id, nome FROM canais WHERE id = ? AND loja_id = ? AND ativo = TRUE', [
    id,
    lojaId,
  ]);
  return rows[0] ?? null;
}
