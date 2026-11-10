import { formatarMoeda } from '../utils/formato.js'
import estilos from './Preco.module.css'

/**
 * Preço no estilo etiqueta de prateleira: "R$" pequeno, reais grandes e
 * centavos elevados. O texto continua sendo "R$ 6,49" para leitores de tela.
 *
 * tamanho: 'md' (padrão) | 'lg' | 'xl'
 * etiqueta: true desenha o fundo amarelo de etiqueta.
 */
export function Preco({ valor, tamanho = 'md', etiqueta = false, className = '' }) {
  const texto = formatarMoeda(valor) // "R$ 1.234,56" (o espaço pode ser não separável)
  const m = texto.match(/^(\D*?)\s*([\d.]+),(\d{2})$/)
  const classes = [estilos.preco, estilos[tamanho], etiqueta && estilos.etiqueta, className].filter(Boolean).join(' ')
  if (!m) return <span className={classes}>{texto}</span>
  const [, moeda, reais, centavos] = m
  return (
    <span className={classes}>
      <span className={estilos.moeda}>{moeda} </span>
      <span className={estilos.reais}>{reais}</span>
      <span className={estilos.centavos}>,{centavos}</span>
    </span>
  )
}
