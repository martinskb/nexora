import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { buscar as buscarProduto } from './produtoService.js';

const LIMITE_ESTOQUE = 1_000_000;

/**
 * Ajuste de estoque (F4), registrado no histórico com o motivo.
 * - modo 'contagem': define o saldo real (quantidade = total contado agora)
 * - modo 'entrada' : soma as unidades que chegaram
 */
export async function ajustar(lojaId, produtoId, { modo, quantidade, motivo }) {
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT quantidade FROM produtos WHERE id = ? AND loja_id = ? AND ativo = TRUE FOR UPDATE',
      [produtoId, lojaId],
    );
    if (!rows[0]) throw new AppError('Produto não encontrado.', 404);
    const atual = rows[0].quantidade;

    const novoSaldo = modo === 'entrada' ? atual + quantidade : quantidade;
    const diferenca = novoSaldo - atual;

    if (diferenca === 0) {
      throw new AppError('A quantidade informada é igual à atual. Nada foi alterado.', 400, {
        quantidade: 'Informe uma quantidade diferente da atual.',
      });
    }
    if (novoSaldo > LIMITE_ESTOQUE) {
      throw new AppError('O estoque ficaria alto demais.', 400, { quantidade: 'Quantidade muito alta.' });
    }

    await conn.execute('UPDATE produtos SET quantidade = ? WHERE id = ? AND loja_id = ?', [
      novoSaldo,
      produtoId,
      lojaId,
    ]);
    await conn.execute(
      `INSERT INTO movimentacoes_estoque (loja_id, produto_id, tipo, quantidade, saldo_apos, motivo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lojaId, produtoId, modo === 'entrada' ? 'entrada' : 'ajuste', diferenca, novoSaldo, motivo],
    );
  });
  return buscarProduto(lojaId, produtoId);
}

/**
 * Histórico de movimentações de um produto (mais recentes primeiro), paginado por id.
 * Explica a origem de qualquer saldo: cadastro, vendas, cancelamentos, entradas e ajustes.
 */
export async function historico(lojaId, produtoId, { limite, antesDe }) {
  // Confere que o produto é da loja (inclusive se foi removido da lista).
  const [prod] = await pool.execute('SELECT id FROM produtos WHERE id = ? AND loja_id = ?', [produtoId, lojaId]);
  if (!prod[0]) throw new AppError('Produto não encontrado.', 404);

  const params = [lojaId, produtoId];
  let filtroId = '';
  if (antesDe) {
    filtroId = 'AND id < ?';
    params.push(antesDe);
  }
  const [rows] = await pool.query(
    `SELECT id, tipo, quantidade, saldo_apos, motivo, venda_id, criado_em
     FROM movimentacoes_estoque
     WHERE loja_id = ? AND produto_id = ? ${filtroId}
     ORDER BY id DESC
     LIMIT ?`,
    [...params, limite + 1],
  );
  return {
    movimentacoes: rows.slice(0, limite).map((r) => ({
      id: r.id,
      tipo: r.tipo,
      quantidade: r.quantidade,
      saldoApos: r.saldo_apos,
      motivo: r.motivo,
      vendaId: r.venda_id,
      criadoEm: r.criado_em,
    })),
    temMais: rows.length > limite,
  };
}
