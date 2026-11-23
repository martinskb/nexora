// Textos para compartilhar (lista de reposição, relatório do dia) e o envio
// pelo compartilhar do aparelho — sem integração com WhatsApp.

const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const reais = (v) => `R$ ${numero.format(v ?? 0)}`
const diaMes = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

export function textoReposicao(loja, data, produtos) {
  const linhas = produtos.map((p) => {
    const saldo = p.quantidade <= 0 ? 'zerado' : `${p.quantidade} un`
    const minimo = p.estoqueMinimo > 0 ? ` (mínimo ${p.estoqueMinimo})` : ''
    return `• ${p.nome}: ${saldo}${minimo}`
  })
  return [`Repor — ${loja} (${diaMes(data)})`, ...linhas].join('\n')
}

export function textoRelatorio(loja, r) {
  const [ano, mes, dia] = r.dia.split('-').map(Number)
  const formas = [
    ['Dinheiro', r.porForma.dinheiro],
    ['Pix', r.porForma.pix],
    ['Cartão', r.porForma.cartao],
    ['Não informado', r.porForma.naoInformado],
  ]
    .filter(([, v]) => v > 0)
    .map(([nome, v]) => `${nome} ${reais(v)}`)
  const linhas = [
    `Relatório de ${diaMes(new Date(ano, mes - 1, dia))} — ${loja}`,
    `Vendido: ${reais(r.vendido)} (${r.vendas} ${r.vendas === 1 ? 'venda' : 'vendas'})`,
  ]
  if (formas.length) linhas.push(formas.join(' · '))
  if (r.lucro.parcial && r.lucro.receitaComCusto === 0) {
    linhas.push('Lucro: sem custo cadastrado')
  } else {
    const margem = r.lucro.margem != null ? ` (${r.lucro.margem}%)` : ''
    linhas.push(`Lucro: ${reais(r.lucro.valor)}${margem}${r.lucro.parcial ? ' (parcial)' : ''}`)
  }
  return linhas.join('\n')
}

/** Usa o compartilhar do aparelho; sem ele, copia o texto. */
export async function compartilharTexto(texto) {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto })
      return 'compartilhado'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
    }
  }
  await navigator.clipboard.writeText(texto)
  return 'copiado'
}
