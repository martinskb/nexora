import { IconeSeta } from './Icones.jsx'
import estilos from './LinhaProduto.module.css'

/** Lista em cartão com linhas de produto (Produtos, Estoque). */
export function ListaProdutos({ children }) {
  return <ul className={estilos.lista}>{children}</ul>
}

/**
 * Linha tocável de produto: nome com um detalhe embaixo (situação colorida
 * quando importa) e um conteúdo à direita (preço ou selo de quantidade).
 * acao: verbo lido pelo leitor de tela antes do nome (ex.: "Editar").
 */
export function LinhaProduto({ nome, detalhe, tom = 'neutro', direita, acao, seta = false, aoAbrir }) {
  return (
    <li>
      <button type="button" className={estilos.linha} onClick={aoAbrir}>
        <span className={estilos.texto}>
          <span className={estilos.nome}>
            {acao && <span className="somente-leitor">{acao} </span>}
            {nome}
          </span>
          {detalhe && <small className={estilos[tom]}>{detalhe}</small>}
        </span>
        {direita}
        {seta && <IconeSeta className={estilos.seta} />}
      </button>
    </li>
  )
}

/** Selo de quantidade: crítico (zerado), alerta (acabando) ou neutro com contorno. */
export function SeloQuantidade({ quantidade, situacao }) {
  return <span className={`${estilos.selo} ${estilos[`selo_${situacao}`]} num`}>{quantidade} un</span>
}
