import { useState } from 'react'
import { produtosApi } from '../api/produtos.js'
import { unidades } from '../utils/estoque.js'
import { lerInteiro } from '../utils/formato.js'
import { Botao } from './Botao.jsx'
import { CampoTexto } from './CampoTexto.jsx'
import { Segmentado } from './Segmentado.jsx'
import estilos from './AjusteEstoque.module.css'

const MODOS = [
  { valor: 'entrada', rotulo: 'Chegou mercadoria' },
  { valor: 'contagem', rotulo: 'Corrigir contagem' },
]
const MOTIVOS_CONTAGEM = ['Contagem de estoque', 'Perda ou avaria', 'Produto vencido', 'Outro']

/**
 * Ajuste de estoque (F4) em dois modos:
 * - "Chegou mercadoria": informa quantas chegaram e o sistema soma.
 * - "Corrigir contagem": informa quantas tem agora; exige motivo.
 * Mostra uma prévia de como o saldo vai ficar antes de confirmar.
 */
export function AjusteEstoque({ produto, aoAjustar }) {
  const [modo, setModo] = useState('entrada')
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('')
  const [motivoOutro, setMotivoOutro] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  const n = lerInteiro(valor)
  const novoSaldo = n === null ? null : modo === 'entrada' ? produto.quantidade + n : n
  const diferenca = novoSaldo === null ? 0 : novoSaldo - produto.quantidade

  function trocarModo(m) {
    setModo(m)
    setValor('')
    setErros({})
  }

  async function aoEnviar(e) {
    e.preventDefault()
    const novosErros = {}
    if (n === null) novosErros.quantidade = 'Informe um número inteiro. Exemplo: 12'
    else if (modo === 'entrada' && n < 1) novosErros.quantidade = 'Informe pelo menos 1 unidade.'
    else if (diferenca === 0) novosErros.quantidade = `O sistema já mostra ${unidades(produto.quantidade)}.`

    const motivoFinal = modo === 'entrada' ? 'Chegou mercadoria' : motivo === 'Outro' ? motivoOutro.trim() : motivo
    if (modo === 'contagem' && !motivo) novosErros.motivo = 'Escolha o motivo da correção.'
    else if (modo === 'contagem' && motivoFinal.length < 3) novosErros.motivo = 'Descreva o motivo (pelo menos 3 letras).'

    setErros(novosErros)
    if (Object.keys(novosErros).length) return

    setEnviando(true)
    try {
      const r = await produtosApi.ajustar(produto.id, n, motivoFinal, modo)
      setValor('')
      setMotivo('')
      setMotivoOutro('')
      aoAjustar(r.produto, { modo, diferenca })
    } catch (err) {
      setErros(err.details ?? { geral: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className={estilos.form} onSubmit={aoEnviar} noValidate>
      <Segmentado rotulo="O que aconteceu?" opcoes={MODOS} valor={modo} aoMudar={trocarModo} />

      <CampoTexto
        key={modo}
        rotulo={modo === 'entrada' ? 'Quantas unidades chegaram?' : 'Quantas unidades você tem agora?'}
        inputMode="numeric"
        placeholder={modo === 'entrada' ? 'Ex.: 24' : `Ex.: ${produto.quantidade}`}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value)
          setErros((x) => ({ ...x, quantidade: undefined, geral: undefined }))
        }}
        erro={erros.quantidade}
        autoComplete="off"
      />

      {modo === 'contagem' && (
        <fieldset className={estilos.motivos}>
          <legend>Motivo</legend>
          <div className={estilos.chips}>
            {MOTIVOS_CONTAGEM.map((m) => (
              <button
                key={m}
                type="button"
                className={`${estilos.chip} ${motivo === m ? estilos.chipAtivo : ''}`}
                aria-pressed={motivo === m}
                onClick={() => {
                  setMotivo(m)
                  setErros((x) => ({ ...x, motivo: undefined }))
                }}
              >
                {m}
              </button>
            ))}
          </div>
          {motivo === 'Outro' && (
            <CampoTexto
              rotulo="Descreva o motivo"
              value={motivoOutro}
              onChange={(e) => setMotivoOutro(e.target.value)}
              maxLength={255}
              autoFocus
              autoComplete="off"
            />
          )}
          {erros.motivo && (
            <span className={estilos.erro} role="alert">
              {erros.motivo}
            </span>
          )}
        </fieldset>
      )}

      {novoSaldo !== null && diferenca !== 0 && (
        <p className={estilos.previa} aria-live="polite">
          O estoque vai de <strong>{produto.quantidade}</strong> para <strong>{novoSaldo}</strong>{' '}
          <span className={diferenca > 0 ? estilos.mais : estilos.menos}>
            ({diferenca > 0 ? '+' : ''}
            {diferenca})
          </span>
        </p>
      )}

      {erros.geral && (
        <span className={estilos.erro} role="alert">
          {erros.geral}
        </span>
      )}

      <Botao type="submit" larguraTotal carregando={enviando}>
        {modo === 'entrada' ? 'Adicionar ao estoque' : 'Salvar correção'}
      </Botao>
    </form>
  )
}
