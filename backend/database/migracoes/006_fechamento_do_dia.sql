-- Fechamento do dia: custo dos produtos (custo médio), custo copiado em cada
-- item vendido, custo informado nas entradas e forma de pagamento das vendas.
-- Compatível com MariaDB e MySQL 8 (Aiven): só ADD COLUMN e CREATE TABLE.

ALTER TABLE produtos
  ADD COLUMN custo DECIMAL(10,2) NULL AFTER preco,
  ADD CONSTRAINT chk_produtos_custo CHECK (custo IS NULL OR custo >= 0);

ALTER TABLE itens_venda
  ADD COLUMN custo_unitario DECIMAL(10,2) NULL AFTER preco_unitario;

ALTER TABLE movimentacoes_estoque
  ADD COLUMN custo_unitario DECIMAL(10,2) NULL AFTER motivo;

CREATE TABLE IF NOT EXISTS pagamentos_venda (
  id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venda_id  INT UNSIGNED  NOT NULL,
  forma     ENUM('dinheiro','pix','cartao') NOT NULL,
  valor     DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_pagamentos_venda (venda_id),
  CONSTRAINT fk_pagamentos_venda FOREIGN KEY (venda_id) REFERENCES vendas (id) ON DELETE CASCADE,
  CONSTRAINT chk_pagamentos_valor CHECK (valor > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
