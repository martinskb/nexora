import { describe, it, expect } from 'vitest'
import { formatarMoeda, lerInteiro, lerValorMonetario, normalizarTexto } from '../formato.js'
import { situacaoEstoque } from '../estoque.js'
import { validarProduto } from '../validacaoProduto.js'

describe('lerValorMonetario', () => {
  it.each([
    ['6,50', 6.5],
    ['6,5', 6.5],
    ['6.50', 6.5],
    ['10', 10],
    ['R$ 10,00', 10],
    ['1.234,56', 1234.56],
    ['1.234', 1234],
    ['0', 0],
  ])('"%s" → %s', (texto, esperado) => {
    expect(lerValorMonetario(texto)).toBe(esperado)
  })

  it.each(['', 'abc', '-5', '6,555', '1,2,3', '6.5.0'])('"%s" é inválido', (texto) => {
    expect(lerValorMonetario(texto)).toBeNull()
  })
})

describe('lerInteiro', () => {
  it('aceita apenas inteiros não negativos', () => {
    expect(lerInteiro('12')).toBe(12)
    expect(lerInteiro(' 3 ')).toBe(3)
    expect(lerInteiro('1,5')).toBeNull()
    expect(lerInteiro('-1')).toBeNull()
    expect(lerInteiro('')).toBeNull()
  })
})

describe('formatação e busca', () => {
  it('formata em reais', () => {
    expect(formatarMoeda(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })
  it('busca ignora acentos e maiúsculas', () => {
    expect(normalizarTexto('  AÇÚCAR Cristal')).toBe('acucar cristal')
  })
})

describe('situacaoEstoque', () => {
  it('classifica zerado, acabando e ok', () => {
    expect(situacaoEstoque({ quantidade: 0, estoqueMinimo: 0 })).toBe('zerado')
    expect(situacaoEstoque({ quantidade: 3, estoqueMinimo: 3 })).toBe('baixo')
    expect(situacaoEstoque({ quantidade: 4, estoqueMinimo: 3 })).toBe('ok')
    expect(situacaoEstoque({ quantidade: 1, estoqueMinimo: 0 })).toBe('ok')
  })
})

describe('validarProduto', () => {
  const base = { nome: 'Arroz', preco: '6,50', quantidade: '10', estoqueMinimo: '' }

  it('converte os valores digitados para enviar à API', () => {
    const { erros, dados } = validarProduto(base, { novo: true })
    expect(erros).toEqual({})
    expect(dados).toEqual({ nome: 'Arroz', preco: 6.5, quantidade: 10, estoqueMinimo: 0 })
  })

  it('na edição não envia quantidade', () => {
    const { dados } = validarProduto({ ...base, quantidade: '' }, { novo: false })
    expect(dados).not.toHaveProperty('quantidade')
  })

  it('aponta erros por campo', () => {
    const { erros } = validarProduto({ nome: ' ', preco: 'x', quantidade: '1,5', estoqueMinimo: 'a' }, { novo: true })
    expect(Object.keys(erros).sort()).toEqual(['estoqueMinimo', 'nome', 'preco', 'quantidade'])
  })
})
