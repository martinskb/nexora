import * as vendaService from '../services/vendaService.js';
import { AppError } from '../utils/AppError.js';
import { idDaRota } from '../utils/parametros.js';
import { filtroVendasSchema } from '../validators/vendaSchemas.js';

const MSG_404 = 'Venda não encontrada.';

export async function registrar(req, res) {
  const venda = await vendaService.registrar(req.lojaId, req.body);
  res.status(201).json({ venda });
}

export async function listar(req, res) {
  const filtro = filtroVendasSchema.safeParse(req.query);
  if (!filtro.success) throw new AppError('Filtro de vendas inválido.', 400);
  res.json(await vendaService.listar(req.lojaId, filtro.data));
}

export async function buscar(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ venda: await vendaService.buscar(req.lojaId, id) });
}

export async function cancelar(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ venda: await vendaService.cancelar(req.lojaId, id, req.body) });
}
