import { useContagem } from '../hooks/useContagem.js'
import { formatarMoeda } from '../utils/formato.js'
import { partesMoeda } from '../utils/moeda.js'
import estilos from './NumeroAnimado.module.css'

/**
 * Número que conta até o valor. Em moeda com destaque, "R$" e centavos ficam
 * menores e levantados (R$ 1.284⁵⁰). O leitor de tela lê só o valor final.
 */
export function NumeroAnimado({
  valor = 0,
  moeda = false,
  destaque = false,
  animar = true,
  desdeZero = true,
  atraso = 400,
  className = '',
}) {
  const v = useContagem(valor, { atraso: desdeZero ? atraso : 0, animar, desdeZero })
  const final = moeda ? formatarMoeda(valor) : Math.round(valor).toLocaleString('pt-BR')
  let visivel
  if (moeda && destaque) {
    const p = partesMoeda(v)
    visivel = (
      <>
        <span className={estilos.simbolo}>{p.simbolo}</span>
        {p.inteiro}
        <span className={estilos.centavos}>{p.centavos}</span>
      </>
    )
  } else {
    visivel = moeda ? formatarMoeda(v) : Math.round(v).toLocaleString('pt-BR')
  }
  return (
    <span className={`num ${className}`}>
      <span aria-hidden="true">{visivel}</span>
      <span className="somente-leitor">{final}</span>
    </span>
  )
}
