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

const PRIORIDADE = { zerado: 0, baixo: 1, ok: 2 }

/** O que precisa de atenção primeiro: zerados, depois acabando, depois o resto (cada grupo por nome). */
export const ordenarPorAtencao = (produtos) =>
  [...produtos].sort(
    (a, b) =>
      PRIORIDADE[situacaoEstoque(a)] - PRIORIDADE[situacaoEstoque(b)] || a.nome.localeCompare(b.nome, 'pt-BR'),
  )
