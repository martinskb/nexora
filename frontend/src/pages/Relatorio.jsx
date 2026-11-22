import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { IconeSeta, IconeVoltar } from '../components/Icones.jsx'
import { LinkApp } from '../components/LinkApp.jsx'
import { NumeroAnimado } from '../components/NumeroAnimado.jsx'
import { Carregando, Skeleton } from '../components/Skeleton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { useRelatorio } from '../dados/hooks.js'
import { useEstadoDaAba } from '../hooks/useEstadoDaAba.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useSkeleton } from '../hooks/useSkeleton.js'
import { useTitulo } from '../hooks/useTitulo.js'
import { compartilharTexto, textoRelatorio } from '../utils/compartilhar.js'
import { formatarMoeda } from '../utils/formato.js'
import estilos from './Relatorio.module.css'

const FORMAS = [
  { chave: 'dinheiro', nome: 'Dinheiro', cor: 'var(--serie-1)' },
  { chave: 'pix', nome: 'Pix', cor: 'var(--serie-4)' },
  { chave: 'cartao', nome: 'Cartão', cor: 'var(--serie-2)' },
  { chave: 'naoInformado', nome: 'Não informado', cor: 'var(--cor-sem-canal)' },
]
const semana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })

/** "AAAA-MM-DD" do dia local, `deslocamento` dias a partir de hoje (0 = hoje, -1 = ontem). */
function diaLocal(deslocamento, base) {
  const d = new Date(base)
  d.setDate(d.getDate() + deslocamento)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

function rotuloDia(deslocamento, base) {
  if (deslocamento === 0) return 'Hoje'
  if (deslocamento === -1) return 'Ontem'
  const d = new Date(base)
  d.setDate(d.getDate() + deslocamento)
  return `${semana.format(d).replace('.', '')}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Relatorio() {
  useTitulo('Relatório do dia')
  const { loja } = useAuth()
  const { avisar } = useAvisos()
  const navigate = useNavigate()
  const location = useLocation()
  const telaGrande = useMediaQuery('(min-width: 960px)')
  const [base] = useState(() => new Date())
  const [deslocamento, setDeslocamento] = useEstadoDaAba('relatorio.dia', 0)
  const dia = diaLocal(deslocamento, base)
  const { data: r, isPending, error, refetch } = useRelatorio(dia)
  const mostrarSkeleton = useSkeleton(Boolean(r), isPending)

  const voltar = () => (location.state?.origem ? navigate(-1) : navigate('/', { replace: true }))

  async function compartilhar() {
    const resultado = await compartilharTexto(textoRelatorio(loja.nome, r))
    if (resultado === 'copiado') avisar('Relatório copiado.')
  }

  const formas = r ? FORMAS.filter((f) => r.porForma[f.chave] > 0) : []

  return (
    <div className={estilos.pagina}>
      <header className={estilos.topo}>
        {telaGrande ? (
          <p className={estilos.trilha}>Relatório do dia</p>
        ) : (
          <button type="button" className={estilos.voltar} onClick={voltar} aria-label="Voltar">
            <IconeVoltar />
          </button>
        )}
        <h1 className={estilos.titulo}>Relatório do dia</h1>
      </header>

      <div className={estilos.seletor} role="group" aria-label="Dia do relatório">
        <button type="button" onClick={() => setDeslocamento((d) => d - 1)} aria-label="Dia anterior">
          <IconeVoltar />
        </button>
        <strong aria-live="polite">{rotuloDia(deslocamento, base)}</strong>
        <button type="button" onClick={() => setDeslocamento((d) => d + 1)} disabled={deslocamento >= 0} aria-label="Próximo dia">
          <IconeSeta />
        </button>
      </div>

      {error && (
        <div className={estilos.erro}>
          <Alerta>{error.message}</Alerta>
          <Botao variante="secundario" onClick={() => refetch()}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {!r && mostrarSkeleton && (
        <Carregando className={estilos.blocos}>
          <Skeleton forma="cartao" altura={120} />
          <Skeleton forma="cartao" altura={160} />
          <Skeleton forma="cartao" altura={120} />
        </Carregando>
      )}

      {r && (
        <div className={estilos.blocos}>
          <section className={estilos.cartao} aria-labelledby="t-vendido">
            <h2 id="t-vendido" className="cap">
              Vendido
            </h2>
            <NumeroAnimado valor={r.vendido} moeda destaque desdeZero={false} className={estilos.grande} />
            <p className={estilos.apoio}>{r.vendas === 1 ? '1 venda' : `${r.vendas} vendas`}</p>
          </section>

          <section className={estilos.cartao} aria-labelledby="t-formas">
            <h2 id="t-formas" className="cap">
              Por forma de pagamento
            </h2>
            {formas.length === 0 ? (
              <p className={estilos.apoio}>Nenhuma venda neste dia.</p>
            ) : (
              <>
                <div
                  className={estilos.barra}
                  role="img"
                  aria-label={formas.map((f) => `${f.nome} ${formatarMoeda(r.porForma[f.chave])}`).join(', ')}
                >
                  {formas.map((f) => (
                    <span key={f.chave} style={{ flexGrow: r.porForma[f.chave], background: f.cor }} />
                  ))}
                </div>
                <ul className={estilos.formas}>
                  {formas.map((f) => (
                    <li key={f.chave}>
                      <span className={estilos.amostra} style={{ background: f.cor }} aria-hidden="true" />
                      <span>{f.nome}</span>
                      <strong className="num">{formatarMoeda(r.porForma[f.chave])}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className={estilos.cartao} aria-labelledby="t-lucro">
            <h2 id="t-lucro" className="cap">
              Lucro
            </h2>
            {/* Sem nenhum item com custo, R$ 0,00 enganaria: diz o que falta. */}
            {r.lucro.receitaComCusto === 0 && r.lucro.parcial ? (
              <p className={estilos.semCusto}>Sem custo cadastrado nos produtos vendidos.</p>
            ) : (
              <p className={estilos.linhaLucro}>
                <NumeroAnimado valor={r.lucro.valor} moeda destaque desdeZero={false} className={estilos.grande} />
                {r.lucro.margem !== null && <span className={estilos.margem}>{r.lucro.margem}%</span>}
              </p>
            )}
            {r.lucro.parcial && r.lucro.receitaComCusto === 0 && (
              <p className={estilos.parcial}>
                <LinkApp to="/estoque">Completar custos</LinkApp>
              </p>
            )}
            {r.lucro.parcial && r.lucro.receitaComCusto > 0 && (
              <p className={estilos.parcial}>
                Parcial:{' '}
                {r.lucro.produtosSemCusto.length === 1
                  ? '1 produto vendido sem custo'
                  : `${r.lucro.produtosSemCusto.length} produtos vendidos sem custo`}
                . <LinkApp to="/estoque">Completar custos</LinkApp>
              </p>
            )}
          </section>

          <Botao variante="secundario" onClick={compartilhar} className={estilos.compartilhar}>
            Compartilhar relatório
          </Botao>
        </div>
      )}
    </div>
  )
}
