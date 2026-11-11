import { Preco } from './Preco.jsx'
import { SeloEstoque } from './SeloEstoque.jsx'
import { ROTULO_SITUACAO, situacaoEstoque } from '../utils/estoque.js'
import estilos from './CartaoProduto.module.css'

// Medidor de estoque: cheio a partir de 3× o mínimo; vazio quando zerado.
const preenchimento = (p) => Math.min(100, Math.round((p.quantidade / (p.estoqueMinimo * 3)) * 100))

/**
 * Cartão de produto no estilo etiqueta de gôndola. O trilho colorido à
 * esquerda mostra a situação do estoque (em dia, acabando, sem estoque).
 *
 * foco: 'preco' (tela Produtos) | 'estoque' (tela Estoque: quantidade em destaque)
 */
export function CartaoProduto({ produto: p, foco = 'preco', aoAbrir, rotulo }) {
  const situacao = situacaoEstoque(p)
  return (
    <button type="button" className={`${estilos.cartao} ${estilos[situacao]}`} onClick={aoAbrir} aria-label={rotulo}>
      <span className={estilos.nome}>{p.nome}</span>

      {foco === 'preco' ? (
        <span className={estilos.linhaPreco}>
          <Preco valor={p.preco} etiqueta />
          <SeloEstoque produto={p} />
        </span>
      ) : (
        <span className={estilos.quantidade}>
          <strong>{p.quantidade}</strong>
          <span className={estilos.unidade}>{p.quantidade === 1 ? 'unidade' : 'unidades'}</span>
          {situacao !== 'ok' && <span className={estilos.situacao}>{ROTULO_SITUACAO[situacao]}</span>}
        </span>
      )}

      {p.estoqueMinimo > 0 && (
        <span className={estilos.medidor} aria-hidden="true">
          <span style={{ width: `${preenchimento(p)}%` }} />
        </span>
      )}

      <span className={estilos.rodape}>
        <span>
          {p.estoqueMinimo > 0 ? (
            <>
              {foco === 'preco' ? 'Mínimo' : 'Aviso em'} <strong>{p.estoqueMinimo}</strong>
            </>
          ) : (
            'Sem mínimo'
          )}
        </span>
        <span>
          Vendeu <strong>{p.vendidos30d ?? 0}</strong> em 30 dias
        </span>
      </span>

    </button>
  )
}
