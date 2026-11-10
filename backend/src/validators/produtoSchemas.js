import { z } from 'zod';

const nome = z
  .string({ error: 'Informe o nome do produto.' })
  .trim()
  .min(1, 'Informe o nome do produto.')
  .max(120, 'Nome muito longo (máximo 120 caracteres).');

// Valor em reais, arredondado para centavos.
const preco = z
  .number({ error: 'Informe o preço.' })
  .finite('Preço inválido.')
  .min(0, 'O preço não pode ser negativo.')
  .max(9_999_999.99, 'Preço muito alto.')
  .transform((v) => Math.round(v * 100) / 100);

const inteiroNaoNegativo = (rotulo) =>
  z
    .number({ error: `Informe ${rotulo}.` })
    .int(`Use um número inteiro para ${rotulo}.`)
    .min(0, `${rotulo[0].toUpperCase()}${rotulo.slice(1)} não pode ser negativo(a).`)
    .max(1_000_000, `Valor muito alto para ${rotulo}.`);

export const criarProdutoSchema = z.object({
  nome,
  preco,
  quantidade: inteiroNaoNegativo('a quantidade'),
  estoqueMinimo: inteiroNaoNegativo('o estoque mínimo').optional().default(0),
});

export const atualizarProdutoSchema = z.object({
  nome,
  preco,
  estoqueMinimo: inteiroNaoNegativo('o estoque mínimo').optional().default(0),
  // A quantidade só muda por venda ou por ajuste de estoque (com motivo registrado).
  quantidade: z
    .undefined({ error: 'A quantidade não pode ser editada aqui. Use o ajuste de estoque.' })
    .optional(),
});
