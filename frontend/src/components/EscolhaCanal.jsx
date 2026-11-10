import { useId } from 'react'
import { Segmentado } from './Segmentado.jsx'
import estilos from './EscolhaCanal.module.css'

/**
 * Escolha de canal de venda. Com poucos canais, botões lado a lado (Segmentado);
 * com muitos (`usarLista`, decidido por quem chama: mais de 3 canais), lista suspensa.
 * opcoes: [{ valor: string, rotulo }]
 */
export function EscolhaCanal({ rotulo, opcoes, valor, aoMudar, usarLista = false, tamanho = 'normal' }) {
  const id = useId()
  if (!usarLista) {
    return <Segmentado rotulo={rotulo} tamanho={tamanho} opcoes={opcoes} valor={valor} aoMudar={aoMudar} />
  }
  return (
    <div className={`${estilos.campo} ${estilos[tamanho]}`}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
      </label>
      <select id={id} className={estilos.lista} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}
