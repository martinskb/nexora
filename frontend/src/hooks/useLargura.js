import { useEffect, useRef, useState } from 'react'

/** Mede a largura de um elemento e acompanha mudanças (para gráficos responsivos). */
export function useLargura() {
  const ref = useRef(null)
  const [largura, setLargura] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observador = new ResizeObserver(([entrada]) => setLargura(Math.floor(entrada.contentRect.width)))
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return [ref, largura]
}
