import { api } from './client.js'

export const produtosApi = {
  listar: (signal) => api('/produtos', { signal }),
  criar: (dados) => api('/produtos', { method: 'POST', body: dados }),
  atualizar: (id, dados) => api(`/produtos/${id}`, { method: 'PUT', body: dados }),
  remover: (id) => api(`/produtos/${id}`, { method: 'DELETE' }),
  /**
   * Ajuste de estoque.
   * modo 'contagem': `quantidade` é o total real contado agora.
   * modo 'entrada' : `quantidade` é quantas unidades chegaram (soma ao saldo).
   */
  /** custo (opcional, só na entrada): { custoUnitario } ou { custoTotal }. */
  ajustar: (id, quantidade, motivo, modo = 'contagem', custo = {}) =>
    api(`/produtos/${id}/ajustes`, { method: 'POST', body: { modo, quantidade, motivo, ...custo } }),
  historico: (id, { antesDe } = {}, signal) =>
    api(`/produtos/${id}/movimentacoes${antesDe ? `?antesDe=${antesDe}` : ''}`, { signal }),
}
