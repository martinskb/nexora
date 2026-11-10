/** Nome mostrado para vendas sem origem. */
export const SEM_CANAL = 'Sem canal'

const NUM_SERIES = 6
const comparar = new Intl.Collator('pt-BR', { sensitivity: 'base' }).compare

/** Nome do canal de uma venda (`canal: { id, nome } | null`). */
export const nomeDoCanal = (canal) => canal?.nome ?? SEM_CANAL

/**
 * Cor do canal nos gráficos: segue a ordem alfabética entre TODOS os canais
 * da loja (ativos e arquivados), para não mudar de um período para outro.
 * Sem canal → cinza neutro. Depois da 6ª cor, as cores se repetem.
 */
export function corDoCanal(canalId, todosCanais) {
  if (canalId == null) return 'var(--cor-sem-canal)'
  const ordem = [...todosCanais].sort((a, b) => comparar(a.nome, b.nome))
  const i = Math.max(0, ordem.findIndex((c) => c.id === canalId))
  return `var(--serie-${(i % NUM_SERIES) + 1})`
}

/** Letras que cabem lado a lado em botões numa tela de celular (~360px). */
const MAX_LETRAS_BOTOES = 28

/**
 * Botões lado a lado (Segmentado) ou lista suspensa?
 * Lista quando há mais de 3 canais ou quando os nomes não cabem na largura do celular.
 * opcoes: todas as opções mostradas (incluindo "Nenhum"/"Vendas"/"Sem canal").
 */
export function usarListaDeCanais(opcoes, quantidadeDeCanais) {
  const letras = opcoes.reduce((soma, o) => soma + o.rotulo.length, 0)
  return quantidadeDeCanais > 3 || letras > MAX_LETRAS_BOTOES
}
