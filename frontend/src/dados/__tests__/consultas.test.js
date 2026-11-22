import { describe, expect, it } from 'vitest'
import { chavePersistencia, chaves, deveRepetir, invalidacoesApos } from '../consultas.js'

describe('invalidacoesApos', () => {
  it('venda atualiza resumo, vendas e produtos', () => {
    const r = invalidacoesApos('venda')
    expect(r).toContainEqual(['resumo'])
    expect(r).toContainEqual(['vendas'])
    expect(r).toContainEqual(['produtos'])
  })
  it('cancelamento faz o mesmo que venda', () => {
    expect(invalidacoesApos('cancelamento')).toEqual(invalidacoesApos('venda'))
  })
  it('ajuste inclui o histórico do produto', () => {
    expect(invalidacoesApos('ajuste', { produtoId: 7 })).toContainEqual(['historico', 7])
  })
  it('canal atualiza canais, vendas e resumo', () => {
    expect(invalidacoesApos('canal')).toEqual(expect.arrayContaining([['canais'], ['vendas'], ['resumo']]))
  })
})

describe('deveRepetir', () => {
  it('repete uma vez erro de rede ou 5xx', () => {
    expect(deveRepetir(0, { status: 0 })).toBe(true)
    expect(deveRepetir(0, { status: 503 })).toBe(true)
  })
  it('não repete 4xx', () => expect(deveRepetir(0, { status: 400 })).toBe(false))
  it('não repete mais de uma vez', () => expect(deveRepetir(1, { status: 503 })).toBe(false))
})

describe('chaves e persistência', () => {
  it('chave de persistência por loja', () => {
    expect(chavePersistencia(3)).toBe('nexora-cache:v1:3')
    expect(chavePersistencia(1)).not.toBe(chavePersistencia(2))
  })
  it('chaves de consulta começam pelo prefixo invalidado', () => {
    expect(chaves.resumo('a', 'b')[0]).toBe('resumo')
    expect(chaves.vendas({ periodo: 'hoje' })[0]).toBe('vendas')
    expect(chaves.historico(7)).toEqual(['historico', 7])
  })
})
