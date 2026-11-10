import { useState } from 'react'
import { ApiError } from '../api/client.js'

/**
 * Estado comum de formulários: valores, erros por campo, erro geral e envio.
 * `enviar(validar, acao)` valida localmente, chama a ação e distribui os
 * erros vindos da API nos campos certos.
 */
export function useFormulario(valoresIniciais) {
  const [valores, setValores] = useState(valoresIniciais)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alterar(evento) {
    const { name, value } = evento.target
    setValores((v) => ({ ...v, [name]: value }))
    // Ao corrigir um campo, a mensagem de erro dele some.
    if (erros[name]) setErros(({ [name]: _removido, ...resto }) => resto)
  }

  async function enviar(validar, acao) {
    setErroGeral('')
    const errosLocais = validar ? validar(valores) : {}
    setErros(errosLocais)
    if (Object.keys(errosLocais).length > 0) return false

    setEnviando(true)
    try {
      await acao(valores)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErros(err.details)
        if (err.status !== 400) setErroGeral(err.message)
      } else {
        setErroGeral(err.message || 'Não foi possível concluir. Verifique sua conexão e tente de novo.')
      }
      return false
    } finally {
      setEnviando(false)
    }
  }

  return { valores, setValores, erros, erroGeral, enviando, alterar, enviar }
}
