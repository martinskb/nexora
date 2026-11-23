import { useId } from 'react'
import estilos from './Segmentado.module.css'

/**
 * Grupo de opções exclusivas (ex.: Hoje | 7 dias | 30 dias), acessível como radio.
 * opcoes: [{ valor, rotulo }]
 */
export function Segmentado({ rotulo, opcoes, valor, aoMudar, tamanho = 'normal' }) {
  const nome = useId()
  return (
    <fieldset className={`${estilos.grupo} ${estilos[tamanho]}`}>
      <legend className={estilos.legenda}>{rotulo}</legend>
      <div className={estilos.opcoes}>
        {opcoes.map((op) => (
          <label key={op.valor} className={`${estilos.opcao} ${op.valor === valor ? estilos.ativa : ''}`}>
            <input
              type="radio"
              name={nome}
              value={op.valor}
              checked={op.valor === valor}
              onChange={() => aoMudar(op.valor)}
            />
            {op.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
