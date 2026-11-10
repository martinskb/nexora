const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numero2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 6.5 → "R$ 6,50" */
export const formatarMoeda = (valor) => moeda.format(valor ?? 0)

/** 6.5 → "6,50" (para preencher campos de formulário) */
export const formatarDecimal = (valor) => numero2.format(valor ?? 0)

/**
 * Lê um valor digitado no formato brasileiro: "6,50", "6.50", "1.234,56", "R$ 10".
 * Retorna número ou null se for inválido.
 */
export function lerValorMonetario(texto) {
  if (texto == null) return null
  let s = String(texto).replace(/R\$|\s/g, '')
  if (!s) return null
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.') // "1.234,56" → "1234.56"
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '') // "1.234" → "1234"
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  return Number(s)
}

/** Lê um número inteiro não negativo ("12" → 12). Retorna null se inválido. */
export function lerInteiro(texto) {
  const s = String(texto ?? '').trim()
  if (!/^\d+$/.test(s)) return null
  return Number(s)
}

/** Texto para comparação em buscas: sem acentos e em minúsculas. */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
