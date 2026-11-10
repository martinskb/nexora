# NEXORA

**Gestão simples de vendas e estoque para o pequeno comerciante.**

Projeto do Laboratório de Empreendimentos Inovadores — Análise e Desenvolvimento de Sistemas, Turma A · Belém/PA · 2026.

---

## Do que se trata

Muitos mercadinhos e pequenos comércios ainda controlam o estoque num caderno, numa planilha
ou num grupo de WhatsApp. Venda de um lado, mercadoria do outro: o que sai no balcão nem sempre
é anotado, o saldo fica errado, aparecem furos no caixa e o cliente pede um produto que "tinha
no sistema" mas já acabou.

O NEXORA junta as duas pontas num lugar só. O comerciante cadastra o produto com poucos campos,
registra a venda e o estoque baixa sozinho. Dá para consultar o saldo a qualquer hora, inclusive
pelo celular.

```
cadastrar produto  →  registrar venda  →  baixa automática no estoque  →  consultar
```

**Para quem:** pequenos comerciantes locais de Belém, começando por mercadinhos e negócios
que hoje controlam os produtos à mão.

**Aposta do produto:** ser fácil de aprender. A meta é que 4 em cada 5 comerciantes consigam
cadastrar, vender e consultar **sem ajuda**, depois de uma orientação curta.

## O que o sistema faz

| | Funcionalidade | Como funciona |
|---|---|---|
| F1 | **Cadastro de produtos** | Só nome, preço e quantidade inicial. |
| F2 | **Registro de vendas** | Carrinho com vários itens; o estoque baixa automaticamente. Não deixa vender além do que existe, mas oferece um ajuste rápido na hora (o caderno do balcão pode estar desatualizado). Origem da venda opcional. |
| F3 | **Consulta de estoque** | Saldo de cada produto, rápido e legível no celular. |
| F4 | **Ajuste de estoque** | Corrige divergências da conferência, sempre com motivo registrado. |
| F5 | **Resumo de vendas** | O que foi vendido no período e os mais vendidos. |
| F6 | **Orientação inicial** | Passo a passo curto no primeiro uso. *(planejada)* |

### Regras importantes

- **A quantidade não se edita à mão.** Ela só muda por venda, cancelamento de venda ou ajuste
  com motivo, o que deixa todo movimento rastreável.
- **Cancelar uma venda devolve os itens ao estoque.** Venda e estoque ficam sempre consistentes.
- **Cada loja vê só os próprios dados.** Um login por loja; a sessão fica num cookie `httpOnly`.

**Fora do escopo por enquanto:** relatórios avançados, financeiro completo (incluindo fiado),
integrações automáticas com outros canais e importação de planilhas.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite, React Router, CSS Modules |
| Backend | Node.js + Express 5 (API REST), validação com Zod, autenticação JWT + bcrypt |
| Banco | MySQL / MariaDB (`mysql2`), migrações numeradas |
| Testes | Vitest + Supertest (API contra banco de testes real) |

## Estrutura

```
backend/
  src/            API: rotas, controllers, services, validators, middlewares
  database/       schema.sql (base) e migracoes/ (alterações numeradas)
  tests/          testes de integração da API
frontend/
  src/pages/      telas: Entrar, Criar conta, Início, Vender, Vendas, Produtos, Estoque
  src/components/ componentes reutilizáveis
docs/
  PROJETO.md      documento do projeto (problema, escopo, riscos, equipe)
```

### API (resumo)

Tudo sob `/api`:

| Rota | Para quê |
|---|---|
| `GET /health` | Verifica se a API e o banco estão no ar |
| `/auth` | Criar conta da loja, entrar, sair, sessão atual |
| `/produtos` | Cadastro, listagem, ajustes de estoque e histórico de movimentações |
| `/vendas` | Registrar, listar e cancelar vendas |
| `/resumo` | Números do Início (vendas do período, mais vendidos) |

## Como rodar (desenvolvimento)

Pré-requisitos: Node.js 20+ e MySQL ou MariaDB.

### 1. Banco de dados

Crie os bancos e um usuário dedicado (exemplo para MariaDB local):

```sql
CREATE DATABASE nexora      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE nexora_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexora'@'localhost' IDENTIFIED BY '<sua-senha>';
GRANT ALL PRIVILEGES ON nexora.*      TO 'nexora'@'localhost';
GRANT ALL PRIVILEGES ON nexora_test.* TO 'nexora'@'localhost';
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # preencha DB_PASSWORD e JWT_SECRET
npm install
npm run db:setup          # cria as tabelas e aplica as migrações pendentes
npm run dev               # http://localhost:3333/api/health
npm test                  # prepara o banco de testes e roda a suíte
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Migrações do banco

A estrutura base está em `backend/database/schema.sql` e **não deve ser editada**.
Para alterar o banco, crie um arquivo numerado em `backend/database/migracoes/`
(ex.: `00N_descricao.sql`) e rode `npm run db:setup`. Cada migração é aplicada uma única vez
(o controle fica na tabela `migracoes`).

## Equipe

| Integrante | Papel |
|---|---|
| João Rafael | Gestão e negócios / Product Owner |
| Kaio Barra | Banco de dados e infraestrutura; fluxo e acompanhamento das tarefas |
| Eduardo Costa | Desenvolvimento / Tech Lead |
| Issac Guimarães | Desenvolvimento |
| Kevin Monteiro | Desenvolvimento |
| Lucas Souza | UX e design |

Mais detalhes sobre o problema, o escopo e os riscos em [`docs/PROJETO.md`](docs/PROJETO.md).
