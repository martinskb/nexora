import { describe, expect, it } from 'vitest'
import { deveConvidar, plataformaDeInstalacao } from '../instalacao.js'

const base = { ehCelular: true, instalado: false, dispensado: false, jaConvidou: false, logado: true }

describe('deveConvidar', () => {
  it('celular, logado, sem app instalado e sem dispensa: convida', () => expect(deveConvidar(base)).toBe(true))
  it('no PC não convida sozinho', () => expect(deveConvidar({ ...base, ehCelular: false })).toBe(false))
  it('já instalado não convida', () => expect(deveConvidar({ ...base, instalado: true })).toBe(false))
  it('dispensado não convida de novo', () => expect(deveConvidar({ ...base, dispensado: true })).toBe(false))
  it('só uma vez por sessão', () => expect(deveConvidar({ ...base, jaConvidou: true })).toBe(false))
  it('só para quem entrou', () => expect(deveConvidar({ ...base, logado: false })).toBe(false))
})

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0'

describe('plataformaDeInstalacao', () => {
  it('iPhone no Safari: passo a passo', () => expect(plataformaDeInstalacao(IPHONE, false)).toBe('ios'))
  it('Android com convite nativo do navegador', () => expect(plataformaDeInstalacao(ANDROID, true)).toBe('nativo'))
  it('navegador sem suporte', () => expect(plataformaDeInstalacao(FIREFOX, false)).toBe('indisponivel'))
})
