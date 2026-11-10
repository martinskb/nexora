import { api } from './client.js'

export const resumoApi = {
  /** Resumo do período; envia o fuso do navegador para agrupar vendas pelo dia local. */
  obter: ({ de, ate }, signal) => {
    const fuso = -new Date().getTimezoneOffset()
    const qs = new URLSearchParams({ de, ate, fuso: String(fuso) })
    return api(`/resumo?${qs}`, { signal })
  },
}
