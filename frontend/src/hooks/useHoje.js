import { useEffect, useState } from 'react'
import { mesmoDia } from '../utils/relatorio.js'

/** Data de hoje que acompanha a virada do dia (app aberto de um dia para o outro). */
export function useHoje() {
  const [hoje, setHoje] = useState(() => new Date())
  useEffect(() => {
    const conferir = () => setHoje((atual) => (mesmoDia(atual, new Date()) ? atual : new Date()))
    const t = setInterval(conferir, 60_000)
    window.addEventListener('focus', conferir)
    document.addEventListener('visibilitychange', conferir)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', conferir)
      document.removeEventListener('visibilitychange', conferir)
    }
  }, [])
  return hoje
}
