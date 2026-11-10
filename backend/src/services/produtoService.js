import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

const NAO_ENCONTRADO = 'Produto não encontrado.';
const COLUNAS = 'id, nome, preco, quantidade, estoque_minimo, criado_em, atualizado_em';

export function paraProdutoPublico(row) {
  return {
    id: row.id,
    nome: row.nome,
    preco: Number(row.preco),
    quantidade: row.quantidade,
    estoqueMinimo: row.estoque_minimo,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    // Só vem na listagem: unidades vendidas (vendas concluídas) nos últimos 30 dias.
    ...(row.vendidos_30d !== undefined && { vendidos30d: Number(row.vendidos_30d) }),
  };
}

// Toda consulta abaixo filtra por loja_id: uma loja nunca enxerga produtos de outra.

export async function listar(lojaId) {
  const [rows] = await pool.execute(
    `SELECT p.${COLUNAS.split(', ').join(', p.')},
            COALESCE(v.vendidos, 0) AS vendidos_30d
       FROM produtos p
       LEFT JOIN (
         SELECT i.produto_id, SUM(i.quantidade) AS vendidos
           FROM itens_venda i
           JOIN vendas ve ON ve.id = i.venda_id
          WHERE ve.loja_id = ? AND ve.status = 'concluida'
            AND ve.criado_em >= UTC_TIMESTAMP() - INTERVAL 30 DAY
          GROUP BY i.produto_id
       ) v ON v.produto_id = p.id
      WHERE p.loja_id = ? AND p.ativo = TRUE
      ORDER BY p.nome`,
    [lojaId, lojaId],
  );
  return rows.map(paraProdutoPublico);
}

export async function buscar(lojaId, id) {
  const [rows] = await pool.execute(
    `SELECT ${COLUNAS} FROM produtos WHERE id = ? AND loja_id = ? AND ativo = TRUE`,
    [id, lojaId],
  );
  if (!rows[0]) throw new AppError(NAO_ENCONTRADO, 404);
  return paraProdutoPublico(rows[0]);
}

async function garantirNomeLivre(conn, lojaId, nome, ignorarId = 0) {
  // A collation do banco já ignora maiúsculas/minúsculas e acentos na comparação.
  const [rows] = await conn.execute(
    'SELECT id FROM produtos WHERE loja_id = ? AND ativo = TRUE AND nome = ? AND id <> ? LIMIT 1',
    [lojaId, nome, ignorarId],
  );
  if (rows[0]) {
    throw new AppError('Já existe um produto com este nome.', 409, {
      nome: 'Já existe um produto com este nome.',
    });
  }
}

export async function criar(lojaId, { nome, preco, quantidade, estoqueMinimo }) {
  const id = await withTransaction(async (conn) => {
    await garantirNomeLivre(conn, lojaId, nome);
    const [res] = await conn.execute(
      'INSERT INTO produtos (loja_id, nome, preco, quantidade, estoque_minimo) VALUES (?, ?, ?, ?, ?)',
      [lojaId, nome, preco, quantidade, estoqueMinimo],
    );
    // A quantidade inicial entra no histórico, para que todo saldo tenha origem.
    await conn.execute(
      `INSERT INTO movimentacoes_estoque (loja_id, produto_id, tipo, quantidade, saldo_apos, motivo)
       VALUES (?, ?, 'cadastro', ?, ?, 'Quantidade inicial')`,
      [lojaId, res.insertId, quantidade, quantidade],
    );
    return res.insertId;
  });
  return buscar(lojaId, id);
}

export async function atualizar(lojaId, id, { nome, preco, estoqueMinimo }) {
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id FROM produtos WHERE id = ? AND loja_id = ? AND ativo = TRUE FOR UPDATE',
      [id, lojaId],
    );
    if (!rows[0]) throw new AppError(NAO_ENCONTRADO, 404);
    await garantirNomeLivre(conn, lojaId, nome, id);
    await conn.execute(
      'UPDATE produtos SET nome = ?, preco = ?, estoque_minimo = ? WHERE id = ? AND loja_id = ?',
      [nome, preco, estoqueMinimo, id, lojaId],
    );
  });
  return buscar(lojaId, id);
}

/** Remove da lista (desativa), preservando o histórico de vendas e movimentações. */
export async function remover(lojaId, id) {
  const [res] = await pool.execute(
    'UPDATE produtos SET ativo = FALSE WHERE id = ? AND loja_id = ? AND ativo = TRUE',
    [id, lojaId],
  );
  if (res.affectedRows === 0) throw new AppError(NAO_ENCONTRADO, 404);
}
