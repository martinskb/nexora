import { useEffect, useId, useRef } from 'react'

// Folhas abertas, da mais antiga para a do topo.
const pilha = []

/**
 * Liga uma folha/janela ao histórico do navegador: abrir empilha uma entrada;
 * o "voltar" do sistema fecha a folha (e a pessoa continua na tela); fechar
 * pelo X, Esc ou fundo desfaz a entrada, para não sobrar um "voltar" fantasma.
 */
export function useHistoricoFolha(aberto, aoFechar) {
  const id = useId()
  const fechar = useRef(aoFechar)
  useEffect(() => {
    fechar.current = aoFechar
  })

  useEffect(() => {
    if (!aberto) return undefined
    // Em modo estrito o efeito roda duas vezes: não empilha de novo a mesma folha.
    if (window.history.state?.folha !== id) {
      window.history.pushState({ ...window.history.state, folha: id }, '')
    }
    if (!pilha.includes(id)) pilha.push(id)

    const aoVoltar = () => {
      if (pilha.at(-1) === id && window.history.state?.folha !== id) {
        pilha.pop()
        fechar.current()
      }
    }
    window.addEventListener('popstate', aoVoltar)
    return () => {
      window.removeEventListener('popstate', aoVoltar)
      const i = pilha.indexOf(id)
      if (i === -1) return // já fechada pelo voltar
      pilha.splice(i, 1)
      // Fechada por X/Esc/fundo: desfaz a entrada (adiado, para o modo estrito reabrir sem duplicar).
      setTimeout(() => {
        if (!pilha.includes(id) && window.history.state?.folha === id) window.history.back()
      }, 0)
    }
  }, [aberto, id])
}
