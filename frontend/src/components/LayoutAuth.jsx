import { Marca } from './Marca.jsx'
import estilos from './LayoutAuth.module.css'

/**
 * Moldura das telas de entrada (login e criação de conta).
 * Celular: o painel marinho é o topo da tela e o formulário sobe numa folha
 * por cima; com o teclado aberto, o painel encolhe. PC: lado a lado.
 */
export function LayoutAuth({ titulo, subtitulo, rodape, children }) {
  return (
    <div className={estilos.pagina}>
      <aside className={estilos.painel}>
        <Marca tamanho={40} invertida className={estilos.marca} />
        {/* Exemplo do que o sistema faz: vendeu um, o saldo baixou sozinho. */}
        <div className={estilos.exemplo} aria-hidden="true">
          <div className={estilos.etiqueta}>
            <span>Leite integral 1L</span>
            <span className={estilos.saldo}>
              <s>42</s> → <b>41 un</b>
            </span>
          </div>
        </div>
        <div className={estilos.textos}>
          <p className={estilos.painelTitulo}>Seu estoque fora do caderno.</p>
          <p className={estilos.painelTexto}>Vendas e estoque juntos, sem complicação.</p>
          <p className={`${estilos.painelTexto} ${estilos.textoLongo}`}>
            Cadastre seus produtos e registre cada venda: o saldo se atualiza sozinho. Nada de anotar no caderno ou
            procurar mensagem no grupo para saber o que ainda tem.
          </p>
        </div>
      </aside>

      <main className={estilos.folha}>
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
