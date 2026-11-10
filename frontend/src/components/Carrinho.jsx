import { useState } from 'react'
import { formatarMoeda } from '../utils/formato.js'
import { Alerta } from './Alerta.jsx'
import { Botao } from './Botao.jsx'
import { CampoTexto } from './CampoTexto.jsx'
import { ControleQuantidade } from './ControleQuantidade.jsx'
import { IconeCarrinho, IconeLixeira } from './Icones.jsx'
import { Segmentado } from './Segmentado.jsx'
import estilos from './Carrinho.module.css'

const OPCOES_CANAL = [
  { valor: 'balcao', rotulo: 'Balcão' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
]

/** Itens da venda em andamento, origem, observação e confirmação. */
export function Carrinho({
  itens,
  total,
  canal,
  aoMudarCanal,
  observacao,
  aoMudarObservacao,
  aoMudarQuantidade,
  aoConfirmar,
  enviando,
  erro,
}) {
  const [mostrarObs, setMostrarObs] = useState(Boolean(observacao))
  const totalUnidades = itens.reduce((s, i) => s + i.quantidade, 0)

  if (itens.length === 0) {
    return (
      <div className={estilos.vazio}>
        <IconeCarrinho tamanho={32} />
        <p>Toque em um produto para adicioná-lo à venda.</p>
      </div>
    )
  }

  return (
    <div className={estilos.carrinho}>
      <ul className={estilos.itens}>
        {itens.map(({ produto, quantidade }) => (
          <li key={produto.id} className={estilos.item}>
            <div className={estilos.info}>
              <span className={estilos.nome}>{produto.nome}</span>
              <span className={estilos.unitario}>{formatarMoeda(produto.preco)} cada</span>
            </div>
            <div className={estilos.linhaQtd}>
              <ControleQuantidade
                valor={quantidade}
                nome={produto.nome}
                aoMudar={(n) => aoMudarQuantidade(produto, n)}
              />
              <span className={estilos.subtotal}>{formatarMoeda(produto.preco * quantidade)}</span>
              <button
                type="button"
                className={estilos.remover}
                onClick={() => aoMudarQuantidade(produto, 0)}
                aria-label={`Tirar ${produto.nome} da venda`}
              >
                <IconeLixeira tamanho={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Segmentado rotulo="Origem da venda" opcoes={OPCOES_CANAL} valor={canal} aoMudar={aoMudarCanal} />

      {mostrarObs ? (
        <CampoTexto
          rotulo="Observação (opcional)"
          placeholder="Ex.: nome do cliente, entrega…"
          value={observacao}
          onChange={(e) => aoMudarObservacao(e.target.value)}
          maxLength={255}
          autoComplete="off"
        />
      ) : (
        <button type="button" className={estilos.link} onClick={() => setMostrarObs(true)}>
          + Adicionar observação
        </button>
      )}

      <div className={estilos.total}>
        <span>
          Total <small>({totalUnidades === 1 ? '1 item' : `${totalUnidades} itens`})</small>
        </span>
        <strong>{formatarMoeda(total)}</strong>
      </div>

      <Alerta>{erro}</Alerta>

      <Botao larguraTotal onClick={aoConfirmar} carregando={enviando}>
        {enviando ? 'Registrando…' : 'Confirmar venda'}
      </Botao>
    </div>
  )
}
