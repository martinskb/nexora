import { describe, expect, it } from 'vitest'
import { opcoesRelatorio } from '../../dados/hooks.js'
import { mesmoDia, textoSemCusto } from '../relatorio.js'
import { parametros } from '../url.js'

describe('parametros (#1: período "Tudo" não manda de=undefined)', () => {
  it('ignora valores vazios', () => {
    expect(parametros({ de: undefined, ate: undefined })).toBe('')
    expect(parametros({ de: 'a', ate: null, x: '' })).toBe('de=a')
  })
})

describe('opcoesRelatorio (#3: dia novo não mostra números do dia anterior)', () => {
  it('não reaproveita os dados de outro dia enquanto carrega', () => {
    expect(opcoesRelatorio('2026-11-22').placeholderData).toBeUndefined()
  })
})

describe('mesmoDia (#4: "Hoje" acompanha a virada do dia)', () => {
  it('compara o dia local', () => {
    expect(mesmoDia(new Date(2026, 10, 22, 23, 59), new Date(2026, 10, 22, 0, 1))).toBe(true)
    expect(mesmoDia(new Date(2026, 10, 22, 23, 59), new Date(2026, 10, 23, 0, 1))).toBe(false)
  })
})

describe('textoSemCusto (#5: diz quais produtos faltam e vale para as próximas vendas)', () => {
  it('lista os nomes', () => {
    expect(textoSemCusto([{ nome: 'Bolo' }, { nome: 'Café' }])).toBe(
      'Sem custo: Bolo e Café. O custo cadastrado agora vale para as próximas vendas.',
    )
  })
  it('resume listas longas', () => {
    const t = textoSemCusto(['A', 'B', 'C', 'D', 'E'].map((nome) => ({ nome })))
    expect(t).toContain('Sem custo: A, B, C e mais 2.')
  })
})
