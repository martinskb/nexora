// Forma de pagamento na hora de vender (fechamento do dia). Contas em centavos.

const c = (v) => Math.round(Number(v) * 100)

export const FORMAS = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'cartao', rotulo: 'Cartão' },
]
export const ROTULO_FORMA = { dinheiro: 'Dinheiro', pix: 'Pix', cartao: 'Cartão', nao_informado: 'Não informado' }

/** Troco do dinheiro recebido, ou quanto ainda falta. null sem valor recebido. */
export function troco(total, recebido) {
  if (recebido == null || recebido === '') return null
  const diferenca = c(recebido) - c(total)
  return diferenca >= 0 ? { troco: diferenca / 100 } : { faltam: -diferenca / 100 }
}

/** Quanto falta pagar na segunda forma. null se a primeira está vazia, zerada ou ≥ total. */
export function restoDaSegunda(total, valorPrimeira) {
  if (valorPrimeira == null || valorPrimeira === '' || c(valorPrimeira) <= 0) return null
  const resto = c(total) - c(valorPrimeira)
  return resto > 0 ? resto / 100 : null
}

/** Marca/desmarca uma forma; no máximo duas (a terceira substitui a mais antiga). */
export function alternarForma(selecionadas, forma) {
  if (selecionadas.includes(forma)) return selecionadas.filter((f) => f !== forma)
  return selecionadas.length < 2 ? [...selecionadas, forma] : [selecionadas[1], forma]
}

/** Pagamentos para enviar à API. null = valores inválidos (não dá para confirmar). */
export function montarPagamentos(formas, total, valorPrimeira) {
  if (formas.length === 0) return []
  if (formas.length === 1) return [{ forma: formas[0] }]
  const resto = restoDaSegunda(total, valorPrimeira)
  if (resto === null) return null
  return [
    { forma: formas[0], valor: c(valorPrimeira) / 100 },
    { forma: formas[1], valor: resto },
  ]
}
