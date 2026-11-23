import { describe, expect, it } from 'vitest'
import { textoRelatorio, textoReposicao } from '../compartilhar.js'

describe('textoReposicao', () => {
  it('lista do que repor com mínimo', () => {
    const texto = textoReposicao('Mercadinho da Esquina', new Date(2026, 10, 22), [
      { nome: 'Ovos (dúzia)', quantidade: 0, estoqueMinimo: 6 },
      { nome: 'Leite em Pó 400g', quantidade: 2, estoqueMinimo: 4 },
    ])
    expect(texto).toBe('Repor — Mercadinho da Esquina (22/11)\n• Ovos (dúzia): zerado (mínimo 6)\n• Leite em Pó 400g: 2 un (mínimo 4)')
  })
})

describe('textoRelatorio', () => {
  const base = {
    dia: '2026-11-22',
    vendido: 1284.5,
    vendas: 37,
    porForma: { dinheiro: 520, pix: 610.5, cartao: 154, naoInformado: 0 },
    lucro: { valor: 410.2, margem: 32, parcial: false },
  }
  it('resumo do dia', () => {
    expect(textoRelatorio('Mercadinho da Esquina', base)).toBe(
      'Relatório de 22/11 — Mercadinho da Esquina\nVendido: R$ 1.284,50 (37 vendas)\nDinheiro R$ 520,00 · Pix R$ 610,50 · Cartão R$ 154,00\nLucro: R$ 410,20 (32%)',
    )
  })
  it('lucro parcial e não informado', () => {
    const t = textoRelatorio('Loja', { ...base, vendas: 1, porForma: { ...base.porForma, naoInformado: 5 }, lucro: { valor: 3, margem: 10, parcial: true } })
    expect(t).toContain('(1 venda)')
    expect(t).toContain('Não informado R$ 5,00')
    expect(t).toContain('Lucro: R$ 3,00 (10%) (parcial)')
  })
})

describe('textoRelatorio sem nenhum custo', () => {
  it('não mostra "Lucro: R$ 0,00" quando nada vendido tem custo', () => {
    const r = {
      dia: '2026-11-22',
      vendido: 10,
      vendas: 1,
      porForma: { dinheiro: 0, pix: 10, cartao: 0, naoInformado: 0 },
      lucro: { valor: 0, receitaComCusto: 0, margem: null, parcial: true },
    }
    expect(textoRelatorio('Loja', r)).toContain('Lucro: sem custo cadastrado')
    expect(textoRelatorio('Loja', r)).not.toContain('R$ 0,00')
  })
})
