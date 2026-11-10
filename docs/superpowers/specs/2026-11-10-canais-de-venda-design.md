# Canais de venda definidos pela loja — design

Data: 2026-11-10 · Status: aprovado

## Por que

Hoje toda venda tem uma "Origem" fixa: Balcão ou WhatsApp. Dois problemas:

1. "WhatsApp" na tela dá a entender que o sistema está integrado ao WhatsApp, e isso não é verdade.
   A equipe não quer prometer integração agora.
2. O público-alvo atual é quem controla o estoque no caderno ou num grupo de WhatsApp. Cada loja
   vende por caminhos diferentes (balcão, grupo, Instagram, encomenda…), e uma lista fixa não serve
   para todas.

Plano futuro (fora desta etapa): a baixa automática de estoque vinda de balcão, WhatsApp, Amazon,
Mercado Livre etc. Ter canais cadastrados pela loja prepara o terreno para isso.

## O que muda para o usuário

- **A loja começa sem nenhum canal.** Enquanto não houver canal, o sistema não fala em origem: o
  carrinho não pede origem, Vendas não tem filtro de origem e o Início não mostra o cartão
  "Origem das vendas".
- **A loja cadastra os próprios canais** com nomes livres (ex.: "Grupo do WhatsApp", "Instagram",
  "Encomenda"). Isso é feito numa tela nova, **Minha loja**, que abre ao tocar no nome da loja no
  cabeçalho.
- **Com pelo menos um canal ativo**, aparecem:
  - **Carrinho:** escolha de origem **opcional**. Por padrão nenhuma vem marcada, e a venda fica
    "Sem canal".
  - **Vendas (lista):** filtro de origem com as opções **Vendas** (todas juntas, no lugar do antigo
    "Todas"), **Sem canal** e um item para cada canal ativo.
  - **Início:** cartão "Origem das vendas" com a divisão por canal, incluindo "Sem canal".
  - **Detalhe da venda e linha na lista:** mostram o nome do canal. Se a venda não tem canal, não
    mostram nada.
- **Arquivar, não apagar:** um canal que já tem venda registrada não pode ser apagado, só
  arquivado. Arquivado, ele some do carrinho e do filtro, mas o histórico continua mostrando o nome
  nas vendas antigas. Um canal sem nenhuma venda pode ser apagado de vez. Um canal arquivado pode
  ser reativado.
- **Renomear** muda o nome em todo o histórico (é o mesmo canal).

## Objetivos

- Origem da venda opcional, definida por cada loja, sem nenhuma promessa de integração na tela.
- Zero complexidade para quem não usa canais: a tela fica igual à de quem nunca ouviu falar nisso.
- Histórico preservado: arquivar ou renomear nunca faz uma venda perder a origem.

## Fora do escopo (não fazer)

- Integrações automáticas (WhatsApp Business API, marketplaces).
- Canal com regras próprias (preço diferente, taxa, comissão).
- Reordenar canais manualmente (a ordem é alfabética).
- Outras configurações na tela "Minha loja" além dos canais. A tela nasce só com isso, mas com nome
  genérico para crescer depois.

## Anti-objetivos (seria falha mesmo funcionando)

- Obrigar a escolher origem para concluir a venda. No balcão, cada toque a mais atrapalha (E1).
- Qualquer texto que sugira que o sistema "recebe" vendas do WhatsApp ou de outro lugar.
- A venda antiga mudar de origem, ou aparecer sem origem, por causa de arquivamento.

## Decisões do usuário

- Canais definidos pela própria loja (opção 2).
- "Vendas" é o nome da visão que junta todos os canais (substitui "Todas" no filtro).
- A origem é opcional. Venda sem canal escolhido fica sem canal.
- Concordou com: arquivar em vez de apagar; gerenciar canais numa tela "Minha loja" pelo nome da
  loja no cabeçalho; migração descrita abaixo.

## Banco de dados

Nova migração `004_canais_de_venda.sql` (o `schema.sql` base não é editado):

```sql
CREATE TABLE canais (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  loja_id    INT UNSIGNED NOT NULL,
  nome       VARCHAR(40)  NOT NULL,
  ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canais_loja_nome (loja_id, nome),
  CONSTRAINT fk_canais_loja FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE
);
ALTER TABLE vendas ADD COLUMN canal_id INT UNSIGNED NULL AFTER status,
  ADD CONSTRAINT fk_vendas_canal FOREIGN KEY (canal_id) REFERENCES canais (id);
```

Migração dos dados existentes, na mesma migração:
- Para cada loja com pelo menos uma venda `canal = 'whatsapp'`: criar o canal "WhatsApp" e apontar
  essas vendas para ele.
- Vendas `canal = 'balcao'` ficam com `canal_id = NULL` (sem canal).
- Remover a coluna `vendas.canal` (enum) no fim.

O `fk_vendas_canal` não tem cascata: um canal com vendas não pode ser apagado (o serviço checa
antes e responde com mensagem clara, e a FK é a garantia final).

## API

