# Canais de venda definidos pela loja — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a origem fixa (Balcão/WhatsApp) por canais opcionais que cada loja cadastra, arquiva e renomeia.

**Architecture:** Nova tabela `canais` (por loja) e `vendas.canal_id` anulável. Nova rota `/api/canais` (CRUD). `vendas` e `resumo` passam a usar `canalId`/`canal: {id, nome}|null`. No frontend: tela nova "Minha loja" e telas existentes que mostram a origem só quando a loja tem canal ativo.

**Tech Stack:** Node.js + Express 5, mysql2, zod, vitest + supertest (backend); React 19 + Vite, CSS Modules, vitest (frontend); MariaDB/MySQL.

**Spec:** `docs/superpowers/specs/2026-11-10-canais-de-venda-design.md`

## Global Constraints

- Toda consulta filtra por `loja_id` da sessão (`req.lojaId`). Uma loja nunca vê nem usa canal de outra.
- `schema.sql` não é editado. Mudanças de banco só por arquivos novos em `backend/database/migracoes/`.
- Nome do canal: texto aparado, 1–40 caracteres, único por loja sem diferenciar maiúsculas. Duplicado → 400 `"Já existe um canal com esse nome."`. Limite: 20 canais por loja (ativos + arquivados) → 400 `"Limite de 20 canais por loja."`.
- Apagar canal com vendas → 409 `"Este canal já tem vendas. Arquive em vez de apagar."`.
- Venda com `canalId` que não é canal ativo da loja → 400 `"Origem da venda inválida."`.
- A origem é sempre opcional. Nunca bloquear a venda por falta de canal.
- Textos de tela: venda sem origem = `"Sem canal"`; visão de todas = `"Vendas"`; nada que sugira integração automática.
- A origem só aparece nas telas (carrinho, filtro, cartão do Início) quando a loja tem ≥ 1 canal **ativo**.
- Até 3 canais ativos: `Segmentado`. Mais de 3: `<select>`.
- Cor do canal: ordem alfabética do nome entre **todos** os canais da loja → `--serie-1..6`, repetindo depois disso; "Sem canal" em cinza neutro.
- Visual segue os tokens de `frontend/src/index.css` (identidade "etiqueta de prateleira").
- Mensagens de commit em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Canal arquivado entre abrir a tela Vender e confirmar:** a API recusa com 400 "Origem da venda inválida."; a tela mostra o erro, recarrega os canais e limpa a escolha, sem perder o carrinho. (Testes: Task 3 API; Task 6 comportamento.)
- **Nome duplicado com caixa/espaços diferentes** (`" instagram "` vs `"Instagram"`), ao criar **e** ao renomear → 400 com a mensagem de duplicado, não 500. (Task 2.)
- **Vendas canceladas no resumo por canal:** ficam fora de `porCanal`, como já acontece nos totais. (Task 4.)
- **Filtro `canalId` com id de canal de outra loja** → lista vazia, nunca dados alheios; `canalId` lixo (`abc`) → 400 "Filtro de vendas inválido.". (Task 3.)
- **Filtro de origem escolhido e o canal foi arquivado/apagado** (ou a loja ficou sem canais ativos) → o filtro volta para "Vendas" em vez de ficar preso numa opção invisível. (Task 6.)

---

### Task 1: Migração 004 — tabela `canais` e `vendas.canal_id`

**Files:**
- Create: `backend/database/migracoes/004_canais_de_venda.sql`

**Interfaces:**
- Produces: tabela `canais (id, loja_id, nome VARCHAR(40), ativo BOOLEAN, criado_em)` com `UNIQUE (loja_id, nome)` e FK `loja_id → lojas ON DELETE CASCADE`; coluna `vendas.canal_id INT UNSIGNED NULL` com FK `fk_vendas_canal → canais(id)` **sem** cascata e índice `(loja_id, canal_id)`.
- A coluna antiga `vendas.canal` (enum) **continua existindo** até a Task 3 (que a remove na migração 005). Desvio consciente do spec, que remove na 004: evita deixar o código quebrado entre as tasks.

