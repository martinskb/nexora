import { z } from 'zod';

// Ajuste: o comerciante informa quantas unidades TEM AGORA (contagem real);
// o sistema calcula a diferença e registra no histórico.
export const ajusteSchema = z.object({
  quantidade: z
    .number({ error: 'Informe quantas unidades você tem agora.' })
    .int('Use um número inteiro, sem vírgula.')
    .min(0, 'A quantidade não pode ser negativa.')
    .max(1_000_000, 'Quantidade muito alta.'),
  motivo: z
    .string({ error: 'Informe o motivo do ajuste.' })
    .trim()
    .min(3, 'Descreva o motivo do ajuste (pelo menos 3 letras).')
    .max(255, 'Motivo muito longo (máximo 255 caracteres).'),
});
