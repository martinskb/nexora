import { Router } from 'express';
import { pool } from '../config/db.js';
import { authRoutes } from './authRoutes.js';
import { produtoRoutes } from './produtoRoutes.js';
import { vendaRoutes } from './vendaRoutes.js';
import { resumoRoutes } from './resumoRoutes.js';
import { canalRoutes } from './canalRoutes.js';

export const routes = Router();

// Verifica se a API e o banco estão respondendo.
routes.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'ok' });
  } catch {
    res.status(503).json({ status: 'erro', banco: 'indisponível' });
  }
});

routes.use('/auth', authRoutes);
routes.use('/produtos', produtoRoutes);
routes.use('/vendas', vendaRoutes);
routes.use('/resumo', resumoRoutes);
routes.use('/canais', canalRoutes);
