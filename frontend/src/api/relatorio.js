import { api } from './client.js'

export const relatorioApi = {
  /** Relatório de um dia local ("AAAA-MM-DD"); envia o fuso do navegador. */
  obter: (dia, signal) => {
    const fuso = -new Date().getTimezoneOffset()
    return api(`/relatorio?${new URLSearchParams({ dia, fuso: String(fuso) })}`, { signal })
  },
}
