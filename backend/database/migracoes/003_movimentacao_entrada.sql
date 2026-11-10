-- Tipo "entrada": reposição de mercadoria (soma ao estoque), separado de
-- "ajuste" (correção de contagem, perda, avaria).
ALTER TABLE movimentacoes_estoque
  MODIFY COLUMN tipo ENUM('cadastro','venda','cancelamento','ajuste','entrada') NOT NULL;
