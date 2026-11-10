// Prepara o banco configurado no .env:
//   1. aplica database/schema.sql (estrutura base; só cria o que não existe)
//   2. aplica, em ordem, as migrações de database/migracoes/ ainda não aplicadas
// Uso: npm run db:setup          (banco de desenvolvimento)
//      npm run db:setup:test     (banco de testes)
//
// Para mudar a estrutura do banco, NÃO edite schema.sql: crie um novo arquivo
// numerado em database/migracoes/ (ex.: 002_descricao.sql).
import { readdir, readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const pastaBanco = new URL('../database/', import.meta.url);

const conn = await mysql.createConnection({ ...env.db, multipleStatements: true });
try {
  await conn.query(await readFile(new URL('schema.sql', pastaBanco), 'utf8'));

  await conn.query(`
    CREATE TABLE IF NOT EXISTS migracoes (
      nome        VARCHAR(190) NOT NULL PRIMARY KEY,
      aplicada_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const [aplicadas] = await conn.query('SELECT nome FROM migracoes');
  const jaAplicadas = new Set(aplicadas.map((r) => r.nome));
  const arquivos = (await readdir(new URL('migracoes/', pastaBanco))).filter((f) => f.endsWith('.sql')).sort();

  let novas = 0;
  for (const arquivo of arquivos) {
    if (jaAplicadas.has(arquivo)) continue;
    const sql = await readFile(new URL(`migracoes/${arquivo}`, pastaBanco), 'utf8');
    // Observação: no MySQL/MariaDB, ALTER TABLE não pode ser desfeito por rollback.
    // Por isso cada migração deve ser pequena e testada no banco de testes antes.
    await conn.query(sql);
    await conn.query('INSERT INTO migracoes (nome) VALUES (?)', [arquivo]);
    console.log(`  migração aplicada: ${arquivo}`);
    novas += 1;
  }

  console.log(`Banco "${env.db.database}" pronto (${novas} migração(ões) nova(s)).`);
} finally {
  await conn.end();
}
