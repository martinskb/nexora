import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import { vendasApi } from '../api/vendas.js'
import { AjusteRapido } from '../components/AjusteRapido.jsx'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { Carrinho } from '../components/Carrinho.jsx'
import { Etiqueta } from '../components/Etiqueta.jsx'
import { Folha } from '../components/Folha.jsx'
import { IconeBusca, IconeCaixa, IconeFechar, IconeSeta } from '../components/Icones.jsx'
import { LinkApp } from '../components/LinkApp.jsx'
import { Carregando, Skeleton } from '../components/Skeleton.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { chaves } from '../dados/consultas.js'
import { useCanais, useInvalidar, useProdutos } from '../dados/hooks.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { situacaoEstoque, unidades } from '../utils/estoque.js'
import { formatarMoeda, normalizarTexto } from '../utils/formato.js'
import { precisaConfirmarSaidaVenda } from '../utils/navegacao.js'
import estilos from './Vender.module.css'

const NOME_DA_TELA = { '/': 'Início', '/produtos': 'Produtos', '/estoque': 'Estoque', '/vendas': 'Vendas', '/minha-loja': 'Minha loja' }

/** Espera o próximo "popstate" (ou um tempo máximo), para encadear voltas no histórico. */
const esperarVolta = () =>
  new Promise((ok) => {
    const fim = () => {
      window.removeEventListener('popstate', fim)
      ok()
    }
    window.addEventListener('popstate', fim)
    setTimeout(fim, 300)
  })

const ehCampoDeTexto = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

