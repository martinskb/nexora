import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Botao } from './Botao.jsx'
import { BotaoTema } from './BotaoTema.jsx'
import { IconeCaixa, IconeCarrinho, IconeEstoque, IconeInicio, IconeRecibo, IconeSair } from './Icones.jsx'
import { Logo } from './Logo.jsx'
import estilos from './LayoutApp.module.css'

// Itens do menu, na ordem do celular. "Vender" é a ação mais frequente no balcão:
// fica no centro do menu inferior e é o único botão preenchido do cabeçalho.
const MENU = [
  { para: '/', rotulo: 'Início', Icone: IconeInicio, exato: true },
  { para: '/vendas', rotulo: 'Vendas', Icone: IconeRecibo },
  { para: '/vender', rotulo: 'Vender', Icone: IconeCarrinho, principal: true },
  { para: '/estoque', rotulo: 'Estoque', Icone: IconeEstoque },
  { para: '/produtos', rotulo: 'Produtos', Icone: IconeCaixa },
]

const classeLink =
  (extra = '') =>
  ({ isActive }) =>
    [estilos.link, extra, isActive && estilos.ativo].filter(Boolean).join(' ')

function ItemMenu({ para, rotulo, Icone, exato, className }) {
  return (
    <NavLink to={para} end={exato} className={classeLink(className)}>
      <Icone />
      <span>{rotulo}</span>
    </NavLink>
  )
}

/** Moldura das telas internas (usuário logado). */
export function LayoutApp() {
  const { loja, sair } = useAuth()
  const navigate = useNavigate()
  const [saindo, setSaindo] = useState(false)
  const vender = MENU.find((m) => m.principal)

  async function aoSair() {
    setSaindo(true)
    await sair()
    navigate('/entrar', { replace: true })
  }

  return (
    <div className={estilos.app}>
      <header className={estilos.cabecalho}>
        <div className={estilos.barra}>
          <Link to="/" aria-label="Início" className={estilos.marca}>
            <Logo tamanho={30} />
          </Link>
          <nav className={estilos.menuTopo} aria-label="Menu principal">
            {MENU.filter((m) => !m.principal).map((m) => (
              <ItemMenu key={m.para} {...m} />
            ))}
          </nav>
          <span className={estilos.loja} title={loja?.nome}>
            {loja?.nome}
          </span>
          <ItemMenu {...vender} className={estilos.venderTopo} />
          <div className={estilos.acoes}>
            <BotaoTema />
            <Botao variante="fantasma" onClick={aoSair} carregando={saindo} aria-label="Sair da conta">
              {!saindo && <IconeSair />}
              <span className={estilos.textoSair}>Sair</span>
            </Botao>
          </div>
        </div>
      </header>
      <main className={estilos.conteudo}>
        <Outlet />
      </main>
      <nav className={estilos.menuInferior} aria-label="Menu principal">
        {MENU.map((m) => (
          <ItemMenu key={m.para} {...m} className={m.principal ? estilos.venderInferior : ''} />
        ))}
      </nav>
    </div>
  )
}
