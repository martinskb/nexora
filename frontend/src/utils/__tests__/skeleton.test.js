import { describe, expect, it } from 'vitest'
import { decidirSkeleton } from '../skeleton.js'

const base = { temDados: false, carregando: true, msDesdeInicio: 0, msDesdeQueApareceu: null }

describe('decidirSkeleton', () => {
  it('com dados guardados nunca mostra', () => {
    expect(decidirSkeleton({ ...base, temDados: true, msDesdeInicio: 5000 })).toBe(false)
  })
  it('resposta rápida (< 200ms): não mostra', () => {
    expect(decidirSkeleton({ ...base, msDesdeInicio: 150 })).toBe(false)
  })
  it('passou de 200ms carregando: mostra', () => {
    expect(decidirSkeleton({ ...base, msDesdeInicio: 250 })).toBe(true)
  })
  it('terminou mas apareceu há menos de 300ms: segura', () => {
    expect(decidirSkeleton({ ...base, carregando: false, msDesdeInicio: 400, msDesdeQueApareceu: 100 })).toBe(true)
  })
  it('terminou e já ficou 300ms: some', () => {
    expect(decidirSkeleton({ ...base, carregando: false, msDesdeInicio: 600, msDesdeQueApareceu: 320 })).toBe(false)
  })
  it('terminou sem nunca ter aparecido: não mostra', () => {
    expect(decidirSkeleton({ ...base, carregando: false, msDesdeInicio: 120 })).toBe(false)
  })
})
