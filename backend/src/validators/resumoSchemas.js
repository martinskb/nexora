import { z } from 'zod';

const dataIso = z.iso.datetime({ offset: true, error: 'Data inválida.' });
const UM_DIA = 86_400_000;

export const filtroResumoSchema = z
  .object({
    de: dataIso,
    ate: dataIso,
    // Diferença do fuso do comerciante para UTC, em minutos (Belém: -180).
    // Usada para agrupar as vendas pelo dia local.
    fuso: z.coerce.number().int().min(-720).max(840).optional().default(0),
  })
  .refine((f) => new Date(f.ate) > new Date(f.de), { error: 'O fim do período deve ser depois do início.' })
  .refine((f) => new Date(f.ate) - new Date(f.de) <= 366 * UM_DIA, { error: 'Período muito longo (máximo 1 ano).' });
