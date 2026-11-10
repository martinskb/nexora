import { AppError } from '../utils/AppError.js';

/**
 * Valida req.body com um schema zod. Em caso de erro, responde 400 com
 * { erro, detalhes: { campo: mensagem } } para o frontend destacar cada campo.
 * Em caso de sucesso, substitui req.body pelos dados já limpos/convertidos.
 */
export function validarCorpo(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const detalhes = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path.join('.') || '_';
        if (!detalhes[campo]) detalhes[campo] = issue.message;
      }
      return next(new AppError('Verifique os campos destacados.', 400, detalhes));
    }
    req.body = resultado.data;
    next();
  };
}
