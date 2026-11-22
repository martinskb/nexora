import { describe, expect, it } from 'vitest'
import { alternarForma, montarPagamentos, restoDaSegunda, troco } from '../pagamento.js'

describe('troco', () => {
  it('recebido maior que o total', () => expect(troco(48.88, 50)).toEqual({ troco: 1.12 }))
  it('exato: troco zero', () => expect(troco(10, 10)).toEqual({ troco: 0 }))
  it('recebido menor: quanto falta', () => expect(troco(10, 7.5)).toEqual({ faltam: 2.5 }))
  it('sem valor recebido', () => expect(troco(10, null)).toBeNull())
})

describe('restoDaSegunda', () => {
  it('total menos a primeira, em centavos', () => expect(restoDaSegunda(0.3, 0.1)).toBe(0.2))
  it('48,88 com 20 no Pix', () => expect(restoDaSegunda(48.88, 20)).toBe(28.88))
  it('primeira ≥ total não serve', () => {
    expect(restoDaSegunda(10, 10)).toBeNull()
    expect(restoDaSegunda(10, 12)).toBeNull()
  })
  it('sem valor na primeira', () => expect(restoDaSegunda(10, null)).toBeNull())
})

describe('alternarForma', () => {
  it('marca até duas', () => expect(alternarForma(['pix'], 'cartao')).toEqual(['pix', 'cartao']))
  it('tocar de novo desmarca', () => expect(alternarForma(['pix', 'cartao'], 'pix')).toEqual(['cartao']))
  it('a terceira substitui a mais antiga', () => expect(alternarForma(['pix', 'cartao'], 'dinheiro')).toEqual(['cartao', 'dinheiro']))
})

describe('montarPagamentos', () => {
  it('nenhuma forma: não envia', () => expect(montarPagamentos([], 10, null)).toEqual([]))
  it('uma forma: sem valor (vale o total)', () => expect(montarPagamentos(['pix'], 10, null)).toEqual([{ forma: 'pix' }]))
  it('duas formas: os dois valores', () =>
    expect(montarPagamentos(['pix', 'cartao'], 48.88, 20)).toEqual([
      { forma: 'pix', valor: 20 },
      { forma: 'cartao', valor: 28.88 },
    ]))
  it('duas formas sem valor válido: null (não dá para confirmar)', () => expect(montarPagamentos(['pix', 'cartao'], 10, 10)).toBeNull())
})
