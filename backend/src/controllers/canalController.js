import * as canalService from '../services/canalService.js';
import { idDaRota } from '../utils/parametros.js';

const MSG_404 = 'Canal não encontrado.';

export async function listar(req, res) {
  res.json({ canais: await canalService.listar(req.lojaId) });
}

export async function criar(req, res) {
  res.status(201).json({ canal: await canalService.criar(req.lojaId, req.body) });
}

export async function atualizar(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  res.json({ canal: await canalService.atualizar(req.lojaId, id, req.body) });
}

export async function remover(req, res) {
  const id = idDaRota(req.params.id, MSG_404);
  await canalService.remover(req.lojaId, id);
  res.status(204).end();
}
