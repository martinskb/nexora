import { describe, it, expect } from 'vitest'
import { dataDoDia, marcasEixo, rotuloEixo } from '../grafico.js'

describe('marcasEixo', () => {
  it('gera marcas redondas que cobrem o máximo', () => {
    expect(marcasEixo(37)).toEqual([0, 10, 20, 30, 40])
    expect(marcasEixo(100)).toEqual([0, 50, 100])
    expect(marcasEixo(1234)).toEqual([0, 500, 1000, 1500])
    expect(marcasEixo(3.5)).toEqual([0, 1, 2, 3, 4])
  })
  it('sem valores, ainda desenha um eixo', () => {
    expect(marcasEixo(0)).toEqual([0, 1])
  })
})

describe('rotuloEixo', () => {
  it('completo abaixo de 10 mil e compacto acima', () => {
    expect(rotuloEixo(1500, 2000)).toBe('1.500')
    expect(rotuloEixo(20000, 40000)).toMatch(/^20\s?mil$/)
  })
})

describe('dataDoDia', () => {
  it('lê o dia sem deslocar o fuso', () => {
    const d = dataDoDia('2026-11-01')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 1])
  })
})
