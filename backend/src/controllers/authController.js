import { env } from '../config/env.js';
import * as authService from '../services/authService.js';
import { AppError } from '../utils/AppError.js';

const opcoesCookie = {
  httpOnly: true, // inacessível ao JavaScript da página (protege contra XSS)
  sameSite: 'strict', // não é enviado por outros sites (protege contra CSRF)
  secure: env.isProduction, // só via HTTPS em produção
  path: '/',
};

function iniciarSessao(res, lojaId) {
  res.cookie(env.sessao.cookie, authService.gerarToken(lojaId), {
    ...opcoesCookie,
    maxAge: env.sessao.dias * 24 * 60 * 60 * 1000,
  });
}

function encerrarSessao(res) {
  res.clearCookie(env.sessao.cookie, opcoesCookie);
}

export async function cadastro(req, res) {
  const loja = await authService.cadastrarLoja(req.body);
  iniciarSessao(res, loja.id);
  res.status(201).json({ loja });
}

export async function login(req, res) {
  const loja = await authService.autenticar(req.body);
  iniciarSessao(res, loja.id);
  res.json({ loja });
}

export function logout(req, res) {
  encerrarSessao(res);
  res.status(204).end();
}

export async function me(req, res) {
  const loja = await authService.buscarLoja(req.lojaId);
  if (!loja) {
    encerrarSessao(res);
    throw new AppError('Sua sessão expirou. Entre novamente.', 401);
  }
  res.json({ loja });
}
