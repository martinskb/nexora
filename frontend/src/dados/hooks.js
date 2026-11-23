import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { canaisApi } from '../api/canais.js'
import { produtosApi } from '../api/produtos.js'
import { relatorioApi } from '../api/relatorio.js'
import { resumoApi } from '../api/resumo.js'
import { vendasApi } from '../api/vendas.js'
import { intervaloAnterior } from '../utils/comparacao.js'
import { intervaloDoPeriodo } from '../utils/datas.js'
import { VALIDADE_MS, chaves, invalidacoesApos } from './consultas.js'

function consultaResumo(intervalo) {
  return {
    queryKey: chaves.resumo(intervalo.de, intervalo.ate),
    queryFn: ({ signal }) => resumoApi.obter(intervalo, signal),
    staleTime: VALIDADE_MS.resumo,
    placeholderData: keepPreviousData,
  }
}

/** Resumo do período e do período anterior equivalente (para as comparações). */
export function useResumoComparado(periodo) {
  const atual = useQuery(consultaResumo(intervaloDoPeriodo(periodo)))
  const anterior = useQuery(consultaResumo(intervaloAnterior(periodo)))
  return {
    atual: atual.data,
    anterior: anterior.data,
    carregando: atual.isPending,
    atualizando: atual.isFetching && !atual.isPending,
    atualizadoEm: atual.dataUpdatedAt,
    erro: atual.error?.message ?? '',
    recarregar: () => Promise.all([atual.refetch(), anterior.refetch()]),
  }
}

const consultaProdutos = {
  queryKey: chaves.produtos(),
  queryFn: ({ signal }) => produtosApi.listar(signal),
  staleTime: VALIDADE_MS.produtos,
}

/** Lista de produtos: `data` é o array de produtos. */
export const useProdutos = () => useQuery({ ...consultaProdutos, select: (d) => d.produtos })

const consultaCanais = {
  queryKey: chaves.canais(),
  queryFn: ({ signal }) => canaisApi.listar(signal),
  staleTime: VALIDADE_MS.canais,
}

/** Canais de venda da loja; `ativos`: só os não arquivados (a API já ordena por nome). */
export function useCanais() {
  const q = useQuery(consultaCanais)
  const canais = useMemo(() => q.data?.canais ?? [], [q.data])
  const ativos = useMemo(() => canais.filter((c) => c.ativo), [canais])
  return { canais, ativos, carregando: q.isPending, erro: q.error?.message ?? '', recarregar: q.refetch }
}

function consultaVendas(filtros) {
  return {
    queryKey: chaves.vendas(filtros),
    queryFn: ({ pageParam, signal }) => vendasApi.listar({ ...filtros, antesDe: pageParam }, signal),
    initialPageParam: undefined,
    getNextPageParam: (ultima) => (ultima.temMais ? ultima.vendas.at(-1)?.id : undefined),
    staleTime: VALIDADE_MS.vendas,
    placeholderData: keepPreviousData,
  }
}

/** Vendas filtradas, paginadas por "Carregar mais". `vendas`: todas as páginas juntas. */
export function useVendas(filtros) {
  const q = useInfiniteQuery(consultaVendas(filtros))
  const vendas = useMemo(() => q.data?.pages.flatMap((p) => p.vendas) ?? [], [q.data])
  return { ...q, vendas }
}

export const useVenda = (id) =>
  useQuery({ queryKey: chaves.venda(id), queryFn: () => vendasApi.buscar(id), enabled: id != null })

/**
 * Relatório do dia local "AAAA-MM-DD". Sem reaproveitar os dados de outro dia
 * enquanto carrega: o rótulo "Ontem" nunca aparece com os números de hoje.
 */
export const opcoesRelatorio = (dia) => ({
  queryKey: chaves.relatorio(dia),
  queryFn: ({ signal }) => relatorioApi.obter(dia, signal),
  staleTime: VALIDADE_MS.relatorio,
})
export const useRelatorio = (dia) => useQuery(opcoesRelatorio(dia))

/** Produtos vendidos no período { de, ate }: `data` é a lista. */
export const useProdutosVendidos = (filtros, { ativo = true } = {}) =>
  useQuery({
    enabled: ativo,
    queryKey: chaves.vendasProdutos(filtros),
    queryFn: ({ signal }) => vendasApi.produtos(filtros, signal),
    select: (d) => d.produtos,
    staleTime: VALIDADE_MS.vendas,
    placeholderData: keepPreviousData,
  })

/** Atualiza o que depende de uma mudança (venda, cancelamento, produto, ajuste, canal). */
export function useInvalidar() {
  const cliente = useQueryClient()
  return useCallback(
    (evento, extra) =>
      Promise.all(invalidacoesApos(evento, extra).map((queryKey) => cliente.invalidateQueries({ queryKey }))),
    [cliente],
  )
}

/** Busca antecipada dos dados de outras telas (para trocar de aba sem espera). */
export function useAntecipar() {
  const cliente = useQueryClient()
  return useMemo(
    () => ({
      produtos: () => cliente.prefetchQuery(consultaProdutos),
      canais: () => cliente.prefetchQuery(consultaCanais),
      vendas: (filtros) => cliente.prefetchInfiniteQuery(consultaVendas(filtros)),
      resumo: (periodo) => cliente.prefetchQuery(consultaResumo(intervaloDoPeriodo(periodo))),
    }),
    [cliente],
  )
}

/** Filtros da lista de Vendas na forma da API (a mesma chave usada pela tela e pela busca antecipada). */
export const filtrosDeVendas = ({ periodo, canalId, status, forma = '' }) => ({ ...intervaloDoPeriodo(periodo), canalId, status, forma })

export const FILTRO_VENDAS_PADRAO = { periodo: 'hoje', canalId: '', status: '', forma: '' }
