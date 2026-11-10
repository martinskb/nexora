import { useEffect, useMemo, useState } from 'react'
import { vendasApi } from '../api/vendas.js'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { DetalheVenda } from '../components/DetalheVenda.jsx'
import { IconeRecibo, IconeSeta } from '../components/Icones.jsx'
import { Modal } from '../components/Modal.jsx'
import { Segmentado } from '../components/Segmentado.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { CANAL_ROTULO, formatarHora, intervaloDoPeriodo, rotuloDoDia } from '../utils/datas.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './Vendas.module.css'

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: '7 dias' },
  { valor: '30d', rotulo: '30 dias' },
  { valor: 'tudo', rotulo: 'Tudo' },
]
const CANAIS = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'balcao', rotulo: 'Balcão' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
]
const SITUACOES = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'concluida', rotulo: 'Concluídas' },
  { valor: 'cancelada', rotulo: 'Canceladas' },
]

function montarFiltros({ periodo, canal, status }) {
  return { ...intervaloDoPeriodo(periodo), canal, status }
}

async function carregar(filtros, antesDe, signal) {
  try {
    const r = await vendasApi.listar({ ...filtros, antesDe }, signal)
    return { ok: true, ...r }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { ok: false, erro: err.message }
  }
}

export default function Vendas() {
  const { avisar } = useAvisos()
  const [filtro, setFiltro] = useState({ periodo: 'hoje', canal: '', status: '' })
  const [estado, setEstado] = useState({ vendas: [], temMais: false, carregando: true, erro: '' })
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [detalhe, setDetalhe] = useState(null) // { carregando, venda, erro }

  // Recarrega a lista quando um filtro muda.
  useEffect(() => {
    const ctrl = new AbortController()
    carregar(montarFiltros(filtro), undefined, ctrl.signal).then((r) => {
      if (!r) return
      setEstado(
        r.ok
          ? { vendas: r.vendas, temMais: r.temMais, carregando: false, erro: '' }
          : { vendas: [], temMais: false, carregando: false, erro: r.erro },
      )
    })
    return () => ctrl.abort()
  }, [filtro])

  function mudarFiltro(campo, valor) {
    setEstado((e) => ({ ...e, carregando: true, erro: '' }))
    setFiltro((f) => ({ ...f, [campo]: valor }))
  }

  async function carregarMais() {
    setCarregandoMais(true)
    const r = await carregar(montarFiltros(filtro), estado.vendas.at(-1)?.id)
    setCarregandoMais(false)
    if (r?.ok) setEstado((e) => ({ ...e, vendas: [...e.vendas, ...r.vendas], temMais: r.temMais }))
    else if (r) avisar(r.erro, 'erro')
  }

  async function abrirDetalhe(id) {
    setDetalhe({ carregando: true })
    try {
      const r = await vendasApi.buscar(id)
      setDetalhe({ venda: r.venda })
    } catch (err) {
      setDetalhe({ erro: err.message })
    }
  }

  function aoCancelar(venda) {
    setDetalhe({ venda })
    setEstado((e) => ({
      ...e,
      // Se o filtro mostra só concluídas, a venda cancelada sai da lista.
      vendas:
        filtro.status === 'concluida'
          ? e.vendas.filter((v) => v.id !== venda.id)
          : e.vendas.map((v) => (v.id === venda.id ? { ...v, ...venda, itens: undefined } : v)),
    }))
    avisar('Venda cancelada. Os itens voltaram ao estoque.')
  }

  // Agrupa por dia ("Hoje", "Ontem", ...).
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const v of estado.vendas) {
      const dia = rotuloDoDia(v.criadoEm)
      if (!mapa.has(dia)) mapa.set(dia, [])
      mapa.get(dia).push(v)
    }
    return [...mapa]
  }, [estado.vendas])

  return (
    <section className={estilos.pagina}>
      <h1 className={estilos.titulo}>Vendas</h1>

      <div className={estilos.filtros}>
        <Segmentado
          rotulo="Período"
          tamanho="compacto"
          opcoes={PERIODOS}
          valor={filtro.periodo}
          aoMudar={(v) => mudarFiltro('periodo', v)}
        />
        <Segmentado
          rotulo="Origem"
          tamanho="compacto"
          opcoes={CANAIS}
          valor={filtro.canal}
          aoMudar={(v) => mudarFiltro('canal', v)}
        />
        <Segmentado
          rotulo="Situação"
          tamanho="compacto"
          opcoes={SITUACOES}
          valor={filtro.status}
          aoMudar={(v) => mudarFiltro('status', v)}
        />
      </div>

      {estado.carregando && <p className={estilos.info}>Carregando vendas…</p>}
      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      {!estado.carregando && !estado.erro && estado.vendas.length === 0 && (
        <div className={estilos.vazio}>
          <IconeRecibo tamanho={36} />
          <p>Nenhuma venda encontrada com esses filtros.</p>
        </div>
      )}

      {!estado.carregando &&
        grupos.map(([dia, vendas]) => (
          <div key={dia} className={estilos.grupo}>
            <h2 className={estilos.dia}>{dia}</h2>
            <ul className={estilos.lista}>
              {vendas.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className={`${estilos.item} ${v.status === 'cancelada' ? estilos.cancelada : ''}`}
                    onClick={() => abrirDetalhe(v.id)}
                    aria-label={`Ver venda das ${formatarHora(v.criadoEm)} de ${formatarMoeda(v.total)}`}
                  >
                    <span className={estilos.hora}>{formatarHora(v.criadoEm)}</span>
                    <span className={estilos.resumo}>
                      <span className={estilos.produtos}>{v.resumo}</span>
                      <span className={estilos.meta}>
                        <span>{v.quantidadeItens === 1 ? '1 item' : `${v.quantidadeItens} itens`}</span>
                        <span className={`${estilos.canal} ${estilos[`canal_${v.canal}`]}`}>{CANAL_ROTULO[v.canal]}</span>
                        {v.status === 'cancelada' && <span className={estilos.seloCancelada}>Cancelada</span>}
                      </span>
                    </span>
                    <span className={estilos.valor}>{formatarMoeda(v.total)}</span>
                    <IconeSeta className={estilos.seta} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {estado.temMais && !estado.carregando && (
        <Botao variante="secundario" onClick={carregarMais} carregando={carregandoMais}>
          Carregar mais vendas
        </Botao>
      )}

      <Modal aberto={detalhe !== null} aoFechar={() => setDetalhe(null)} titulo="Detalhes da venda">
        {detalhe?.carregando && <p className={estilos.info}>Carregando…</p>}
        {detalhe?.erro && <Alerta>{detalhe.erro}</Alerta>}
        {detalhe?.venda && <DetalheVenda key={detalhe.venda.status} venda={detalhe.venda} aoCancelar={aoCancelar} />}
      </Modal>
    </section>
  )
}
