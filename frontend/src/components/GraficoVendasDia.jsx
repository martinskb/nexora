import { useState } from 'react'
import { useLargura } from '../hooks/useLargura.js'
import { dataDoDia, marcasEixo, rotuloEixo } from '../utils/grafico.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './GraficoVendasDia.module.css'

const ALTURA = 200
const MARGEM = { topo: 20, direita: 4, baixo: 26, esquerda: 44 }
const BARRA_MAX = 24
const RAIO = 4

const fmtDiaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fmtSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const fmtDiaLongo = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

/** Caminho de uma coluna com o topo arredondado (4px) e a base reta, apoiada no eixo. */
function caminhoColuna(x, y, largura, altura) {
  if (altura <= 0) return ''
  const r = Math.min(RAIO, largura / 2, altura)
  return `M${x},${y + altura}V${y + r}Q${x},${y} ${x + r},${y}H${x + largura - r}Q${x + largura},${y} ${x + largura},${y + r}V${y + altura}Z`
}

/**
 * Colunas de valor vendido por dia (série única: sem legenda, o título nomeia).
 * Passar o mouse ou focar com o teclado mostra o dia, o valor e o nº de vendas.
 * A mesma informação fica disponível em tabela logo abaixo.
 */
export function GraficoVendasDia({ dias }) {
  const [ref, largura] = useLargura()
  const [ativo, setAtivo] = useState(null)

  const maximo = Math.max(...dias.map((d) => d.valor), 0)
  const marcas = marcasEixo(maximo)
  const topo = marcas.at(-1)
  const larguraPlot = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 0)
  const alturaPlot = ALTURA - MARGEM.topo - MARGEM.baixo
  const banda = dias.length ? larguraPlot / dias.length : 0
  const larguraBarra = Math.max(Math.min(BARRA_MAX, banda - 2), 2) // ≥ 2px de espaço entre colunas
  const y = (v) => MARGEM.topo + alturaPlot - (v / topo) * alturaPlot

  // Rótulos do eixo X: só quantos couberem sem encostar
  // (dia da semana "seg" ~30px; data "10/11" ~44px).
  const curto = dias.length <= 7
  const passoRotulo = Math.max(1, Math.ceil((curto ? 30 : 44) / Math.max(banda, 1)))
  const indiceMaior = dias.reduce((m, d, i) => (d.valor > (dias[m]?.valor ?? -1) ? i : m), 0)

  const diaAtivo = ativo !== null ? dias[ativo] : null
  const xAtivo = ativo !== null ? MARGEM.esquerda + banda * ativo + banda / 2 : 0
  // A dica abre para o lado que tem espaço, para nunca sair da tela.
  const ladoDica = xAtivo < largura / 3 ? 'direita' : xAtivo > (largura * 2) / 3 ? 'esquerda' : 'centro'

  return (
    <div className={estilos.grafico}>
      <div ref={ref} className={estilos.area} onPointerLeave={() => setAtivo(null)}>
        {largura > 0 && (
          <svg width={largura} height={ALTURA} role="img" aria-label="Valor vendido por dia">
            {/* grade e eixo Y */}
            {marcas.map((m) => (
              <g key={m}>
                <line
                  x1={MARGEM.esquerda}
                  x2={largura - MARGEM.direita}
                  y1={y(m)}
                  y2={y(m)}
                  className={m === 0 ? estilos.base : estilos.grade}
                />
                <text x={MARGEM.esquerda - 8} y={y(m)} className={estilos.eixoY} dominantBaseline="middle">
                  {rotuloEixo(m, topo)}
                </text>
              </g>
            ))}

            {dias.map((d, i) => {
              const xBanda = MARGEM.esquerda + banda * i
              const xBarra = xBanda + (banda - larguraBarra) / 2
              const yBarra = y(d.valor)
              const data = dataDoDia(d.dia)
              const descricao = `${fmtDiaLongo.format(data)}: ${formatarMoeda(d.valor)}, ${d.vendas} ${d.vendas === 1 ? 'venda' : 'vendas'}`
              return (
                <g key={d.dia}>
                  <path
                    d={caminhoColuna(xBarra, yBarra, larguraBarra, MARGEM.topo + alturaPlot - yBarra)}
                    className={`${estilos.coluna} ${ativo !== null && ativo !== i ? estilos.apagada : ''}`}
                  />
                  {/* rótulo direto só no maior dia */}
                  {i === indiceMaior && d.valor > 0 && (
                    <text x={xBanda + banda / 2} y={yBarra - 6} className={estilos.rotuloValor} textAnchor="middle">
                      {rotuloEixo(Math.round(d.valor), topo)}
                    </text>
                  )}
                  {i % passoRotulo === 0 && (
                    <text x={xBanda + banda / 2} y={ALTURA - 8} className={estilos.eixoX} textAnchor="middle">
                      {curto ? fmtSemana.format(data).replace('.', '') : fmtDiaCurto.format(data)}
                    </text>
                  )}
                  {/* área de toque: a faixa inteira do dia, maior que a coluna */}
                  <rect
                    x={xBanda}
                    y={MARGEM.topo}
                    width={banda}
                    height={alturaPlot}
                    className={estilos.alvo}
                    tabIndex={0}
                    aria-label={descricao}
                    onPointerEnter={() => setAtivo(i)}
                    onFocus={() => setAtivo(i)}
                    onBlur={() => setAtivo(null)}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {diaAtivo && (
          <div
            className={`${estilos.dica} ${estilos[`dica_${ladoDica}`]}`}
            style={{ left: xAtivo, top: Math.max(y(diaAtivo.valor) - 8, 0) }}
            role="status"
          >
            <strong>{formatarMoeda(diaAtivo.valor)}</strong>
            <span>{fmtDiaLongo.format(dataDoDia(diaAtivo.dia))}</span>
            <span>
              {diaAtivo.vendas} {diaAtivo.vendas === 1 ? 'venda' : 'vendas'}
            </span>
          </div>
        )}
      </div>

      <details className={estilos.tabela}>
        <summary>Ver em tabela</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Vendas</th>
              <th scope="col">Valor</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.dia}>
                <td>{fmtDiaCurto.format(dataDoDia(d.dia))}</td>
                <td>{d.vendas}</td>
                <td>{formatarMoeda(d.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
