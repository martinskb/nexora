import { api } from './client.js'

export const authApi = {
  cadastrar: (dados) => api('/auth/cadastro', { method: 'POST', body: dados }),
  entrar: (dados) => api('/auth/login', { method: 'POST', body: dados }),
  sair: () => api('/auth/logout', { method: 'POST' }),
  me: (signal) => api('/auth/me', { signal }),
}
