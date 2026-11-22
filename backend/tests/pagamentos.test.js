import { describe, expect, it } from 'vitest';
import { normalizarPagamentos } from '../src/utils/pagamentos.js';

const falha = (fn) => {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('deveria ter falhado');
};

describe('normalizarPagamentos', () => {
  it('sem pagamentos: venda sem forma informada', () => {
    expect(normalizarPagamentos(undefined, 1000)).toEqual([]);
    expect(normalizarPagamentos([], 1000)).toEqual([]);
  });

  it('uma forma sem valor: vale o total', () => {
    expect(normalizarPagamentos([{ forma: 'pix' }], 1000)).toEqual([{ forma: 'pix', valorCentavos: 1000 }]);
  });

  it('uma forma com valor diferente do total é recusada', () => {
    const e = falha(() => normalizarPagamentos([{ forma: 'pix', valor: 9 }], 1000));
    expect(e.status).toBe(400);
    expect(e.details.pagamentos).toBeDefined();
  });

  it('duas formas somando o total em centavos (0,10 + 0,20 = 0,30)', () => {
    expect(
      normalizarPagamentos(
        [
          { forma: 'pix', valor: 0.1 },
          { forma: 'cartao', valor: 0.2 },
        ],
        30,
      ),
    ).toEqual([
      { forma: 'pix', valorCentavos: 10 },
      { forma: 'cartao', valorCentavos: 20 },
    ]);
  });

  it('duas formas com soma diferente do total é recusada', () => {
    expect(() =>
      normalizarPagamentos(
        [
          { forma: 'pix', valor: 5 },
          { forma: 'cartao', valor: 4 },
        ],
        1000,
      ),
    ).toThrow();
  });

  it('primeira forma com o total inteiro (segunda ficaria zero) é recusada', () => {
    expect(() =>
      normalizarPagamentos(
        [
          { forma: 'pix', valor: 10 },
          { forma: 'cartao', valor: 0 },
        ],
        1000,
      ),
    ).toThrow();
  });

  it('formas repetidas e mais de duas são recusadas', () => {
    expect(() => normalizarPagamentos([{ forma: 'pix', valor: 5 }, { forma: 'pix', valor: 5 }], 1000)).toThrow();
    expect(() =>
      normalizarPagamentos([{ forma: 'pix' }, { forma: 'cartao' }, { forma: 'dinheiro' }], 1000),
    ).toThrow();
  });
});
