import { api } from './client.js'

export const vendasApi = {
  registrar: (dados) => api('/vendas', { method: 'POST', body: dados }),
  listar: (filtros = {}, signal) => {
    const params = new URLSearchParams()
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') params.set(chave, valor)
    }
    const qs = params.toString()
    return api(`/vendas${qs ? `?${qs}` : ''}`, { signal })
  },
  buscar: (id) => api(`/vendas/${id}`),
  /** Quanto saiu de cada produto no período { de, ate }. */
  produtos: ({ de, ate }, signal) => api(`/vendas/produtos?${new URLSearchParams({ de, ate })}`, { signal }),
  cancelar: (id, motivo) => api(`/vendas/${id}/cancelar`, { method: 'POST', body: { motivo } }),
}
