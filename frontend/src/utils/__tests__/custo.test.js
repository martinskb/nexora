import { describe, expect, it } from 'vitest'
import { margem, previaCusto } from '../custo.js'

describe('previaCusto', () => {
  it('total da entrada → por unidade e médio', () => {
    expect(previaCusto({ modo: 'total', valor: 54, quantidade: 12, saldoAtual: 6, custoAtual: 4.5 })).toEqual({ porUnidade: 4.5, medio: 4.5 })
  })
  it('por unidade com média ponderada', () => {
    expect(previaCusto({ modo: 'unidade', valor: 5, quantidade: 12, saldoAtual: 6, custoAtual: 4.5 })).toEqual({ porUnidade: 5, medio: 4.83 })
  })
  it('sem valor ou sem quantidade: sem prévia', () => {
    expect(previaCusto({ modo: 'unidade', valor: null, quantidade: 3, saldoAtual: 1, custoAtual: 1 })).toBeNull()
    expect(previaCusto({ modo: 'total', valor: 10, quantidade: 0, saldoAtual: 1, custoAtual: 1 })).toBeNull()
  })
})

describe('margem', () => {
  it('percentual sobre o preço', () => expect(margem(12, 8)).toBe(33))
  it('custo igual ao preço', () => expect(margem(5, 5)).toBe(0))
  it('sem custo ou preço zero', () => {
    expect(margem(5, null)).toBeNull()
    expect(margem(0, 1)).toBeNull()
  })
})
