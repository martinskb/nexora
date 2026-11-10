import { describe, it, expect } from 'vitest'
import { intervaloDoPeriodo, rotuloDoDia } from '../datas.js'

const agora = new Date(2026, 10, 10, 15, 30) // 10/11/2026 15:30 (horário local)

describe('intervaloDoPeriodo', () => {
  it('hoje: da meia-noite de hoje até a meia-noite de amanhã (horário local)', () => {
    const { de, ate } = intervaloDoPeriodo('hoje', agora)
    expect(new Date(de)).toEqual(new Date(2026, 10, 10))
    expect(new Date(ate)).toEqual(new Date(2026, 10, 11))
  })
  it('7 dias inclui hoje e os 6 dias anteriores', () => {
    expect(new Date(intervaloDoPeriodo('7d', agora).de)).toEqual(new Date(2026, 10, 4))
  })
  it('30 dias', () => {
    expect(new Date(intervaloDoPeriodo('30d', agora).de)).toEqual(new Date(2026, 9, 12))
  })
  it('tudo não limita datas', () => {
    expect(intervaloDoPeriodo('tudo', agora)).toEqual({})
  })
})

describe('rotuloDoDia', () => {
  it('Hoje, Ontem ou data por extenso', () => {
    expect(rotuloDoDia(new Date(2026, 10, 10, 8).toISOString(), agora)).toBe('Hoje')
    expect(rotuloDoDia(new Date(2026, 10, 9, 23).toISOString(), agora)).toBe('Ontem')
    expect(rotuloDoDia(new Date(2026, 10, 2, 12).toISOString(), agora)).toMatch(/^Segunda-feira, 2 de novembro$/)
  })
})
