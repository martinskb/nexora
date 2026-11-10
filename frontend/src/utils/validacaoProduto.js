import { lerInteiro, lerValorMonetario } from './formato.js'

/**
 * Valida o formulário de produto (valores digitados, em texto) e devolve
 * { erros, dados } — dados já convertidos para enviar à API.
 */
export function validarProduto(valores, { novo }) {
  const erros = {}
  const nome = valores.nome.trim()
  if (!nome) erros.nome = 'Informe o nome do produto.'
  else if (nome.length > 120) erros.nome = 'Nome muito longo (máximo 120 caracteres).'

  const preco = lerValorMonetario(valores.preco)
  if (valores.preco.trim() === '') erros.preco = 'Informe o preço.'
  else if (preco === null) erros.preco = 'Preço inválido. Exemplo: 6,50'
  else if (preco > 9_999_999.99) erros.preco = 'Preço muito alto.'

  let quantidade
  if (novo) {
    quantidade = lerInteiro(valores.quantidade)
    if (valores.quantidade.trim() === '') erros.quantidade = 'Informe quantas unidades você tem agora.'
    else if (quantidade === null) erros.quantidade = 'Use um número inteiro, sem vírgula. Exemplo: 12'
    else if (quantidade > 1_000_000) erros.quantidade = 'Quantidade muito alta.'
  }

  let estoqueMinimo = 0
  if (valores.estoqueMinimo.trim() !== '') {
    estoqueMinimo = lerInteiro(valores.estoqueMinimo)
    if (estoqueMinimo === null) erros.estoqueMinimo = 'Use um número inteiro, sem vírgula.'
    else if (estoqueMinimo > 1_000_000) erros.estoqueMinimo = 'Valor muito alto.'
  }

  const dados = { nome, preco, estoqueMinimo }
  if (novo) dados.quantidade = quantidade
  return { erros, dados }
}
