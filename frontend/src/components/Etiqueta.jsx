import { Link } from 'react-router-dom'
import estilos from './Etiqueta.module.css'

/**
 * Etiqueta de preço (identidade da Nexora): ponta em bico com o furo do barbante.
 * variante 'indicador' (Início: rótulo, valor e comparação) ou 'preco' (pequena).
 * estado: 'neutra' | 'alerta' | 'critico'. Com `para`, vira link.
 * `descricao` é o texto lido pelo leitor de tela (ex.: "Vendas: 37, 6 a mais que ontem").
 */
export function Etiqueta({
  rotulo,
  valor,
  comparacao = null,
  estado = 'neutra',
  variante = 'indicador',
  para,
  estadoLink,
  indice = 0,
  animar = false,
  descricao,
  className = '',
}) {
  const classes = [estilos.contorno, estilos[variante], estilos[estado], animar && estilos.pendura, className]
    .filter(Boolean)
    .join(' ')
  const conteudo = (
    <span className={estilos.forma}>
      {rotulo && <span className={estilos.rotulo}>{rotulo}</span>}
      <span className={estilos.valor}>{valor}</span>
      {comparacao && <span className={`${estilos.comparacao} ${estilos[comparacao.direcao] ?? ''}`}>{comparacao.texto}</span>}
    </span>
  )
  const props = { className: classes, style: { '--indice': indice }, 'aria-label': descricao }
  if (para) {
    return (
      <Link to={para} state={estadoLink} {...props}>
        {conteudo}
      </Link>
    )
  }
  return (
    <span role={descricao ? 'group' : undefined} {...props}>
      {conteudo}
    </span>
  )
}
