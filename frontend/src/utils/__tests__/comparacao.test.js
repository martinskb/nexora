import { describe, expect, it } from 'vitest'
import { compararValores, fracaoAnel, intervaloAnterior } from '../comparacao.js'

const agora = new Date(2026, 10, 10, 15, 30) // 10/11/2026 15:30 local

describe('intervaloAnterior', () => {
  it('hoje → ontem inteiro', () => {
    const { de, ate } = intervaloAnterior('hoje', agora)
    expect(new Date(de)).toEqual(new Date(2026, 10, 9))
    expect(new Date(ate)).toEqual(new Date(2026, 10, 10))
  })
  it('7 dias → os 7 dias antes', () => {
    const { de, ate } = intervaloAnterior('7d', agora)
    expect(new Date(de)).toEqual(new Date(2026, 9, 28))
    expect(new Date(ate)).toEqual(new Date(2026, 10, 4))
  })
  it('30 dias → os 30 dias antes', () => {
    const { de, ate } = intervaloAnterior('30d', agora)
    expect(new Date(de)).toEqual(new Date(2026, 8, 12))
    expect(new Date(ate)).toEqual(new Date(2026, 9, 12))
  })
})

describe('compararValores', () => {
  it('diferença em alta', () => {
    expect(compararValores(37, 31, 'diferenca')).toEqual({ direcao: 'alta', texto: '↑ 6' })
  })
  it('percentual em queda, arredondado', () => {
    expect(compararValores(34.7, 36.15, 'percentual')).toEqual({ direcao: 'queda', texto: '↓ 4%' })
  })
  it('igual', () => {
    expect(compararValores(5, 5, 'diferenca')).toEqual({ direcao: 'igual', texto: '= 0' })
  })
  it('sem base (anterior zero) → null', () => {
    expect(compararValores(5, 0, 'diferenca')).toBeNull()
    expect(compararValores(0, 0, 'percentual')).toBeNull()
  })
})

describe('fracaoAnel', () => {
  it('parte do anterior', () => {
    const r = fracaoAnel(1284.5, 2071.3)
    expect(r.fracao).toBeCloseTo(0.62, 2)
    expect(r.percentual).toBe(62)
  })
  it('acima do anterior: anel cheio e percentual > 100', () => {
    expect(fracaoAnel(3000, 2000)).toEqual({ fracao: 1, percentual: 150 })
  })
  it('sem anterior: anel cheio e sem percentual', () => {
    expect(fracaoAnel(10, 0)).toEqual({ fracao: 1, percentual: null })
    expect(fracaoAnel(0, 0)).toEqual({ fracao: 1, percentual: null })
  })
  it('nunca NaN nem Infinity', () => {
    for (const [a, b] of [[0, 0], [5, 0], [0, 5], [-1, 0]]) {
      const { fracao, percentual } = fracaoAnel(a, b)
      expect(Number.isFinite(fracao)).toBe(true)
      expect(percentual === null || Number.isFinite(percentual)).toBe(true)
    }
  })
})
