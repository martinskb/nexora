import estilos from './Botao.module.css'

/**
 * Botão padrão da NEXORA.
 * variante: 'primario' | 'secundario' | 'fantasma' | 'perigo'
 * carregando: mostra indicador e bloqueia cliques repetidos.
 */
export function Botao({
  variante = 'primario',
  carregando = false,
  larguraTotal = false,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}) {
  const classes = [estilos.botao, estilos[variante], larguraTotal && estilos.larguraTotal, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || carregando} aria-busy={carregando} {...props}>
      {carregando && <span className={estilos.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
