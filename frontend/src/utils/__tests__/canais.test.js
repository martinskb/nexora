import { describe, expect, it } from 'vitest'
import { corDoCanal, nomeDoCanal, SEM_CANAL, usarListaDeCanais } from '../canais.js'

describe('nomeDoCanal', () => {
  it('venda sem canal mostra "Sem canal"', () => {
    expect(SEM_CANAL).toBe('Sem canal')
    expect(nomeDoCanal(null)).toBe('Sem canal')
    expect(nomeDoCanal(undefined)).toBe('Sem canal')
  })

  it('usa o nome do canal', () => {
    expect(nomeDoCanal({ id: 1, nome: 'Grupo' })).toBe('Grupo')
  })
})

describe('corDoCanal', () => {
  const canais = [
    { id: 9, nome: 'Zap' },
    { id: 3, nome: 'Balcão' },
  ]

  it('sem canal usa o cinza neutro', () => {
    expect(corDoCanal(null, canais)).toBe('var(--cor-sem-canal)')
  })

  it('segue a ordem alfabética do nome, não o id', () => {
    expect(corDoCanal(3, canais)).toBe('var(--serie-1)')
    expect(corDoCanal(9, canais)).toBe('var(--serie-2)')
  })

  it('a ordem alfabética ignora acentos e maiúsculas', () => {
    const lista = [
      { id: 1, nome: 'encomenda' },
      { id: 2, nome: 'Ásia' },
    ]
    expect(corDoCanal(2, lista)).toBe('var(--serie-1)')
  })

  it('a partir do 7º canal as cores se repetem', () => {
    const lista = 'ABCDEFG'.split('').map((l, i) => ({ id: i + 1, nome: l }))
    expect(corDoCanal(6, lista)).toBe('var(--serie-6)')
    expect(corDoCanal(7, lista)).toBe('var(--serie-1)')
  })

  it('canal desconhecido (ex.: lista ainda carregando) usa a primeira cor', () => {
    expect(corDoCanal(42, [])).toBe('var(--serie-1)')
  })
})

describe('usarListaDeCanais', () => {
  const ops = (...rotulos) => rotulos.map((r, i) => ({ valor: String(i), rotulo: r }))

  it('poucos canais com nomes curtos: botões', () => {
    expect(usarListaDeCanais(ops('Nenhum', 'Zap', 'Feira'), 2)).toBe(false)
  })

  it('mais de 3 canais: lista suspensa', () => {
    expect(usarListaDeCanais(ops('Nenhum', 'A', 'B', 'C', 'D'), 4)).toBe(true)
  })

  it('nomes que não cabem lado a lado no celular: lista suspensa', () => {
    expect(usarListaDeCanais(ops('Nenhum', 'Encomenda', 'Instagram', 'WhatsApp'), 3)).toBe(true)
  })
})