- [ ] **Step 1: Escrever a migração** na ordem: `CREATE TABLE canais` (DDL do spec, com `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`) → `ALTER TABLE vendas ADD canal_id … , ADD KEY idx_vendas_loja_canal (loja_id, canal_id), ADD CONSTRAINT fk_vendas_canal …` → dados:

```sql
INSERT INTO canais (loja_id, nome)
  SELECT DISTINCT loja_id, 'WhatsApp' FROM vendas WHERE canal = 'whatsapp';
UPDATE vendas v JOIN canais c ON c.loja_id = v.loja_id AND c.nome = 'WhatsApp'
  SET v.canal_id = c.id WHERE v.canal = 'whatsapp';
```

- [ ] **Step 2: Conferir o estado antes no banco de dev** (a loja demo `demo-visual@nexora.test` tem vendas `whatsapp`):

Run: `mariadb -u nexora -p nexora -e "SELECT canal, COUNT(*) FROM vendas GROUP BY canal"`
Anote os números.

- [ ] **Step 3: Aplicar nos dois bancos**

Run: `cd backend && npm run db:setup && npm run db:setup:test`
Expected: os dois terminam sem erro e listam `004_canais_de_venda.sql` como aplicada.

- [ ] **Step 4: Verificar a migração dos dados (dev)**

Run: `mariadb -u nexora -p nexora -e "SELECT v.canal, c.nome, COUNT(*) FROM vendas v LEFT JOIN canais c ON c.id = v.canal_id GROUP BY v.canal, c.nome"`
Expected: toda linha `whatsapp` com `nome = WhatsApp`; toda `balcao` com `nome = NULL`; contagens iguais às do Step 2. Lojas sem vendas por WhatsApp sem linha em `canais`.

- [ ] **Step 5: Rodar a suíte existente** (nada deve quebrar ainda)

Run: `cd backend && npm test`
Expected: PASS.

- [ ] **Step 6: Commit** `"Canais (1/7): migração dos canais de venda (004)"`

---

### Task 2: API `/api/canais` (listar, criar, renomear/arquivar, apagar)

**Files:**
- Create: `backend/src/validators/canalSchemas.js`, `backend/src/services/canalService.js`, `backend/src/controllers/canalController.js`, `backend/src/routes/canalRoutes.js`
- Modify: `backend/src/routes/index.js` (registrar `routes.use('/canais', canalRoutes)`)
- Test: `backend/tests/canais.test.js`

**Interfaces:**
- Produces (service):
  - `listar(lojaId) → Promise<Canal[]>` ordenado por `nome`; `Canal = { id, nome, ativo: boolean, temVendas: boolean }`
  - `criar(lojaId, { nome }) → Promise<Canal>`
  - `atualizar(lojaId, id, { nome?, ativo? }) → Promise<Canal>` (404 `"Canal não encontrado."` se não for da loja)
  - `remover(lojaId, id) → Promise<void>`
  - `buscarAtivo(conn, lojaId, id) → Promise<{id, nome} | null>` — usado pela Task 3 dentro da transação da venda.
- Produces (HTTP): `GET /api/canais → { canais }`, `POST → 201 { canal }`, `PUT /:id → { canal }`, `DELETE /:id → 204`. Todas atrás de `autenticar`.
- Schemas: `criarCanalSchema = { nome }`, `atualizarCanalSchema = { nome?, ativo? }` com pelo menos um dos dois (senão 400 `"Nada para alterar."`).

