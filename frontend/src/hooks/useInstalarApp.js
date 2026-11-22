import { useCallback, useEffect, useState } from 'react'
import { plataformaDeInstalacao } from '../utils/instalacao.js'
import { useMediaQuery } from './useMediaQuery.js'

const CHAVE_DISPENSA = 'nexora-instalar-dispensado'

// O navegador avisa uma vez que o app pode ser instalado: guardamos o aviso
// para mostrar o convite na hora certa (e não a barrinha padrão dele).
let convite = null
const ouvintes = new Set()
const avisar = () => ouvintes.forEach((f) => f())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    convite = e
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    convite = null
    avisar()
  })
}

function lerDispensa() {
  try {
    return window.localStorage.getItem(CHAVE_DISPENSA) === '1'
  } catch {
    return false
  }
}

/** Estado e ações para instalar o Nexora como app (atalho na tela inicial). */
export function useInstalarApp() {
  const [, atualizar] = useState(0)
  const [dispensado, setDispensado] = useState(lerDispensa)
  const standalone = useMediaQuery('(display-mode: standalone)')
  const instalado = standalone || window.navigator.standalone === true

  useEffect(() => {
    const f = () => atualizar((n) => n + 1)
    ouvintes.add(f)
    return () => ouvintes.delete(f)
  }, [])

  const plataforma = plataformaDeInstalacao(window.navigator.userAgent, Boolean(convite))

  const instalar = useCallback(async () => {
    if (!convite) return 'recusado'
    convite.prompt()
    const { outcome } = await convite.userChoice
    convite = null
    avisar()
    return outcome === 'accepted' ? 'aceito' : 'recusado'
  }, [])

  const dispensar = useCallback(() => {
    try {
      window.localStorage.setItem(CHAVE_DISPENSA, '1')
    } catch {
      /* armazenamento indisponível */
    }
    setDispensado(true)
  }, [])

  return { plataforma, instalado, dispensado, podeInstalar: !instalado && plataforma !== 'indisponivel', instalar, dispensar }
}
