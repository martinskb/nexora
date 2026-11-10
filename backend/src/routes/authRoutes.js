import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import * as auth from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validarCorpo } from '../middlewares/validar.js';
import { cadastroSchema, loginSchema } from '../validators/authSchemas.js';

export const authRoutes = Router();

// Limita tentativas para dificultar adivinhação de senha.
// Só contam as tentativas que FALHAM: quem entra certo não gasta o limite.
const limiteTentativas = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.limiteTentativasAuth,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
});

authRoutes.post('/cadastro', limiteTentativas, validarCorpo(cadastroSchema), auth.cadastro);
authRoutes.post('/login', limiteTentativas, validarCorpo(loginSchema), auth.login);
authRoutes.post('/logout', auth.logout);
authRoutes.get('/me', autenticar, auth.me);
