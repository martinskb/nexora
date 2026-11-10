import { Logo } from './Logo.jsx'

export function TelaCarregando({ mensagem = 'Carregando…' }) {
  return (
    <div
      role="status"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeContent: 'center',
        justifyItems: 'center',
        gap: 'var(--esp-3)',
        color: 'var(--cor-texto-suave)',
      }}
    >
      <Logo tamanho={40} comTexto={false} />
      <span>{mensagem}</span>
    </div>
  )
}
