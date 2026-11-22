import { describe, expect, it } from 'vitest'
import { partesMoeda } from '../moeda.js'

describe('partesMoeda', () => {
  it('separa símbolo, inteiro com milhar e centavos', () => {
    expect(partesMoeda(1284.5)).toEqual({ simbolo: 'R$', inteiro: '1.284', centavos: ',50' })
  })
  it('zero', () => {
    expect(partesMoeda(0)).toEqual({ simbolo: 'R$', inteiro: '0', centavos: ',00' })
  })
  it('centavos com zero à direita', () => {
    expect(partesMoeda(34.7).centavos).toBe(',70')
  })
  it('negativo mantém o sinal no inteiro', () => {
    expect(partesMoeda(-12.3)).toEqual({ simbolo: 'R$', inteiro: '-12', centavos: ',30' })
  })
})
