import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { TelaCarregando } from './TelaCarregando.jsx'

/** Só deixa passar quem está logado; os demais vão para /entrar. */
export function RotaProtegida() {
  const { loja, verificando } = useAuth()
  const location = useLocation()
  if (verificando) return <TelaCarregando />
  if (!loja) return <Navigate to="/entrar" replace state={{ de: location.pathname }} />
  return <Outlet />
}

/** Telas de entrada: quem já está logado é levado ao início. */
export function SomenteVisitante() {
  const { loja, verificando } = useAuth()
  if (verificando) return <TelaCarregando />
  if (loja) return <Navigate to="/" replace />
  return <Outlet />
}
