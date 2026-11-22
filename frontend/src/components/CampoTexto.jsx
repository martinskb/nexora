import { forwardRef, useId, useState } from 'react'
import { IconeOlho, IconeOlhoFechado } from './Icones.jsx'
import { mascararInteiro, mascararMoeda } from '../utils/mascaras.js'
import estilos from './CampoTexto.module.css'

/**
 * Campo de formulário com rótulo, dica e mensagem de erro acessíveis.
 * Para type="password", mostra um botão de "ver senha".
 * formato: 'inteiro' (só dígitos) ou 'moeda' (a vírgula entra sozinha) — o campo
 * não deixa digitar o que não serve, em vez de reclamar só ao salvar.
 */
export const CampoTexto = forwardRef(function CampoTexto(
  { rotulo, erro, dica, prefixo, type = 'text', formato, onChange, className = '', ...props },
  ref,
) {
  const id = useId()
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const ehSenha = type === 'password'
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined
  const mascara = formato === 'inteiro' ? mascararInteiro : formato === 'moeda' ? mascararMoeda : null
  const aoMudar =
    mascara && onChange
      ? (e) => {
          e.target.value = mascara(e.target.value)
          onChange(e)
        }
      : onChange
  const teclado = formato ? { inputMode: 'numeric', autoComplete: 'off' } : {}

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
          {...teclado}
          {...props}
          onChange={aoMudar}
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
