import { useEffect, useRef, useState } from 'react'
import { ATRASO_SKELETON_MS, MINIMO_SKELETON_MS, decidirSkeleton } from '../utils/skeleton.js'

/**
 * Mostrar o skeleton agora? Mesma regra de `decidirSkeleton` (atraso de 200ms,
 * mínimo de 300ms na tela), aplicada com timers.
 */
export function useSkeleton(temDados, carregando) {
  const [mostrar, setMostrar] = useState(false)
  const inicio = useRef(null)
  const apareceuEm = useRef(null)

  useEffect(() => {
    if (inicio.current === null) inicio.current = performance.now()
    const avaliar = () => {
      const agora = performance.now()
      const sim = decidirSkeleton({
        temDados,
        carregando,
        msDesdeInicio: agora - inicio.current,
        msDesdeQueApareceu: apareceuEm.current === null ? null : agora - apareceuEm.current,
      })
      if (sim && apareceuEm.current === null) apareceuEm.current = agora
      if (!sim) apareceuEm.current = null
      setMostrar(sim)
      return sim
    }
    const sim = avaliar()
    // Reavalia quando o atraso vence (ainda carregando) ou quando o mínimo vence (já terminou).
    const espera = sim ? MINIMO_SKELETON_MS : carregando && !temDados ? ATRASO_SKELETON_MS : null
    if (espera === null) return undefined
    const t = setTimeout(avaliar, espera + 10)
    return () => clearTimeout(t)
  }, [temDados, carregando])

  return mostrar
}
