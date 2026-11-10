import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { CampoTexto } from '../components/CampoTexto.jsx'
import { LayoutAuth } from '../components/LayoutAuth.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useFormulario } from '../hooks/useFormulario.js'
import { validarLogin } from '../utils/validacao.js'

export default function Entrar() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = location.state?.de || '/'
  const { valores, erros, erroGeral, enviando, alterar, enviar } = useFormulario({ email: '', senha: '' })

  async function aoEnviar(e) {
    e.preventDefault()
    const ok = await enviar(validarLogin, entrar)
    if (ok) navigate(destino, { replace: true })
  }

  return (
    <LayoutAuth
      titulo="Entrar"
      subtitulo="Acesse a conta da sua loja."
      rodape={
        <>
          Ainda não tem conta? <Link to="/criar-conta">Criar conta da loja</Link>
        </>
      }
    >
      <form onSubmit={aoEnviar} noValidate style={{ display: 'grid', gap: 'var(--esp-4)' }}>
        <Alerta>{erroGeral}</Alerta>
        <CampoTexto
          rotulo="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={valores.email}
          onChange={alterar}
          erro={erros.email}
          autoFocus
        />
        <CampoTexto
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          value={valores.senha}
          onChange={alterar}
          erro={erros.senha}
        />
        <Botao type="submit" larguraTotal carregando={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Botao>
      </form>
    </LayoutAuth>
  )
}
