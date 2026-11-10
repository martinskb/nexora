import { api } from './client.js'

export const produtosApi = {
  listar: (signal) => api('/produtos', { signal }),
  criar: (dados) => api('/produtos', { method: 'POST', body: dados }),
  atualizar: (id, dados) => api(`/produtos/${id}`, { method: 'PUT', body: dados }),
  remover: (id) => api(`/produtos/${id}`, { method: 'DELETE' }),
  /** Ajuste de estoque: `quantidade` é o total real contado agora. */
  ajustar: (id, quantidade, motivo) => api(`/produtos/${id}/ajustes`, { method: 'POST', body: { quantidade, motivo } }),
}
