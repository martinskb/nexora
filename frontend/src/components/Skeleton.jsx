import estilos from './Skeleton.module.css'

/** Bloco de carregamento no formato do conteúdo. forma: 'linha' | 'circulo' | 'etiqueta' | 'pilula' | 'cartao' */
export function Skeleton({ largura = '100%', altura = 16, forma = 'linha', className = '', style }) {
  return (
    <span
      className={`${estilos.sk} ${estilos[forma] ?? ''} ${className}`}
      style={{ width: largura, height: altura, ...style }}
      aria-hidden="true"
    />
  )
}

/** Contêiner de uma área carregando: avisa o leitor de tela. */
export function Carregando({ children, className = '' }) {
  return (
    <div className={className} aria-busy="true">
      <span className="somente-leitor" role="status">
        Carregando…
      </span>
      {children}
    </div>
  )
}
