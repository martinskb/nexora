import { Router } from 'express';
import * as produtos from '../controllers/produtoController.js';
import { autenticar } from '../middlewares/autenticar.js';
import { validarCorpo } from '../middlewares/validar.js';
import { atualizarProdutoSchema, criarProdutoSchema } from '../validators/produtoSchemas.js';

export const produtoRoutes = Router();

produtoRoutes.use(autenticar);

produtoRoutes.get('/', produtos.listar);
produtoRoutes.post('/', validarCorpo(criarProdutoSchema), produtos.criar);
produtoRoutes.get('/:id', produtos.buscar);
produtoRoutes.put('/:id', validarCorpo(atualizarProdutoSchema), produtos.atualizar);
produtoRoutes.delete('/:id', produtos.remover);
