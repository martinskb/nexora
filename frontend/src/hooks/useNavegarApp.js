import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { acaoAoIrPara, ehAba } from '../utils/navegacao.js'

/**
 * Navegação do menu com as regras de histórico do app (utils/navegacao.js):
 * abas não empilham; voltar numa aba leva ao Início; Vender e Minha loja
 * guardam de onde a pessoa veio (state.origem).
 */
export function useNavegarApp() {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(
    (para, { state: extra } = {}) => {
      const de = location.pathname
      const inicioAtras = Boolean(location.state?.inicioAtras)
      const acao = acaoAoIrPara(de, para, inicioAtras)
      if (acao.tipo === 'voltar') return navigate(-1)

      const state = { ...extra }
      if (ehAba(para)) {
        // "Início atrás": vale para a aba aberta a partir do Início e para as que a substituem.
        if (para !== '/') state.inicioAtras = de === '/' || (acao.replace && inicioAtras)
      } else {
        state.origem = de
      }
      return navigate(para, { replace: acao.replace, state })
    },
    [location, navigate],
  )
}
