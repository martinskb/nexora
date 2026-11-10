// Datas são calculadas no fuso do navegador do comerciante e enviadas em ISO (UTC).

function inicioDoDia(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Intervalo { de, ate } em ISO para períodos rápidos. 'tudo' → sem limites. */
export function intervaloDoPeriodo(periodo, agora = new Date()) {
  if (periodo === 'tudo') return {}
  const dias = { hoje: 0, '7d': 6, '30d': 29 }[periodo] ?? 0
  const de = inicioDoDia(agora)
  de.setDate(de.getDate() - dias)
  const ate = inicioDoDia(agora)
  ate.setDate(ate.getDate() + 1)
  return { de: de.toISOString(), ate: ate.toISOString() }
}

const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dataLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const formatarHora = (iso) => hora.format(new Date(iso))
export const formatarDataHora = (iso) => dataHora.format(new Date(iso))

/** "Hoje", "Ontem" ou "segunda-feira, 10 de novembro". */
export function rotuloDoDia(iso, agora = new Date()) {
  const dia = inicioDoDia(iso).getTime()
  const hoje = inicioDoDia(agora).getTime()
  const diffDias = Math.round((hoje - dia) / 86_400_000)
  if (diffDias === 0) return 'Hoje'
  if (diffDias === 1) return 'Ontem'
  const texto = dataLonga.format(new Date(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const CANAL_ROTULO = { balcao: 'Balcão', whatsapp: 'WhatsApp' }
