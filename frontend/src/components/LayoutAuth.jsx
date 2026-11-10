import { BotaoTema } from './BotaoTema.jsx'
import { Logo } from './Logo.jsx'
import estilos from './LayoutAuth.module.css'

/** Moldura das telas de entrada (login e criação de conta). */
export function LayoutAuth({ titulo, subtitulo, rodape, children }) {
  return (
    <div className={estilos.pagina}>
      <div className={estilos.topo}>
        <BotaoTema />
      </div>
      <main className={estilos.centro}>
        <header className={estilos.cabecalho}>
          <Logo tamanho={44} />
          <p className={estilos.slogan}>Vendas e estoque juntos, sem complicação.</p>
        </header>
        <section className={estilos.cartao} aria-labelledby="titulo-auth">
          <div>
            <h1 id="titulo-auth" className={estilos.titulo}>
              {titulo}
            </h1>
            {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
          </div>
          {children}
        </section>
        {rodape && <p className={estilos.rodape}>{rodape}</p>}
      </main>
    </div>
  )
}