- [ ] **Step 1: Escrever os testes** em `tests/canais.test.js` (padrão de `vendas.test.js`: `beforeEach(limparBanco)`, `criarLojaLogada`):
  - `lista vazia para loja nova` → `GET` retorna `{ canais: [] }`.
  - `cria canal com nome aparado` → `POST { nome: '  Instagram ' }` → 201, `canal` = `{ nome: 'Instagram', ativo: true, temVendas: false }`.
  - `recusa nome vazio e nome com 41 caracteres` → 400.
  - `recusa duplicado ignorando maiúsculas` → criar `Instagram`, depois `' instagram '` → 400 `"Já existe um canal com esse nome."`.
  - `recusa renomear para nome de outro canal` → `PUT { nome: 'INSTAGRAM' }` em outro canal → 400 mesma mensagem.
  - `limite de 20 canais` → 21º `POST` → 400 `"Limite de 20 canais por loja."`.
  - `arquiva e reativa` → `PUT { ativo: false }` → `ativo: false`; `PUT { ativo: true }` → `true`.
  - `apaga canal sem vendas` → `DELETE` 204, some do `GET`.
  - `não apaga canal com vendas` → inserir venda com `canal_id` direto via `pool.query` (a API de venda só ganha `canalId` na Task 3) → `DELETE` 409 com a mensagem do spec; `GET` mostra `temVendas: true`.
  - `isolamento entre lojas` → loja B faz `PUT`/`DELETE` no canal da loja A → 404; `GET` da B não lista o canal da A.
  - `exige login` → `request(app).get('/api/canais')` → 401.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npx vitest run tests/canais.test.js` (com `NODE_ENV=test`, como no `npm test`)
Expected: FAIL (rota inexistente → 404).

- [ ] **Step 3: Implementar** schemas, service, controller e rotas seguindo o padrão de `produto*`. Duplicado: capturar `ER_DUP_ENTRY` do mysql2 e transformar em `AppError(…, 400)`. `temVendas`: `EXISTS (SELECT 1 FROM vendas WHERE canal_id = c.id)`. Limite: `COUNT(*)` da loja antes do `INSERT`. `remover`: checar `temVendas` → 409, antes do `DELETE`. Ids pela `idDaRota` existente.

- [ ] **Step 4: Rodar os testes**

Run: `cd backend && npm test`
Expected: PASS (todos, inclusive os antigos).

- [ ] **Step 5: Commit** `"Canais (2/7): API de canais de venda"`

---

### Task 3: Vendas usam `canalId` + migração 005

**Files:**
- Create: `backend/database/migracoes/005_remove_canal_fixo.sql` (`ALTER TABLE vendas DROP COLUMN canal;`)
- Modify: `backend/src/validators/vendaSchemas.js`, `backend/src/services/vendaService.js`
- Test: `backend/tests/vendas.test.js` (atualizar as linhas 32, 49–55, 103, 231–239)

**Interfaces:**
- Consumes: `buscarAtivo(conn, lojaId, id)` da Task 2.
- Produces:
  - `criarVendaSchema.canalId: number int positive | null`, opcional, padrão `null`. Remover `CANAIS` e `canal`.
  - `filtroVendasSchema.canalId: number int positive | 'sem'`, opcional (`z.union([z.literal('sem'), z.coerce.number().int().positive()])`).
  - Venda pública: `canal: { id, nome } | null` (o campo `canal` string deixa de existir).
  - `registrar(lojaId, { itens, canalId, observacao })`; `listar(lojaId, { …, canalId })`.

- [ ] **Step 1: Atualizar/escrever os testes** em `vendas.test.js`:
  - Linha 32: `canal: null` em vez de `'balcao'`.
  - `registra a origem quando informada` (substitui o teste do WhatsApp) → criar canal via `/api/canais`, vender com `canalId` → `venda.canal` = `{ id, nome: 'Instagram' }`, observação mantida.
  - `recusa canal arquivado, inexistente ou de outra loja` → três casos → 400 `"Origem da venda inválida."`, e o estoque **não** foi baixado.
  - Linha 103: `canalId: 'telefone'` → 400.
  - `filtra por canal, sem canal, situação e período` (reescrever o de 231) → `?canalId=<id>` 1 venda, `?canalId=sem` só as sem canal, sem parâmetro todas.
  - `filtro com canal de outra loja retorna vazio` → `?canalId=<id da loja A>` na loja B → `vendas: []`.
  - `filtro inválido` → `?canalId=abc` → 400 `"Filtro de vendas inválido."`.
  - `canal arquivado continua aparecendo no histórico` → vender com canal, arquivar → `GET /api/vendas/:id` ainda traz `canal.nome`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npx vitest run tests/vendas.test.js`
