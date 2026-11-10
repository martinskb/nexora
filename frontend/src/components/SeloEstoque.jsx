import { situacaoEstoque, ROTULO_SITUACAO } from '../utils/estoque.js'
import estilos from './SeloEstoque.module.css'

/** Mostra o saldo do produto com cor conforme a situação (ok / acabando / zerado). */
export function SeloEstoque({ produto }) {
  const situacao = situacaoEstoque(produto)
  return (
    <span className={`${estilos.selo} ${estilos[situacao]}`} title={ROTULO_SITUACAO[situacao]}>
      <span>
        <strong>{produto.quantidade}</strong> un.
      </span>
      {situacao !== 'ok' && <span className={estilos.rotulo}>{ROTULO_SITUACAO[situacao]}</span>}
    </span>
  )
}
