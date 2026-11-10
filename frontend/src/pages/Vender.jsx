import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import { produtosApi } from '../api/produtos.js'
import { vendasApi } from '../api/vendas.js'
import { AjusteRapido } from '../components/AjusteRapido.jsx'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { Carrinho } from '../components/Carrinho.jsx'
import { IconeBusca, IconeCaixa, IconeMais } from '../components/Icones.jsx'
import { Modal } from '../components/Modal.jsx'
import { Preco } from '../components/Preco.jsx'
import { SeloEstoque } from '../components/SeloEstoque.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { useCanais } from '../hooks/useCanais.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { formatarMoeda, normalizarTexto } from '../utils/formato.js'
import { unidades } from '../utils/estoque.js'
import estilos from './Vender.module.css'

async function carregarProdutos(signal) {
  try {
    const r = await produtosApi.listar(signal)
    return { lista: r.produtos, carregando: false, erro: '' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { lista: [], carregando: false, erro: err.message }
  }
}

export default function Vender() {
  const { avisar } = useAvisos()
  const telaGrande = useMediaQuery('(min-width: 900px)')

  const [produtos, setProdutos] = useState({ lista: [], carregando: true, erro: '' })
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState([]) // [{ produtoId, quantidade }]
  const { ativos: canais, recarregar: recarregarCanais } = useCanais()
  const [canalId, setCanalId] = useState('') // '' = venda sem canal
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroVenda, setErroVenda] = useState('')
  const [ajuste, setAjuste] = useState(null) // { produto, necessario }
  const [carrinhoAberto, setCarrinhoAberto] = useState(false) // celular

  useEffect(() => {
    const ctrl = new AbortController()
    carregarProdutos(ctrl.signal).then((r) => r && setProdutos(r))
    return () => ctrl.abort()
  }, [])

  const recarregarProdutos = () => carregarProdutos().then((r) => r && setProdutos(r))

  const porId = useMemo(() => new Map(produtos.lista.map((p) => [p.id, p])), [produtos.lista])

  const itens = useMemo(
    () =>
      carrinho
        .map(({ produtoId, quantidade }) => ({ produto: porId.get(produtoId), quantidade }))
        .filter((i) => i.produto),
    [carrinho, porId],
  )
  const total = itens.reduce((s, i) => s + Math.round(i.produto.preco * 100) * i.quantidade, 0) / 100
  const totalUnidades = itens.reduce((s, i) => s + i.quantidade, 0)

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return termo ? produtos.lista.filter((p) => normalizarTexto(p.nome).includes(termo)) : produtos.lista
  }, [produtos.lista, busca])

  const qtdNoCarrinho = (id) => carrinho.find((i) => i.produtoId === id)?.quantidade ?? 0

  function definirQuantidade(produto, quantidade) {
    setErroVenda('')
    if (quantidade <= 0) {
      setCarrinho((c) => c.filter((i) => i.produtoId !== produto.id))
      return
    }
    // Pediu mais do que o sistema mostra: oferece o ajuste rápido em vez de travar.
    if (quantidade > produto.quantidade) {
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
    setProdutos((p) => ({ ...p, lista: p.lista.map((x) => (x.id === produtoAtualizado.id ? produtoAtualizado : x)) }))
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
    setEnviando(true)
    setErroVenda('')
    try {
      const { venda } = await vendasApi.registrar({
        itens: carrinho,
        canalId: canalId ? Number(canalId) : null,
        observacao: observacao.trim() || undefined,
      })
      avisar(`Venda de ${formatarMoeda(venda.total)} registrada.`)
      setCarrinho([])
      setObservacao('')
      setCanalId('')
      setCarrinhoAberto(false)
      setBusca('')
      await recarregarProdutos() // saldos atualizados após a baixa
    } catch (err) {
      const faltando = err instanceof ApiError ? err.details?.estoqueInsuficiente?.[0] : null
      if (faltando) {
        // Outro atendimento pode ter vendido antes: atualiza e oferece o ajuste.
        const r = await carregarProdutos()
        if (r) setProdutos(r)
        const produto = r?.lista.find((p) => p.id === faltando.produtoId)
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
        await recarregarProdutos()
        setErroVenda('Um produto da venda foi removido do cadastro e saiu da lista. Confira e confirme de novo.')
      } else {
        setErroVenda(err.message)
      }
    } finally {
      setEnviando(false)
    }
  }

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

  if (!produtos.carregando && !produtos.erro && produtos.lista.length === 0) {
    return (
      <section className={estilos.semProdutos}>
        <IconeCaixa tamanho={40} />
        <h1>Cadastre produtos para começar a vender</h1>
        <p>Cada venda desconta o estoque automaticamente. Primeiro, cadastre o que você vende.</p>
        <Link to="/produtos" className={estilos.botaoLink}>
          Ir para Produtos
        </Link>
      </section>
    )
  }

  return (
    <div className={estilos.pagina}>
      <section className={estilos.catalogo} aria-labelledby="titulo-vender">
        <h1 id="titulo-vender" className={estilos.titulo}>
          Nova venda
        </h1>

        <div className={estilos.busca}>
          <IconeBusca />
          <input
            type="search"
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {produtos.carregando && <p className={estilos.info}>Carregando produtos…</p>}
        {produtos.erro && (
          <div className={estilos.info}>
            <Alerta>{produtos.erro}</Alerta>
            <Botao variante="secundario" onClick={recarregarProdutos}>
              Tentar de novo
            </Botao>
          </div>
        )}
        {!produtos.carregando && filtrados.length === 0 && busca && (
          <p className={estilos.info}>Nenhum produto encontrado para “{busca}”.</p>
        )}

        <ul className={estilos.produtos}>
          {filtrados.map((p) => {
            const noCarrinho = qtdNoCarrinho(p.id)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`${estilos.produto} ${noCarrinho ? estilos.selecionado : ''}`}
                  onClick={() => definirQuantidade(p, noCarrinho + 1)}
                  aria-label={`Adicionar ${p.nome}`}
                >
                  <span className={estilos.nomeProduto}>{p.nome}</span>
                  <span className={estilos.linhaPreco}>
                    <Preco valor={p.preco} etiqueta />
                    {noCarrinho > 0 ? (
                      <span className={estilos.naVenda} aria-label={`${noCarrinho} na venda`}>
                        {noCarrinho}
                      </span>
                    ) : (
                      <span className={estilos.mais} aria-hidden="true">
                        <IconeMais />
                      </span>
                    )}
                  </span>
                  <SeloEstoque produto={p} />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {telaGrande ? (
        <aside className={estilos.lateral} aria-label="Venda atual">
          <h2 className={estilos.subtitulo}>Venda atual</h2>
          <Carrinho {...carrinhoProps} />
        </aside>
      ) : (
        itens.length > 0 && (
          <div className={estilos.barraResumo}>
            <span>
              <small>{totalUnidades === 1 ? '1 item' : `${totalUnidades} itens`}</small>
              <Preco valor={total} />
            </span>
            <Botao onClick={() => setCarrinhoAberto(true)}>Revisar e confirmar</Botao>
          </div>
        )
      )}

      {!telaGrande && (
        <Modal aberto={carrinhoAberto && !ajuste} aoFechar={() => setCarrinhoAberto(false)} titulo="Venda atual">
          <Carrinho {...carrinhoProps} />
        </Modal>
      )}

      <Modal aberto={ajuste !== null} aoFechar={() => setAjuste(null)} titulo="Corrigir estoque">
        {ajuste && (
          <AjusteRapido
            produto={ajuste.produto}
            necessario={ajuste.necessario}
            aoAjustar={aoAjustar}
            aoCancelar={() => setAjuste(null)}
          />
        )}
      </Modal>
    </div>
  )
}