Expected: FAIL nos testes novos/alterados.

- [ ] **Step 3: Implementar.** Em `registrar`, dentro da transação e antes de travar os produtos: se `canalId != null`, `buscarAtivo` → `null` gera `AppError('Origem da venda inválida.', 400)`. `INSERT` grava `canal_id`. Leitura (`buscar`/`listar`): `LEFT JOIN canais c ON c.id = v.canal_id`, `paraVendaPublica` monta `canal`. Filtro: `canalId === 'sem'` → `v.canal_id IS NULL`; número → `v.canal_id = ?` (a condição `v.loja_id = ?` já existente garante o isolamento).

- [ ] **Step 4: Criar a migração 005 e aplicar**

Run: `cd backend && npm run db:setup && npm test`
Expected: 005 aplicada nos dois bancos; os testes de vendas passam. O `resumo.test.js` vai falhar até a Task 4 (ele ainda usa `canal`). Isso é esperado; confirmar que **só** ele falha.

- [ ] **Step 5: Commit** `"Canais (3/7): vendas com canal opcional da loja"`

---

### Task 4: Resumo com origem dinâmica e `temCanais`

**Files:**
- Modify: `backend/src/services/resumoService.js`
- Test: `backend/tests/resumo.test.js`

**Interfaces:**
- Produces: `resumo.porCanal: Array<{ canalId: number|null, nome: string|null, vendas: number, valor: number }>`, só com quem teve venda concluída no período, ordenado por `valor` desc; `resumo.temCanais: boolean` (a loja tem ≥ 1 canal ativo).

