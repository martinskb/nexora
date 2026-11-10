import { Link, useNavigate } from 'react-router-dom'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { CampoTexto } from '../components/CampoTexto.jsx'
import { LayoutAuth } from '../components/LayoutAuth.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useFormulario } from '../hooks/useFormulario.js'
import { validarCadastro } from '../utils/validacao.js'

export default function CriarConta() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const { valores, erros, erroGeral, enviando, alterar, enviar } = useFormulario({
    nome: '',
    email: '',
    senha: '',
  })

  async function aoEnviar(e) {
    e.preventDefault()
    const ok = await enviar(validarCadastro, cadastrar)
    if (ok) navigate('/', { replace: true })
  }

  return (
    <LayoutAuth
      titulo="Criar conta da loja"
      subtitulo="Leva menos de um minuto. São só 3 campos."
      rodape={
        <>
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate style={{ display: 'grid', gap: 'var(--esp-4)' }}>
        <Alerta>{erroGeral}</Alerta>
        <CampoTexto
          rotulo="Nome da loja"
          name="nome"
          autoComplete="organization"
          placeholder="Ex.: Mercadinho Andorinhas"
          value={valores.nome}
          onChange={alterar}
          erro={erros.nome}
          maxLength={120}
          autoFocus
        />
        <CampoTexto
          rotulo="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          dica="Você vai usar este e-mail para entrar."
          value={valores.email}
          onChange={alterar}
          erro={erros.email}
        />
        <CampoTexto
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          dica="Pelo menos 8 caracteres."
          value={valores.senha}
          onChange={alterar}
          erro={erros.senha}
          maxLength={72}
        />
        <Botao type="submit" larguraTotal carregando={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </Botao>
      </form>
    </LayoutAuth>
  )
}
