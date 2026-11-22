import { useEffect, useState } from 'react'
import { Alerta } from '../components/Alerta.jsx'
import { Anel } from '../components/Anel.jsx'
import { Botao } from '../components/Botao.jsx'
import { CampoBuscaRapida } from '../components/BuscaRapida.jsx'
import { Etiqueta } from '../components/Etiqueta.jsx'
import { GraficoVendasDia } from '../components/GraficoVendasDia.jsx'
import { LinkApp } from '../components/LinkApp.jsx'
import { NumeroAnimado } from '../components/NumeroAnimado.jsx'
import { Segmentado } from '../components/Segmentado.jsx'
import { Carregando, Skeleton } from '../components/Skeleton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCanais, useResumoComparado } from '../dados/hooks.js'
import { useEstadoDaAba } from '../hooks/useEstadoDaAba.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { corDoCanal, nomeDoCanal } from '../utils/canais.js'
import { compararValores, fracaoAnel } from '../utils/comparacao.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './Inicio.module.css'

const PERIODOS = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: '7 dias' },
  { valor: '30d', rotulo: '30 dias' },
]
const NOME_PERIODO = { hoje: 'hoje', '7d': 'em 7 dias', '30d': 'em 30 dias' }
// "↑ 6 que ontem"; legenda do anel: "62% do total de ontem"
const COMPARADO_A = { hoje: 'que ontem', '7d': 'que nos 7 dias anteriores', '30d': 'que nos 30 dias anteriores' }
const TOTAL_ANTERIOR = { hoje: 'de ontem', '7d': 'dos 7 dias anteriores', '30d': 'dos 30 dias anteriores' }
const POR_EXTENSO = { alta: 'a mais', queda: 'a menos' }
const IGUAL_A = { hoje: 'igual a ontem', '7d': 'igual aos 7 dias anteriores', '30d': 'igual aos 30 dias anteriores' }

const dataLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const percentual = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0)
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

function comparacao(atual, anterior, modo, periodo) {
  const c = compararValores(atual, anterior, modo)
  return c && { ...c, texto: `${c.texto} ${COMPARADO_A[periodo]}` }
}

function descrever(rotulo, valorTexto, c, periodo) {
  if (!c) return `${rotulo}: ${valorTexto}`
  const quanto = c.texto.replace(/^[↑↓=]\s*/, '').replace(` ${COMPARADO_A[periodo]}`, '')
  return c.direcao === 'igual'
    ? `${rotulo}: ${valorTexto}, ${IGUAL_A[periodo]}`
    : `${rotulo}: ${valorTexto}, ${quanto} ${POR_EXTENSO[c.direcao]} ${COMPARADO_A[periodo]}`
}

/** Formato da tela enquanto não há nada guardado (primeiro acesso). */
function SkeletonInicio() {
  return (
    <Carregando className={estilos.skeleton}>
      <div className={estilos.heroi}>
        <Skeleton forma="circulo" largura={232} altura={232} className={estilos.skAnel} />
        <div className={estilos.etiquetas}>
          <Skeleton forma="etiqueta" altura={56} />
          <Skeleton forma="etiqueta" altura={56} />
          <Skeleton forma="etiqueta" altura={56} />
        </div>
      </div>
      <div className={estilos.grade}>
        <Skeleton forma="cartao" altura={260} />
        <Skeleton forma="cartao" altura={260} />
      </div>
    </Carregando>
  )
}

