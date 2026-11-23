import { useEffect, useId, useRef } from 'react'
import { useHistoricoFolha } from '../hooks/useHistoricoFolha.js'
import { Botao } from './Botao.jsx'
import { IconeFechar } from './Icones.jsx'
import estilos from './Folha.module.css'

/**
 * Folha sobreposta: sobe de baixo no celular e aparece no centro no PC.
 * Baseada no <dialog> nativo (foco preso, Esc fecha, foco volta a quem abriu).
 * Entra no histórico: o "voltar" do sistema fecha a folha.
 * O conteúdo só é montado enquanto está aberta (formulários começam limpos).
 */
export function Folha({ aberto, aoFechar, titulo, rodape, children }) {
  const ref = useRef(null)
  const idTitulo = useId()
  useHistoricoFolha(aberto, aoFechar)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className={estilos.folha}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault() // Esc: o React controla o fechamento
        aoFechar()
      }}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar() // toque no fundo
      }}
    >
      {aberto && (
        <div className={estilos.caixa}>
          <span className={estilos.alca} aria-hidden="true" />
          <header className={estilos.cabecalho}>
            <h2 id={idTitulo} className={estilos.titulo}>
              {titulo}
            </h2>
            <Botao variante="fantasma" onClick={aoFechar} aria-label="Fechar">
              <IconeFechar />
            </Botao>
          </header>
          <div className={estilos.corpo}>{children}</div>
          {rodape && <footer className={estilos.rodape}>{rodape}</footer>}
        </div>
      )}
    </dialog>
  )
}
