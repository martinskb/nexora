import { pool } from '../config/db.js';

const UM_DIA = 86_400_000;
const LIMITE_MAIS_VENDIDOS = 5;
const LIMITE_ALERTAS = 8;
const dinheiro = (v) => Math.round(Number(v) * 100) / 100;

/** "YYYY-MM-DD" do instante `data` no fuso informado (minutos em relação ao UTC). */
function diaLocal(data, fuso) {
  return new Date(data.getTime() + fuso * 60_000).toISOString().slice(0, 10);
}

/** Lista todos os dias locais do período, para o gráfico mostrar também os dias sem venda. */
function diasDoPeriodo(de, ate, fuso) {
  const dias = [];
  const fim = diaLocal(new Date(ate.getTime() - 1), fuso);
  for (let d = diaLocal(de, fuso); d <= fim; ) {
    dias.push(d);
    d = new Date(Date.parse(`${d}T00:00:00Z`) + UM_DIA).toISOString().slice(0, 10);
  }
  return dias;
}

/**
 * Resumo de vendas (F5) de um período: totais, origem, vendas por dia,
 * mais vendidos e alertas de estoque. Vendas canceladas não entram nos totais.
 */
export async function gerar(lojaId, { de: deIso, ate: ateIso, fuso }) {
  const de = new Date(deIso);
  const ate = new Date(ateIso);
  const periodo = [lojaId, de, ate];
  const noPeriodo = 'v.loja_id = ? AND v.criado_em >= ? AND v.criado_em < ?';

  const [[totais], [porCanal], [porDia], [maisVendidos], [alertas], [[contagemAlertas]]] = await Promise.all([
    pool.query(
      `SELECT
         SUM(v.status = 'concluida')                              AS vendas,
         COALESCE(SUM(CASE WHEN v.status = 'concluida' THEN v.total END), 0) AS valor,
         SUM(v.status = 'cancelada')                              AS canceladas,
         COALESCE(SUM(CASE WHEN v.status = 'cancelada' THEN v.total END), 0) AS valor_cancelado
       FROM vendas v WHERE ${noPeriodo}`,
      periodo,
    ),
    pool.query(
      `SELECT v.canal, COUNT(*) AS vendas, SUM(v.total) AS valor
       FROM vendas v WHERE ${noPeriodo} AND v.status = 'concluida'
       GROUP BY v.canal`,
      periodo,
    ),
    pool.query(
      `SELECT DATE_FORMAT(DATE_ADD(v.criado_em, INTERVAL ? MINUTE), '%Y-%m-%d') AS dia,
              COUNT(*) AS vendas, SUM(v.total) AS valor
       FROM vendas v WHERE ${noPeriodo} AND v.status = 'concluida'
       GROUP BY dia`,
      [fuso, ...periodo],
    ),
    pool.query(
      `SELECT i.produto_id, p.nome, SUM(i.quantidade) AS quantidade, SUM(i.subtotal) AS valor
       FROM itens_venda i
       JOIN vendas v   ON v.id = i.venda_id
       JOIN produtos p ON p.id = i.produto_id
       WHERE ${noPeriodo} AND v.status = 'concluida'
       GROUP BY i.produto_id, p.nome
       ORDER BY quantidade DESC, valor DESC, p.nome
       LIMIT ?`,
      [...periodo, LIMITE_MAIS_VENDIDOS],
    ),
    pool.query(
      `SELECT id, nome, quantidade, estoque_minimo
       FROM produtos
       WHERE loja_id = ? AND ativo = TRUE
         AND (quantidade = 0 OR (estoque_minimo > 0 AND quantidade <= estoque_minimo))
       ORDER BY quantidade, nome
       LIMIT ?`,
      [lojaId, LIMITE_ALERTAS],
    ),
    pool.query(
      `SELECT SUM(quantidade = 0) AS zerados,
              SUM(quantidade > 0 AND estoque_minimo > 0 AND quantidade <= estoque_minimo) AS acabando
       FROM produtos WHERE loja_id = ? AND ativo = TRUE`,
      [lojaId],
    ),
  ]);

  const t = totais[0];
  const vendas = Number(t.vendas ?? 0);
  const valor = dinheiro(t.valor);

  const porDiaMapa = new Map(porDia.map((d) => [d.dia, d]));
  const canais = new Map(porCanal.map((c) => [c.canal, c]));

  return {
    totais: {
      valor,
      vendas,
      ticketMedio: vendas ? dinheiro(valor / vendas) : 0,
      canceladas: Number(t.canceladas ?? 0),
      valorCancelado: dinheiro(t.valor_cancelado),
    },
    porCanal: ['balcao', 'whatsapp'].map((canal) => ({
      canal,
      vendas: Number(canais.get(canal)?.vendas ?? 0),
      valor: dinheiro(canais.get(canal)?.valor ?? 0),
    })),
    porDia: diasDoPeriodo(de, ate, fuso).map((dia) => ({
      dia,
      vendas: Number(porDiaMapa.get(dia)?.vendas ?? 0),
      valor: dinheiro(porDiaMapa.get(dia)?.valor ?? 0),
    })),
    maisVendidos: maisVendidos.map((m) => ({
      produtoId: m.produto_id,
      nome: m.nome,
      quantidade: Number(m.quantidade),
      valor: dinheiro(m.valor),
    })),
    alertasEstoque: {
      zerados: Number(contagemAlertas.zerados ?? 0),
      acabando: Number(contagemAlertas.acabando ?? 0),
      produtos: alertas.map((p) => ({
        id: p.id,
        nome: p.nome,
        quantidade: p.quantidade,
        estoqueMinimo: p.estoque_minimo,
      })),
    },
  };
}
