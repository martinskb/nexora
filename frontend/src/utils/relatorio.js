// Apoio da tela de Relatório do dia.

/** Mesmo dia no calendário local? */
export const mesmoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/**
 * Aviso de lucro parcial: quais produtos foram vendidos sem custo. O custo de
 * cada venda fica gravado na hora, então cadastrar agora vale para as próximas.
 */
export function textoSemCusto(produtos) {
  const nomes = produtos.map((p) => p.nome)
  const lista =
    nomes.length > 3
      ? `${nomes.slice(0, 3).join(', ')} e mais ${nomes.length - 3}`
      : nomes.length > 1
        ? `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`
        : nomes[0]
  return `Sem custo: ${lista}. O custo cadastrado agora vale para as próximas vendas.`
}
