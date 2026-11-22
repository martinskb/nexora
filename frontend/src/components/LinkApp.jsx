import { Link } from 'react-router-dom'
import { useNavegarApp } from '../hooks/useNavegarApp.js'

/** Link interno que segue as regras de histórico do app (abas não empilham). */
export function LinkApp({ to, state, onClick, ...props }) {
  const navegar = useNavegarApp()
  return (
    <Link
      to={to}
      state={state}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navegar(to, { state })
      }}
      {...props}
    />
  )
}
