import { describe, expect, it } from 'vitest';
import { custoMedio, custoPorUnidade } from '../src/utils/custo.js';

describe('custoPorUnidade', () => {
  it('total da entrada dividido pela quantidade', () => {
    expect(custoPorUnidade({ custoTotal: 54, quantidade: 12 })).toBe(4.5);
  });
  it('custo por unidade informado direto', () => {
    expect(custoPorUnidade({ custoUnitario: 4.5, quantidade: 12 })).toBe(4.5);
  });
  it('arredonda a centavos', () => {
    expect(custoPorUnidade({ custoTotal: 10, quantidade: 3 })).toBe(3.33);
  });
  it('sem custo informado → null', () => {
    expect(custoPorUnidade({ quantidade: 5 })).toBeNull();
  });
});

describe('custoMedio', () => {
  it('média ponderada entre o saldo e a entrada', () => {
    expect(custoMedio({ saldoAntes: 6, custoAtual: 4.5, quantidade: 12, custoEntrada: 5 })).toBe(4.83);
  });
  it('saldo zero: vale o custo da entrada (sem dividir por zero)', () => {
    expect(custoMedio({ saldoAntes: 0, custoAtual: 4.5, quantidade: 10, custoEntrada: 6 })).toBe(6);
  });
  it('sem custo anterior: vale o custo da entrada', () => {
    expect(custoMedio({ saldoAntes: 8, custoAtual: null, quantidade: 2, custoEntrada: 3 })).toBe(3);
  });
  it('entrada sem custo mantém o custo atual', () => {
    expect(custoMedio({ saldoAntes: 8, custoAtual: 4, quantidade: 2, custoEntrada: null })).toBe(4);
  });
});
