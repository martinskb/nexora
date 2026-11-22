// Máscaras de digitação: o campo nem aceita o que não serve (letras, vírgula
// em quantidade), em vez de deixar digitar e reclamar só ao salvar.

const moeda = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Quantidades: só dígitos, sem zeros à esquerda, até `max` dígitos. */
export function mascararInteiro(texto, max = 6) {
  const digitos = String(texto ?? '').replace(/\D/g, '').slice(0, max)
  return digitos === '' ? '' : String(Number(digitos))
}

/**
 * Valores em R$: a pessoa digita só números e a vírgula entra sozinha
 * (1 → 0,01 → 0,12 → 1,23). Até 9 dígitos (R$ 9.999.999,99).
 */
export function mascararMoeda(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 9)
  if (digitos === '') return ''
  return moeda.format(Number(digitos) / 100)
}
