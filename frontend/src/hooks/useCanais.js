import { useCallback, useEffect, useMemo, useState } from 'react'
import { canaisApi } from '../api/canais.js'

async function buscarCanais(signal) {
  try {
    const { canais } = await canaisApi.listar(signal)
    return { canais, erro: '' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { canais: null, erro: err.message }
  }
}

/**
 * Canais de venda da loja.
 * `ativos`: só os não arquivados, em ordem alfabética (a API já ordena por nome).
 */
export function useCanais() {
  const [estado, setEstado] = useState({ canais: [], carregando: true, erro: '' })

  const aplicar = useCallback((r) => {
    if (!r) return
    // Em caso de erro, mantém a última lista conhecida.
    setEstado((e) => ({ canais: r.canais ?? e.canais, carregando: false, erro: r.erro }))
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    buscarCanais(ctrl.signal).then(aplicar)
    return () => ctrl.abort()
  }, [aplicar])

  const recarregar = useCallback(() => buscarCanais().then(aplicar), [aplicar])
  const ativos = useMemo(() => estado.canais.filter((c) => c.ativo), [estado.canais])

  return { ...estado, ativos, recarregar }
}
