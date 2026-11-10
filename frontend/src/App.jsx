import { useEffect, useState } from 'react'
import { api } from './api/client.js'

// Tela temporária da Etapa 1: confirma que frontend, API e banco estão conectados.
// Será substituída pelo login e pelas telas do sistema nas próximas etapas.
async function checarSaude(signal) {
  try {
    const dados = await api('/health', { signal })
    return { carregando: false, ok: dados.banco === 'ok' }
  } catch (err) {
    if (err.name === 'AbortError') return null
    return { carregando: false, ok: false, erro: err.message }
  }
}

export default function App() {
  const [estado, setEstado] = useState({ carregando: true })

  function verificar() {
    setEstado({ carregando: true })
    checarSaude().then(setEstado)
  }

  useEffect(() => {
    const ctrl = new AbortController()
    checarSaude(ctrl.signal).then((r) => r && setEstado(r))
    return () => ctrl.abort()
  }, [])

  return (
    <main style={estilos.pagina}>
      <section style={estilos.cartao}>
        <h1 style={estilos.marca}>NEXORA</h1>
        <p style={estilos.sub}>Gestão simples para o pequeno comerciante</p>

        <p role="status" style={estilos.status}>
          {estado.carregando
            ? 'Verificando conexão…'
            : estado.ok
              ? '✅ Sistema conectado ao servidor e ao banco de dados.'
              : `⚠️ ${estado.erro || 'O servidor respondeu, mas o banco está indisponível.'}`}
        </p>

        <button
          type="button"
          style={estilos.botao}
          onClick={verificar}
          disabled={estado.carregando}
        >
          Verificar novamente
        </button>
      </section>
    </main>
  )
}

const estilos = {
  pagina: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    padding: 'var(--esp-4)',
  },
  cartao: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--cor-superficie)',
    borderRadius: 'var(--raio-lg)',
    boxShadow: 'var(--sombra-md)',
    padding: 'var(--esp-6) var(--esp-5)',
    textAlign: 'center',
    display: 'grid',
    gap: 'var(--esp-4)',
  },
  marca: { color: 'var(--cor-primaria)', fontSize: 'var(--texto-2xl)', letterSpacing: '0.04em' },
  sub: { color: 'var(--cor-texto-suave)' },
  status: { fontSize: 'var(--texto-sm)' },
  botao: {
    minHeight: 'var(--toque-min)',
    border: 0,
    borderRadius: 'var(--raio-md)',
    background: 'var(--cor-primaria)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
