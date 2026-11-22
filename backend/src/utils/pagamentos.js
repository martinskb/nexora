import { AppError } from './AppError.js';

const centavos = (v) => Math.round(v * 100);

function recusar(mensagem) {
  throw new AppError(mensagem, 400, { pagamentos: mensagem });
}

/**
 * Confere a forma de pagamento informada para uma venda e devolve os valores
 * em centavos. O pagamento é opcional (lista vazia = não informado).
 * - 1 forma: o valor, se vier, tem de ser o total; sem valor, vale o total.
 * - 2 formas: formas diferentes, cada valor > 0 e a soma exatamente o total.
 */
export function normalizarPagamentos(pagamentos, totalCentavos) {
  if (!pagamentos || pagamentos.length === 0) return [];
  if (pagamentos.length > 2) recusar('Use no máximo duas formas de pagamento.');
  if (new Set(pagamentos.map((p) => p.forma)).size !== pagamentos.length) {
    recusar('As duas formas de pagamento precisam ser diferentes.');
  }

  if (pagamentos.length === 1) {
    const [p] = pagamentos;
    if (p.valor != null && centavos(p.valor) !== totalCentavos) {
      recusar('O valor pago precisa ser igual ao total da venda.');
    }
    return [{ forma: p.forma, valorCentavos: totalCentavos }];
  }

  const linhas = pagamentos.map((p) => ({ forma: p.forma, valorCentavos: p.valor == null ? null : centavos(p.valor) }));
  if (linhas.some((l) => l.valorCentavos === null || l.valorCentavos <= 0)) {
    recusar('Informe um valor maior que zero para cada forma de pagamento.');
  }
  if (linhas.reduce((s, l) => s + l.valorCentavos, 0) !== totalCentavos) {
    recusar('A soma dos pagamentos precisa ser igual ao total da venda.');
  }
  return linhas;
}
