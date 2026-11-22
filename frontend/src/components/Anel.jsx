import { useState } from 'react'
import estilos from './Anel.module.css'

/**
 * Anel de progresso. `fracao` de 0 a 1. O centro (children) mostra o valor.
 * Para o leitor de tela, `descricao` resume o que o anel mostra.
 */
export function Anel({ fracao = 0, tamanho = 232, espessura = 6, animar = true, descricao, children }) {
  const raio = (tamanho - espessura) / 2 - 2
  const volta = 2 * Math.PI * raio
  const f = Math.min(1, Math.max(0, fracao))
  // A animação de entrada só roda uma vez; depois, mudanças deslizam por transição.
  const [entrando, setEntrando] = useState(animar)
  return (
    <div className={estilos.anel} style={{ width: tamanho, height: tamanho }} role="img" aria-label={descricao}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <circle className={estilos.trilho} cx={tamanho / 2} cy={tamanho / 2} r={raio} strokeWidth={espessura} />
        <circle
          className={`${estilos.arco} ${entrando ? estilos.anima : ''}`}
          onAnimationEnd={() => setEntrando(false)}
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
          style={{ '--volta': volta, '--alvo': volta * (1 - f) }}
        />
      </svg>
      <div className={estilos.centro} aria-hidden="true">
        {children}
      </div>
    </div>
  )
}
