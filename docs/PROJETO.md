# NEXORA — Documento do Projeto

> Gestão simples para o pequeno comerciante.
> Laboratório de Empreendimentos Inovadores · ADS Turma A · Belém/PA · 2026

## Equipe

| Integrante | Papel |
|---|---|
| João Rafael | Gestão e negócios / Product Owner |
| Kaio Barra | Banco de dados e infraestrutura; fluxo e acompanhamento das tarefas |
| Eduardo Costa | Desenvolvimento / Tech Lead |
| Issac Guimarães | Desenvolvimento |
| Kevin Monteiro | Desenvolvimento |
| Lucas Souza | UX e design |

## Problema

Pequenos comércios registram vendas e estoque em lugares separados (caderno, planilha, WhatsApp).
Pedidos do balcão e das mensagens nem sempre chegam ao controle de mercadorias, o que gera
furos no caixa, vendas sem registro, vendas duplicadas e cancelamentos por falta de produto.

**Público:** pequenos comerciantes locais de Belém, com foco inicial em mercadinhos e negócios
com controle manual de produtos.

## Solução

Um sistema de controle de **vendas e estoque integrados**, com poucos campos, linguagem
acessível e orientação inicial.

**Fluxo principal:** cadastro do produto → registro da venda → baixa automática no estoque → consulta.

**Diferencial pretendido:** facilidade de aprendizado (hipótese a ser testada).

## Escopo da versão atual

| # | Funcionalidade | Descrição |
|---|---|---|
| F1 | Cadastro de produtos | Poucos campos: nome, preço e quantidade inicial |
| F2 | Registro de vendas | Baixa automática no estoque a cada venda; origem opcional, com canais definidos pela loja (ex.: Instagram, encomenda), registrados manualmente |
| F3 | Consulta de estoque | Ver rapidamente o saldo de cada produto, inclusive pelo celular |
| F4 | Ajuste de estoque | Corrigir divergências encontradas na conferência |
| F5 | Resumo de vendas | Visão simples do que foi vendido e dos mais vendidos |
| F6 | Orientação inicial | Passo a passo curto no primeiro uso |

**Fora do escopo agora:** relatórios avançados, gestão financeira completa (incluindo fiado),
integração com WhatsApp e importação de planilhas.

## Requisitos de qualidade

- Consistência entre venda e estoque (inclusive em cancelamentos).
- Controle de acesso: cada loja acessa somente os próprios dados.
- Cópias de segurança e recuperação de falhas.
- Interface simples, responsiva e utilizável no celular.

## Meta de usabilidade

Quatro em cada cinco comerciantes devem concluir **cadastro, venda e consulta sem ajuda**
após uma breve orientação.

## Base técnica

JavaScript · React · Node.js/Express (API REST) · MySQL · GitHub · Figma

## Principais riscos

| Risco | Probabilidade | Ação |
|---|---|---|
| Baixa adesão ao sistema | Média | Testar facilidade e uso continuado; ajustar linguagem e orientação |
| Inconsistência ou perda de dados | Média | Testar vendas e cancelamentos; controlar acessos; manter backups |
| Ampliação do escopo / indisponibilidade da equipe | Média | Priorizar o fluxo básico; revisar capacidade semanalmente |
| Receita insuficiente para manutenção | Média | Estimar custos e investigar disposição a pagar |

---
*Resumo do documento consolidado "Consolidado AV1" (08/10/2026).*
