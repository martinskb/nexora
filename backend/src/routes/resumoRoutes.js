import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { gerar } from '../services/resumoService.js';
import { AppError } from '../utils/AppError.js';
import { filtroResumoSchema } from '../validators/resumoSchemas.js';

export const resumoRoutes = Router();

resumoRoutes.use(autenticar);

// GET /api/resumo?de=ISO&ate=ISO&fuso=-180
resumoRoutes.get('/', async (req, res) => {
  const filtro = filtroResumoSchema.safeParse(req.query);
  if (!filtro.success) {
    throw new AppError(filtro.error.issues[0]?.message || 'Período inválido.', 400);
  }
  res.json(await gerar(req.lojaId, filtro.data));
});
