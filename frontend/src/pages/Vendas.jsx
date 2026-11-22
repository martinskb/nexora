import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { DetalheVenda } from '../components/DetalheVenda.jsx'
import { EscolhaCanal } from '../components/EscolhaCanal.jsx'
import { Folha } from '../components/Folha.jsx'
import { IconeRecibo } from '../components/Icones.jsx'
import { Segmentado } from '../components/Segmentado.jsx'
import { Skeleton, SkeletonLista } from '../components/Skeleton.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { chaves } from '../dados/consultas.js'
import { FILTRO_VENDAS_PADRAO, filtrosDeVendas, useCanais, useInvalidar, useVenda, useVendas } from '../dados/hooks.js'
import { useEstadoDaAba, useRolagemDaAba } from '../hooks/useEstadoDaAba.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { SEM_CANAL, usarListaDeCanais } from '../utils/canais.js'
import { formatarHora, rotuloDoDia } from '../utils/datas.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './Vendas.module.css'

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: '7 dias' },
  { valor: '30d', rotulo: '30 dias' },
  { valor: 'tudo', rotulo: 'Tudo' },
]
const SITUACOES = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'concluida', rotulo: 'Concluídas' },
  { valor: 'cancelada', rotulo: 'Canceladas' },
]

const somaConcluidas = (vendas) =>
  vendas.reduce((s, v) => s + (v.status === 'cancelada' ? 0 : Math.round(v.total * 100)), 0) / 100

export default function Vendas() {
  useTitulo('Vendas')
  useRolagemDaAba('vendas')
  const { avisar } = useAvisos()
  const cliente = useQueryClient()
  const invalidar = useInvalidar()
  const { ativos: canais } = useCanais()
  // canalId: '' = todas, 'sem' = sem canal
  const [filtro, setFiltro] = useEstadoDaAba('vendas.filtro', FILTRO_VENDAS_PADRAO)
  const consulta = useVendas(filtrosDeVendas(filtro))
  const { vendas, isPending: carregando, isPlaceholderData: trocandoFiltro, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    consulta
  const mostrarSkeleton = useSkeleton(vendas.length > 0, carregando)
  const [detalheId, setDetalheId] = useState(null)
  const detalhe = useVenda(detalheId)

  // Opções de origem: só aparecem quando a loja tem canais ativos.
  const opcoesCanal = useMemo(
    () => [
      { valor: '', rotulo: 'Vendas' },
      { valor: 'sem', rotulo: SEM_CANAL },
      ...canais.map((c) => ({ valor: String(c.id), rotulo: c.nome })),
    ],
    [canais],
  )
  // Se o canal filtrado foi arquivado/apagado (ou a loja ficou sem canais), volta para "Vendas".
  const canalNoFiltro = canais.length > 0 && opcoesCanal.some((o) => o.valor === filtro.canalId) ? filtro.canalId : ''
  if (canalNoFiltro !== filtro.canalId) setFiltro((f) => ({ ...f, canalId: canalNoFiltro }))

  const mudarFiltro = (campo, valor) => setFiltro((f) => ({ ...f, [campo]: valor }))

  async function carregarMais() {
    const r = await fetchNextPage()
    if (r.error) avisar(r.error.message, 'erro')
  }

  function aoCancelar(venda) {
    cliente.setQueryData(chaves.venda(venda.id), (d) => ({ ...d, venda }))
    invalidar('cancelamento')
    avisar('Venda cancelada. Os itens voltaram ao estoque.')
  }

  // Agrupa por dia ("Hoje", "Ontem", ...). O total do dia só aparece se o dia veio inteiro.
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const v of vendas) {
      const dia = rotuloDoDia(v.criadoEm)
      if (!mapa.has(dia)) mapa.set(dia, [])
      mapa.get(dia).push(v)
    }
    return [...mapa].map(([dia, lista], i, todos) => ({
      dia,
      vendas: lista,
      total: hasNextPage && i === todos.length - 1 ? null : somaConcluidas(lista),
    }))
  }, [vendas, hasNextPage])

  return (
    <section className={estilos.pagina}>
      <h1 className={estilos.titulo}>Vendas</h1>

      <div className={estilos.filtros}>
        <Segmentado rotulo="Período" tamanho="compacto" opcoes={PERIODOS} valor={filtro.periodo} aoMudar={(v) => mudarFiltro('periodo', v)} />
        {canais.length > 0 && (
          <EscolhaCanal
            rotulo="Origem"
            tamanho="compacto"
            opcoes={opcoesCanal}
            valor={filtro.canalId}
            aoMudar={(v) => mudarFiltro('canalId', v)}
            usarLista={usarListaDeCanais(opcoesCanal, canais.length)}
          />
        )}
        <Segmentado rotulo="Situação" tamanho="compacto" opcoes={SITUACOES} valor={filtro.status} aoMudar={(v) => mudarFiltro('status', v)} />
      </div>

      {mostrarSkeleton && <SkeletonLista linhas={6} />}
      {error && <Alerta>{error.message}</Alerta>}

      {!carregando && !error && vendas.length === 0 && (
        <div className={estilos.vazio}>
          <IconeRecibo tamanho={40} />
          <h2>Nenhuma venda aqui</h2>
          <p>Não há vendas com esses filtros. Tente outro período ou situação.</p>
        </div>
      )}

      <div className={`${estilos.grupos} ${trocandoFiltro ? estilos.trocando : ''}`} aria-busy={trocandoFiltro}>
        {grupos.map((g) => (
          <section key={g.dia} className={estilos.grupo} aria-label={g.dia}>
            <header className={estilos.cabecalhoDia}>
              <h2 className="cap">{g.dia}</h2>
              {g.total !== null && (
                <strong className={`num ${g.dia === 'Hoje' ? estilos.totalHoje : ''}`}>{formatarMoeda(g.total)}</strong>
              )}
            </header>
            <ul className={estilos.lista}>
              {g.vendas.map((v) => {
                const cancelada = v.status === 'cancelada'
                return (
                  <li key={v.id}>
                    <button type="button" className={`${estilos.linha} ${cancelada ? estilos.cancelada : ''}`} onClick={() => setDetalheId(v.id)}>
                      <span className="somente-leitor">Ver venda das </span>
                      <span className={estilos.texto}>
                        <span className={estilos.principal}>
                          {formatarHora(v.criadoEm)} · {v.quantidadeItens === 1 ? '1 item' : `${v.quantidadeItens} itens`}
                        </span>
                        <small>
                          {cancelada ? 'Cancelada · ' : v.canal ? `${v.canal.nome} · ` : ''}
                          {v.resumo}
                        </small>
                      </span>
                      <span className={`${estilos.valor} num`}>{formatarMoeda(v.total)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      {hasNextPage && !carregando && (
        <Botao variante="secundario" onClick={carregarMais} carregando={isFetchingNextPage}>
          Carregar mais vendas
        </Botao>
      )}

      <Folha aberto={detalheId !== null} aoFechar={() => setDetalheId(null)} titulo="Detalhes da venda">
        {detalhe.isPending && (
          <div className={estilos.skDetalhe} aria-busy="true">
            <Skeleton altura={20} largura="60%" />
            <Skeleton altura={120} forma="cartao" />
            <Skeleton altura={48} />
          </div>
        )}
        {detalhe.error && <Alerta>{detalhe.error.message}</Alerta>}
        {detalhe.data?.venda && <DetalheVenda key={detalhe.data.venda.status} venda={detalhe.data.venda} aoCancelar={aoCancelar} />}
      </Folha>
    </section>
  )
}
