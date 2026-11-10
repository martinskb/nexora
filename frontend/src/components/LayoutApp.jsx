import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Botao } from './Botao.jsx'
import { BotaoTema } from './BotaoTema.jsx'
import { IconeCaixa, IconeCarrinho, IconeInicio, IconeRecibo, IconeSair } from './Icones.jsx'
import { Logo } from './Logo.jsx'
import estilos from './LayoutApp.module.css'

// Itens do menu. Cada etapa nova acrescenta sua tela aqui.
const MENU = [
  { para: '/', rotulo: 'Início', Icone: IconeInicio, exato: true },
  { para: '/vender', rotulo: 'Vender', Icone: IconeCarrinho },
  { para: '/vendas', rotulo: 'Vendas', Icone: IconeRecibo },
  { para: '/produtos', rotulo: 'Produtos', Icone: IconeCaixa },
]

function Menu({ className }) {
  return (
    <nav className={className} aria-label="Menu principal">
      {MENU.map(({ para, rotulo, Icone, exato }) => (
        <NavLink
          key={para}
          to={para}
          end={exato}
          className={({ isActive }) => `${estilos.link} ${isActive ? estilos.ativo : ''}`}
        >
          <Icone />
          <span>{rotulo}</span>
        </NavLink>
      ))}
    </nav>
  )
}

/** Moldura das telas internas (usuário logado). */
export function LayoutApp() {
  const { loja, sair } = useAuth()
  const navigate = useNavigate()
  const [saindo, setSaindo] = useState(false)

  async function aoSair() {
    setSaindo(true)
    await sair()
    navigate('/entrar', { replace: true })
  }

  return (
    <div className={estilos.app}>
      <header className={estilos.cabecalho}>
        <div className={estilos.barra}>
          <Link to="/" aria-label="Início">
            <Logo tamanho={30} />
          </Link>
          <Menu className={estilos.menuTopo} />
          <span className={estilos.loja} title={loja?.nome}>
            {loja?.nome}
          </span>
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
      <Menu className={estilos.menuInferior} />
    </div>
  )
}
