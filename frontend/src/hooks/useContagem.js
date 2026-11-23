import { useEffect, useRef, useState } from 'react'
import { useReduzirMovimento } from './useReduzirMovimento.js'

/**
 * Número que "conta" até o alvo: na primeira vez a partir de 0 (desdeZero); quando
 * o alvo muda, a partir do valor anterior. Desacelera no fim. Com "reduzir movimento"
 * (ou animar=false), devolve o alvo direto.
 */
export function useContagem(alvo, { duracao = 1200, atraso = 0, animar = true, desdeZero = true } = {}) {
  const reduzir = useReduzirMovimento()
  const direto = reduzir || !animar
  const partida = direto || !desdeZero ? alvo : 0
  const [valor, setValor] = useState(partida)
  const atual = useRef(partida)

  useEffect(() => {
    if (direto) {
      atual.current = alvo
      return undefined
    }
    const de = atual.current
    let quadro
    const inicio = performance.now() + atraso
    const passo = (agora) => {
      const p = Math.min(1, Math.max(0, (agora - inicio) / duracao))
      const v = de + (alvo - de) * (1 - (1 - p) ** 4)
      atual.current = v
      setValor(v)
      if (p < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, direto, duracao, atraso])

  return direto ? alvo : valor
}
