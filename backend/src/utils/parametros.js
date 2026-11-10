import { AppError } from './AppError.js';

/** Converte um parâmetro de rota em id inteiro positivo; senão, 404. */
export function idDaRota(valor, mensagem = 'Registro não encontrado.') {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(mensagem, 404);
  return id;
}
