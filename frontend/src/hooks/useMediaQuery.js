import { useCallback, useSyncExternalStore } from 'react'

/** true enquanto a media query CSS for verdadeira (ex.: '(min-width: 900px)'). */
export function useMediaQuery(consulta) {
  const assinar = useCallback(
    (aoMudar) => {
      const mq = window.matchMedia(consulta)
      mq.addEventListener('change', aoMudar)
      return () => mq.removeEventListener('change', aoMudar)
    },
    [consulta],
  )
  return useSyncExternalStore(assinar, () => window.matchMedia(consulta).matches)
}
