// Cria a loja de demonstração "Mercadinho da Esquina" com cerca de um mês de uso:
// produtos de mercadinho, canais de venda, vendas diárias (mais no fim de semana),
// reposições de mercadoria, uma correção de contagem e alguns cancelamentos.
//
// Tudo passa pelos mesmos serviços do sistema (estoque e histórico ficam
// consistentes); depois as datas são recuadas para os dias simulados.
//
// Uso:
//   npm run seed:demo                         (banco do .env)
//   DOTENV_CONFIG_PATH=.env.producao npm run seed:demo   (outro banco)
//   npm run seed:demo -- --recriar            (apaga a loja demo e cria de novo)
// Variáveis opcionais: DEMO_EMAIL, DEMO_SENHA (senão é gerada e mostrada no fim).
import { randomBytes } from 'node:crypto';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import * as authService from '../src/services/authService.js';
import * as canalService from '../src/services/canalService.js';
import * as estoqueService from '../src/services/estoqueService.js';
import * as produtoService from '../src/services/produtoService.js';
import * as vendaService from '../src/services/vendaService.js';

const NOME = 'Mercadinho da Esquina';
const EMAIL = (process.env.DEMO_EMAIL || 'demo@mercadinhodaesquina.example').toLowerCase();
const SENHA = process.env.DEMO_SENHA || `esquina-${randomBytes(4).toString('hex')}`;
const DIAS = 30;
const FUSO_HORAS = -3; // Belém

// [nome, preço, estoque inicial, mínimo, popularidade (peso), repor?]
// Os três últimos não são repostos, de propósito: a demo termina com dois
// produtos acabando e um sem estoque (o "piso" abaixo segura o saldo final).
const CATALOGO = [
  ['Arroz Tio João 5kg', 28.9, 30, 6, 6, true],
  ['Feijão Carioca 1kg', 8.49, 40, 8, 7, true],
  ["Farinha d'água 1kg", 9.9, 35, 8, 8, true],
  ['Açúcar Cristal 2kg', 9.99, 25, 5, 5, true],
  ['Café Santa Clara 250g', 11.9, 30, 6, 7, true],
  ['Óleo de Soja 900ml', 7.89, 30, 6, 6, true],
  ['Macarrão Espaguete 500g', 4.79, 40, 8, 6, true],
  ['Leite Integral 1L', 5.49, 60, 12, 10, true],
  ['Pão de Forma', 9.49, 20, 5, 6, true],
  ['Biscoito Cream Cracker', 4.99, 30, 6, 5, true],
  ['Biscoito Recheado', 3.29, 50, 10, 8, true],
  ['Sardinha em Lata', 6.49, 30, 6, 4, true],
  ['Ovos (dúzia)', 11.9, 25, 6, 7, true],
  ['Guaraná 2L', 9.5, 30, 6, 7, true],
  ['Água Mineral 1,5L', 3.5, 48, 12, 8, true],
  ['Cerveja Lata 350ml', 4.29, 72, 24, 9, true],
  ['Sabão em Pó 1kg', 14.9, 18, 4, 3, true],
  ['Detergente 500ml', 2.79, 36, 8, 4, true],
  ['Papel Higiênico 4 rolos', 7.99, 24, 6, 4, true],
  ['Creme Dental 90g', 4.49, 24, 5, 3, true],
  ['Sabonete 85g', 2.49, 36, 8, 3, true],
  ['Manteiga 200g', 12.9, 14, 5, 4, false],
  ['Leite em Pó 400g', 19.9, 12, 4, 3, false],
  ['Charque 500g', 24.9, 9, 3, 4, false],
];

// Saldo abaixo do qual a simulação para de vender o produto não reposto.
const PISO = { 'Manteiga 200g': 3, 'Leite em Pó 400g': 2, 'Charque 500g': 0 };

// Gerador pseudoaleatório com semente fixa: rodar de novo gera a mesma loja.
let semente = 20261110;
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
}
const entre = (min, max) => min + Math.floor(aleatorio() * (max - min + 1));
function sortear(itens, pesos) {
  let r = aleatorio() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < itens.length; i++) if ((r -= pesos[i]) < 0) return itens[i];
  return itens.at(-1);
}

