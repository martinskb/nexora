// Validações do lado do navegador (a API valida de novo; aqui é para avisar rápido).

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarEmail(email) {
  const valor = email.trim()
  if (!valor) return 'Informe o e-mail.'
  if (!REGEX_EMAIL.test(valor)) return 'E-mail inválido. Exemplo: loja@email.com'
  return null
}

export function validarLogin({ email, senha }) {
  const erros = {}
  const erroEmail = validarEmail(email)
  if (erroEmail) erros.email = erroEmail
  if (!senha) erros.senha = 'Informe a senha.'
  return erros
}

export function validarCadastro({ nome, email, senha }) {
  const erros = {}
  if (nome.trim().length < 2) erros.nome = 'Informe o nome da loja (pelo menos 2 letras).'
  const erroEmail = validarEmail(email)
  if (erroEmail) erros.email = erroEmail
  if (senha.length < 8) erros.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  else if (senha.length > 72) erros.senha = 'Senha muito longa (máximo 72 caracteres).'
  return erros
}

export const temErros = (erros) => Object.keys(erros).length > 0
