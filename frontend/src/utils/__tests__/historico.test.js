import { afterEach, describe, expect, it, vi } from 'vitest'
import { esperarVolta, estadoComGuarda, itemPedidoAberto } from '../historico.js'

describe('estadoComGuarda (C1: a guarda de Vender não herda a marca da folha)', () => {
  it('copia o estado do roteador, marca a guarda e tira a marca da folha', () => {
    const r = estadoComGuarda({ usr: { origem: '/estoque' }, key: 'k', idx: 3, folha: ':r1:' })
    expect(r).toEqual({ usr: { origem: '/estoque' }, key: 'k', idx: 3, guardaVenda: true })
    expect('folha' in r).toBe(false)
  })
  it('estado vazio', () => expect(estadoComGuarda(null)).toEqual({ guardaVenda: true }))
})

describe('itemPedidoAberto (I1: pedido por link/estado não reabre depois de fechado)', () => {
  it('aberto pela pessoa tem prioridade', () => expect(itemPedidoAberto(5, 9, false)).toBe(5))
  it('pedido pelo link abre', () => expect(itemPedidoAberto(null, 9, false)).toBe(9))
  it('pedido já dispensado não reabre', () => expect(itemPedidoAberto(null, 9, true)).toBe(null))
})

describe('esperarVolta', () => {
  afterEach(() => {
    delete globalThis.window
    vi.useRealTimers()
  })
  it('resolve no próximo popstate', async () => {
    globalThis.window = new EventTarget()
    let pronto = false
    const p = esperarVolta(1000).then(() => (pronto = true))
    await Promise.resolve()
    expect(pronto).toBe(false)
    window.dispatchEvent(new Event('popstate'))
    await p
    expect(pronto).toBe(true)
  })
  it('resolve pelo tempo máximo se o popstate não vier', async () => {
    vi.useFakeTimers()
    globalThis.window = new EventTarget()
    const p = esperarVolta(300)
    vi.advanceTimersByTime(300)
    await expect(p).resolves.toBeUndefined()
  })
})
