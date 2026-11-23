export const ATRASO_SKELETON_MS = 200
export const MINIMO_SKELETON_MS = 300

/**
 * Mostrar o skeleton? Só sem dados guardados, só se a espera passar de 200ms
 * e, depois de aparecer, por pelo menos 300ms (para não piscar).
 */
export function decidirSkeleton({ temDados, carregando, msDesdeInicio, msDesdeQueApareceu }) {
  if (temDados && msDesdeQueApareceu === null) return false
  if (msDesdeQueApareceu !== null && msDesdeQueApareceu < MINIMO_SKELETON_MS) return true
  if (temDados || !carregando) return false
  return msDesdeInicio >= ATRASO_SKELETON_MS
}
