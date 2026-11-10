export function Logo({ tamanho = 32, comTexto = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--esp-2)' }}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--cor-primaria)" />
        <path d="M19 46V18h5.5l15 19.5V18H45v28h-5.5l-15-19.5V46z" fill="var(--cor-sobre-primaria)" />
      </svg>
      {comTexto && (
        <span
          style={{
            fontWeight: 800,
            letterSpacing: '0.06em',
            fontSize: tamanho * 0.6,
            color: 'var(--cor-texto)',
          }}
        >
          NEXORA
        </span>
      )}
    </span>
  )
}
