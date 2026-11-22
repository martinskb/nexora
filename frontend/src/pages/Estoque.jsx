import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AjusteEstoque } from '../components/AjusteEstoque.jsx'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { CampoBusca } from '../components/CampoBusca.jsx'
import { Folha } from '../components/Folha.jsx'
import { HistoricoEstoque } from '../components/HistoricoEstoque.jsx'
import { IconeEstoque } from '../components/Icones.jsx'
import { LinhaProduto, ListaProdutos, SeloQuantidade } from '../components/LinhaProduto.jsx'
import { LinkApp } from '../components/LinkApp.jsx'
import { SkeletonLista } from '../components/Skeleton.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { chaves } from '../dados/consultas.js'
import { useInvalidar, useProdutos } from '../dados/hooks.js'
import { useEstadoDaAba, useRolagemDaAba } from '../hooks/useEstadoDaAba.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { ROTULO_SITUACAO, ordenarPorAtencao, situacaoEstoque, unidades } from '../utils/estoque.js'
import { normalizarTexto } from '../utils/formato.js'
import { esperarVolta, itemPedidoAberto } from '../utils/historico.js'
import estilos from './Estoque.module.css'

export default function Estoque() {
  useTitulo('Estoque')
  useRolagemDaAba('estoque')
  const { avisar } = useAvisos()
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const cliente = useQueryClient()
  const invalidar = useInvalidar()
  const { data: produtos = [], isPending: carregando, error, refetch } = useProdutos()
  const mostrarSkeleton = useSkeleton(produtos.length > 0, carregando)
  const [filtro, setFiltro] = useEstadoDaAba('estoque.filtro', 'todos')
  const [busca, setBusca] = useEstadoDaAba('estoque.busca', '')
  const [selecionadoEstado, setSelecionado] = useState(null) // id do produto aberto
  const [versaoHistorico, setVersaoHistorico] = useState(0)

  // Vindo do Início: "Acabando" abre com o filtro; um produto da lista abre direto (?produto=id).
  const filtroPedido = location.state?.filtro
  useEffect(() => {
    if (!filtroPedido) return
    setFiltro(filtroPedido)
    navigate(location.pathname + location.search, { replace: true, state: { ...location.state, filtro: undefined } })
  }, [filtroPedido, setFiltro, navigate, location.pathname, location.search, location.state])

  // ?produto=id (vindo do Início) abre direto o produto pedido, até ser dispensado.
  const idPedido = Number(params.get('produto')) || null
  const [dispensado, setDispensado] = useState(null)
  const selecionado = itemPedidoAberto(selecionadoEstado, idPedido, dispensado === idPedido)

  function fechar() {
    setSelecionado(null)
    if (!idPedido) return
    // Limpa o ?produto só na entrada de baixo, depois que a folha sai do histórico:
    // regravar a entrada da folha deixaria um "voltar" que reabre o produto.
    setDispensado(idPedido)
    const estado = location.state
    esperarVolta().then(() => setParams({}, { replace: true, state: estado }))
  }

  const contagem = useMemo(() => {
    const c = { todos: produtos.length, baixo: 0, zerado: 0 }
    for (const p of produtos) {
      const s = situacaoEstoque(p)
      if (s !== 'ok') c[s] += 1
    }
    return c
  }, [produtos])

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return ordenarPorAtencao(
      produtos.filter(
        (p) => (filtro === 'todos' || situacaoEstoque(p) === filtro) && (!termo || normalizarTexto(p.nome).includes(termo)),
      ),
    )
  }, [produtos, filtro, busca])

  const produtoAberto = produtos.find((p) => p.id === selecionado)

  function aoAjustar(produto, { modo, diferenca }) {
    cliente.setQueryData(chaves.produtos(), (d) =>
      d ? { ...d, produtos: d.produtos.map((p) => (p.id === produto.id ? { ...p, ...produto } : p)) } : d,
    )
    invalidar('ajuste', { produtoId: produto.id })
    setVersaoHistorico((v) => v + 1)
    avisar(
      modo === 'entrada'
        ? `+${diferenca} ${produto.nome}. Estoque agora: ${unidades(produto.quantidade)}.`
        : `Estoque de ${produto.nome} corrigido para ${unidades(produto.quantidade)}.`,
    )
  }

  const FILTROS = [
    { valor: 'todos', rotulo: 'Todos', n: contagem.todos },
    { valor: 'baixo', rotulo: 'Acabando', n: contagem.baixo },
    { valor: 'zerado', rotulo: 'Zerados', n: contagem.zerado },
  ]

  return (
    <section className={estilos.pagina}>
      <header>
        <h1 className={estilos.titulo}>Estoque</h1>
      </header>

      {mostrarSkeleton && <SkeletonLista />}
      {error && (
        <div className={estilos.info}>
          <Alerta>{error.message}</Alerta>
          <Botao variante="secundario" onClick={() => refetch()}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!carregando && !error && produtos.length === 0 && (
        <div className={estilos.vazio}>
          <IconeEstoque tamanho={40} />
          <h2>Nenhum produto cadastrado</h2>
          <p>O estoque aparece aqui depois que você cadastra o que vende.</p>
          <LinkApp to="/produtos" className={estilos.link}>
            Cadastrar produtos
          </LinkApp>
        </div>
      )}

      {produtos.length > 0 && (
        <>
          <div className={estilos.chips} role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                className={`${estilos.chip} ${filtro === f.valor ? estilos.ativo : ''}`}
                aria-pressed={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
              >
                {f.rotulo} <b className={`num ${estilos[`conta_${f.valor}`]}`}>{f.n}</b>
              </button>
            ))}
          </div>

          <CampoBusca valor={busca} aoMudar={setBusca} />

          {filtrados.length === 0 ? (
            <p className={estilos.info}>
              {busca
                ? `Nenhum produto encontrado para “${busca}”.`
                : filtro === 'zerado'
                  ? 'Nenhum produto zerado.'
                  : 'Nenhum produto acabando.'}
            </p>
          ) : (
            <ListaProdutos>
              {filtrados.map((p) => (
                <LinhaProduto
                  key={p.id}
                  nome={p.nome}
                  detalhe={p.estoqueMinimo > 0 ? `mínimo ${p.estoqueMinimo}` : 'sem mínimo'}
                  acao="Ajustar estoque de"
                  direita={<SeloQuantidade quantidade={p.quantidade} situacao={situacaoEstoque(p)} />}
                  seta
                  aoAbrir={() => setSelecionado(p.id)}
                />
              ))}
            </ListaProdutos>
          )}
        </>
      )}

      <Folha aberto={Boolean(produtoAberto)} aoFechar={fechar} titulo={produtoAberto?.nome ?? ''}>
        {produtoAberto && (
          <div className={estilos.detalhe}>
            <div className={estilos.saldo}>
              <span className="cap">Estoque atual</span>
              <strong className="num">{produtoAberto.quantidade}</strong>
              <span className={`${estilos.situacao} ${estilos[`situacao_${situacaoEstoque(produtoAberto)}`]}`}>
                {ROTULO_SITUACAO[situacaoEstoque(produtoAberto)]}
              </span>
              {produtoAberto.estoqueMinimo > 0 && (
                <span className={estilos.avisoMinimo}>Aviso quando restarem {produtoAberto.estoqueMinimo} un.</span>
              )}
            </div>
            <AjusteEstoque key={produtoAberto.id} produto={produtoAberto} aoAjustar={aoAjustar} />
            <div>
              <h3 className={`cap ${estilos.tituloHistorico}`}>Histórico</h3>
              <HistoricoEstoque key={`${produtoAberto.id}-${versaoHistorico}`} produtoId={produtoAberto.id} />
            </div>
          </div>
        )}
      </Folha>
    </section>
  )
}
