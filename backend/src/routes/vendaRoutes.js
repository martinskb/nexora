import { Router } from 'express';
import * as vendas from '../controllers/vendaController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validarCorpo } from '../middlewares/validar.js';
import { produtosVendidos } from '../services/vendaService.js';
import { AppError } from '../utils/AppError.js';
import { cancelarVendaSchema, criarVendaSchema, filtroProdutosVendidosSchema } from '../validators/vendaSchemas.js';

export const vendaRoutes = Router();

vendaRoutes.use(autenticar);

vendaRoutes.get('/', vendas.listar);
vendaRoutes.post('/', validarCorpo(criarVendaSchema), vendas.registrar);
// Antes de '/:id', senão "produtos" seria lido como id.
vendaRoutes.get('/produtos', async (req, res) => {
  const filtro = filtroProdutosVendidosSchema.safeParse(req.query);
  if (!filtro.success) throw new AppError(filtro.error.issues[0]?.message || 'Período inválido.', 400);
  res.json({ produtos: await produtosVendidos(req.lojaId, filtro.data) });
});
vendaRoutes.get('/:id', vendas.buscar);
vendaRoutes.post('/:id/cancelar', validarCorpo(cancelarVendaSchema), vendas.cancelar);
