// Uma tela com trabalho em andamento (Vender com itens) pode segurar a saída:
// qualquer navegação do app passa por aqui e, se houver itens, a tela pergunta
// antes e só depois segue (a "continuação").

let guarda = null

/** guarda: { temItens(): boolean, pedir(continuar): void } — ou null para soltar. */
export function definirGuardaSaida(g) {
  guarda = g
}

/** Segue direto (true) ou deixa a tela perguntar antes (false). */
export function tentarSair(continuar) {
  if (guarda?.temItens()) {
    guarda.pedir(continuar)
    return false
  }
  continuar()
  return true
}