export default function Vender() {
  useTitulo('Nova venda')
  const { avisar } = useAvisos()
  const navigate = useNavigate()
  const location = useLocation()
  const origem = location.state?.origem
  const telaGrande = useMediaQuery('(min-width: 960px)')
  const cliente = useQueryClient()
  const invalidar = useInvalidar()

  const { data: lista = [], isPending: carregando, error: erroProdutos, refetch } = useProdutos()
  const mostrarSkeleton = useSkeleton(lista.length > 0, carregando)
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinhoEstado] = useState([]) // [{ produtoId, quantidade }]
  // Espelho síncrono: toques rápidos seguidos sempre partem da quantidade mais recente.
  const carrinhoAtual = useRef([])
  const setCarrinho = (fn) => {
    carrinhoAtual.current = typeof fn === 'function' ? fn(carrinhoAtual.current) : fn
    setCarrinhoEstado(carrinhoAtual.current)
  }
  const { ativos: canais, recarregar: recarregarCanais } = useCanais()
  const [canalId, setCanalId] = useState('') // '' = venda sem canal
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroVenda, setErroVenda] = useState('')
  const [ajuste, setAjuste] = useState(null) // { produto, necessario }
  const [carrinhoAberto, setCarrinhoAberto] = useState(false) // celular
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const campoBusca = useRef(null)

  const porId = useMemo(() => new Map(lista.map((p) => [p.id, p])), [lista])
  const itens = useMemo(
    () => carrinho.map(({ produtoId, quantidade }) => ({ produto: porId.get(produtoId), quantidade })).filter((i) => i.produto),
    [carrinho, porId],
  )
  const total = itens.reduce((s, i) => s + Math.round(i.produto.preco * 100) * i.quantidade, 0) / 100
  const totalUnidades = itens.reduce((s, i) => s + i.quantidade, 0)
  const temItens = precisaConfirmarSaidaVenda(totalUnidades)

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return termo ? lista.filter((p) => normalizarTexto(p.nome).includes(termo)) : lista
  }, [lista, busca])

  const qtdNoCarrinho = (id) => carrinho.find((i) => i.produtoId === id)?.quantidade ?? 0
  const qtdAtual = (id) => carrinhoAtual.current.find((i) => i.produtoId === id)?.quantidade ?? 0

  // ---------- Saída protegida: com itens, o "voltar" pergunta antes de descartar ----------
  const guardaAtiva = useRef(false)

  useEffect(() => {
    if (temItens && !guardaAtiva.current) {
      window.history.pushState({ ...window.history.state, guardaVenda: true }, '')
      guardaAtiva.current = true
    } else if (!temItens && guardaAtiva.current) {
      guardaAtiva.current = false
      if (window.history.state?.guardaVenda && !window.history.state?.folha) window.history.back()
    }
  }, [temItens])

  useEffect(() => {
    const aoVoltar = () => {
      if (!guardaAtiva.current || window.history.state?.guardaVenda) return
      // Saiu da entrada de guarda: recoloca e pergunta.
      window.history.pushState({ ...window.history.state, guardaVenda: true }, '')
      setConfirmarSaida(true)
    }
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  /** Volta para a tela de onde a pessoa veio, desfazendo folhas e a guarda. */
  async function sairDaVenda() {
    guardaAtiva.current = false
    setConfirmarSaida(false)
    setCarrinhoAberto(false)
    await new Promise((ok) => setTimeout(ok, 60)) // folhas desfazem a própria entrada
    for (let i = 0; i < 3 && window.history.state?.folha; i++) {
      window.history.back()
      await esperarVolta()
    }
    if (window.history.state?.guardaVenda) {
      window.history.back()
      await esperarVolta()
    }
    if (origem) navigate(-1)
    else navigate('/', { replace: true })
  }

  const aoFecharTela = () => (temItens ? setConfirmarSaida(true) : sairDaVenda())

  // ---------- Atalhos (PC): "/" vai para a busca; Enter confirma ----------
  const confirmarRef = useRef(null)
  useEffect(() => {
    const aoTeclar = (e) => {
      if (document.querySelector('dialog[open]')) return
      if (e.key === '/' && !ehCampoDeTexto(document.activeElement)) {
        e.preventDefault()
        campoBusca.current?.focus()
      } else if (e.key === 'Enter' && telaGrande && !ehCampoDeTexto(document.activeElement) && document.activeElement?.tagName !== 'BUTTON') {
        confirmarRef.current?.()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [telaGrande])

  function definirQuantidade(produto, quantidade) {
    setErroVenda('')
    if (quantidade <= 0) {
      setCarrinho((c) => c.filter((i) => i.produtoId !== produto.id))
      return
    }
    // Pediu mais do que o sistema mostra: oferece o ajuste rápido em vez de travar.
    if (quantidade > produto.quantidade) {
      setCarrinhoAberto(false)
      setAjuste({ produto, necessario: quantidade })
      return
    }
    setCarrinho((c) =>
      c.some((i) => i.produtoId === produto.id)
        ? c.map((i) => (i.produtoId === produto.id ? { ...i, quantidade } : i))
        : [...c, { produtoId: produto.id, quantidade }],
    )
  }

  function aoAjustar(produtoAtualizado) {
    const { necessario } = ajuste
    cliente.setQueryData(chaves.produtos(), (d) =>
      d ? { ...d, produtos: d.produtos.map((x) => (x.id === produtoAtualizado.id ? produtoAtualizado : x)) } : d,
    )
    invalidar('ajuste', { produtoId: produtoAtualizado.id })
    setAjuste(null)
    const possivel = Math.min(necessario, produtoAtualizado.quantidade)
    setCarrinho((c) => {
      const sem = c.filter((i) => i.produtoId !== produtoAtualizado.id)
      return possivel > 0 ? [...sem, { produtoId: produtoAtualizado.id, quantidade: possivel }] : sem
    })
    if (possivel < necessario) {
      avisar(`Estoque corrigido para ${unidades(produtoAtualizado.quantidade)}. Só foi possível incluir ${possivel}.`, 'erro')
    } else {
      avisar(`Estoque de "${produtoAtualizado.nome}" corrigido para ${unidades(produtoAtualizado.quantidade)}.`)
    }
  }

  async function confirmarVenda() {
    if (!temItens || enviando) return
    setEnviando(true)
    setErroVenda('')
    try {
      const { venda } = await vendasApi.registrar({
        itens: carrinho,
        canalId: canalId ? Number(canalId) : null,
        observacao: observacao.trim() || undefined,
      })
      avisar(`Venda de ${formatarMoeda(venda.total)} registrada.`)
      invalidar('venda')
      await sairDaVenda()
    } catch (err) {
      const faltando = err instanceof ApiError ? err.details?.estoqueInsuficiente?.[0] : null
      if (faltando) {
        // Outro atendimento pode ter vendido antes: atualiza e oferece o ajuste.
        const r = await refetch()
        const produto = r.data?.find((p) => p.id === faltando.produtoId)
        if (produto) setAjuste({ produto, necessario: faltando.solicitado })
        setErroVenda(err.message)
      } else if (err instanceof ApiError && err.details?.canalId) {
        // O canal foi arquivado/apagado em outro lugar: atualiza as opções e mantém o carrinho.
        setCanalId('')
        await recarregarCanais()
        setErroVenda('A origem escolhida não está mais disponível. Escolha outra ou confirme sem origem.')
      } else if (err instanceof ApiError && err.details?.produtosNaoEncontrados) {
        const ausentes = new Set(err.details.produtosNaoEncontrados)
        setCarrinho((c) => c.filter((i) => !ausentes.has(i.produtoId)))
        await refetch()
        setErroVenda('Um produto da venda foi removido do cadastro e saiu da lista. Confira e confirme de novo.')
      } else {
        setErroVenda(err.message)
      }
    } finally {
      setEnviando(false)
    }
  }
  useEffect(() => {
    confirmarRef.current = confirmarVenda
  })

  const carrinhoProps = {
    itens,
    total,
    canais,
    canalId,
    aoMudarCanal: setCanalId,
    observacao,
    aoMudarObservacao: setObservacao,
    aoMudarQuantidade: definirQuantidade,
    aoConfirmar: confirmarVenda,
    enviando,
    erro: erroVenda,
  }

  const topo = (
    <header className={estilos.topo}>
      {telaGrande ? (
        <nav className={estilos.trilha} aria-label="Você está em">
          {origem && NOME_DA_TELA[origem] ? (
            <button type="button" onClick={aoFecharTela}>
              {NOME_DA_TELA[origem]}
            </button>
          ) : (
            <LinkApp to="/">Início</LinkApp>
          )}
          <IconeSeta tamanho={14} />
          <span aria-current="page">Nova venda</span>
        </nav>
      ) : (
        <button type="button" className={estilos.fechar} onClick={aoFecharTela} aria-label="Fechar a venda">
          <IconeFechar />
        </button>
      )}
      <h1 className={estilos.titulo}>Nova venda</h1>
    </header>
  )

  if (!carregando && !erroProdutos && lista.length === 0) {
    return (
      <div className={estilos.pagina}>
        {topo}
        <section className={estilos.semProdutos}>
          <IconeCaixa tamanho={40} />
          <h2>Cadastre produtos para começar a vender</h2>
          <p>Cada venda desconta o estoque automaticamente. Primeiro, cadastre o que você vende.</p>
          <LinkApp to="/produtos" className={estilos.botaoLink}>
            Ir para Produtos
          </LinkApp>
        </section>
      </div>
    )
  }

  return (
    <div className={`${estilos.pagina} ${telaGrande ? estilos.comPainel : ''}`}>
      <section className={estilos.catalogo} aria-labelledby="titulo-vender">
        {topo}

        <label className={estilos.busca}>
          <IconeBusca />
          <input
            ref={campoBusca}
            type="search"
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {telaGrande && <kbd className={estilos.atalho}>/</kbd>}
        </label>

        {erroProdutos && (
          <div className={estilos.info}>
            <Alerta>{erroProdutos.message}</Alerta>
            <Botao variante="secundario" onClick={() => refetch()}>
              Tentar de novo
            </Botao>
          </div>
        )}
        {mostrarSkeleton && (
          <Carregando className={estilos.produtos}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} forma="cartao" altura={124} />
            ))}
          </Carregando>
        )}
        {!carregando && filtrados.length === 0 && busca && (
          <p className={estilos.info}>Nenhum produto encontrado para “{busca}”.</p>
        )}

        <ul className={estilos.produtos}>
          {filtrados.map((p) => {
            const noCarrinho = qtdNoCarrinho(p.id)
            const situacao = situacaoEstoque(p)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${estilos.produto} ${noCarrinho ? estilos.selecionado : ''} ${situacao === 'zerado' ? estilos.zerado : ''}`}
                  onClick={() => definirQuantidade(p, qtdAtual(p.id) + 1)}
                >
                  {/* Sem aria-label: o leitor lê nome, estoque, preço e quantidade na venda. */}
                  <span className={estilos.nomeProduto}>
                    <span className="somente-leitor">Adicionar </span>
                    {p.nome}
                  </span>
                  <span className={`${estilos.estoque} ${estilos[situacao]}`}>
                    {situacao === 'zerado' ? 'Zerado' : `${p.quantidade} em estoque`}
                  </span>
                  <Etiqueta variante="preco" valor={formatarMoeda(p.preco)} className={estilos.preco} />
                  {noCarrinho > 0 && (
                    <span key={noCarrinho} className={estilos.contador}>
                      {noCarrinho}
                      <span className="somente-leitor"> na venda</span>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {telaGrande ? (
        <aside className={estilos.painel} aria-label="Venda atual">
          <h2 className="cap">Venda atual</h2>
          <Carrinho {...carrinhoProps} atalhoConfirmar="Enter" />
        </aside>
      ) : (
        temItens && (
          <button type="button" className={estilos.barraVenda} onClick={() => setCarrinhoAberto(true)}>
            <span>
              <small>Venda atual · {totalUnidades === 1 ? '1 item' : `${totalUnidades} itens`}</small>
              <strong className="num">{formatarMoeda(total)}</strong>
            </span>
            <span className={estilos.revisar}>
              Revisar <IconeSeta />
            </span>
          </button>
        )
      )}

      {!telaGrande && (
        <Folha aberto={carrinhoAberto} aoFechar={() => setCarrinhoAberto(false)} titulo="Venda atual">
          <Carrinho {...carrinhoProps} />
        </Folha>
      )}

      <Folha aberto={ajuste !== null} aoFechar={() => setAjuste(null)} titulo="Corrigir estoque">
        {ajuste && (
          <AjusteRapido produto={ajuste.produto} necessario={ajuste.necessario} aoAjustar={aoAjustar} aoCancelar={() => setAjuste(null)} />
        )}
      </Folha>

      <Folha aberto={confirmarSaida} aoFechar={() => setConfirmarSaida(false)} titulo="Descartar esta venda?">
        <div className={estilos.confirmar}>
          <p>
            {totalUnidades === 1 ? 'O item escolhido vai' : `Os ${totalUnidades} itens escolhidos vão`} sair da venda. Nada é registrado.
          </p>
          <Botao variante="perigo" larguraTotal onClick={sairDaVenda}>
            Descartar venda
          </Botao>
          <Botao variante="secundario" larguraTotal onClick={() => setConfirmarSaida(false)}>
            Continuar vendendo
          </Botao>
        </div>
      </Folha>
    </div>
  )
}