export default function Inicio() {
  useTitulo('Início')
  const { loja } = useAuth()
  const { canais } = useCanais() // todos (inclusive arquivados): a cor segue a ordem alfabética
  const [periodo, setPeriodo] = useEstadoDaAba('inicio.periodo', 'hoje')
  const { atual: dados, anterior, carregando, atualizando, erro, recarregar } = useResumoComparado(periodo)
  const mostrarSkeleton = useSkeleton(Boolean(dados), carregando)
  const [hoje] = useState(() => dataLonga.format(new Date()))

  // A entrada animada (anel enchendo, números contando, etiquetas penduradas)
  // só acontece na primeira vez que o Início aparece na sessão.
  const [jaAnimou, setJaAnimou] = useEstadoDaAba('inicio.animou', false)
  const [animar] = useState(!jaAnimou)
  useEffect(() => {
    if (dados) setJaAnimou(true)
  }, [dados, setJaAnimou])

  const t = dados?.totais
  const ta = anterior?.totais
  const alertas = dados?.alertasEstoque
  const reposicao = (alertas?.zerados ?? 0) + (alertas?.acabando ?? 0)
  const anel = fracaoAnel(t?.valor ?? 0, ta?.valor ?? 0)
  const cVendas = t && ta && comparacao(t.vendas, ta.vendas, 'diferenca', periodo)
  const cTicket = t && ta && comparacao(t.ticketMedio, ta.ticketMedio, 'percentual', periodo)
  // Em "Hoje" o gráfico mostra a última semana; o dia atual (último) fica em destaque.
  const diasGrafico = (periodo === 'hoje' ? dados?.ultimos7Dias : dados?.porDia) ?? []
  const mostrarGrafico = diasGrafico.some((d) => d.valor > 0)
  const totalGrafico = diasGrafico.reduce((s, d) => s + d.valor, 0)
  const mostrarOrigem = Boolean(dados?.temCanais) && t?.vendas > 0
  const origens = (dados?.porCanal ?? []).map((c) => ({
    ...c,
    nome: nomeDoCanal(c.canalId == null ? null : { nome: c.nome }),
    cor: corDoCanal(c.canalId, canais),
  }))

  return (
    <div className={estilos.pagina}>
      <header className={`${estilos.cabecalho} ${animar ? 'entra' : ''}`}>
        <div>
          <h1 className={estilos.titulo}>{loja.nome}</h1>
          <p className={estilos.subtitulo}>
            <span className="cap">{hoje}</span>
            {dados && (
              <span className={`${estilos.status} ${atualizando ? estilos.atualizando : ''}`} role="status">
                <i aria-hidden="true" />
                {atualizando ? 'Atualizando…' : 'Atualizado agora'}
              </span>
            )}
          </p>
        </div>
        <div className={estilos.controles}>
          <span className={estilos.soPc}>
            <CampoBuscaRapida />
          </span>
          <Segmentado rotulo="Período" tamanho="compacto" opcoes={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
        </div>
      </header>

      {erro && (
        <div className={estilos.erro}>
          <Alerta>{erro}</Alerta>
          <Botao variante="secundario" onClick={recarregar}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!dados && mostrarSkeleton && <SkeletonInicio />}

      {dados && (
        <>
          <section className={estilos.heroi} aria-label="Resumo do período">
            <div className={`${estilos.anel} ${animar ? 'entra' : ''}`} style={{ '--atraso': '0.1s' }}>
              <Anel
                fracao={anel.fracao}
                animar={animar}
                descricao={`Vendido ${NOME_PERIODO[periodo]}: ${formatarMoeda(t.valor)}${
                  anel.percentual !== null ? `, ${anel.percentual}% do total ${TOTAL_ANTERIOR[periodo]}` : ''
                }`}
              >
                <span className="cap">Vendido {NOME_PERIODO[periodo]}</span>
                <NumeroAnimado valor={t.valor} moeda destaque desdeZero={animar} className={estilos.valorAnel} />
                {anel.percentual !== null && (
                  <span className={estilos.legenda}>
                    {anel.percentual}% do total {TOTAL_ANTERIOR[periodo]}
                  </span>
                )}
              </Anel>
            </div>

            <div className={estilos.etiquetas}>
              <Etiqueta
                rotulo="Vendas"
                valor={<NumeroAnimado valor={t.vendas} desdeZero={animar} />}
                comparacao={cVendas}
                descricao={descrever('Vendas', String(t.vendas), cVendas, periodo)}
                animar={animar}
                indice={0}
              />
              <Etiqueta
                rotulo="Ticket médio"
                valor={<NumeroAnimado valor={t.ticketMedio} moeda desdeZero={animar} />}
                comparacao={cTicket}
                descricao={descrever('Ticket médio', formatarMoeda(t.ticketMedio), cTicket, periodo)}
                animar={animar}
                indice={1}
              />
              <Etiqueta
                rotulo="Acabando"
                valor={reposicao}
                estado={reposicao > 0 ? 'alerta' : 'neutra'}
                comparacao={{ direcao: 'igual', texto: 'Ver produtos →' }}
                para="/estoque"
                estadoLink={reposicao > 0 ? { filtro: 'acabando' } : undefined}
                descricao={`Acabando: ${plural(reposicao, 'produto precisa', 'produtos precisam')} de reposição. Ver estoque`}
                animar={animar}
                indice={2}
              />
            </div>

            {(t.canceladas > 0 || t.vendas === 0) && (
              <div className={estilos.notas}>
                {t.canceladas > 0 && (
                  <p>
                    {plural(t.canceladas, 'venda cancelada', 'vendas canceladas')} ({formatarMoeda(t.valorCancelado)}) não{' '}
                    {t.canceladas === 1 ? 'entra' : 'entram'} no total.
                  </p>
                )}
                {t.vendas === 0 && (
                  <p>
                    Nenhuma venda {NOME_PERIODO[periodo]} ainda. <LinkApp to="/vender">Registrar uma venda</LinkApp>
                  </p>
                )}
              </div>
            )}
          </section>

          <div className={estilos.grade}>
            {mostrarGrafico && (
              <section className={`${estilos.cartao} ${estilos.cartaoGrafico} ${animar ? 'entra' : ''}`} style={{ '--atraso': '0.85s' }} aria-labelledby="t-grafico">
                <header className={estilos.cabecalhoCartao}>
                  <h2 id="t-grafico" className="cap">
                    Vendas · {periodo === 'hoje' ? 'últimos 7 dias' : NOME_PERIODO[periodo].replace('em ', 'últimos ')}
                  </h2>
                  <strong className="num">{formatarMoeda(totalGrafico)}</strong>
                </header>
                <GraficoVendasDia dias={diasGrafico} destaque={diasGrafico.at(-1)?.dia} animar={animar} />
              </section>
            )}

            <section className={`${estilos.cartao} ${animar ? 'entra' : ''}`} style={{ '--atraso': '0.95s' }} aria-labelledby="t-alertas">
              <header className={estilos.cabecalhoCartao}>
                <h2 id="t-alertas" className="cap">
                  Acabando
                </h2>
                <LinkApp to="/estoque" className={estilos.link}>
                  Ver estoque
                </LinkApp>
              </header>
              {alertas.produtos.length === 0 ? (
                <p className={estilos.info}>Nenhum produto acabando. Tudo em ordem.</p>
              ) : (
                <ul className={estilos.lista}>
                  {alertas.produtos.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      {/* a linha inteira é o alvo de toque */}
                      <LinkApp to={`/estoque?produto=${p.id}`} className={estilos.linhaLista}>
                        <span>{p.nome}</span>
                        <strong className={`num ${p.quantidade === 0 ? estilos.zerado : estilos.acabando}`}>
                          {p.quantidade === 0 ? 'Zerado' : `${p.quantidade} un`}
                        </strong>
                      </LinkApp>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {(dados.maisVendidos.length > 0 || mostrarOrigem) && (
            <div className={estilos.grade}>
              {dados.maisVendidos.length > 0 && (
                <section className={estilos.cartao} aria-labelledby="t-mais">
                  <header className={estilos.cabecalhoCartao}>
                    <h2 id="t-mais" className="cap">
                      Mais vendidos
                    </h2>
                  </header>
                  <ol className={estilos.ranking}>
                    {dados.maisVendidos.map((p) => (
                      <li key={p.produtoId}>
                        <div className={estilos.linhaRanking}>
                          <span>{p.nome}</span>
                          <span className="num">
                            <strong>{p.quantidade} un</strong> · {formatarMoeda(p.valor)}
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

              {mostrarOrigem && (
                <section className={estilos.cartao} aria-labelledby="t-origem">
                  <header className={estilos.cabecalhoCartao}>
                    <h2 id="t-origem" className="cap">
                      Origem das vendas
                    </h2>
                  </header>
                  {/* barra fina dividida: o texto abaixo traz os números */}
                  <div
                    className={estilos.barraDividida}
                    role="img"
                    aria-label={origens.map((c) => `${c.nome} ${percentual(c.valor, t.valor)}%`).join(', ')}
                  >
                    {origens.map((c) =>
                      c.valor > 0 ? <span key={c.canalId ?? 'sem'} style={{ flexGrow: c.valor, background: c.cor }} /> : null,
                    )}
                  </div>
                  <ul className={estilos.origens}>
                    {origens.map((c) => (
                      <li key={c.canalId ?? 'sem'}>
                        <span className={estilos.amostra} style={{ background: c.cor }} aria-hidden="true" />
                        <span className={estilos.nomeOrigem}>
                          {c.nome}
                          <small>{plural(c.vendas, 'venda', 'vendas')}</small>
                        </span>
                        <span className="num">
                          <strong>{formatarMoeda(c.valor)}</strong> <small>{percentual(c.valor, t.valor)}%</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
