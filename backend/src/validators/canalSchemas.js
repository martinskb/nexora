import { z } from 'zod';

const nome = z
  .string({ error: 'Informe o nome do canal.' })
  .trim()
  .min(1, 'Informe o nome do canal.')
  .max(40, 'Nome muito longo (máximo 40 caracteres).');

export const criarCanalSchema = z.object({ nome });

export const atualizarCanalSchema = z
  .object({
    nome: nome.optional(),
    ativo: z.boolean({ error: 'Valor inválido.' }).optional(),
  })
  .refine((d) => d.nome !== undefined || d.ativo !== undefined, { message: 'Nada para alterar.' });
