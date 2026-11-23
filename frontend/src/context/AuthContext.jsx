import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/auth.js'
import { definirAoPerderSessao } from '../api/client.js'
import { limparCacheDaLoja } from '../dados/cliente.js'
import { lojaParaLimpar } from '../dados/consultas.js'
import { esquecerEstadoDasAbas } from '../hooks/useEstadoDaAba.js'

const AuthContext = createContext(null)
const CHAVE_ULTIMA_LOJA = 'nexora-ultima-loja'

function lerUltimaLoja() {
  try {
    return window.localStorage.getItem(CHAVE_ULTIMA_LOJA)
  } catch {
    return null
  }
}

function gravarUltimaLoja(id) {
  try {
    if (id == null) window.localStorage.removeItem(CHAVE_ULTIMA_LOJA)
    else window.localStorage.setItem(CHAVE_ULTIMA_LOJA, String(id))
  } catch {
    /* armazenamento indisponível */
  }
}

export function AuthProvider({ children }) {
  const [loja, setLoja] = useState(null)
  const [verificando, setVerificando] = useState(true)
  // Indício de sessão (alguém já entrou neste aparelho): a abertura mostra a moldura do app.
  const [ultimaLojaId] = useState(lerUltimaLoja)
  const lojaAtual = useRef(null)
  useEffect(() => {
    lojaAtual.current = loja
    if (loja?.id != null) gravarUltimaLoja(loja.id)
  }, [loja])

  // Ao sair ou perder a sessão, apaga os dados guardados ANTES de esquecer a loja.
  const esquecerLoja = useCallback(() => {
    limparCacheDaLoja(lojaParaLimpar(lojaAtual.current, lerUltimaLoja()))
    esquecerEstadoDasAbas()
    gravarUltimaLoja(null)
    setLoja(null)
  }, [])

  // Ao abrir o sistema, verifica se já existe uma sessão ativa.
  useEffect(() => {
    definirAoPerderSessao(esquecerLoja)
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
  }, [esquecerLoja])

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
      esquecerLoja()
    }
  }, [esquecerLoja])

  const valor = useMemo(
    () => ({ loja, verificando, ultimaLojaId, entrar, cadastrar, sair, atualizarLoja: setLoja }),
    [loja, verificando, ultimaLojaId, entrar, cadastrar, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
