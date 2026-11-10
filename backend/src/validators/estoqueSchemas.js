import { z } from 'zod';

const motivo = z
  .string({ error: 'Informe o motivo do ajuste.' })
  .trim()
  .min(3, 'Descreva o motivo do ajuste (pelo menos 3 letras).')
  .max(255, 'Motivo muito longo (máximo 255 caracteres).');

/**
 * Dois modos de ajuste (F4):
 * - contagem: o comerciante informa quantas unidades TEM AGORA; o sistema calcula a diferença.
 * - entrada : chegou mercadoria; informa QUANTAS CHEGARAM e o sistema soma ao saldo.
 * Sem "modo", vale "contagem" (compatível com o ajuste rápido da venda).
 */
export const ajusteSchema = z.discriminatedUnion(
  'modo',
  [
    z.object({
      modo: z.literal('contagem'),
      quantidade: z
        .number({ error: 'Informe quantas unidades você tem agora.' })
        .int('Use um número inteiro, sem vírgula.')
        .min(0, 'A quantidade não pode ser negativa.')
        .max(1_000_000, 'Quantidade muito alta.'),
      motivo,
    }),
    z.object({
      modo: z.literal('entrada'),
      quantidade: z
        .number({ error: 'Informe quantas unidades chegaram.' })
        .int('Use um número inteiro, sem vírgula.')
        .min(1, 'Informe pelo menos 1 unidade.')
        .max(1_000_000, 'Quantidade muito alta.'),
      motivo: motivo.optional().default('Chegou mercadoria'),
    }),
  ],
  { error: 'Tipo de ajuste inválido.' },
);

// Aceita requisições sem "modo" como contagem.
export const ajusteComPadrao = z.preprocess(
  (corpo) => (corpo && typeof corpo === 'object' && !('modo' in corpo) ? { ...corpo, modo: 'contagem' } : corpo),
  ajusteSchema,
);

export const filtroMovimentacoesSchema = z.object({
  limite: z.coerce.number().int().min(1).max(100).optional().default(30),
  antesDe: z.coerce.number().int().positive().optional(),
});
