import { forwardRef } from 'react'
import { IconeBusca } from './Icones.jsx'
import estilos from './CampoBusca.module.css'

/** Campo de busca com lupa (o rótulo é lido pelo leitor de tela). */
export const CampoBusca = forwardRef(function CampoBusca({ valor, aoMudar, rotulo = 'Buscar produto', atalho }, ref) {
  return (
    <label className={estilos.busca}>
      <IconeBusca />
      <input
        ref={ref}
        type="search"
        placeholder={rotulo}
        aria-label={rotulo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
      />
      {atalho && <kbd className={estilos.atalho}>{atalho}</kbd>}
    </label>
  )
})
