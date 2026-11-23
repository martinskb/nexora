-- A origem fixa (enum balcao/whatsapp) foi substituída por vendas.canal_id (migração 004).
ALTER TABLE vendas DROP COLUMN canal;
