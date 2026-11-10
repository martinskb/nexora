import { useEffect, useMemo, useState } from 'react'
import { produtosApi } from '../api/produtos.js'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { FormularioProduto } from '../components/FormularioProduto.jsx'
import { IconeBusca, IconeCaixa, IconeMais, IconeSeta } from '../components/Icones.jsx'
import { Modal } from '../components/Modal.jsx'
import { SeloEstoque } from '../components/SeloEstoque.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { formatarMoeda, normalizarTexto } from '../utils/formato.js'
import estilos from './Produtos.module.css'

const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })

async function carregarProdutos(signal) {
  try {
    const r = await produtosApi.listar(signal)
    return { produtos: r.produtos, carregando: false, erro: '' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { produtos: [], carregando: false, erro: err.message }
  }
}

export default function Produtos() {
  const { avisar } = useAvisos()
  const [estado, setEstado] = useState({ produtos: [], carregando: true, erro: '' })
  const [busca, setBusca] = useState('')
  // null = fechado; { produto: null } = novo; { produto } = edição
  const [janela, setJanela] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    carregarProdutos(ctrl.signal).then((r) => r && setEstado(r))
    return () => ctrl.abort()
  }, [])

  function tentarDeNovo() {
    setEstado((e) => ({ ...e, carregando: true, erro: '' }))
    carregarProdutos().then((r) => r && setEstado(r))
  }

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    if (!termo) return estado.produtos
    return estado.produtos.filter((p) => normalizarTexto(p.nome).includes(termo))
  }, [estado.produtos, busca])

  function aoSalvar(produto, { novo }) {
    setEstado((e) => ({
      ...e,
      produtos: (novo ? [...e.produtos, produto] : e.produtos.map((p) => (p.id === produto.id ? produto : p))).sort(
        porNome,
      ),
    }))
    setJanela(null)
    avisar(novo ? `"${produto.nome}" cadastrado.` : 'Alterações salvas.')
  }

  function aoRemover(produto) {
    setEstado((e) => ({ ...e, produtos: e.produtos.filter((p) => p.id !== produto.id) }))
    setJanela(null)
    avisar(`"${produto.nome}" removido.`)
  }

  const total = estado.produtos.length

  return (
    <section className={estilos.pagina}>
      <header className={estilos.topo}>
        <div>
          <h1 className={estilos.titulo}>Produtos</h1>
          {total > 0 && (
            <p className={estilos.contagem}>
              {total === 1 ? '1 produto cadastrado' : `${total} produtos cadastrados`}
            </p>
          )}
        </div>
        {total > 0 && (
          <Botao onClick={() => setJanela({ produto: null })}>
            <IconeMais /> Novo produto
          </Botao>
        )}
      </header>

      {estado.carregando && <p className={estilos.info}>Carregando produtos…</p>}

      {estado.erro && (
        <div className={estilos.erro}>
          <Alerta>{estado.erro}</Alerta>
          <Botao variante="secundario" onClick={tentarDeNovo}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!estado.carregando && !estado.erro && total === 0 && (
        <div className={estilos.vazio}>
          <IconeCaixa tamanho={40} />
          <h2>Nenhum produto ainda</h2>
          <p>Cadastre os produtos que você vende. Depois, cada venda desconta o estoque automaticamente.</p>
          <Botao onClick={() => setJanela({ produto: null })}>
            <IconeMais /> Cadastrar primeiro produto
          </Botao>
        </div>
      )}

      {total > 0 && (
        <>
          <div className={estilos.busca}>
            <IconeBusca />
            <input
              type="search"
              placeholder="Buscar produto pelo nome"
              aria-label="Buscar produto pelo nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {filtrados.length === 0 ? (
            <p className={estilos.info}>Nenhum produto encontrado para “{busca}”.</p>
          ) : (
            <ul className={estilos.lista}>
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={estilos.item}
                    onClick={() => setJanela({ produto: p })}
                    aria-label={`Editar ${p.nome}`}
                  >
                    <span className={estilos.nome}>{p.nome}</span>
                    <span className={estilos.preco}>{formatarMoeda(p.preco)}</span>
                    <span className={estilos.saldo}>
                      <SeloEstoque produto={p} />
                    </span>
                    <IconeSeta className={estilos.seta} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal
        aberto={janela !== null}
        aoFechar={() => setJanela(null)}
        titulo={janela?.produto ? 'Editar produto' : 'Novo produto'}
      >
        {janela && (
          <FormularioProduto
            produto={janela.produto}
            aoSalvar={aoSalvar}
            aoRemover={aoRemover}
            aoCancelar={() => setJanela(null)}
          />
        )}
      </Modal>
    </section>
  )
}
