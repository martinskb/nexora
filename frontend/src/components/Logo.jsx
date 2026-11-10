/**
 * Marca NEXORA: o "N" dentro de uma etiqueta de preço (com o furo do barbante).
 */
export function Logo({ tamanho = 32, comTexto = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--esp-2)' }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M5 32 L21 13 H59 V51 H21 Z"
          fill="var(--cor-primaria)"
          stroke="var(--cor-primaria)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="32" r="4" fill="var(--cor-etiqueta)" />
        <path d="M29 45V19h5l11 15.5V19h5v26h-5L34 29.5V45z" fill="var(--cor-sobre-primaria)" />
      </svg>
      {comTexto && (
        <span
          style={{
            fontFamily: 'var(--fonte-titulo)',
            fontStretch: '80%',
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontSize: tamanho * 0.66,
            lineHeight: 1,
            color: 'var(--cor-texto)',
          }}
        >
          NEXORA
        </span>
      )}
    </span>
  )
}
