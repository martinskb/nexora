// Ícones SVG simples (traço), herdam a cor do texto.
function Icone({ children, tamanho = 20, ...props }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconeSol = (p) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Icone>
)

export const IconeLua = (p) => (
  <Icone {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icone>
)

export const IconeOlho = (p) => (
  <Icone {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icone>
)

export const IconeOlhoFechado = (p) => (
  <Icone {...p}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
    <path d="M2 2l20 20" />
  </Icone>
)

export const IconeSair = (p) => (
  <Icone {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Icone>
)

export const IconeAlerta = (p) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icone>
)

export const IconeInicio = (p) => (
  <Icone {...p}>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </Icone>
)

export const IconeCaixa = (p) => (
  <Icone {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </Icone>
)

export const IconeCarrinho = (p) => (
  <Icone {...p}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6" />
  </Icone>
)

export const IconeRecibo = (p) => (
  <Icone {...p}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icone>
)

export const IconeLixeira = (p) => (
  <Icone {...p}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </Icone>
)

export const IconeEstoque = (p) => (
  <Icone {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icone>
)

export const IconeMais = (p) => (
  <Icone {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
)

export const IconeBusca = (p) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icone>
)

export const IconeFechar = (p) => (
  <Icone {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Icone>
)

export const IconeSeta = (p) => (
  <Icone {...p}>
    <path d="M9 18l6-6-6-6" />
  </Icone>
)

export const IconeCheck = (p) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-6" />
  </Icone>
)
