import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Botao } from './Botao.jsx'
import { BotaoTema } from './BotaoTema.jsx'
import { IconeSair } from './Icones.jsx'
import { Logo } from './Logo.jsx'
import estilos from './LayoutApp.module.css'

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
    <>
      <header className={estilos.cabecalho}>
        <div className={estilos.barra}>
          <Link to="/" aria-label="Início">
            <Logo tamanho={30} />
          </Link>
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
    </>
  )
}
