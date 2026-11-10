-- NEXORA — schema do banco (MySQL 8+ / MariaDB 10.6+)
-- Modelo multi-loja: um único banco; toda tabela de dados tem loja_id,
-- e o backend filtra cada consulta pela loja autenticada.
--
-- ESTRUTURA BASE: não altere este arquivo. Mudanças no banco devem ser feitas
-- com novos arquivos em database/migracoes/ (aplicados por `npm run db:setup`).
-- Datas são gravadas em UTC (a conexão da API usa time_zone = '+00:00').

SET NAMES utf8mb4;

-- Uma conta (login) por loja.
CREATE TABLE IF NOT EXISTS lojas (
  id                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome                  VARCHAR(120)  NOT NULL,
  email                 VARCHAR(160)  NOT NULL,
  senha_hash            VARCHAR(255)  NOT NULL,
  onboarding_concluido  BOOLEAN       NOT NULL DEFAULT FALSE,
  criado_em             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lojas_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Produtos: poucos campos (nome, preço, quantidade em estoque).
-- estoque_minimo é opcional e serve para avisar quando o produto está acabando.
-- ativo = FALSE em vez de apagar, para preservar o histórico de vendas.
CREATE TABLE IF NOT EXISTS produtos (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  loja_id         INT UNSIGNED   NOT NULL,
  nome            VARCHAR(120)   NOT NULL,
  preco           DECIMAL(10,2)  NOT NULL,
  quantidade      INT            NOT NULL DEFAULT 0,
  estoque_minimo  INT UNSIGNED   NOT NULL DEFAULT 0,
  ativo           BOOLEAN        NOT NULL DEFAULT TRUE,
  criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_produtos_loja_nome (loja_id, nome),
  CONSTRAINT fk_produtos_loja FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE,
  CONSTRAINT chk_produtos_preco CHECK (preco >= 0),
  CONSTRAINT chk_produtos_quantidade CHECK (quantidade >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendas (cabeçalho). Cancelar uma venda devolve as quantidades ao estoque.
CREATE TABLE IF NOT EXISTS vendas (
  id                   INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  loja_id              INT UNSIGNED   NOT NULL,
  total                DECIMAL(12,2)  NOT NULL,
  status               ENUM('concluida','cancelada') NOT NULL DEFAULT 'concluida',
  observacao           VARCHAR(255)   NULL,
  motivo_cancelamento  VARCHAR(255)   NULL,
  cancelada_em         DATETIME       NULL,
  criado_em            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vendas_loja_data (loja_id, criado_em),
  CONSTRAINT fk_vendas_loja FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Itens da venda. O preço é copiado no momento da venda
-- (mudar o preço do produto depois não altera vendas antigas).
CREATE TABLE IF NOT EXISTS itens_venda (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  venda_id        INT UNSIGNED   NOT NULL,
  produto_id      INT UNSIGNED   NOT NULL,
  quantidade      INT UNSIGNED   NOT NULL,
  preco_unitario  DECIMAL(10,2)  NOT NULL,
  subtotal        DECIMAL(12,2)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_itens_venda (venda_id),
  KEY idx_itens_produto (produto_id),
  CONSTRAINT fk_itens_venda FOREIGN KEY (venda_id) REFERENCES vendas (id) ON DELETE CASCADE,
  CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id),
  CONSTRAINT chk_itens_quantidade CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico de toda mudança de estoque: explica qualquer saldo.
-- quantidade é a variação (positiva = entrou, negativa = saiu).
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  loja_id     INT UNSIGNED  NOT NULL,
  produto_id  INT UNSIGNED  NOT NULL,
  tipo        ENUM('cadastro','venda','cancelamento','ajuste') NOT NULL,
  quantidade  INT           NOT NULL,
  saldo_apos  INT           NOT NULL,
  motivo      VARCHAR(255)  NULL,
  venda_id    INT UNSIGNED  NULL,
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mov_loja_produto (loja_id, produto_id, criado_em),
  CONSTRAINT fk_mov_loja FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_venda FOREIGN KEY (venda_id) REFERENCES vendas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
