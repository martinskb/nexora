import { Marca } from './Marca.jsx'

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
      <Marca tamanho={40} />
      <span>{mensagem}</span>
    </div>
  )
}