Todas as rotas exigem login e filtram por `loja_id`.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/canais` | Lista os canais da loja (ativos e arquivados), com `id`, `nome`, `ativo` e `temVendas` |
| POST | `/api/canais` | Cria (`{ nome }`) |
| PUT | `/api/canais/:id` | Renomeia e/ou arquiva/reativa (`{ nome?, ativo? }`) |
| DELETE | `/api/canais/:id` | Apaga. Se tiver vendas, responde 409 com "Este canal já tem vendas. Arquive em vez de apagar." |

Mudanças nas rotas existentes:
- `POST /api/vendas`: `canal` sai; entra `canalId` opcional (inteiro ou `null`). Precisa ser um
  canal **ativo da mesma loja**; caso contrário, 400 com "Origem da venda inválida.".
- `GET /api/vendas`: filtro `canal` sai; entra `canalId`, que aceita um id ou `sem` (vendas sem
  canal). Ausente significa todas. Cada venda retorna `canal: { id, nome } | null`.
- `GET /api/vendas/:id`: idem (`canal: { id, nome } | null`).
- `GET /api/resumo`: `porCanal` vira uma lista dinâmica
  `[{ canalId: number|null, nome: string|null, vendas, valor }]`. Inclui apenas canais com vendas
  no período, mais a linha "sem canal" (`canalId: null`) se houver. Ordem: maior valor primeiro.
  Também retorna `temCanais: boolean` (a loja tem ao menos um canal ativo), que o Início usa para
  decidir se mostra o cartão.

Validação do nome: texto aparado, de 1 a 40 caracteres, único por loja sem diferenciar
maiúsculas/minúsculas (a collation `utf8mb4_unicode_ci` já garante; o serviço traduz o erro de
duplicado para "Já existe um canal com esse nome."). Limite de 20 canais por loja.

## Telas

- **Cabeçalho:** o nome da loja vira link para `/minha-loja`. No celular continua truncado, mas
  clicável (área de toque de 44px).
- **Minha loja (`/minha-loja`):** título "Minha loja", seção "Canais de venda" com uma frase curta
  explicando ("Marque de onde veio cada venda, se quiser. Ex.: Instagram, encomenda."), campo
  "Novo canal" com o botão "Adicionar" e a lista de canais. Cada canal pode ser renomeado (edição
  na própria linha) e arquivado. Quando o canal não tem vendas, a ação é "Apagar". Os arquivados
  ficam numa lista recolhida "Arquivados (n)", com a ação "Reativar". Lista vazia: "Nenhum canal
  ainda. Sem canais, as vendas são registradas sem origem."
- **Carrinho:** com canais ativos, a "Origem da venda (opcional)" vira uma lista de opções. Até 3
  canais, usar o `Segmentado` com "Nenhum" + canais. Com mais de 3, usar um `<select>` com
  "Nenhum" no topo. Sem canais ativos, nada aparece.
- **Vendas:** com canais ativos, o filtro de origem aparece (Vendas / Sem canal / canais). Mais de
  3 canais: `<select>`. Sem canais, o filtro some.
- **Início:** o cartão "Origem das vendas" aparece se `temCanais` e houver vendas no período. Cores:
  "Sem canal" em cinza neutro (`--cor-borda` forte); os canais usam uma paleta categórica de até 6
  cores definida em `index.css` (`--serie-1`…`--serie-6`) e repetem depois disso. A cor segue a
  ordem alfabética do canal, para não mudar entre períodos.

## Testes

- Backend: CRUD de canais (isolamento por loja, nome duplicado, limite, apagar com vendas → 409,
  arquivar/reativar); venda com canal ativo, inativo, de outra loja e sem canal; filtro `canalId`
  (id e `sem`); resumo com lista dinâmica e `temCanais`; migração (whatsapp vira canal, balcão vira
  null) testada sobre o banco de testes.
- Frontend: os testes utilitários existentes continuam passando. Verificar no navegador: loja sem
  canais (nada de origem em lugar nenhum), com 1, com 2 e com mais de 3 canais, e canal arquivado
  com histórico.

## Observações para quem implementar

- O `db-setup.js` roda cada migração com `multipleStatements`, mas DDL no MySQL não é transacional.
  Se a 004 falhar no meio, ela não é registrada e o banco pode ficar pela metade. Teste no
  `nexora_test` antes. Ordem dentro do arquivo: criar `canais` → adicionar `canal_id` → migrar
  dados → remover `canal`.
- Há cerca de 14 referências a `canal`/`whatsapp` em `backend/tests/` que precisam ser atualizadas
  para o novo formato.
- Frontend que hoje usa o canal fixo: `utils/datas.js` (`CANAL_ROTULO`), `Carrinho.jsx`,
  `Vender.jsx`, `Vendas.jsx` (+ `.canal_whatsapp` no CSS), `DetalheVenda.jsx` e `Inicio.jsx`.
- Se a loja arquivar todos os canais, `temCanais` fica falso e a origem some das telas (inclusive
  do Início), mas o detalhe de cada venda antiga continua mostrando o canal.

## Deixado para quem implementar

- Componentes visuais internos da tela Minha loja, seguindo a identidade atual (tokens em
  `index.css`).
- Mensagens de erro além das citadas, no tom do app (claras, sem pedir desculpa).
- Ordem dos passos (sugestão: migração → API → testes → telas).

## Decisões minhas (para conferir)

- Nome "Sem canal" para venda sem origem nas listas, no filtro e no Início.
- Nome do canal até 40 caracteres e limite de 20 canais por loja.
- Renomear vale para todo o histórico.
- Até 3 canais usam botões; com mais, uma lista suspensa.
- Cor por ordem alfabética do canal; "Sem canal" em cinza.
- `/api/resumo` só lista canais que tiveram venda no período.
- Na migração, lojas sem vendas por WhatsApp não ganham canal nenhum.
