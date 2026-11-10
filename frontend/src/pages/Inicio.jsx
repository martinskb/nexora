import { useAuth } from '../context/AuthContext.jsx'

// Tela inicial provisória. Nas próximas etapas recebe o resumo de vendas,
// alertas de estoque e os atalhos para produtos e vendas.
export default function Inicio() {
  const { loja } = useAuth()
  return (
    <section style={{ display: 'grid', gap: 'var(--esp-2)' }}>
      <h1 style={{ fontSize: 'var(--texto-xl)' }}>Olá, {loja.nome}!</h1>
      <p style={{ color: 'var(--cor-texto-suave)' }}>Sua conta está pronta.</p>
    </section>
  )
}
