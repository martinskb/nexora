import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Confere o contraste WCAG dos tokens de cor do index.css nos dois temas.
const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8')

function tokensDoBloco(texto) {
  const mapa = {}
  for (const [, nome, hex] of texto.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) mapa[nome] = hex
  return mapa
}

const inicioEscuro = css.indexOf('@media (prefers-color-scheme: dark)')
const claro = tokensDoBloco(css.slice(css.indexOf(':root'), inicioEscuro))
const escuro = { ...claro, ...tokensDoBloco(css.slice(inicioEscuro, css.indexOf('}', css.indexOf(':root', inicioEscuro)))) }

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const temas = { claro, escuro }

describe.each(Object.keys(temas))('tema %s', (nome) => {
  const t = temas[nome]

  it('texto e texto suave passam 4.5:1 sobre fundo e superfície', () => {
    for (const texto of ['--cor-texto', '--cor-texto-suave'])
      for (const fundo of ['--cor-fundo', '--cor-superficie']) {
        expect(t[texto], texto).toBeDefined()
        expect(contraste(t[texto], t[fundo]), `${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(4.5)
      }
  })

  it('marca, dinheiro, alerta e crítico passam 4.5:1 como texto sobre a superfície', () => {
    for (const cor of ['--cor-marca-texto', '--cor-dinheiro', '--cor-alerta', '--cor-critico']) {
      expect(t[cor], cor).toBeDefined()
      expect(contraste(t[cor], t['--cor-superficie']), cor).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('texto sobre a cor da marca passa 4.5:1 (botões)', () => {
    expect(contraste(t['--cor-sobre-marca'], t['--cor-marca'])).toBeGreaterThanOrEqual(4.5)
  })
})
