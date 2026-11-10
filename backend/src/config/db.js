import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  // DECIMAL chega como número (valores monetários com 2 casas cabem com folga em double)
  decimalNumbers: true,
  dateStrings: false,
  timezone: 'Z',
});

/**
 * Executa `fn` dentro de uma transação. Faz commit se tudo der certo
 * e rollback se qualquer erro for lançado.
 */
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
