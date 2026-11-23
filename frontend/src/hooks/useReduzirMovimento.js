import { useMediaQuery } from './useMediaQuery.js'

/** true quando a pessoa pediu "reduzir movimento" no sistema. */
export const useReduzirMovimento = () => useMediaQuery('(prefers-reduced-motion: reduce)')
