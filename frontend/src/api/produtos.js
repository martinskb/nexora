import { api } from './client.js'

export const produtosApi = {
  listar: (signal) => api('/produtos', { signal }),
  criar: (dados) => api('/produtos', { method: 'POST', body: dados }),
  atualizar: (id, dados) => api(`/produtos/${id}`, { method: 'PUT', body: dados }),
  remover: (id) => api(`/produtos/${id}`, { method: 'DELETE' }),
}
