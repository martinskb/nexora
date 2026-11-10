import { z } from 'zod';

const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max, `Texto muito longo (máximo ${max} caracteres).`)
    .optional()
    .transform((v) => (v ? v : null));

export const criarVendaSchema = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.number({ error: 'Produto inválido.' }).int().positive('Produto inválido.'),
        quantidade: z
          .number({ error: 'Informe a quantidade.' })
          .int('Use um número inteiro.')
          .min(1, 'A quantidade mínima é 1.')
          .max(100_000, 'Quantidade muito alta.'),
      }),
      { error: 'Adicione pelo menos um produto à venda.' },
    )
    .min(1, 'Adicione pelo menos um produto à venda.')
    .max(200, 'Muitos itens em uma única venda.'),
  // Origem opcional: id de um canal ativo da loja, ou null (venda sem canal).
  canalId: z
    .number({ error: 'Origem da venda inválida.' })
    .int('Origem da venda inválida.')
    .positive('Origem da venda inválida.')
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  observacao: textoOpcional(255),
});

export const cancelarVendaSchema = z.object({
  motivo: z
    .string({ error: 'Informe o motivo do cancelamento.' })
    .trim()
    .min(3, 'Informe o motivo do cancelamento (pelo menos 3 letras).')
    .max(255, 'Motivo muito longo (máximo 255 caracteres).'),
});

const dataIso = z.iso.datetime({ offset: true, error: 'Data inválida.' });

export const filtroVendasSchema = z.object({
  de: dataIso.optional(),
  ate: dataIso.optional(),
  canalId: z.union([z.literal('sem'), z.coerce.number().int().positive()]).optional(), // 'sem' = vendas sem canal
  status: z.enum(['concluida', 'cancelada']).optional(),
  limite: z.coerce.number().int().min(1).max(100).optional().default(50),
  antesDe: z.coerce.number().int().positive().optional(), // paginação: id da última venda já carregada
});
