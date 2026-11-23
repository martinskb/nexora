import { Router } from 'express';
import * as canais from '../controllers/canalController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validarCorpo } from '../middlewares/validar.js';
import { atualizarCanalSchema, criarCanalSchema } from '../validators/canalSchemas.js';

export const canalRoutes = Router();

canalRoutes.use(autenticar);

canalRoutes.get('/', canais.listar);
canalRoutes.post('/', validarCorpo(criarCanalSchema), canais.criar);
canalRoutes.put('/:id', validarCorpo(atualizarCanalSchema), canais.atualizar);
canalRoutes.delete('/:id', canais.remover);
