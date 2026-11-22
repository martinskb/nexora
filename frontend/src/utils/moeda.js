const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Separa um valor em reais nas partes que o destaque mostra em tamanhos
 * diferentes: R$ 1.284,50 → { simbolo: 'R$', inteiro: '1.284', centavos: ',50' }.
 */
export function partesMoeda(valor) {
  const texto = numero.format(valor ?? 0)
  const virgula = texto.lastIndexOf(',')
  return { simbolo: 'R$', inteiro: texto.slice(0, virgula), centavos: texto.slice(virgula) }
}
