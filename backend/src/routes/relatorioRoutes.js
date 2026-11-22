import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { gerar } from '../services/relatorioService.js';
import { AppError } from '../utils/AppError.js';
import { filtroRelatorioSchema } from '../validators/relatorioSchemas.js';

export const relatorioRoutes = Router();

relatorioRoutes.use(autenticar);

// GET /api/relatorio?dia=AAAA-MM-DD&fuso=-180
relatorioRoutes.get('/', async (req, res) => {
  const filtro = filtroRelatorioSchema.safeParse(req.query);
  if (!filtro.success) throw new AppError(filtro.error.issues[0]?.message || 'Dia inválido.', 400);
  res.json(await gerar(req.lojaId, filtro.data));
});
