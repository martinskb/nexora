import { formatarMoeda, lerValorMonetario } from '../utils/formato.js'
import { FORMAS, ROTULO_FORMA, restoDaSegunda, troco } from '../utils/pagamento.js'
import { CampoTexto } from './CampoTexto.jsx'
import estilos from './FormaPagamento.module.css'

/**
 * Forma de pagamento da venda (opcional): Dinheiro, Pix ou Cartão; até duas.
 * Em dinheiro, calcula o troco; com duas formas, o resto da segunda.
 */
export function FormaPagamento({ total, formas, aoAlternarForma, valorPrimeira, aoMudarValorPrimeira, recebido, aoMudarRecebido }) {
  const soDinheiro = formas.length === 1 && formas[0] === 'dinheiro'
  const duas = formas.length === 2
  const t = soDinheiro ? troco(total, lerValorMonetario(recebido)) : null
  const primeira = lerValorMonetario(valorPrimeira)
  const resto = duas ? restoDaSegunda(total, primeira) : null

  return (
    <fieldset className={estilos.grupo}>
      <legend className={estilos.legenda}>Forma de pagamento (opcional)</legend>
      <div className={estilos.opcoes}>
        {FORMAS.map((f) => {
          const marcada = formas.includes(f.valor)
          return (
            <button
              key={f.valor}
              type="button"
              className={`${estilos.opcao} ${marcada ? estilos.marcada : ''}`}
              aria-pressed={marcada}
              onClick={() => aoAlternarForma(f.valor)}
            >
              {f.rotulo}
            </button>
          )
        })}
      </div>

      {soDinheiro && (
        <div className={estilos.linha}>
          <CampoTexto rotulo="Recebi" prefixo="R$" formato="moeda" placeholder="0,00" value={recebido} onChange={(e) => aoMudarRecebido(e.target.value)} />
          {t && (
            <p className={`${estilos.resultado} ${'faltam' in t ? estilos.falta : ''}`} role="status">
              {'faltam' in t ? `Faltam ${formatarMoeda(t.faltam)}` : `Troco: ${formatarMoeda(t.troco)}`}
            </p>
          )}
        </div>
      )}

      {duas && (
        <div className={estilos.linha}>
          <CampoTexto
            rotulo={`Valor no ${ROTULO_FORMA[formas[0]]}`}
            prefixo="R$"
            formato="moeda"
            placeholder="0,00"
            value={valorPrimeira}
            onChange={(e) => aoMudarValorPrimeira(e.target.value)}
          />
          <p className={`${estilos.resultado} ${primeira !== null && resto === null ? estilos.falta : ''}`} role="status">
            {resto !== null
              ? `${ROTULO_FORMA[formas[1]]}: ${formatarMoeda(resto)}`
              : primeira !== null && primeira > 0
                ? 'O valor precisa ser menor que o total.'
                : `Quanto vai no ${ROTULO_FORMA[formas[0]]}?`}
          </p>
        </div>
      )}
    </fieldset>
  )
}
