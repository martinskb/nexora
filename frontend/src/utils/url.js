/** Query string só com os valores preenchidos (sem "de=undefined"). */
export function parametros(objeto) {
  const p = new URLSearchParams()
  for (const [chave, valor] of Object.entries(objeto)) {
    if (valor !== undefined && valor !== null && valor !== '') p.set(chave, valor)
  }
  return p.toString()
}
