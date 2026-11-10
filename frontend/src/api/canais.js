import { api } from './client.js'

export const canaisApi = {
  listar: (signal) => api('/canais', { signal }),
  criar: (dados) => api('/canais', { method: 'POST', body: dados }),
  /** dados: { nome?, ativo? } */
  atualizar: (id, dados) => api(`/canais/${id}`, { method: 'PUT', body: dados }),
  remover: (id) => api(`/canais/${id}`, { method: 'DELETE' }),
}
