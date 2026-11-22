// Custo dos produtos (fechamento do dia). Valores em reais, arredondados a
// centavos; os cálculos internos são feitos em centavos.

const centavos = (v) => Math.round(v * 100);

/** Custo por unidade de uma entrada: informado direto ou total ÷ quantidade. null = sem custo. */
export function custoPorUnidade({ custoUnitario, custoTotal, quantidade }) {
  if (custoUnitario != null) return centavos(custoUnitario) / 100;
  if (custoTotal != null && quantidade > 0) return Math.round(centavos(custoTotal) / quantidade) / 100;
  return null;
}

/**
 * Novo custo médio depois de uma entrada (média ponderada pelo saldo).
 * Sem custo anterior, ou sem saldo antes da entrada, vale o custo da entrada.
 * Entrada sem custo mantém o custo atual.
 */
export function custoMedio({ saldoAntes, custoAtual, quantidade, custoEntrada }) {
  if (custoEntrada == null) return custoAtual ?? null;
  if (custoAtual == null || saldoAntes <= 0) return custoEntrada;
  const total = saldoAntes * centavos(custoAtual) + quantidade * centavos(custoEntrada);
  return Math.round(total / (saldoAntes + quantidade)) / 100;
}
