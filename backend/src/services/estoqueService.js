import { withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { buscar as buscarProduto } from './produtoService.js';

/**
 * Ajuste de estoque (F4): define a quantidade real do produto e registra
 * a diferença no histórico, com o motivo informado.
 */
export async function ajustar(lojaId, produtoId, { quantidade, motivo }) {
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT quantidade FROM produtos WHERE id = ? AND loja_id = ? AND ativo = TRUE FOR UPDATE',
      [produtoId, lojaId],
    );
    if (!rows[0]) throw new AppError('Produto não encontrado.', 404);

    const diferenca = quantidade - rows[0].quantidade;
    if (diferenca === 0) {
      throw new AppError('A quantidade informada é igual à atual. Nada foi alterado.', 400, {
        quantidade: 'Informe uma quantidade diferente da atual.',
      });
    }

    await conn.execute('UPDATE produtos SET quantidade = ? WHERE id = ? AND loja_id = ?', [
      quantidade,
      produtoId,
      lojaId,
    ]);
    await conn.execute(
      `INSERT INTO movimentacoes_estoque (loja_id, produto_id, tipo, quantidade, saldo_apos, motivo)
       VALUES (?, ?, 'ajuste', ?, ?, ?)`,
      [lojaId, produtoId, diferenca, quantidade, motivo],
    );
  });
  return buscarProduto(lojaId, produtoId);
}
