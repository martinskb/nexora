# NEXORA

Gestão simples de vendas e estoque para o pequeno comerciante.
Projeto do Laboratório de Empreendimentos Inovadores — ADS Turma A.

## Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express (API REST)
- **Banco:** MySQL / MariaDB

## Estrutura
```
backend/    API REST (src/, database/schema.sql, tests/)
frontend/   Aplicação React
docs/       Documentação do projeto (PROJETO.md)
```

## Como rodar (desenvolvimento)

### 1. Banco de dados
Crie o banco e um usuário dedicado (exemplo para MariaDB local):
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
npm run db:setup          # cria as tabelas
npm run db:setup:test     # cria as tabelas no banco de testes
npm run dev               # http://localhost:3333/api/health
npm test
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```
