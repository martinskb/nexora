import { useEffect } from 'react'

/** Título da aba do navegador: "‹Tela› · Nexora". */
export function useTitulo(nome) {
  useEffect(() => {
    document.title = nome ? `${nome} · Nexora` : 'Nexora'
  }, [nome])
}
