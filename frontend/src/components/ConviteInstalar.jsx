import { useInstalarApp } from '../hooks/useInstalarApp.js'
import { Botao } from './Botao.jsx'
import { Folha } from './Folha.jsx'
import { Marca } from './Marca.jsx'
import estilos from './ConviteInstalar.module.css'

/** Folha "Instale o Nexora na tela inicial". aoDispensar: "Agora não" (não pergunta de novo sozinho). */
export function ConviteInstalar({ aberto, aoFechar, aoDispensar }) {
  const { plataforma, instalar } = useInstalarApp()

  async function aoInstalar() {
    await instalar()
    aoFechar()
  }

  return (
    <Folha aberto={aberto} aoFechar={aoFechar} titulo="Instale o Nexora">
      <div className={estilos.convite}>
        <div className={estilos.icone} aria-hidden="true">
          <Marca tamanho={40} invertida />
        </div>
        <p>Coloque o Nexora na tela inicial do celular: ele abre direto, como um aplicativo, sem a barra do navegador.</p>

        {plataforma === 'ios' && (
          <ol className={estilos.passos}>
            <li>
              Toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima).
            </li>
            <li>
              Escolha <strong>Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Toque em <strong>Adicionar</strong>.
            </li>
          </ol>
        )}
        {plataforma === 'indisponivel' && (
          <p className={estilos.nota}>Este navegador não permite instalar. Abra o Nexora pelo Chrome (Android) ou pelo Safari (iPhone).</p>
        )}

        <div className={estilos.acoes}>
          {plataforma === 'nativo' && (
            <Botao larguraTotal onClick={aoInstalar}>
              Instalar
            </Botao>
          )}
          <Botao
            variante="secundario"
            larguraTotal
            onClick={() => {
              aoDispensar?.()
              aoFechar()
            }}
          >
            {plataforma === 'nativo' ? 'Agora não' : 'Entendi'}
          </Botao>
        </div>
      </div>
    </Folha>
  )
}
