import { z } from 'zod';

const email = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .max(160, 'E-mail muito longo.')
  .pipe(z.email('E-mail inválido.'));

export const cadastroSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome da loja.' })
    .trim()
    .min(2, 'O nome da loja precisa ter pelo menos 2 letras.')
    .max(120, 'Nome muito longo (máximo 120 caracteres).'),
  email,
  // bcrypt considera no máximo 72 bytes da senha
  senha: z
    .string({ error: 'Crie uma senha.' })
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
    .max(72, 'Senha muito longa (máximo 72 caracteres).'),
});

export const loginSchema = z.object({
  email,
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(72, 'Senha inválida.'),
});
