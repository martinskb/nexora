// Regras de histórico do app, como num app nativo:
// - as abas são irmãs: trocar de aba não empilha (exceto saindo do Início);
// - assim, voltar em qualquer aba leva ao Início, e voltar no Início sai;
// - Vender e Minha loja são caminhos de ida e volta: empilham.

export const ABAS = ['/', '/produtos', '/estoque', '/vendas']

/** Compara só o caminho: /estoque?produto=3 ainda é a aba Estoque. */
export const ehAba = (caminho) => ABAS.includes(caminho.split('?')[0])

export function modoNavegacao(de, para) {
  if (!ehAba(para)) return 'empilhar'
  if (de === '/' && para !== '/') return 'empilhar'
  return 'substituir'
}

/** O que fazer ao tocar num item do menu. */
export function acaoAoIrPara(de, para, temInicioAtras) {
  if (para === '/' && de !== '/' && ehAba(de)) {
    return temInicioAtras ? { tipo: 'voltar' } : { tipo: 'navegar', replace: true }
  }
  return { tipo: 'navegar', replace: modoNavegacao(de, para) === 'substituir' }
}

export const precisaConfirmarSaidaVenda = (itensNoCarrinho) => itensNoCarrinho > 0
