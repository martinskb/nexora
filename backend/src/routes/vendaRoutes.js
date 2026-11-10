import { Router } from 'express';
import * as vendas from '../controllers/vendaController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validarCorpo } from '../middlewares/validar.js';
import { cancelarVendaSchema, criarVendaSchema } from '../validators/vendaSchemas.js';

export const vendaRoutes = Router();

vendaRoutes.use(autenticar);

vendaRoutes.get('/', vendas.listar);
vendaRoutes.post('/', validarCorpo(criarVendaSchema), vendas.registrar);
vendaRoutes.get('/:id', vendas.buscar);
vendaRoutes.post('/:id/cancelar', validarCorpo(cancelarVendaSchema), vendas.cancelar);
