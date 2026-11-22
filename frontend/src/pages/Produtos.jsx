import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { Folha } from '../components/Folha.jsx'
import { FormularioProduto } from '../components/FormularioProduto.jsx'
import { CampoBusca } from '../components/CampoBusca.jsx'
import { IconeCaixa, IconeMais } from '../components/Icones.jsx'
import { LinhaProduto, ListaProdutos } from '../components/LinhaProduto.jsx'
import { SkeletonLista } from '../components/Skeleton.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { chaves } from '../dados/consultas.js'
import { useInvalidar, useProdutos } from '../dados/hooks.js'
import { useEstadoDaAba, useRolagemDaAba } from '../hooks/useEstadoDaAba.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { situacaoEstoque } from '../utils/estoque.js'
import { formatarMoeda, normalizarTexto } from '../utils/formato.js'
import estilos from './Produtos.module.css'

const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })

/** Detalhe da linha: quantidade, e a situação em cor só quando importa. */
function detalheEstoque(p) {
  const s = situacaoEstoque(p)
  if (s === 'zerado') return { detalhe: 'Zerado', tom: 'critico' }
  if (s === 'baixo') return { detalhe: `${p.quantidade} un · acabando`, tom: 'alerta' }
  return { detalhe: `${p.quantidade} un`, tom: 'neutro' }
}

export default function Produtos() {
  useTitulo('Produtos')
  useRolagemDaAba('produtos')
  const { avisar } = useAvisos()
  const location = useLocation()
  const navigate = useNavigate()
  const cliente = useQueryClient()
  const invalidar = useInvalidar()
  const { data: produtos = [], isPending: carregando, error, refetch } = useProdutos()
  const mostrarSkeleton = useSkeleton(produtos.length > 0, carregando)
  const [busca, setBusca] = useEstadoDaAba('produtos.busca', '')
  // null = fechado; { produto: null } = novo; { produto } = edição
  const [janela, setJanela] = useState(null)

  // Vindo da busca rápida (Ctrl K): abre direto a edição do produto escolhido.
  const idEditar = location.state?.editar
  useEffect(() => {
    if (!idEditar || produtos.length === 0) return
    const produto = produtos.find((p) => p.id === idEditar)
    navigate(location.pathname, { replace: true, state: { ...location.state, editar: undefined } })
    if (produto) setJanela({ produto })
  }, [idEditar, produtos, navigate, location.pathname, location.state])

  const ordenados = useMemo(() => [...produtos].sort(porNome), [produtos])
  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return termo ? ordenados.filter((p) => normalizarTexto(p.nome).includes(termo)) : ordenados
  }, [ordenados, busca])

  function atualizarLista(fn) {
    cliente.setQueryData(chaves.produtos(), (d) => (d ? { ...d, produtos: fn(d.produtos) } : d))
    invalidar('produto')
  }

  function aoSalvar(produto, { novo }) {
    atualizarLista((lista) => (novo ? [...lista, produto] : lista.map((p) => (p.id === produto.id ? { ...p, ...produto } : p))))
    setJanela(null)
    avisar(novo ? `"${produto.nome}" cadastrado.` : 'Alterações salvas.')
  }

  function aoRemover(produto) {
    atualizarLista((lista) => lista.filter((p) => p.id !== produto.id))
    setJanela(null)
    avisar(`"${produto.nome}" removido.`)
  }

  const total = produtos.length
  const novo = () => setJanela({ produto: null })

  return (
    <section className={estilos.pagina}>
      <header className={estilos.topo}>
        <h1 className={estilos.titulo}>Produtos</h1>
        {total > 0 && <span className="cap">{total === 1 ? '1 item' : `${total} itens`}</span>}
        {total > 0 && (
          <Botao className={estilos.novoPc} onClick={novo}>
            <IconeMais /> Produto
          </Botao>
        )}
      </header>

      {mostrarSkeleton && <SkeletonLista />}

      {error && (
        <div className={estilos.erro}>
          <Alerta>{error.message}</Alerta>
          <Botao variante="secundario" onClick={() => refetch()}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!carregando && !error && total === 0 && (
        <div className={estilos.vazio}>
          <IconeCaixa tamanho={40} />
          <h2>Nenhum produto ainda</h2>
          <p>Cadastre os produtos que você vende. Depois, cada venda desconta o estoque automaticamente.</p>
          <Botao onClick={novo}>
            <IconeMais /> Cadastrar primeiro produto
          </Botao>
        </div>
      )}

      {total > 0 && (
        <>
          <CampoBusca valor={busca} aoMudar={setBusca} rotulo="Buscar produto pelo nome" />

          {filtrados.length === 0 ? (
            <p className={estilos.info}>Nenhum produto encontrado para “{busca}”.</p>
          ) : (
            <ListaProdutos>
              {filtrados.map((p) => (
                <LinhaProduto
                  key={p.id}
                  nome={p.nome}
                  {...detalheEstoque(p)}
                  acao="Editar"
                  direita={<span className={`${estilos.preco} num`}>{formatarMoeda(p.preco)}</span>}
                  aoAbrir={() => setJanela({ produto: p })}
                />
              ))}
            </ListaProdutos>
          )}

          <button type="button" className={estilos.flutuante} onClick={novo}>
            <IconeMais /> Produto
          </button>
        </>
      )}

      <Folha aberto={janela !== null} aoFechar={() => setJanela(null)} titulo={janela?.produto ? 'Editar produto' : 'Novo produto'}>
        {janela && (
          <FormularioProduto produto={janela.produto} aoSalvar={aoSalvar} aoRemover={aoRemover} aoCancelar={() => setJanela(null)} />
        )}
      </Folha>
    </section>
  )
}
