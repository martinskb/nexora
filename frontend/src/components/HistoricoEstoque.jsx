import { useEffect, useState } from 'react'
import { produtosApi } from '../api/produtos.js'
import { formatarDataHora } from '../utils/datas.js'
import { Alerta } from './Alerta.jsx'
import { Botao } from './Botao.jsx'
import estilos from './HistoricoEstoque.module.css'

const ROTULO_TIPO = {
  cadastro: 'Cadastro (quantidade inicial)',
  venda: 'Venda',
  cancelamento: 'Venda cancelada (devolução)',
  entrada: 'Chegou mercadoria',
  ajuste: 'Correção de contagem',
}

function rotulo(m) {
  if (m.tipo === 'venda' && m.vendaId) return `Venda nº ${m.vendaId}`
  if (m.tipo === 'cancelamento' && m.vendaId) return `Venda nº ${m.vendaId} cancelada (devolução)`
  return ROTULO_TIPO[m.tipo] ?? m.tipo
}

// Motivos que só repetem o tipo não precisam aparecer.
const MOTIVOS_OBVIOS = new Set(['Quantidade inicial', 'Chegou mercadoria'])

async function carregar(produtoId, antesDe, signal) {
  try {
    return { ok: true, ...(await produtosApi.historico(produtoId, { antesDe }, signal)) }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { ok: false, erro: err.message }
  }
}

/** Movimentações de um produto: explica de onde veio cada saldo. */
export function HistoricoEstoque({ produtoId }) {
  const [estado, setEstado] = useState({ itens: [], temMais: false, carregando: true, erro: '' })
  const [carregandoMais, setCarregandoMais] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    carregar(produtoId, undefined, ctrl.signal).then((r) => {
      if (!r) return
      setEstado(
        r.ok
          ? { itens: r.movimentacoes, temMais: r.temMais, carregando: false, erro: '' }
          : { itens: [], temMais: false, carregando: false, erro: r.erro },
      )
    })
    return () => ctrl.abort()
  }, [produtoId])

  async function carregarMais() {
    setCarregandoMais(true)
    const r = await carregar(produtoId, estado.itens.at(-1)?.id)
    setCarregandoMais(false)
    if (r?.ok) setEstado((e) => ({ ...e, itens: [...e.itens, ...r.movimentacoes], temMais: r.temMais }))
    else if (r) setEstado((e) => ({ ...e, erro: r.erro }))
  }

  if (estado.carregando) return <p className={estilos.info}>Carregando histórico…</p>

  return (
    <div className={estilos.historico}>
      {estado.erro && <Alerta>{estado.erro}</Alerta>}
      <ol className={estilos.lista}>
        {estado.itens.map((m) => (
          <li key={m.id} className={estilos.item}>
            <div className={estilos.linha}>
              <span className={estilos.tipo}>{rotulo(m)}</span>
              <span className={m.quantidade >= 0 ? estilos.entrada : estilos.saida}>
                {m.quantidade > 0 ? '+' : ''}
                {m.quantidade}
              </span>
            </div>
            <div className={estilos.linha}>
              <span className={estilos.meta}>{formatarDataHora(m.criadoEm)}</span>
              <span className={estilos.meta}>saldo: {m.saldoApos}</span>
            </div>
            {m.motivo && !MOTIVOS_OBVIOS.has(m.motivo) && <span className={estilos.motivo}>Motivo: {m.motivo}</span>}
          </li>
        ))}
      </ol>
      {estado.temMais && (
        <Botao variante="secundario" onClick={carregarMais} carregando={carregandoMais}>
          Ver movimentações anteriores
        </Botao>
      )}
    </div>
  )
}
