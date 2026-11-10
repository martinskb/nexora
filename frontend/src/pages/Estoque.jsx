import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { produtosApi } from '../api/produtos.js'
import { AjusteEstoque } from '../components/AjusteEstoque.jsx'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { HistoricoEstoque } from '../components/HistoricoEstoque.jsx'
import { IconeBusca, IconeSeta } from '../components/Icones.jsx'
import { Modal } from '../components/Modal.jsx'
import { SeloEstoque } from '../components/SeloEstoque.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { ROTULO_SITUACAO, situacaoEstoque, unidades } from '../utils/estoque.js'
import { normalizarTexto } from '../utils/formato.js'
import estilos from './Estoque.module.css'

async function carregarProdutos(signal) {
  try {
    const r = await produtosApi.listar(signal)
    return { produtos: r.produtos, carregando: false, erro: '' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { produtos: [], carregando: false, erro: err.message }
  }
}

export default function Estoque() {
  const { avisar } = useAvisos()
  const [params, setParams] = useSearchParams()
  const [estado, setEstado] = useState({ produtos: [], carregando: true, erro: '' })
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null) // id do produto aberto
  const [versaoHistorico, setVersaoHistorico] = useState(0)

  const idPedido = Number(params.get('produto')) || null

  useEffect(() => {
    const ctrl = new AbortController()
    carregarProdutos(ctrl.signal).then((r) => {
      if (!r) return
      setEstado(r)
      // Vindo de "Produtos → Ajustar estoque": abre direto o produto pedido.
      if (idPedido && r.produtos.some((p) => p.id === idPedido)) setSelecionado(idPedido)
    })
    return () => ctrl.abort()
    // idPedido é lido só na primeira carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tentarDeNovo() {
    setEstado((e) => ({ ...e, carregando: true, erro: '' }))
    carregarProdutos().then((r) => r && setEstado(r))
  }

  function fechar() {
    setSelecionado(null)
    if (params.has('produto')) setParams({}, { replace: true })
  }

  const contagem = useMemo(() => {
    const c = { todos: estado.produtos.length, baixo: 0, zerado: 0 }
    for (const p of estado.produtos) {
      const s = situacaoEstoque(p)
      if (s !== 'ok') c[s] += 1
    }
    return c
  }, [estado.produtos])

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return estado.produtos.filter(
      (p) =>
        (filtro === 'todos' || situacaoEstoque(p) === filtro) &&
        (!termo || normalizarTexto(p.nome).includes(termo)),
    )
  }, [estado.produtos, filtro, busca])

  const produtoAberto = estado.produtos.find((p) => p.id === selecionado)

  function aoAjustar(produto, { modo, diferenca }) {
    setEstado((e) => ({ ...e, produtos: e.produtos.map((p) => (p.id === produto.id ? produto : p)) }))
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
    { valor: 'zerado', rotulo: 'Sem estoque', n: contagem.zerado },
  ]

  return (
    <section className={estilos.pagina}>
      <header>
        <h1 className={estilos.titulo}>Estoque</h1>
        <p className={estilos.subtitulo}>Confira os saldos e registre a mercadoria que chegou ou correções.</p>
      </header>

      {estado.carregando && <p className={estilos.info}>Carregando estoque…</p>}
      {estado.erro && (
        <div className={estilos.info}>
          <Alerta>{estado.erro}</Alerta>
          <Botao variante="secundario" onClick={tentarDeNovo}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!estado.carregando && !estado.erro && estado.produtos.length === 0 && (
        <div className={estilos.vazio}>
          <p>Nenhum produto cadastrado ainda.</p>
          <Link to="/produtos" className={estilos.link}>
            Cadastrar produtos
          </Link>
        </div>
      )}

      {estado.produtos.length > 0 && (
        <>
          <div className={estilos.filtros} role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button
                key={f.valor}
                type="button"
                className={`${estilos.filtro} ${estilos[`filtro_${f.valor}`]} ${filtro === f.valor ? estilos.ativo : ''}`}
                aria-pressed={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
              >
                <strong>{f.n}</strong>
                <span>{f.rotulo}</span>
              </button>
            ))}
          </div>

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

          {filtrados.length === 0 ? (
            <p className={estilos.info}>
              {busca
                ? `Nenhum produto encontrado para “${busca}”.`
                : filtro === 'zerado'
                  ? 'Nenhum produto sem estoque. 👍'
                  : 'Nenhum produto acabando.'}
            </p>
          ) : (
            <ul className={estilos.lista}>
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={estilos.item}
                    onClick={() => setSelecionado(p.id)}
                    aria-label={`Estoque de ${p.nome}`}
                  >
                    <span className={estilos.nome}>
                      {p.nome}
                      {p.estoqueMinimo > 0 && <small>Aviso em {p.estoqueMinimo} un.</small>}
                    </span>
                    <SeloEstoque produto={p} />
                    <IconeSeta className={estilos.seta} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal aberto={Boolean(produtoAberto)} aoFechar={fechar} titulo={produtoAberto?.nome ?? ''}>
        {produtoAberto && (
          <div className={estilos.detalhe}>
            <div className={estilos.saldo}>
              <span>Estoque atual</span>
              <strong>{produtoAberto.quantidade}</strong>
              <span className={`${estilos.situacao} ${estilos[`situacao_${situacaoEstoque(produtoAberto)}`]}`}>
                {ROTULO_SITUACAO[situacaoEstoque(produtoAberto)]}
              </span>
              {produtoAberto.estoqueMinimo > 0 && (
                <span className={estilos.avisoMinimo}>Aviso quando restarem {produtoAberto.estoqueMinimo} un.</span>
              )}
            </div>
            <AjusteEstoque key={produtoAberto.id} produto={produtoAberto} aoAjustar={aoAjustar} />
            <div>
              <h3 className={estilos.tituloHistorico}>Histórico</h3>
              <HistoricoEstoque key={`${produtoAberto.id}-${versaoHistorico}`} produtoId={produtoAberto.id} />
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
