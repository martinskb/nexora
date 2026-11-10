import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { IconeAlerta, IconeCheck } from '../components/Icones.jsx'
import estilos from './Avisos.module.css'

const AvisosContext = createContext(null)
const DURACAO_MS = 3500

/** Avisos rápidos ("Produto salvo.") que aparecem no rodapé e somem sozinhos. */
export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const proximoId = useRef(1)

  const fechar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const avisar = useCallback(
    (mensagem, tipo = 'sucesso') => {
      const id = proximoId.current++
      setAvisos((lista) => [...lista.slice(-1), { id, mensagem, tipo }]) // no máximo 2 empilhados
      setTimeout(() => fechar(id), DURACAO_MS)
    },
    [fechar],
  )

  const valor = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div className={estilos.regiao} aria-live="polite" aria-atomic="false">
        {avisos.map((a) => (
          <div key={a.id} className={`${estilos.aviso} ${estilos[a.tipo]}`} role="status">
            {a.tipo === 'erro' ? <IconeAlerta /> : <IconeCheck />}
            <span>{a.mensagem}</span>
            <button type="button" className={estilos.fechar} onClick={() => fechar(a.id)} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAvisos() {
  const ctx = useContext(AvisosContext)
  if (!ctx) throw new Error('useAvisos deve ser usado dentro de <AvisosProvider>')
  return ctx
}
