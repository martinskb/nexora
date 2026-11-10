// Aplica database/schema.sql no banco configurado no .env.
// Uso: npm run db:setup          (banco de desenvolvimento)
//      npm run db:setup:test     (banco de testes)
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const schemaUrl = new URL('../database/schema.sql', import.meta.url);

const sql = await readFile(schemaUrl, 'utf8');
const conn = await mysql.createConnection({ ...env.db, multipleStatements: true });
try {
  await conn.query(sql);
  console.log(`Schema aplicado no banco "${env.db.database}".`);
} finally {
  await conn.end();
}
