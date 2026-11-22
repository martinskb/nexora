import { useCallback, useLayoutEffect, useState } from 'react'

// Guardado enquanto a aba do navegador estiver aberta (não vai para o localStorage).
const memoria = new Map()

/** Como useState, mas o valor sobrevive a sair e voltar para a tela (filtros, busca). */
export function useEstadoDaAba(chave, inicial) {
  const [valor, setValor] = useState(() => (memoria.has(chave) ? memoria.get(chave) : inicial))
  const definir = useCallback(
    (novo) =>
      setValor((atual) => {
        const v = typeof novo === 'function' ? novo(atual) : novo
        memoria.set(chave, v)
        return v
      }),
    [chave],
  )
  return [valor, definir]
}

/** Lembra a posição de rolagem da tela e a restaura ao voltar. */
export function useRolagemDaAba(chave) {
  useLayoutEffect(() => {
    window.scrollTo(0, memoria.get(`rolagem:${chave}`) ?? 0)
    return () => memoria.set(`rolagem:${chave}`, window.scrollY)
  }, [chave])
}

/** Esquece tudo (ao sair da conta). */
export const esquecerEstadoDasAbas = () => memoria.clear()
