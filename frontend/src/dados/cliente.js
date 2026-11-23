import { QueryClient } from '@tanstack/react-query'
import { chavePersistencia, deveRepetir } from './consultas.js'

const DIA_MS = 24 * 60 * 60 * 1000

export function criarClienteDeConsultas() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: DIA_MS,
        staleTime: 30_000,
        retry: deveRepetir,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  })
}

// Cliente da loja atual, para limpar o cache ao sair (o AuthContext fica fora do provedor).
let clienteAtual = null

/** Registra o cliente da loja atual (chamado pelo ProvedorDeDados). */
export function registrarCliente(cliente) {
  clienteAtual = cliente
}

export function armazenamento() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/** Apaga o cache da loja: da memória e do localStorage. */
export function limparCacheDaLoja(lojaId) {
  clienteAtual?.cancelQueries()
  clienteAtual?.clear()
  const storage = armazenamento()
  if (!storage || lojaId == null) return
  const apagar = () => {
    try {
      storage.removeItem(chavePersistencia(lojaId))
    } catch {
      /* armazenamento indisponível */
    }
  }
  apagar()
  // Uma gravação atrasada (throttle de 1s) pode recriar a chave: apaga de novo depois.
  setTimeout(apagar, 1200)
}
