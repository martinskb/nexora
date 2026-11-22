// Peças das regras de histórico que não dependem do React.

/**
 * Estado da entrada de "guarda" de Vender: copia o do roteador, mas nunca a
 * marca de uma folha (senão a folha, ao se fechar, apagaria a guarda no lugar
 * da própria entrada).
 */
export function estadoComGuarda(estado) {
  const { folha: _folha, ...resto } = estado ?? {}
  return { ...resto, guardaVenda: true }
}

/** Item aberto numa tela: o que a pessoa abriu, ou o pedido pelo link (até ser dispensado). */
export const itemPedidoAberto = (abertoPelaPessoa, pedido, pedidoDispensado) =>
  abertoPelaPessoa ?? (pedidoDispensado ? null : pedido)

/** Espera o próximo "popstate" (ou um tempo máximo), para encadear voltas no histórico. */
export const esperarVolta = (maximoMs = 400) =>
  new Promise((ok) => {
    let t
    const fim = () => {
      window.removeEventListener('popstate', fim)
      clearTimeout(t)
      ok()
    }
    window.addEventListener('popstate', fim)
    t = setTimeout(fim, maximoMs)
  })
