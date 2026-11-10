// Cliente HTTP da NEXORA: centraliza chamadas à API e trata erros
// em mensagens prontas para mostrar ao usuário.
// A sessão fica num cookie httpOnly, enviado automaticamente pelo navegador.

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

let aoPerderSessao = null

/** Registra o que fazer quando a API responde 401 (ex.: sessão expirada). */
export function definirAoPerderSessao(fn) {
  aoPerderSessao = fn
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet e tente de novo.', 0)
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && aoPerderSessao) aoPerderSessao()
    const message = data?.erro || 'Algo deu errado. Tente novamente.'
    throw new ApiError(message, res.status, data?.detalhes)
  }
  return data
}
