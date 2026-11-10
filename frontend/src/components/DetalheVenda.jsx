import { useState } from 'react'
import { vendasApi } from '../api/vendas.js'
import { CANAL_ROTULO, formatarDataHora } from '../utils/datas.js'
import { formatarMoeda } from '../utils/formato.js'
import { Alerta } from './Alerta.jsx'
import { Botao } from './Botao.jsx'
import { CampoTexto } from './CampoTexto.jsx'
import estilos from './DetalheVenda.module.css'

const MOTIVOS_RAPIDOS = ['Cliente desistiu', 'Registrada por engano', 'Devolução do cliente']

/** Itens e dados de uma venda; permite cancelar (devolvendo ao estoque). */
export function DetalheVenda({ venda, aoCancelar }) {
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cancelada = venda.status === 'cancelada'

  async function confirmarCancelamento(e) {
    e.preventDefault()
    if (motivo.trim().length < 3) return setErro('Informe o motivo do cancelamento.')
    setEnviando(true)
    setErro('')
    try {
      const r = await vendasApi.cancelar(venda.id, motivo.trim())
      aoCancelar(r.venda)
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className={estilos.detalhe}>
      <dl className={estilos.dados}>
        <div>
          <dt>Data</dt>
          <dd>{formatarDataHora(venda.criadoEm)}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{CANAL_ROTULO[venda.canal]}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd className={cancelada ? estilos.textoCancelada : estilos.textoOk}>{cancelada ? 'Cancelada' : 'Concluída'}</dd>
        </div>
      </dl>

      {venda.observacao && <p className={estilos.obs}>“{venda.observacao}”</p>}

      <ul className={estilos.itens}>
        {venda.itens.map((i) => (
          <li key={i.produtoId}>
            <span>
              <strong>{i.quantidade}×</strong> {i.nome}
              <small> · {formatarMoeda(i.precoUnitario)} cada</small>
            </span>
            <span className={estilos.valor}>{formatarMoeda(i.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className={`${estilos.total} ${cancelada ? estilos.riscado : ''}`}>
        <span>Total</span>
        <strong>{formatarMoeda(venda.total)}</strong>
      </div>

      {cancelada && (
        <Alerta tipo="aviso">
          Cancelada em {formatarDataHora(venda.canceladaEm)}. Motivo: {venda.motivoCancelamento}. Os itens voltaram ao
          estoque.
        </Alerta>
      )}

      {!cancelada && !cancelando && (
        <button type="button" className={estilos.botaoCancelar} onClick={() => setCancelando(true)}>
          Cancelar esta venda
        </button>
      )}

      {!cancelada && cancelando && (
        <form className={estilos.formCancelar} onSubmit={confirmarCancelamento} noValidate>
          <p>Os itens desta venda voltarão ao estoque. Por que ela está sendo cancelada?</p>
          <div className={estilos.chips}>
            {MOTIVOS_RAPIDOS.map((m) => (
              <button
                key={m}
                type="button"
                className={`${estilos.chip} ${motivo === m ? estilos.chipAtivo : ''}`}
                onClick={() => {
                  setMotivo(m)
                  setErro('')
                }}
                aria-pressed={motivo === m}
              >
                {m}
              </button>
            ))}
          </div>
          <CampoTexto
            rotulo="Motivo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErro('')
            }}
            erro={erro}
            maxLength={255}
            placeholder="Escolha acima ou escreva"
            autoComplete="off"
          />
          <div className={estilos.acoes}>
            <Botao variante="secundario" onClick={() => setCancelando(false)} disabled={enviando}>
              Voltar
            </Botao>
            <Botao type="submit" variante="perigo" carregando={enviando}>
              Cancelar venda
            </Botao>
          </div>
        </form>
      )}
    </div>
  )
}
