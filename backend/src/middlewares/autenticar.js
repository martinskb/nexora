import { env } from '../config/env.js';
import { lerToken } from '../services/authService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Exige uma sessão válida. Define req.lojaId, que TODAS as rotas de dados
 * devem usar para filtrar as consultas (isolamento entre lojas).
 */
export function autenticar(req, res, next) {
  const token = req.cookies?.[env.sessao.cookie];
  const lojaId = token ? lerToken(token) : null;
  if (!lojaId) {
    return next(new AppError('Sua sessão expirou. Entre novamente.', 401));
  }
  req.lojaId = lojaId;
  next();
}