- [ ] **Step 1: Atualizar os testes.** O helper `vender(itens, canal, quando)` passa a receber `canalId`. Asserções:
  - Com 1 venda sem canal (23,00) e 1 no canal "Grupo" (16,00): `porCanal` = `[{ canalId: null, nome: null, vendas: 1, valor: 23 }, { canalId: grupo.id, nome: 'Grupo', vendas: 1, valor: 16 }]` e `temCanais: true`.
  - `venda cancelada não entra em porCanal` → cancelar a do Grupo → `porCanal` só com a linha `null`.
  - `loja sem canais` → `temCanais: false` e `porCanal` com só a linha `null` (ou vazio se não houver vendas).
  - `todos os canais arquivados` → `temCanais: false`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd backend && npx vitest run tests/resumo.test.js`
Expected: FAIL.

- [ ] **Step 3: Implementar.** Consulta de `porCanal`: `SELECT v.canal_id, c.nome, COUNT(*), SUM(v.total) … LEFT JOIN canais c … GROUP BY v.canal_id, c.nome ORDER BY SUM(v.total) DESC`. Mais uma consulta no `Promise.all`: `SELECT EXISTS(SELECT 1 FROM canais WHERE loja_id = ? AND ativo = TRUE) AS tem`.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `cd backend && npm test`
Expected: PASS em tudo.

- [ ] **Step 5: Commit** `"Canais (4/7): resumo por canal da loja"`

---

### Task 5: Tela "Minha loja" (gerenciar canais)

**Files:**
- Create: `frontend/src/api/canais.js`, `frontend/src/pages/MinhaLoja.jsx`, `frontend/src/pages/MinhaLoja.module.css`, `frontend/src/hooks/useCanais.js`
- Modify: `frontend/src/App.jsx` (rota `/minha-loja` dentro do layout logado), `frontend/src/components/LayoutApp.jsx` + `.module.css` (o nome da loja vira `<Link to="/minha-loja">`, área de toque ≥ 44px)

**Interfaces:**
- Produces:
  - `canaisApi = { listar(signal), criar({ nome }), atualizar(id, dados), remover(id) }` (mesmo padrão de `produtosApi`).
  - `useCanais() → { canais: Canal[], ativos: Canal[], carregando: boolean, erro: string, recarregar: () => Promise<void> }`. `ativos` = filtrados por `ativo`, em ordem alfabética.

- [ ] **Step 1: Implementar `canaisApi` e `useCanais`.**

- [ ] **Step 2: Implementar a tela** conforme a seção "Telas" do spec, com textos exatos:
  - Título `"Minha loja"`; seção `"Canais de venda"`; explicação `"Marque de onde veio cada venda, se quiser. Ex.: Instagram, encomenda."`
  - Campo `"Novo canal"` + botão `"Adicionar"` (Enter também adiciona; limpa o campo e avisa `"Canal "X" adicionado."`).
  - Linha do canal: nome; `"Renomear"` (edição na própria linha, Enter salva, Esc cancela); `"Arquivar"` se `temVendas`, senão `"Apagar"` (confirmar com `Modal`).
  - `<details>` `"Arquivados (n)"` com `"Reativar"`.
  - Vazio: `"Nenhum canal ainda. Sem canais, as vendas são registradas sem origem."`
  - Erros da API aparecem com `Alerta` junto do campo/linha.

- [ ] **Step 3: Verificar no navegador** (login demo; celular 390px e computador 1280px, temas claro e escuro): criar, renomear, tentar duplicar (mensagem aparece), arquivar, reativar, apagar sem vendas; tocar no nome da loja no cabeçalho abre a tela.

- [ ] **Step 4: Lint, testes e build**

Run: `cd frontend && npm run lint && npm test && npm run build`
Expected: sem erros.

- [ ] **Step 5: Commit** `"Canais (5/7): tela Minha loja com canais de venda"`

---

### Task 6: Origem opcional no carrinho, na lista e no detalhe da venda

**Files:**
- Create: `frontend/src/components/EscolhaCanal.jsx` (+ `.module.css` se precisar), `frontend/src/utils/canais.js`, `frontend/src/utils/__tests__/canais.test.js`
- Modify: `frontend/src/components/Carrinho.jsx`, `frontend/src/pages/Vender.jsx`, `frontend/src/pages/Vendas.jsx` + `.module.css` (remover `.canal_whatsapp`), `frontend/src/components/DetalheVenda.jsx`, `frontend/src/utils/datas.js` (remover `CANAL_ROTULO`), `frontend/src/components/Segmentado.jsx` (só o comentário de exemplo)

**Interfaces:**
- Consumes: `useCanais()` da Task 5; venda pública com `canal: {id, nome}|null`; filtro `canalId` (id ou `'sem'`).
- Produces:
  - `utils/canais.js`: `SEM_CANAL = 'Sem canal'`; `nomeDoCanal(canal) → string` (`canal?.nome ?? SEM_CANAL`); `corDoCanal(canalId, todosCanais) → string` (CSS var: `null` → `'var(--cor-sem-canal)'`; senão índice na ordem alfabética de `todosCanais` → `` `var(--serie-${(i % 6) + 1})` ``).
  - `<EscolhaCanal rotulo opcoes valor aoMudar usarLista />`: `opcoes = [{ valor, rotulo }]`; `usarLista` (boolean) é decidido por quem chama como `ativos.length > 3`. `false` → `Segmentado`, `true` → `<select>` com o mesmo rótulo.

- [ ] **Step 1: Escrever os testes de `utils/canais.js`**:
  - `nomeDoCanal(null) === 'Sem canal'`; `nomeDoCanal({ id: 1, nome: 'Grupo' }) === 'Grupo'`.
  - `corDoCanal(null, …) === 'var(--cor-sem-canal)'`.
  - Com canais `[{id:9,nome:'Zap'},{id:3,nome:'Balcão'}]`: `corDoCanal(3) === 'var(--serie-1)'`, `corDoCanal(9) === 'var(--serie-2)'` (alfabética, não por id).
  - 7º canal em ordem alfabética → `'var(--serie-1)'` (repete).

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd frontend && npx vitest run src/utils/__tests__/canais.test.js`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `utils/canais.js` e `EscolhaCanal`; rodar os testes** → PASS.

