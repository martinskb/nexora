import { describe, expect, it } from 'vitest'
import { mascararInteiro, mascararMoeda } from '../mascaras.js'
import { lerValorMonetario } from '../formato.js'

describe('mascararInteiro', () => {
  it('só deixa dígitos', () => expect(mascararInteiro('1a2,3 -4')).toBe('1234'))
  it('tira zeros à esquerda, mas mantém um zero sozinho', () => {
    expect(mascararInteiro('007')).toBe('7')
    expect(mascararInteiro('0')).toBe('0')
  })
  it('vazio continua vazio', () => expect(mascararInteiro('abc')).toBe(''))
  it('limita o tamanho', () => expect(mascararInteiro('12345678', 6)).toBe('123456'))
})

describe('mascararMoeda (a vírgula entra sozinha)', () => {
  it('os dígitos preenchem da direita para a esquerda', () => {
    expect(mascararMoeda('1')).toBe('0,01')
    expect(mascararMoeda('12')).toBe('0,12')
    expect(mascararMoeda('123')).toBe('1,23')
    expect(mascararMoeda('123456')).toBe('1.234,56')
  })
  it('ignora letras e pontuação digitadas', () => expect(mascararMoeda('R$ 4a,9x9')).toBe('4,99'))
  it('apagar tudo deixa vazio', () => expect(mascararMoeda('0,0')).toBe(''))
  it('continua editando um valor já formatado', () => expect(mascararMoeda('12,345')).toBe('123,45'))
  it('o resultado é lido certo pelo leitor de valores', () => expect(lerValorMonetario(mascararMoeda('123456'))).toBe(1234.56))
})
