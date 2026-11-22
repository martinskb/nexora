import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect, useMemo, useState } from 'react'
import { armazenamento, criarClienteDeConsultas, registrarCliente } from './cliente.js'
import { chavePersistencia } from './consultas.js'

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Provedor de dados da loja logada. O cache em memória é próprio de cada loja
 * (o componente é remontado com key=lojaId) e é gravado no localStorage numa
 * chave por loja, por até 24h. Sem loja, não grava nada.
 */
export function ProvedorDeDados({ lojaId, children }) {
  const [cliente] = useState(criarClienteDeConsultas)
  useEffect(() => registrarCliente(cliente), [cliente])
  const persister = useMemo(() => {
    const storage = armazenamento()
    if (!lojaId || !storage) return null
    return createSyncStoragePersister({ storage, key: chavePersistencia(lojaId), throttleTime: 1000 })
  }, [lojaId])

  if (!persister) return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  return (
    <PersistQueryClientProvider client={cliente} persistOptions={{ persister, maxAge: DIA_MS, buster: 'v1' }}>
      {children}
    </PersistQueryClientProvider>
  )
}