- [ ] **Step 4: Carrinho/Vender.** Estado `canalId` (padrão `null`). Com `ativos.length > 0`, o carrinho mostra `EscolhaCanal` com o rótulo `"Origem da venda (opcional)"` e as opções `[{ valor: '', rotulo: 'Nenhum' }, …ativos]`; sem canais ativos, nada. Envia `canalId` (ou `null`). Após a venda, volta a `null`. Erro `400` com a mensagem `"Origem da venda inválida."`: mostrar o erro, chamar `recarregar()` dos canais e voltar `canalId` a `null`, **mantendo o carrinho**.

- [ ] **Step 5: Vendas (lista) e Detalhe.** Filtro `canalId` (`''` = todas). Com canais ativos, `EscolhaCanal` rotulado `"Origem"` com `[{ valor: '', rotulo: 'Vendas' }, { valor: 'sem', rotulo: 'Sem canal' }, …ativos]`; sem canais ativos, o filtro some. Se o `canalId` escolhido não estiver mais entre as opções (arquivado/apagado), voltar a `''`. A linha da venda mostra `v.canal.nome` só quando `v.canal` existe. No detalhe, a linha "Origem" só aparece quando `venda.canal` existe.

- [ ] **Step 6: Verificar no navegador** (celular e computador): loja sem canais (nenhum vestígio de origem no carrinho, na lista ou no detalhe); com 1 canal (botões Nenhum/Canal); com 4 canais (lista suspensa); vender com e sem canal; filtrar por "Sem canal"; arquivar o canal filtrado em outra aba e voltar (filtro volta a "Vendas"); arquivar o canal escolhido no carrinho antes de confirmar (erro claro, carrinho mantido).

- [ ] **Step 7: Lint, testes e build** → `cd frontend && npm run lint && npm test && npm run build`, sem erros.

- [ ] **Step 8: Commit** `"Canais (6/7): origem opcional nas vendas"`

---

### Task 7: Início — cartão "Origem das vendas" dinâmico

**Files:**
- Modify: `frontend/src/pages/Inicio.jsx`, `frontend/src/pages/Inicio.module.css`, `frontend/src/index.css` (`--serie-3..6` e `--cor-sem-canal`, claro e os dois blocos do escuro)

**Interfaces:**
- Consumes: `resumo.porCanal` e `resumo.temCanais` (Task 4); `useCanais().canais` e `corDoCanal`/`nomeDoCanal` (Tasks 5–6).

- [ ] **Step 1: Paleta.** Carregar a skill `dataviz` antes de escolher as cores. Definir `--serie-3`…`--serie-6` (mantendo `--serie-1` `#2a8a5c` e `--serie-2` `#d9622b`) e `--cor-sem-canal`, nos dois temas, conferindo contraste com o fundo do cartão e separação para daltonismo com o validador da skill.

- [ ] **Step 2: Cartão.** Mostrar só se `temCanais && t.vendas > 0`. Remover a lista fixa `CANAIS`; a barra dividida e a lista usam `porCanal` (já em ordem de valor), com `nomeDoCanal` e `corDoCanal(canalId, canais)`. Manter o `aria-label` da barra (`"<nome> <n>%"` separados por vírgula) e o percentual em cada linha. A regra de `colunaInteira` do cartão de estoque passa a valer quando os dois cartões da direita existem (com origem oculta e mais vendidos presente, o estoque não ocupa duas linhas).

- [ ] **Step 3: Verificar no navegador** (claro/escuro, celular/computador): loja sem canais (cartão some, grade sem buraco); com vendas sem canal e em 2 canais; com 7 canais (cores repetem sem quebrar); hoje/7/30 dias mantêm a mesma cor por canal.

- [ ] **Step 4: Lint, testes e build** → sem erros.

- [ ] **Step 5: Atualizar `docs/PROJETO.md`** (linha F2: "origem opcional, com canais definidos pela loja") e **Commit** `"Canais (7/7): origem das vendas por canal no Início"`.
