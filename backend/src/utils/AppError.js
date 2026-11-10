/**
 * Erro "esperado", com mensagem pensada para ser mostrada ao usuário.
 * Erros que não são AppError viram resposta 500 genérica (sem detalhes internos).
 */
export class AppError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}
