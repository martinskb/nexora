// Chaves, validades e regras de atualização do cache de dados (spec §4.2).

export const chaves = {
  resumo: (de, ate) => ['resumo', de, ate],
  produtos: () => ['produtos'],
  vendas: (filtros) => ['vendas', filtros],
  venda: (id) => ['venda', id],
  canais: () => ['canais'],
  historico: (produtoId) => ['historico', produtoId],
}

export const VALIDADE_MS = {
  resumo: 30_000,
  produtos: 60_000,
  vendas: 30_000,
  canais: 60_000,
  historico: 60_000,
}

/** Prefixos de chave a atualizar depois de cada tipo de mudança. */
export function invalidacoesApos(evento, extra = {}) {
  switch (evento) {
    case 'venda':
    case 'cancelamento':
      return [['resumo'], ['vendas'], ['venda'], ['produtos']]
    case 'produto':
      return [['produtos'], ['resumo']]
    case 'ajuste':
      return [['produtos'], ['resumo'], ['historico', extra.produtoId]]
    case 'canal':
      return [['canais'], ['vendas'], ['resumo']]
    default:
      return []
  }
}

/** Uma nova tentativa só para falha de rede ou erro do servidor (5xx). */
export const deveRepetir = (falhas, erro) => falhas < 1 && (erro?.status === 0 || erro?.status >= 500)

export const chavePersistencia = (lojaId) => `nexora-cache:v1:${lojaId}`
