import { Logo } from './Logo.jsx'
import { Preco } from './Preco.jsx'
import estilos from './LayoutAuth.module.css'

/** Moldura das telas de entrada (login e criação de conta). */
export function LayoutAuth({ titulo, subtitulo, rodape, children }) {
  return (
    <div className={estilos.pagina}>
      {/* Telas grandes: painel que mostra, num exemplo, o que o sistema faz. */}
      <aside className={estilos.painel}>
        <p className={estilos.painelTitulo}>Seu estoque fora do caderno.</p>
        <p className={estilos.painelTexto}>
          Cadastre seus produtos e registre cada venda: o saldo se atualiza sozinho. Nada de anotar no caderno ou
          procurar mensagem no grupo para saber o que ainda tem.
        </p>
        <div className={estilos.exemplo} aria-hidden="true">
          <span className={estilos.exemploNome}>Leite integral 1L</span>
          <Preco valor={5.29} tamanho="lg" etiqueta />
          <span className={estilos.exemploSaldo}>
            Estoque <s>43</s> <strong>42 un.</strong>
          </span>
        </div>
      </aside>

      <div className={estilos.lado}>
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
    </div>
  )
}
