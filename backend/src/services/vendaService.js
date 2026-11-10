import { pool, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

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
export async function registrar(lojaId, { itens, canal, observacao }) {
  const pedidos = agruparItens(itens).sort((a, b) => a.produtoId - b.produtoId);
  const ids = pedidos.map((p) => p.produtoId);

  const vendaId = await withTransaction(async (conn) => {
    const [produtos] = await conn.query(
      `SELECT id, nome, preco, quantidade FROM produtos
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
      return { ...p, preco: prod.preco, subtotal: subtotalCentavos / 100, saldoApos: prod.quantidade - p.quantidade };
    });
    const total = linhas.reduce((s, l) => s + centavos(l.subtotal), 0) / 100;

    const [venda] = await conn.execute(
      'INSERT INTO vendas (loja_id, total, canal, observacao) VALUES (?, ?, ?, ?)',
      [lojaId, total, canal, observacao],
    );

    for (const l of linhas) {
      await conn.execute(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [venda.insertId, l.produtoId, l.quantidade, l.preco, l.subtotal],
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
    return venda.insertId;
  });

  return buscar(lojaId, vendaId);
}

function paraVendaPublica(row) {
  return {
    id: row.id,
    total: Number(row.total),
    status: row.status,
    canal: row.canal,
    observacao: row.observacao,
    motivoCancelamento: row.motivo_cancelamento,
    canceladaEm: row.cancelada_em,
    criadoEm: row.criado_em,
  };
}

export async function buscar(lojaId, id) {
  const [rows] = await pool.execute('SELECT * FROM vendas WHERE id = ? AND loja_id = ?', [id, lojaId]);
  if (!rows[0]) throw new AppError(NAO_ENCONTRADA, 404);

  // O nome vem do produto mesmo que ele tenha sido removido depois (histórico preservado).
  const [itens] = await pool.execute(
    `SELECT i.produto_id, p.nome, i.quantidade, i.preco_unitario, i.subtotal
     FROM itens_venda i JOIN produtos p ON p.id = i.produto_id
     WHERE i.venda_id = ? ORDER BY i.id`,
    [id],
  );
  return {
    ...paraVendaPublica(rows[0]),
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
export async function listar(lojaId, { de, ate, canal, status, limite, antesDe }) {
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
  if (canal) {
    condicoes.push('v.canal = ?');
    params.push(canal);
  }
  if (status) {
    condicoes.push('v.status = ?');
    params.push(status);
  }
  if (antesDe) {
    condicoes.push('v.id < ?');
    params.push(antesDe);
  }

  // Busca um a mais que o limite para saber se existe próxima página.
  const [rows] = await pool.query(
    `SELECT v.*,
            (SELECT COALESCE(SUM(i.quantidade), 0) FROM itens_venda i WHERE i.venda_id = v.id) AS qtd_itens,
            (SELECT GROUP_CONCAT(p.nome ORDER BY i.id SEPARATOR ', ')
               FROM itens_venda i JOIN produtos p ON p.id = i.produto_id WHERE i.venda_id = v.id) AS resumo
     FROM vendas v
     WHERE ${condicoes.join(' AND ')}
     ORDER BY v.id DESC
     LIMIT ?`,
    [...params, limite + 1],
  );

  const temMais = rows.length > limite;
  const vendas = rows.slice(0, limite).map((r) => ({
    ...paraVendaPublica(r),
    quantidadeItens: Number(r.qtd_itens),
    resumo: r.resumo,
  }));
  return { vendas, temMais };
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
