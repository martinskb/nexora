import { useCallback, useEffect, useState } from 'react'

const CHAVE = 'nexora-tema'
const consultaEscuro = '(prefers-color-scheme: dark)'

function temaDoSistema() {
  return window.matchMedia(consultaEscuro).matches ? 'escuro' : 'claro'
}

/**
 * Tema da interface. Por padrão segue o sistema; ao alternar, a escolha
 * é salva no navegador e aplicada via <html data-theme="...">.
 */
export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.theme || temaDoSistema())

  // Acompanha mudanças do sistema enquanto o usuário não escolheu manualmente.
  useEffect(() => {
    const mq = window.matchMedia(consultaEscuro)
    const aoMudar = () => {
      if (!document.documentElement.dataset.theme) setTema(temaDoSistema())
    }
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  const alternar = useCallback(() => {
    setTema((atual) => {
      const novo = atual === 'escuro' ? 'claro' : 'escuro'
      document.documentElement.dataset.theme = novo
      try {
        localStorage.setItem(CHAVE, novo)
      } catch {
        // navegador sem armazenamento: o tema vale só nesta visita
      }
      return novo
    })
  }, [])

  return { tema, alternar }
}
