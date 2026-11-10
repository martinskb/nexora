import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resumoApi } from '../api/resumo.js'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { GraficoVendasDia } from '../components/GraficoVendasDia.jsx'
import { IconeAlerta } from '../components/Icones.jsx'
import { Preco } from '../components/Preco.jsx'
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
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

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
  const alertas = dados?.alertasEstoque

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>Olá, {loja.nome}!</h1>

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
          {/* Abertura: o número que importa, sem moldura; os de apoio em linha logo abaixo. */}
          <section className={estilos.abertura} aria-label="Resumo do período">
            <p className={estilos.rotulo}>Vendido {NOME_PERIODO[periodo]}</p>
            <p className={estilos.heroi}>
              <Preco valor={t.valor} tamanho="xl" />
            </p>
            <dl className={estilos.apoio}>
              <div>
                <dt>Vendas</dt>
                <dd>{t.vendas}</dd>
              </div>
              <div>
                <dt>Valor médio por venda</dt>
                <dd>{formatarMoeda(t.ticketMedio)}</dd>
              </div>
            </dl>
            {t.canceladas > 0 && (
              <p className={estilos.nota}>
                {plural(t.canceladas, 'venda cancelada', 'vendas canceladas')} ({formatarMoeda(t.valorCancelado)}) não{' '}
                {t.canceladas === 1 ? 'entra' : 'entram'} no total.
              </p>
            )}
            {t.vendas === 0 && (
              <p className={estilos.nota}>
                Nenhuma venda {NOME_PERIODO[periodo]} ainda. <Link to="/vender">Registrar uma venda</Link>
              </p>
            )}
          </section>

          <div className={estilos.grade}>
            <section
              className={`${estilos.cartao} ${t.vendas > 0 ? estilos.colunaInteira : ''}`}
              aria-labelledby="t-alertas"
            >
              <h2 id="t-alertas" className={estilos.tituloCartao}>
                Estoque
              </h2>
              {alertas.produtos.length === 0 ? (
                <p className={estilos.info}>Nenhum produto acabando. Tudo em ordem.</p>
              ) : (
                <>
                  <p className={estilos.resumoAlertas}>
                    <IconeAlerta tamanho={18} />
                    <span>Precisam de reposição:</span>
                    {alertas.zerados > 0 && <span className={estilos.contaZerado}>{alertas.zerados} sem estoque</span>}
                    {alertas.acabando > 0 && <span className={estilos.contaAcabando}>{alertas.acabando} acabando</span>}
                  </p>
                  <ul className={estilos.alertas}>
                    {alertas.produtos.map((p) => (
                      <li key={p.id}>
                        {/* a linha inteira é o alvo de toque */}
                        <Link to={`/estoque?produto=${p.id}`} className={estilos.linhaAlerta}>
                          <span>{p.nome}</span>
                          <span className={p.quantidade === 0 ? estilos.zerado : estilos.acabando}>
                            {p.quantidade === 0 ? 'Sem estoque' : `Restam ${unidades(p.quantidade)}`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to="/estoque" className={estilos.verTodos}>
                    Ver estoque completo
                  </Link>
                </>
              )}
            </section>

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
                          <small>{plural(c.vendas, 'venda', 'vendas')}</small>
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
                          <strong>{p.quantidade} un.</strong>
                          <span>{formatarMoeda(p.valor)}</span>
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

            {periodo !== 'hoje' && t.vendas > 0 && (
              <section className={`${estilos.cartao} ${estilos.largo}`} aria-labelledby="t-grafico">
                <h2 id="t-grafico" className={estilos.tituloCartao}>
                  Vendas por dia <small>(R$)</small>
                </h2>
                <GraficoVendasDia dias={dados.porDia} />
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
