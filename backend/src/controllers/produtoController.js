import * as produtoService from '../services/produtoService.js';
import * as estoqueService from '../services/estoqueService.js';
import { AppError } from '../utils/AppError.js';
import { idDaRota } from '../utils/parametros.js';
import { filtroMovimentacoesSchema } from '../validators/estoqueSchemas.js';

const MSG_404 = 'Produto não encontrado.';

export async function listar(req, res) {
  res.json({ produtos: await produtoService.listar(req.lojaId) });
}

export async function buscar(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ produto: await produtoService.buscar(req.lojaId, id) });
}

export async function criar(req, res) {
  const produto = await produtoService.criar(req.lojaId, req.body);
  res.status(201).json({ produto });
}

export async function atualizar(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ produto: await produtoService.atualizar(req.lojaId, id, req.body) });
}

export async function ajustarEstoque(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ produto: await estoqueService.ajustar(req.lojaId, id, req.body) });
}

export async function historico(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  const filtro = filtroMovimentacoesSchema.safeParse(req.query);
  if (!filtro.success) throw new AppError('Filtro inválido.', 400);
  res.json(await estoqueService.historico(req.lojaId, id, filtro.data));
}

export async function remover(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  await produtoService.remover(req.lojaId, id);
  res.status(204).end();
}
