import { useState } from 'react'
import { produtosApi } from '../api/produtos.js'
import { lerInteiro } from '../utils/formato.js'
import { unidades } from '../utils/estoque.js'
import { Alerta } from './Alerta.jsx'
import { Botao } from './Botao.jsx'
import { CampoTexto } from './CampoTexto.jsx'

export const MOTIVO_AJUSTE_NA_VENDA = 'Correção durante a venda (sistema mostrava menos do que havia)'

/**
 * Usado na venda quando o sistema mostra menos unidades do que o necessário.
 * O comerciante informa quanto tem de verdade; o ajuste fica registrado com motivo.
 */
export function AjusteRapido({ produto, necessario, aoAjustar, aoCancelar }) {
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e) {
    e.preventDefault()
    const quantidade = lerInteiro(valor)
    if (quantidade === null) return setErro('Informe um número inteiro. Exemplo: 10')
    if (quantidade === produto.quantidade) return setErro(`O sistema já mostra ${unidades(quantidade)}.`)
    setEnviando(true)
    setErro('')
    try {
      const r = await produtosApi.ajustar(produto.id, quantidade, MOTIVO_AJUSTE_NA_VENDA)
      aoAjustar(r.produto)
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate style={{ display: 'grid', gap: 'var(--esp-4)' }}>
      <Alerta tipo="aviso">
        O sistema mostra <strong>{unidades(produto.quantidade)}</strong> de <strong>{produto.nome}</strong>
        {necessario > produto.quantidade && <>, mas a venda precisa de {necessario}</>}.
      </Alerta>
      <p style={{ color: 'var(--cor-texto-suave)', fontSize: 'var(--texto-sm)' }}>
        Se o produto está na loja, informe quantas unidades você tem agora (antes desta venda). A correção fica
        registrada no histórico.
      </p>
      <CampoTexto
        rotulo="Quantas unidades você tem agora?"
        inputMode="numeric"
        placeholder={`Ex.: ${Math.max(necessario, 1)}`}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value)
          setErro('')
        }}
        erro={erro}
        autoFocus
        autoComplete="off"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--esp-3)' }}>
        <Botao variante="secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={enviando}>
          Corrigir estoque
        </Botao>
      </div>
    </form>
  )
}
