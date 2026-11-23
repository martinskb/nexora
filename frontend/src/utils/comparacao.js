import { intervaloDoPeriodo } from './datas.js'

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Intervalo de mesmo tamanho imediatamente antes do período atual
 * (hoje → ontem; 7 dias → os 7 anteriores; 30 dias → os 30 anteriores).
 */
export function intervaloAnterior(periodo, agora = new Date()) {
  const atual = intervaloDoPeriodo(periodo, agora)
  const ate = new Date(atual.de)
  const dias = Math.round((new Date(atual.ate) - ate) / DIA_MS)
  const de = new Date(ate)
  de.setDate(de.getDate() - dias) // setDate respeita mudanças de horário de verão
  return { de: de.toISOString(), ate: ate.toISOString() }
}

/**
 * Compara o valor atual com o do período anterior.
 * modo 'diferenca' → "↑ 6"; 'percentual' → "↓ 4%". Sem base (anterior 0) → null.
 */
export function compararValores(atual, anterior, modo) {
  if (!anterior) return null
  const bruto = modo === 'percentual' ? ((atual - anterior) / anterior) * 100 : atual - anterior
  const valor = Math.round(Math.abs(bruto))
  const direcao = valor === 0 ? 'igual' : bruto > 0 ? 'alta' : 'queda'
  const seta = { alta: '↑', queda: '↓', igual: '=' }[direcao]
  return { direcao, texto: `${seta} ${valor}${modo === 'percentual' ? '%' : ''}` }
}

/**
 * Quanto do total do período anterior o atual já alcançou.
 * Sem período anterior (≤ 0): anel cheio e sem percentual.
 */
export function fracaoAnel(atual, anterior) {
  if (!(anterior > 0)) return { fracao: 1, percentual: null }
  const razao = Math.max(0, atual) / anterior
  return { fracao: Math.min(1, razao), percentual: Math.round(razao * 100) }
}