/** Instante UTC de um horário local de Belém, `dias` atrás. */
function quando(diasAtras, hora, minuto = 0) {
  const hoje = new Date();
  const local = new Date(hoje.getTime() + FUSO_HORAS * 3_600_000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - diasAtras, hora - FUSO_HORAS, minuto),
  );
}

async function ultimoMov(lojaId) {
  const [[r]] = await pool.query('SELECT COALESCE(MAX(id), 0) AS id FROM movimentacoes_estoque WHERE loja_id = ?', [
    lojaId,
  ]);
  return r.id;
}

/** Recua para `data` as movimentações de estoque criadas pela última operação. */
async function datarMovs(lojaId, desdeId, data) {
  await pool.query('UPDATE movimentacoes_estoque SET criado_em = ? WHERE loja_id = ? AND id > ?', [
    data,
    lojaId,
    desdeId,
  ]);
}

async function main() {
  const recriar = process.argv.includes('--recriar');
  const [[existente]] = await pool.query('SELECT id FROM lojas WHERE email = ?', [EMAIL]);
  if (existente) {
    if (!recriar) {
      console.log(`A loja demo (${EMAIL}) já existe. Use --recriar para apagar e criar de novo.`);
      return;
    }
    await pool.query('DELETE FROM lojas WHERE id = ?', [existente.id]); // apaga em cascata
    console.log('Loja demo anterior apagada.');
  }

  const loja = await authService.cadastrarLoja({ nome: NOME, email: EMAIL, senha: SENHA });
  const lojaId = loja.id;
  await pool.query('UPDATE lojas SET onboarding_concluido = TRUE, criado_em = ? WHERE id = ?', [
    quando(DIAS + 1, 8),
    lojaId,
  ]);

  // Canais: balcão é a venda "sem canal"; WhatsApp e encomenda são registrados à mão.
  const whatsapp = await canalService.criar(lojaId, { nome: 'WhatsApp' });
  const encomenda = await canalService.criar(lojaId, { nome: 'Encomenda' });

  const produtos = [];
  for (const [nome, preco, quantidade, estoqueMinimo, peso, repor] of CATALOGO) {
    const desde = await ultimoMov(lojaId);
    const p = await produtoService.criar(lojaId, { nome, preco, quantidade, estoqueMinimo });
    const data = quando(DIAS + 1, 9, produtos.length);
    await pool.query('UPDATE produtos SET criado_em = ? WHERE id = ?', [data, p.id]);
    await datarMovs(lojaId, desde, data);
    produtos.push({ ...p, peso, repor });
  }

  let vendas = 0;
  let canceladas = 0;
  const agoraLocalHora = new Date(Date.now() + FUSO_HORAS * 3_600_000).getUTCHours();

  for (let d = DIAS; d >= 0; d--) {
    const diaSemana = quando(d, 12).getUTCDay(); // 0 = domingo
    const fimDeSemana = diaSemana === 0 || diaSemana === 6;

    // Segunda e quinta de manhã: chega mercadoria para o que está perto do mínimo.
    if (diaSemana === 1 || diaSemana === 4) {
      const [saldos] = await pool.query('SELECT id, quantidade FROM produtos WHERE loja_id = ?', [lojaId]);
      const saldo = new Map(saldos.map((s) => [s.id, s.quantidade]));
      for (const p of produtos) {
        if (!p.repor || saldo.get(p.id) > p.estoqueMinimo * 2) continue;
        const desde = await ultimoMov(lojaId);
        await estoqueService.ajustar(lojaId, p.id, {
          modo: 'entrada',
          quantidade: p.estoqueMinimo * 4,
          motivo: 'Chegou mercadoria do fornecedor',
        });
        await datarMovs(lojaId, desde, quando(d, 6, entre(0, 50))); // antes de abrir
      }
    }

    // Vendas do dia, em ordem de horário (hoje, só até a hora atual).
    const ultimaHora = d === 0 ? Math.min(agoraLocalHora - 1, 20) : 20;
    if (ultimaHora < 7) continue;
    let anterior = 0; // cada venda pelo menos 1 minuto depois da anterior
    const total = Math.round(entre(9, 16) * (fimDeSemana ? 1.4 : 1) * (d === 0 ? (ultimaHora - 6) / 14 : 1));
    const horarios = Array.from({ length: total }, () => [entre(7, ultimaHora), entre(0, 59)]).sort(
      (a, b) => a[0] - b[0] || a[1] - b[1],
    );

    for (const [hora, minuto] of horarios) {
      const itens = [];
      for (let i = entre(1, 4); i > 0; i--) {
        const p = sortear(
          produtos,
          produtos.map((x) => x.peso),
        );
        const quantidade = entre(1, p.nome.startsWith('Cerveja') ? 6 : 2);
        if (p.nome in PISO) {
          const [[{ quantidade: saldo }]] = await pool.query('SELECT quantidade FROM produtos WHERE id = ?', [p.id]);
          if (saldo - quantidade < PISO[p.nome]) continue;
        }
        itens.push({ produtoId: p.id, quantidade });
      }
      if (itens.length === 0) continue;
      const canal = sortear([null, whatsapp.id, encomenda.id], [75, 20, 5]);
      const data = new Date(Math.max(quando(d, hora, minuto).getTime(), anterior + 60_000));
      anterior = data.getTime();
      const desde = await ultimoMov(lojaId);
      let venda;
      try {
        venda = await vendaService.registrar(lojaId, { itens, canalId: canal, observacao: null });
      } catch (err) {
        if (err.status !== 409 && err.statusCode !== 409 && !/estoque/i.test(err.message)) throw err;
        continue; // faltou estoque para algum item: o cliente levou outra coisa
      }
      await pool.query('UPDATE vendas SET criado_em = ? WHERE id = ?', [data, venda.id]);
      await datarMovs(lojaId, desde, data);
      vendas += 1;

      // De vez em quando o cliente desiste logo depois.
      if (aleatorio() < 0.025) {
        const desdeC = await ultimoMov(lojaId);
        await vendaService.cancelar(lojaId, venda.id, { motivo: 'Cliente desistiu da compra' });
        const dataC = new Date(data.getTime() + 30_000); // antes da próxima venda
        await pool.query('UPDATE vendas SET cancelada_em = ? WHERE id = ?', [dataC, venda.id]);
        await datarMovs(lojaId, desdeC, dataC);
        canceladas += 1;
      }
    }

    // Uma correção de contagem no meio do mês, depois de fechar o caixa.
    if (d === 12) {
      const p = produtos.find((x) => x.nome.startsWith('Ovos'));
      const [[{ quantidade }]] = await pool.query('SELECT quantidade FROM produtos WHERE id = ?', [p.id]);
      const desde = await ultimoMov(lojaId);
      await estoqueService.ajustar(lojaId, p.id, {
        modo: 'contagem',
        quantidade: Math.max(quantidade - 2, 0),
        motivo: 'Contagem: 2 dúzias quebradas',
      });
      await datarMovs(lojaId, desde, quando(d, 22, 0));
    }
  }

  const [[situacao]] = await pool.query(
    `SELECT SUM(quantidade = 0) AS zerados,
            SUM(quantidade > 0 AND quantidade <= estoque_minimo) AS acabando
     FROM produtos WHERE loja_id = ?`,
    [lojaId],
  );
  console.log(`\nLoja "${NOME}" criada no banco "${env.db.database}":`);
  console.log(`  ${produtos.length} produtos, ${vendas} vendas em ${DIAS + 1} dias (${canceladas} canceladas)`);
  console.log(`  ${Number(situacao.acabando)} produto(s) acabando, ${Number(situacao.zerados)} sem estoque`);
  console.log(`\n  E-mail: ${EMAIL}`);
  console.log(`  Senha:  ${process.env.DEMO_SENHA ? '(a que você definiu em DEMO_SENHA)' : SENHA}\n`);
}

try {
  await main();
} finally {
  await pool.end();
}
