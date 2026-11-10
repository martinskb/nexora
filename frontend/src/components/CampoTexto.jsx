import { forwardRef, useId, useState } from 'react'
import { IconeOlho, IconeOlhoFechado } from './Icones.jsx'
import estilos from './CampoTexto.module.css'

/**
 * Campo de formulário com rótulo, dica e mensagem de erro acessíveis.
 * Para type="password", mostra um botão de "ver senha".
 */
export const CampoTexto = forwardRef(function CampoTexto(
  { rotulo, erro, dica, prefixo, type = 'text', className = '', ...props },
  ref,
) {
  const id = useId()
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const ehSenha = type === 'password'
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined

  const classesEntrada = [
    estilos.entrada,
    ehSenha && estilos.comBotao,
    prefixo && estilos.comPrefixo,
    erro && estilos.invalida,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`${estilos.campo} ${className}`}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
      </label>
      {dica && (
        <span id={idDica} className={estilos.dica}>
          {dica}
        </span>
      )}
      <div className={estilos.caixa}>
        {prefixo && (
          <span className={estilos.prefixo} aria-hidden="true">
            {prefixo}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={ehSenha && senhaVisivel ? 'text' : type}
          className={classesEntrada}
          aria-invalid={Boolean(erro)}
          aria-describedby={[idDica, idErro].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {ehSenha && (
          <button
            type="button"
            className={estilos.botaoVer}
            onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? 'Esconder senha' : 'Mostrar senha'}
            aria-pressed={senhaVisivel}
          >
            {senhaVisivel ? <IconeOlhoFechado /> : <IconeOlho />}
          </button>
        )}
      </div>
      {erro && (
        <span id={idErro} className={estilos.erro} role="alert">
          {erro}
        </span>
      )}
    </div>
  )
})
