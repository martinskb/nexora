import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.details });
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Dados enviados em formato inválido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Dados enviados são grandes demais.' });
  }

  if (!env.isTest) console.error(err);
  return res.status(500).json({ erro: 'Erro interno. Tente novamente em instantes.' });
}
