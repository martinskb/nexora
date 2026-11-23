import { afterEach, describe, expect, it, vi } from 'vitest'
import { definirGuardaSaida, tentarSair } from '../guardaSaida.js'

afterEach(() => definirGuardaSaida(null))

describe('tentarSair (I2: sair de Vender por qualquer caminho pede confirmação)', () => {
  it('sem guarda, segue direto', () => {
    const continuar = vi.fn()
    expect(tentarSair(continuar)).toBe(true)
    expect(continuar).toHaveBeenCalledOnce()
  })
  it('guarda sem itens, segue direto', () => {
    const pedir = vi.fn()
    definirGuardaSaida({ temItens: () => false, pedir })
    const continuar = vi.fn()
    tentarSair(continuar)
    expect(continuar).toHaveBeenCalledOnce()
    expect(pedir).not.toHaveBeenCalled()
  })
  it('guarda com itens: não segue e pede confirmação com a continuação', () => {
    const pedir = vi.fn()
    definirGuardaSaida({ temItens: () => true, pedir })
    const continuar = vi.fn()
    expect(tentarSair(continuar)).toBe(false)
    expect(continuar).not.toHaveBeenCalled()
    expect(pedir).toHaveBeenCalledWith(continuar)
  })
})
