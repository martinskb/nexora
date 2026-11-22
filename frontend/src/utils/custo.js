// Prévia do custo na entrada de mercadoria e margem do produto (mesma regra do backend).

const c = (v) => Math.round(Number(v) * 100)

export function previaCusto({ modo, valor, quantidade, saldoAtual, custoAtual }) {
  if (valor == null || valor === '' || !(quantidade > 0)) return null
  const porUnidade = modo === 'total' ? Math.round(c(valor) / quantidade) / 100 : c(valor) / 100
  const medio =
    custoAtual == null || saldoAtual <= 0
      ? porUnidade
      : Math.round((saldoAtual * c(custoAtual) + quantidade * c(porUnidade)) / (saldoAtual + quantidade)) / 100
  return { porUnidade, medio }
}

/** Margem sobre o preço de venda, em % inteiro. */
export function margem(preco, custo) {
  if (custo == null || !(preco > 0)) return null
  return Math.round(((c(preco) - c(custo)) / c(preco)) * 100)
}
