-- Canais de venda definidos por cada loja (ex.: "Instagram", "Encomenda").
-- A origem da venda é opcional: vendas.canal_id NULL = venda sem canal.
-- A coluna antiga vendas.canal (enum balcao/whatsapp) é removida na migração 005.
CREATE TABLE IF NOT EXISTS canais (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id    INT UNSIGNED NOT NULL,
  nome       VARCHAR(40)  NOT NULL,
  ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canais_loja_nome (loja_id, nome),
  CONSTRAINT fk_canais_loja FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Um canal com vendas não pode ser apagado (só arquivado): o serviço de canais
-- garante isso. SET NULL apenas para não travar a exclusão em cascata da loja.
ALTER TABLE vendas
  ADD COLUMN canal_id INT UNSIGNED NULL AFTER status,
  ADD KEY idx_vendas_loja_canal (loja_id, canal_id),
  ADD CONSTRAINT fk_vendas_canal FOREIGN KEY (canal_id) REFERENCES canais (id) ON DELETE SET NULL;

-- Dados existentes: "whatsapp" vira o canal "WhatsApp" da própria loja;
-- "balcao" fica sem canal.
INSERT INTO canais (loja_id, nome)
  SELECT DISTINCT loja_id, 'WhatsApp' FROM vendas WHERE canal = 'whatsapp';

UPDATE vendas v
  JOIN canais c ON c.loja_id = v.loja_id AND c.nome = 'WhatsApp'
  SET v.canal_id = c.id
  WHERE v.canal = 'whatsapp';
