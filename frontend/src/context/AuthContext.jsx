import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth.js'
import { definirAoPerderSessao } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loja, setLoja] = useState(null)
  const [verificando, setVerificando] = useState(true)

  // Ao abrir o sistema, verifica se já existe uma sessão ativa.
  useEffect(() => {
    definirAoPerderSessao(() => setLoja(null))
    const ctrl = new AbortController()
    authApi
      .me(ctrl.signal)
      .then((r) => {
        setLoja(r.loja)
        setVerificando(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoja(null)
        setVerificando(false)
      })
    return () => ctrl.abort()
  }, [])

  const entrar = useCallback(async (dados) => {
    const r = await authApi.entrar(dados)
    setLoja(r.loja)
  }, [])

  const cadastrar = useCallback(async (dados) => {
    const r = await authApi.cadastrar(dados)
    setLoja(r.loja)
  }, [])

  const sair = useCallback(async () => {
    try {
      await authApi.sair()
    } finally {
      setLoja(null)
    }
  }, [])

  const valor = useMemo(
    () => ({ loja, verificando, entrar, cadastrar, sair, atualizarLoja: setLoja }),
    [loja, verificando, entrar, cadastrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
