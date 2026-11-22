import { useEffect, useState } from 'react'
import estilosApp from './LayoutApp.module.css'
import { Marca } from './Marca.jsx'
import { Carregando, Skeleton } from './Skeleton.jsx'
import estilos from './TelaCarregando.module.css'

const ESPERA_AVISO_MS = 4000

/** Depois de alguns segundos sem resposta, avisa que o servidor pode estar acordando. */
function AvisoServidorLento() {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLento(true), ESPERA_AVISO_MS)
    return () => clearTimeout(t)
  }, [])
  return (
    <p className={`${estilos.aviso} ${lento ? estilos.visivel : ''}`} role="status">
      {lento && 'Conectando ao servidor… pode levar alguns segundos na primeira vez.'}
    </p>
  )
}

/**
 * Abertura do app enquanto a sessão é verificada.
 * moldura=true (alguém já entrou neste aparelho): a moldura do app aparece pronta,
 * com o skeleton do Início. Sem isso: só a marca, até decidir se vai para o login.
 */
export function TelaCarregando({ moldura = false }) {
  if (!moldura) {
    return (
      <div className={estilos.simples}>
        <Marca tamanho={44} />
        <span className="somente-leitor" role="status">
          Carregando…
        </span>
        <AvisoServidorLento />
      </div>
    )
  }
  return (
    <div className={estilosApp.app}>
      <aside className={estilosApp.lateral}>
        <span className={estilosApp.marcaLateral}>
          <Marca tamanho={32} />
        </span>
        <div className={estilos.menu}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} altura={20} largura="70%" />
          ))}
        </div>
      </aside>
      <header className={estilosApp.topo}>
        <Marca tamanho={32} />
      </header>
      <main className={estilosApp.conteudo}>
        <Carregando className={estilos.inicio}>
          <Skeleton altura={34} largura="70%" />
          <Skeleton altura={14} largura="40%" />
          <Skeleton altura={44} forma="pilula" />
          <Skeleton forma="circulo" largura={232} altura={232} className={estilos.anel} />
          <Skeleton forma="etiqueta" altura={56} />
          <Skeleton forma="etiqueta" altura={56} />
          <Skeleton forma="etiqueta" altura={56} />
          <AvisoServidorLento />
        </Carregando>
      </main>
    </div>
  )
}
