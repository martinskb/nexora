import { z } from 'zod';

export const filtroRelatorioSchema = z.object({
  dia: z
    .string({ error: 'Informe o dia.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dia inválido (use AAAA-MM-DD).')
    .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), 'Dia inválido.'),
  // Diferença do fuso do comerciante para UTC, em minutos (Brasil: -180).
  fuso: z.coerce.number().int().min(-720).max(840).optional().default(0),
});
