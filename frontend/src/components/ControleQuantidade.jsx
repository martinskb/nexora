import { useState } from 'react'
import { IconeMais } from './Icones.jsx'
import estilos from './ControleQuantidade.module.css'

/**
 * Botões − e + com campo editável no meio.
 * aoMudar(novaQuantidade) é chamado com inteiros >= 0 (0 = remover).
 */
export function ControleQuantidade({ valor, aoMudar, nome }) {
  const [rascunho, setRascunho] = useState(null) // texto enquanto o usuário digita

  function confirmarDigitado() {
    if (rascunho === null) return
    const n = Number(rascunho)
    setRascunho(null)
    if (Number.isInteger(n) && n >= 0 && n !== valor) aoMudar(n)
  }

  return (
    <div className={estilos.controle}>
      <button
        type="button"
        className={estilos.botao}
        onClick={() => aoMudar(valor - 1)}
        aria-label={valor === 1 ? `Remover ${nome}` : `Diminuir ${nome}`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        className={estilos.campo}
        inputMode="numeric"
        aria-label={`Quantidade de ${nome}`}
        value={rascunho ?? String(valor)}
        onChange={(e) => setRascunho(e.target.value.replace(/\D/g, ''))}
        onBlur={confirmarDigitado}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className={estilos.botao} onClick={() => aoMudar(valor + 1)} aria-label={`Aumentar ${nome}`}>
        <IconeMais tamanho={18} />
      </button>
    </div>
  )
}
