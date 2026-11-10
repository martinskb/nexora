/**
 * Situação do saldo de um produto:
 * - 'zerado': não há unidades
 * - 'baixo' : chegou ao estoque mínimo definido pelo comerciante
 * - 'ok'    : demais casos
 */
export function situacaoEstoque({ quantidade, estoqueMinimo }) {
  if (quantidade <= 0) return 'zerado'
  if (estoqueMinimo > 0 && quantidade <= estoqueMinimo) return 'baixo'
  return 'ok'
}

export const ROTULO_SITUACAO = {
  zerado: 'Sem estoque',
  baixo: 'Acabando',
  ok: 'Em estoque',
}

export const unidades = (n) => `${n} ${n === 1 ? 'unidade' : 'unidades'}`
