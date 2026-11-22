/**
 * Marca Nexora: o "N" dentro de uma etiqueta de preço, com o furo do barbante.
 * Dentro do app aparece só a etiqueta (sem a palavra). `invertida` é a versão
 * para fundos marinhos (Entrar/Criar conta): etiqueta branca e N marinho.
 */
export function Marca({ tamanho = 32, invertida = false, className }) {
  const etiqueta = invertida ? '#ffffff' : 'var(--cor-logo)'
  const letra = invertida ? '#14245c' : '#ffffff'
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Nexora"
      className={className}
    >
      <path d="M5 32 L21 13 H59 V51 H21 Z" fill={etiqueta} stroke={etiqueta} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="18" cy="32" r="4" fill="var(--cor-furo-logo, #ffd43b)" />
      <path d="M29 45V19h5l11 15.5V19h5v26h-5L34 29.5V45z" fill={letra} />
    </svg>
  )
}
