# NEXORA

**Gestão de vendas e estoque para o pequeno comércio.**

NEXORA é um sistema web para mercadinhos e pequenos comércios que ainda controlam vendas e mercadorias em cadernos, planilhas ou mensagens. Venda e estoque ficam integrados: cada venda registrada baixa o estoque automaticamente, e o saldo, o caixa e o lucro do dia podem ser consultados a qualquer momento, inclusive pelo celular.

```
cadastrar produto  →  registrar venda  →  baixa automática no estoque  →  acompanhar resultados
```

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Produtos** | Cadastro com nome, preço, quantidade inicial e custo opcional. |
| **Vender** | Carrinho com vários itens, atalhos de teclado e busca rápida. Impede vender além do estoque, com ajuste rápido no momento da venda. |
| **Pagamentos** | Até duas formas de pagamento por venda, com divisão de valores e cálculo de troco. |
| **Vendas** | Histórico com filtros por período, forma de pagamento e canal; cancelamento devolve os itens ao estoque. |
| **Estoque** | Saldo por produto, ajustes com motivo, entrada de mercadoria com custo médio e lista de reposição. |
| **Canais de venda** | Origens definidas pela própria loja (balcão, Instagram, encomenda etc.). |
| **Início** | Indicadores do período com comparação ao período anterior, gráfico de vendas e mais vendidos. |
| **Fechamento do dia** | Total vendido, divisão por forma de pagamento, custo e lucro do dia. |

### Regras de negócio

- **Toda alteração de estoque é rastreável.** A quantidade só muda por venda, cancelamento, entrada de mercadoria ou ajuste com motivo registrado.
- **Venda e estoque são sempre consistentes.** Registro e cancelamento ocorrem em transação.
- **Isolamento por loja.** Cada conta acessa apenas os próprios dados; a sessão usa cookie `httpOnly`.
- **Custo histórico preservado.** O custo do produto é copiado para cada item vendido, mantendo o lucro correto mesmo após mudanças de preço ou custo.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite, React Router, TanStack Query, CSS Modules, PWA |
| Backend | Node.js, Express 5, Zod, JWT, bcrypt, Helmet, rate limiting |
| Banco de dados | MySQL 8 / MariaDB (`mysql2`), com migrações versionadas |
| Testes | Vitest e Supertest (integração contra banco de testes real) |

## Estrutura

```
backend/
  src/
    routes/        definição das rotas da API
    controllers/   entrada e saída HTTP
    services/      regras de negócio e acesso ao banco
    validators/    esquemas de validação (Zod)
    middlewares/   autenticação, validação e tratamento de erros
  database/
    schema.sql     estrutura base
    migracoes/     alterações numeradas
  scripts/         configuração do banco e carga de dados de demonstração
  tests/           testes de integração
frontend/
  src/
    pages/         telas do aplicativo
    components/    componentes reutilizáveis
    dados/         cache e consultas (TanStack Query)
    api/           cliente HTTP
    hooks/ utils/ context/
```

## API

Todas as rotas ficam sob `/api` e, exceto `/health` e `/auth`, exigem autenticação.

| Rota | Descrição |
|---|---|
| `GET /health` | Status da API e do banco |
| `/auth` | Cadastro da loja, login, logout e sessão atual |
| `/produtos` | CRUD de produtos, ajustes de estoque e histórico de movimentações |
| `/vendas` | Registro, listagem, detalhe e cancelamento de vendas; produtos vendidos no período |
| `/resumo` | Indicadores do período |
| `/relatorio` | Fechamento do dia |
| `/canais` | Canais de venda da loja |

## Desenvolvimento

Requisitos: Node.js 20+ e MySQL 8 ou MariaDB.

### Banco de dados

```sql
CREATE DATABASE nexora      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE nexora_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexora'@'localhost' IDENTIFIED BY '<senha>';
GRANT ALL PRIVILEGES ON nexora.*      TO 'nexora'@'localhost';
GRANT ALL PRIVILEGES ON nexora_test.* TO 'nexora'@'localhost';
```

### Backend

```bash
cd backend
cp .env.example .env      # preencha DB_PASSWORD e JWT_SECRET
npm install
npm run db:setup          # cria as tabelas e aplica as migrações pendentes
npm run dev               # http://localhost:3333/api/health
npm test                  # prepara o banco de testes e executa a suíte
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
npm test
```

### Migrações

`backend/database/schema.sql` contém a estrutura base e não deve ser alterado. Mudanças no banco entram como arquivos numerados em `backend/database/migracoes/` (ex.: `007_descricao.sql`) e são aplicadas por `npm run db:setup`. Cada migração roda uma única vez, controlada pela tabela `migracoes`.

### Dados de demonstração

```bash
cd backend
npm run seed:demo                 # cria uma loja com um mês de movimento
npm run seed:demo -- --recriar    # recria a loja com vendas até a data atual
```

As credenciais são exibidas ao final. Para outro banco, use `DOTENV_CONFIG_PATH=.env.producao npm run seed:demo`.

## Deploy

| Componente | Plataforma |
|---|---|
| Frontend | Vercel (`frontend/vercel.json` encaminha `/api` ao backend, preservando o cookie de sessão) |
| Backend | Render |
| Banco de dados | MySQL gerenciado (Aiven), com SSL via `DB_SSL_CA` |

## Roadmap

- Orientação guiada no primeiro uso.
- Relatórios avançados e controle de fiado.
- Importação de planilhas.
