import { describe, expect, it } from 'vitest'
import { acaoAoIrPara, ehAba, modoNavegacao, precisaConfirmarSaidaVenda } from '../navegacao.js'

describe('modoNavegacao', () => {
  it('do Início para outra aba empilha', () => expect(modoNavegacao('/', '/vendas')).toBe('empilhar'))
  it('entre abas que não são o Início substitui', () => expect(modoNavegacao('/vendas', '/estoque')).toBe('substituir'))
  it('mesma aba substitui', () => expect(modoNavegacao('/produtos', '/produtos')).toBe('substituir'))
  it('Vender empilha', () => expect(modoNavegacao('/estoque', '/vender')).toBe('empilhar'))
  it('Minha loja empilha', () => expect(modoNavegacao('/vendas', '/minha-loja')).toBe('empilhar'))
})

describe('acaoAoIrPara', () => {
  it('aba → Início com o Início atrás: voltar', () => {
    expect(acaoAoIrPara('/estoque', '/', true)).toEqual({ tipo: 'voltar' })
  })
  it('aba → Início sem o Início atrás: navegar substituindo', () => {
    expect(acaoAoIrPara('/estoque', '/', false)).toEqual({ tipo: 'navegar', replace: true })
  })
  it('Início → aba: navegar empilhando', () => {
    expect(acaoAoIrPara('/', '/produtos', false)).toEqual({ tipo: 'navegar', replace: false })
  })
  it('aba → aba: navegar substituindo', () => {
    expect(acaoAoIrPara('/produtos', '/vendas', true)).toEqual({ tipo: 'navegar', replace: true })
  })
})

describe('sequência de abas', () => {
  it('Início → Produtos → Estoque → Vendas deixa a pilha [Início, Vendas]', () => {
    const pilha = ['/']
    const ir = (para) => {
      const de = pilha.at(-1)
      const a = acaoAoIrPara(de, para, pilha.length > 1 && pilha.at(-2) === '/')
      if (a.tipo === 'voltar') pilha.pop()
      else if (a.replace) pilha[pilha.length - 1] = para
      else pilha.push(para)
    }
    for (const p of ['/produtos', '/estoque', '/vendas']) ir(p)
    expect(pilha).toEqual(['/', '/vendas'])
    ir('/')
    expect(pilha).toEqual(['/'])
  })
})

describe('precisaConfirmarSaidaVenda', () => {
  it('carrinho vazio sai direto', () => expect(precisaConfirmarSaidaVenda(0)).toBe(false))
  it('com itens pede confirmação', () => expect(precisaConfirmarSaidaVenda(2)).toBe(true))
})

describe('ehAba', () => {
  it('reconhece as quatro abas', () => {
    expect(['/', '/produtos', '/estoque', '/vendas'].every(ehAba)).toBe(true)
    expect(ehAba('/vender')).toBe(false)
    expect(ehAba('/minha-loja')).toBe(false)
  })
})
