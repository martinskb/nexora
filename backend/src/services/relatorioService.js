import { pool } from '../config/db.js';

const UM_DIA = 86_400_000;
const centavos = (v) => Math.round(Number(v) * 100);

/** Início e fim (UTC) do dia local "AAAA-MM-DD" no fuso informado (minutos em relação ao UTC). */
export function intervaloDoDia(dia, fuso) {
  const [ano, mes, d] = dia.split('-').map(Number);
  const de = new Date(Date.UTC(ano, mes - 1, d) - fuso * 60_000);
  return { de, ate: new Date(de.getTime() + UM_DIA) };
}

const DO_DIA = `v.loja_id = ? AND v.status = 'concluida' AND v.criado_em >= ? AND v.criado_em < ?`;

/**
 * Relatório do dia (fechamento): vendido, divisão por forma de pagamento e
 * lucro. Só vendas concluídas. O lucro usa o custo copiado em cada item no
 * momento da venda; itens sem custo deixam o lucro "parcial".
 */
export async function gerar(lojaId, { dia, fuso }) {
  const { de, ate } = intervaloDoDia(dia, fuso);
  const params = [lojaId, de, ate];

  const [[[totais]], [formas], [[semForma]], [itens]] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS vendas, COALESCE(SUM(v.total), 0) AS vendido FROM vendas v WHERE ${DO_DIA}`, params),
    pool.query(
      `SELECT pg.forma, SUM(pg.valor) AS valor
         FROM pagamentos_venda pg JOIN vendas v ON v.id = pg.venda_id
        WHERE ${DO_DIA} GROUP BY pg.forma`,
      params,
    ),
    pool.query(
      `SELECT COALESCE(SUM(v.total), 0) AS valor FROM vendas v
        WHERE ${DO_DIA} AND NOT EXISTS (SELECT 1 FROM pagamentos_venda pg WHERE pg.venda_id = v.id)`,
      params,
    ),
    pool.query(
      `SELECT i.produto_id, p.nome, i.quantidade, i.subtotal, i.custo_unitario
         FROM itens_venda i JOIN vendas v ON v.id = i.venda_id JOIN produtos p ON p.id = i.produto_id
        WHERE ${DO_DIA}`,
      params,
    ),
  ]);

  const porForma = { dinheiro: 0, pix: 0, cartao: 0, naoInformado: centavos(semForma.valor) / 100 };
  for (const f of formas) porForma[f.forma] = centavos(f.valor) / 100;

  let lucroCentavos = 0;
  let receitaComCusto = 0;
  const semCusto = new Map();
  for (const i of itens) {
    if (i.custo_unitario === null) {
      semCusto.set(i.produto_id, i.nome);
      continue;
    }
    receitaComCusto += centavos(i.subtotal);
    lucroCentavos += centavos(i.subtotal) - centavos(i.custo_unitario) * i.quantidade;
  }

  return {
    dia,
    vendido: centavos(totais.vendido) / 100,
    vendas: Number(totais.vendas),
    porForma,
    lucro: {
      valor: lucroCentavos / 100,
      receitaComCusto: receitaComCusto / 100,
      margem: receitaComCusto > 0 ? Math.round((lucroCentavos / receitaComCusto) * 100) : null,
      parcial: semCusto.size > 0,
      produtosSemCusto: [...semCusto].map(([id, nome]) => ({ id, nome })),
    },
  };
}
