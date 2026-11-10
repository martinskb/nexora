import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resumoApi } from '../api/resumo.js'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { GraficoVendasDia } from '../components/GraficoVendasDia.jsx'
import { IconeAlerta, IconeCarrinho } from '../components/Icones.jsx'
import { Segmentado } from '../components/Segmentado.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { intervaloDoPeriodo } from '../utils/datas.js'
import { unidades } from '../utils/estoque.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './Inicio.module.css'

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: '7 dias' },
  { valor: '30d', rotulo: '30 dias' },
]
const NOME_PERIODO = { hoje: 'hoje', '7d': 'nos últimos 7 dias', '30d': 'nos últimos 30 dias' }
const CANAIS = [
  { canal: 'balcao', nome: 'Balcão', cor: 'var(--serie-1)' },
  { canal: 'whatsapp', nome: 'WhatsApp', cor: 'var(--serie-2)' },
]

const percentual = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)

async function carregar(periodo, signal) {
  try {
    return { dados: await resumoApi.obter(intervaloDoPeriodo(periodo), signal), erro: '' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { dados: null, erro: err.message }
  }
}

export default function Inicio() {
  const { loja } = useAuth()
  const [periodo, setPeriodo] = useState('hoje')
  const [estado, setEstado] = useState({ dados: null, erro: '', carregando: true })

  useEffect(() => {
    const ctrl = new AbortController()
    carregar(periodo, ctrl.signal).then((r) => {
      if (!r) return
      // Em caso de erro, mantém os últimos dados na tela.
      setEstado((e) => ({ dados: r.dados ?? e.dados, erro: r.erro, carregando: false }))
    })
    return () => ctrl.abort()
  }, [periodo])

  function mudarPeriodo(p) {
    setEstado((e) => ({ ...e, carregando: true }))
    setPeriodo(p)
  }

  const { dados } = estado
  const t = dados?.totais

  return (
    <div className={estilos.pagina}>
      <header className={estilos.topo}>
        <div>
          <h1 className={estilos.titulo}>Olá, {loja.nome}!</h1>
          <p className={estilos.subtitulo}>Veja como estão as vendas e o estoque.</p>
        </div>
        <Link to="/vender" className={estilos.novaVenda}>
          <IconeCarrinho /> Nova venda
        </Link>
      </header>

      <Segmentado rotulo="Período" tamanho="compacto" opcoes={PERIODOS} valor={periodo} aoMudar={mudarPeriodo} />

      {estado.erro && (
        <div className={estilos.erro}>
          <Alerta>{estado.erro}</Alerta>
          <Botao variante="secundario" onClick={() => mudarPeriodo(periodo)}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!dados && estado.carregando && <p className={estilos.info}>Carregando resumo…</p>}

      {dados && (
        // Ao trocar o período, o painel anterior fica esmaecido até chegar o novo (sem "pulo").
        <div className={`${estilos.conteudo} ${estado.carregando ? estilos.atualizando : ''}`} aria-busy={estado.carregando}>
          {/* Números principais */}
          <section className={estilos.numeros} aria-label="Resumo do período">
            <div className={`${estilos.cartao} ${estilos.destaque}`}>
              <span className={estilos.rotulo}>Total vendido {NOME_PERIODO[periodo]}</span>
              <strong className={estilos.heroi}>{formatarMoeda(t.valor)}</strong>
              {t.canceladas > 0 && (
                <span className={estilos.nota}>
                  {t.canceladas === 1 ? '1 venda cancelada' : `${t.canceladas} vendas canceladas`} (
                  {formatarMoeda(t.valorCancelado)}) não {t.canceladas === 1 ? 'entra' : 'entram'} no total
                </span>
              )}
            </div>
            <div className={estilos.cartao}>
              <span className={estilos.rotulo}>Vendas</span>
              <strong className={estilos.valor}>{t.vendas}</strong>
            </div>
            <div className={estilos.cartao}>
              <span className={estilos.rotulo}>Ticket médio</span>
              <strong className={estilos.valor}>{formatarMoeda(t.ticketMedio)}</strong>
            </div>
          </section>

          {t.vendas === 0 && (
            <div className={estilos.semVendas}>
              <p>Nenhuma venda {NOME_PERIODO[periodo]} ainda.</p>
              <Link to="/vender">Registrar uma venda</Link>
            </div>
          )}

          <div className={estilos.grade}>
            {periodo !== 'hoje' && t.vendas > 0 && (
              <section className={`${estilos.cartao} ${estilos.largo}`} aria-labelledby="t-grafico">
                <h2 id="t-grafico" className={estilos.tituloCartao}>
                  Vendas por dia <small>(R$)</small>
                </h2>
                <GraficoVendasDia dias={dados.porDia} />
              </section>
            )}

            {t.vendas > 0 && (
              <section className={estilos.cartao} aria-labelledby="t-origem">
                <h2 id="t-origem" className={estilos.tituloCartao}>
                  Origem das vendas
                </h2>
                {/* barra fina dividida: o texto ao lado traz os números */}
                <div
                  className={estilos.barraDividida}
                  role="img"
                  aria-label={dados.porCanal
                    .map((c) => `${c.canal === 'balcao' ? 'Balcão' : 'WhatsApp'} ${percentual(c.valor, t.valor)}%`)
                    .join(', ')}
                >
                  {CANAIS.map(({ canal, cor }) => {
                    const c = dados.porCanal.find((x) => x.canal === canal)
                    return c.valor > 0 ? <span key={canal} style={{ flexGrow: c.valor, background: cor }} /> : null
                  })}
                </div>
                <ul className={estilos.origens}>
                  {CANAIS.map(({ canal, nome, cor }) => {
                    const c = dados.porCanal.find((x) => x.canal === canal)
                    return (
                      <li key={canal}>
                        <span className={estilos.amostra} style={{ background: cor }} aria-hidden="true" />
                        <span className={estilos.nomeOrigem}>
                          {nome}
                          <small>{c.vendas === 1 ? '1 venda' : `${c.vendas} vendas`}</small>
                        </span>
                        <span className={estilos.valorOrigem}>
                          <strong>{formatarMoeda(c.valor)}</strong>
                          <small>{percentual(c.valor, t.valor)}%</small>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {dados.maisVendidos.length > 0 && (
              <section className={estilos.cartao} aria-labelledby="t-mais">
                <h2 id="t-mais" className={estilos.tituloCartao}>
                  Mais vendidos
                </h2>
                <ol className={estilos.ranking}>
                  {dados.maisVendidos.map((p) => (
                    <li key={p.produtoId}>
                      <div className={estilos.linhaRanking}>
                        <span className={estilos.nomeRanking}>{p.nome}</span>
                        <span className={estilos.qtdRanking}>
                          <strong>{p.quantidade} un.</strong> · {formatarMoeda(p.valor)}
                        </span>
                      </div>
                      <div className={estilos.medidor} aria-hidden="true">
                        <span style={{ width: `${(p.quantidade / dados.maisVendidos[0].quantidade) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className={estilos.cartao} aria-labelledby="t-alertas">
              <h2 id="t-alertas" className={estilos.tituloCartao}>
                Estoque
              </h2>
              {dados.alertasEstoque.produtos.length === 0 ? (
                <p className={estilos.info}>Nenhum produto acabando. Tudo em ordem.</p>
              ) : (
                <>
                  <p className={estilos.resumoAlertas}>
                    <IconeAlerta tamanho={18} />
                    {[
                      dados.alertasEstoque.zerados > 0 &&
                        `${dados.alertasEstoque.zerados} sem estoque`,
                      dados.alertasEstoque.acabando > 0 && `${dados.alertasEstoque.acabando} acabando`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <ul className={estilos.alertas}>
                    {dados.alertasEstoque.produtos.map((p) => (
                      <li key={p.id}>
                        <Link to={`/estoque?produto=${p.id}`}>{p.nome}</Link>
                        <span className={p.quantidade === 0 ? estilos.zerado : estilos.acabando}>
                          {p.quantidade === 0 ? 'Sem estoque' : `Restam ${unidades(p.quantidade)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/estoque" className={estilos.verTodos}>
                    Ver estoque completo →
                  </Link>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
