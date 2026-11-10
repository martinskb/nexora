/**
 * Marcas "redondas" para o eixo Y: passo 1, 2 ou 5 × 10^n, com ~4 divisões.
 * Ex.: max 37 → [0, 10, 20, 30, 40]
 */
export function marcasEixo(maximo, divisoes = 4) {
  if (!(maximo > 0)) return [0, 1]
  const bruto = maximo / divisoes
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= bruto)
  const topo = Math.ceil(maximo / passo) * passo
  const marcas = []
  for (let v = 0; v <= topo + passo / 2; v += passo) marcas.push(Math.round(v * 100) / 100)
  return marcas
}

/** Rótulo do eixo: completo abaixo de 10 mil, compacto acima ("12 mil"). */
export function rotuloEixo(valor, maximo) {
  return new Intl.NumberFormat('pt-BR', {
    notation: maximo >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: maximo >= 10_000 ? 1 : 0,
  }).format(valor)
}

/** "2026-11-10" → Date local (meia-noite), sem deslocamento de fuso. */
export function dataDoDia(dia) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a, m - 1, d)
}
