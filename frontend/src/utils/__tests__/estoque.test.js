import { describe, expect, it } from 'vitest'
import { ordenarPorAtencao } from '../estoque.js'

const p = (nome, quantidade, estoqueMinimo = 5) => ({ nome, quantidade, estoqueMinimo })

describe('ordenarPorAtencao', () => {
  it('zerados, depois acabando, depois o resto; cada grupo por nome', () => {
    const lista = [p('Arroz', 20), p('Café', 3), p('Leite', 0), p('Açúcar', 2)]
    expect(ordenarPorAtencao(lista).map((x) => x.nome)).toEqual(['Leite', 'Açúcar', 'Café', 'Arroz'])
  })
  it('não altera a lista original', () => {
    const lista = [p('B', 9), p('A', 0)]
    ordenarPorAtencao(lista)
    expect(lista.map((x) => x.nome)).toEqual(['B', 'A'])
  })
})
