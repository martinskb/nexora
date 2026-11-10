import { IconeAlerta, IconeCheck } from './Icones.jsx'
import estilos from './Alerta.module.css'

/** Mensagem em destaque. tipo: 'erro' | 'sucesso' | 'aviso' */
export function Alerta({ tipo = 'erro', children }) {
  if (!children) return null
  return (
    <div className={`${estilos.alerta} ${estilos[tipo]}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {tipo === 'sucesso' ? <IconeCheck /> : <IconeAlerta />}
      <span>{children}</span>
    </div>
  )
}
