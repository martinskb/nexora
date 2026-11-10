import { useEffect, useId, useRef } from 'react'
import { Botao } from './Botao.jsx'
import { IconeFechar } from './Icones.jsx'
import estilos from './Modal.module.css'

/**
 * Janela sobreposta baseada no <dialog> nativo (foco preso dentro dela
 * e tecla Esc para fechar, sem bibliotecas extras).
 * O conteúdo só é montado enquanto está aberta, então formulários começam limpos.
 */
export function Modal({ aberto, aoFechar, titulo, children }) {
  const ref = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className={estilos.dialogo}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault() // Esc: deixamos o React controlar o fechamento
        aoFechar()
      }}
    >
      {aberto && (
        <>
          <header className={estilos.cabecalho}>
            <h2 id={idTitulo} className={estilos.titulo}>
              {titulo}
            </h2>
            <Botao variante="fantasma" onClick={aoFechar} aria-label="Fechar">
              <IconeFechar />
            </Botao>
          </header>
          <div className={estilos.corpo}>{children}</div>
        </>
      )}
    </dialog>
  )
}
