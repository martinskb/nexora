import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { normalizarPagamentos } from '../utils/pagamentos.js';
import { buscarAtivo } from './canalService.js';

const NAO_ENCONTRADA = 'Venda não encontrada.';
const centavos = (v) => Math.round(v * 100);

/** Junta itens repetidos do mesmo produto somando as quantidades. */
function agruparItens(itens) {
  const mapa = new Map();
  for (const { produtoId, quantidade } of itens) {
    mapa.set(produtoId, (mapa.get(produtoId) ?? 0) + quantidade);
  }
  return [...mapa].map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

/**
 * Registra uma venda e dá baixa no estoque — tudo ou nada.
 *
 * Fluxo (uma única transação):
 *  1. trava as linhas dos produtos (SELECT ... FOR UPDATE, em ordem de id para evitar deadlock)
 *  2. confere se todos existem, pertencem à loja e têm saldo suficiente
 *  3. grava venda e itens com o preço ATUAL do cadastro (o cliente não define preço)
 *  4. desconta o estoque e registra cada saída no histórico
 *
 * Este é o ponto único de registro de vendas: tela de venda e futuras
 * integrações (WhatsApp, marketplaces) devem usar esta função.
 */
export async function registrar(lojaId, { itens, canalId = null, observacao, pagamentos }) {
  const pedidos = agruparItens(itens).sort((a, b) => a.produtoId - b.produtoId);
  const ids = pedidos.map((p) => p.produtoId);

  const vendaId = await withTransaction(async (conn) => {
    if (canalId !== null && !(await buscarAtivo(conn, lojaId, canalId))) {
      throw new AppError('Origem da venda inválida.', 400, { canalId: 'Origem da venda inválida.' });
    }
    const [produtos] = await conn.query(
      `SELECT id, nome, preco, custo, quantidade FROM produtos
       WHERE loja_id = ? AND ativo = TRUE AND id IN (?) ORDER BY id FOR UPDATE`,
      [lojaId, ids],
    );
    const porId = new Map(produtos.map((p) => [p.id, p]));

    const inexistentes = ids.filter((id) => !porId.has(id));
    if (inexistentes.length) {
      throw new AppError('Um ou mais produtos não foram encontrados. Atualize a página e tente de novo.', 404, {
        produtosNaoEncontrados: inexistentes,
      });
    }

    const semSaldo = pedidos
      .filter((p) => porId.get(p.produtoId).quantidade < p.quantidade)
      .map((p) => {
        const prod = porId.get(p.produtoId);
        return { produtoId: prod.id, nome: prod.nome, disponivel: prod.quantidade, solicitado: p.quantidade };
      });
    if (semSaldo.length) {
      const primeiro = semSaldo[0];
      throw new AppError(
        `Estoque insuficiente: o sistema mostra ${primeiro.disponivel} unidade(s) de "${primeiro.nome}".`,
        409,
        { estoqueInsuficiente: semSaldo },
      );
    }

    // Soma em centavos para evitar erros de arredondamento.
    const linhas = pedidos.map((p) => {
      const prod = porId.get(p.produtoId);
      const subtotalCentavos = centavos(prod.preco) * p.quantidade;
      return {
        ...p,
        preco: prod.preco,
        custo: prod.custo, // cópia do custo atual: o lucro desta venda não muda depois
        subtotal: subtotalCentavos / 100,
        saldoApos: prod.quantidade - p.quantidade,
      };
    });
    const totalCentavos = linhas.reduce((s, l) => s + centavos(l.subtotal), 0);
    const total = totalCentavos / 100;
    // Confere a forma de pagamento antes de gravar qualquer coisa.
    const formas = normalizarPagamentos(pagamentos, totalCentavos);

    const [venda] = await conn.execute(
      'INSERT INTO vendas (loja_id, total, canal_id, observacao) VALUES (?, ?, ?, ?)',
      [lojaId, total, canalId, observacao],
    );

    for (const l of linhas) {
      await conn.execute(
        `INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, custo_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [venda.insertId, l.produtoId, l.quantidade, l.preco, l.custo, l.subtotal],
      );
      await conn.execute('UPDATE produtos SET quantidade = ? WHERE id = ? AND loja_id = ?', [
        l.saldoApos,
        l.produtoId,
        lojaId,
      ]);
      await conn.execute(
        `INSERT INTO movimentacoes_estoque (loja_id, produto_id, tipo, quantidade, saldo_apos, venda_id)
         VALUES (?, ?, 'venda', ?, ?, ?)`,
        [lojaId, l.produtoId, -l.quantidade, l.saldoApos, venda.insertId],
      );
    }
    for (const f of formas) {
      await conn.execute('INSERT INTO pagamentos_venda (venda_id, forma, valor) VALUES (?, ?, ?)', [
        venda.insertId,
        f.forma,
        f.valorCentavos / 100,
      ]);
    }
    return venda.insertId;
  });

  return buscar(lojaId, vendaId);
}

/** Pagamentos de várias vendas de uma vez: Map vendaId → [{ forma, valor }]. */
async function pagamentosDe(ids) {
  const mapa = new Map(ids.map((id) => [id, []]));
  if (ids.length === 0) return mapa;
  const [rows] = await pool.query(
    'SELECT venda_id, forma, valor FROM pagamentos_venda WHERE venda_id IN (?) ORDER BY id',
    [ids],
  );
  for (const r of rows) mapa.get(r.venda_id)?.push({ forma: r.forma, valor: Number(r.valor) });
  return mapa;
}

function paraVendaPublica(row) {
  return {
    id: row.id,
    total: Number(row.total),
    status: row.status,
    canal: row.canal_id ? { id: row.canal_id, nome: row.canal_nome } : null,
    observacao: row.observacao,
    motivoCancelamento: row.motivo_cancelamento,
    canceladaEm: row.cancelada_em,
    criadoEm: row.criado_em,
  };
}

export async function buscar(lojaId, id) {
  const [rows] = await pool.execute(
    `SELECT v.*, c.nome AS canal_nome FROM vendas v LEFT JOIN canais c ON c.id = v.canal_id
     WHERE v.id = ? AND v.loja_id = ?`,
    [id, lojaId],
  );
  if (!rows[0]) throw new AppError(NAO_ENCONTRADA, 404);

  // O nome vem do produto mesmo que ele tenha sido removido depois (histórico preservado).
  const [itens] = await pool.execute(
    `SELECT i.produto_id, p.nome, i.quantidade, i.preco_unitario, i.subtotal
     FROM itens_venda i JOIN produtos p ON p.id = i.produto_id
     WHERE i.venda_id = ? ORDER BY i.id`,
    [id],
  );
  const pagamentos = (await pagamentosDe([rows[0].id])).get(rows[0].id);
  return {
    ...paraVendaPublica(rows[0]),
    pagamentos,
    itens: itens.map((i) => ({
      produtoId: i.produto_id,
      nome: i.nome,
      quantidade: i.quantidade,
      precoUnitario: Number(i.preco_unitario),
      subtotal: Number(i.subtotal),
    })),
  };
}

/** Lista vendas (mais recentes primeiro) com filtros e paginação por id. */
export async function listar(lojaId, { de, ate, canalId, status, forma, limite, antesDe }) {
  const condicoes = ['v.loja_id = ?'];
  const params = [lojaId];
  if (de) {
    condicoes.push('v.criado_em >= ?');
    params.push(new Date(de));
  }
  if (ate) {
    condicoes.push('v.criado_em < ?');
    params.push(new Date(ate));
  }
  if (canalId === 'sem') {
    condicoes.push('v.canal_id IS NULL');
  } else if (canalId) {
    condicoes.push('v.canal_id = ?');
    params.push(canalId);
  }
  if (status) {
    condicoes.push('v.status = ?');
    params.push(status);
  }
  if (forma === 'nao_informado') {
    condicoes.push('NOT EXISTS (SELECT 1 FROM pagamentos_venda pg WHERE pg.venda_id = v.id)');
  } else if (forma) {
    condicoes.push('EXISTS (SELECT 1 FROM pagamentos_venda pg WHERE pg.venda_id = v.id AND pg.forma = ?)');
    params.push(forma);
  }
  if (antesDe) {
    condicoes.push('v.id < ?');
    params.push(antesDe);
  }

  // Busca um a mais que o limite para saber se existe próxima página.
  const [rows] = await pool.query(
    `SELECT v.*, c.nome AS canal_nome,
            (SELECT COALESCE(SUM(i.quantidade), 0) FROM itens_venda i WHERE i.venda_id = v.id) AS qtd_itens,
            (SELECT GROUP_CONCAT(p.nome ORDER BY i.id SEPARATOR ', ')
               FROM itens_venda i JOIN produtos p ON p.id = i.produto_id WHERE i.venda_id = v.id) AS resumo
     FROM vendas v
     LEFT JOIN canais c ON c.id = v.canal_id
     WHERE ${condicoes.join(' AND ')}
     ORDER BY v.id DESC
     LIMIT ?`,
    [...params, limite + 1],
  );

  const temMais = rows.length > limite;
  const pagina = rows.slice(0, limite);
  const pagamentos = await pagamentosDe(pagina.map((r) => r.id));
  const vendas = pagina.map((r) => ({
    ...paraVendaPublica(r),
    pagamentos: pagamentos.get(r.id),
    quantidadeItens: Number(r.qtd_itens),
    resumo: r.resumo,
  }));
  return { vendas, temMais };
}

/** Quanto saiu de cada produto no período (vendas concluídas), do mais vendido para o menos. */
export async function produtosVendidos(lojaId, { de, ate }) {
  const [rows] = await pool.query(
    `SELECT i.produto_id, p.nome, SUM(i.quantidade) AS quantidade, SUM(i.subtotal) AS valor
       FROM itens_venda i JOIN vendas v ON v.id = i.venda_id JOIN produtos p ON p.id = i.produto_id
      WHERE v.loja_id = ? AND v.status = 'concluida' AND v.criado_em >= ? AND v.criado_em < ?
      GROUP BY i.produto_id, p.nome
      ORDER BY quantidade DESC, p.nome`,
    [lojaId, new Date(de), new Date(ate)],
  );
  return rows.map((r) => ({
    produtoId: r.produto_id,
    nome: r.nome,
    quantidade: Number(r.quantidade),
    valor: Math.round(Number(r.valor) * 100) / 100,
  }));
}

/** Cancela a venda e devolve as quantidades ao estoque (tudo ou nada). */
export async function cancelar(lojaId, id, { motivo }) {
  await withTransaction(async (conn) => {
    const [vendas] = await conn.execute('SELECT status FROM vendas WHERE id = ? AND loja_id = ? FOR UPDATE', [
      id,
      lojaId,
    ]);
    if (!vendas[0]) throw new AppError(NAO_ENCONTRADA, 404);
    if (vendas[0].status === 'cancelada') throw new AppError('Esta venda já foi cancelada.', 409);

    const [itens] = await conn.execute(
      'SELECT produto_id, quantidade FROM itens_venda WHERE venda_id = ? ORDER BY produto_id',
      [id],
    );
    for (const item of itens) {
      // Trava o produto e devolve as unidades (mesmo que o produto tenha sido removido da lista).
      const [prod] = await conn.execute(
        'SELECT quantidade FROM produtos WHERE id = ? AND loja_id = ? FOR UPDATE',
        [item.produto_id, lojaId],
      );
      const saldoApos = prod[0].quantidade + item.quantidade;
      await conn.execute('UPDATE produtos SET quantidade = ? WHERE id = ?', [saldoApos, item.produto_id]);
      await conn.execute(
        `INSERT INTO movimentacoes_estoque (loja_id, produto_id, tipo, quantidade, saldo_apos, motivo, venda_id)
         VALUES (?, ?, 'cancelamento', ?, ?, ?, ?)`,
        [lojaId, item.produto_id, item.quantidade, saldoApos, motivo, id],
      );
    }

    await conn.execute(
      "UPDATE vendas SET status = 'cancelada', motivo_cancelamento = ?, cancelada_em = UTC_TIMESTAMP() WHERE id = ?",
      [motivo, id],
    );
  });
  return buscar(lojaId, id);
}
