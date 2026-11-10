import { useTema } from '../hooks/useTema.js'
import { IconeLua, IconeSol } from './Icones.jsx'
import { Botao } from './Botao.jsx'

export function BotaoTema() {
  const { tema, alternar } = useTema()
  const proximo = tema === 'escuro' ? 'claro' : 'escuro'
  return (
    <Botao variante="fantasma" onClick={alternar} aria-label={`Usar tema ${proximo}`} title={`Usar tema ${proximo}`}>
      {tema === 'escuro' ? <IconeSol /> : <IconeLua />}
    </Botao>
  )
}
