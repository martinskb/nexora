import { useState } from 'react'
import { canaisApi } from '../api/canais.js'
import { Alerta } from '../components/Alerta.jsx'
import { Botao } from '../components/Botao.jsx'
import { CampoTexto } from '../components/CampoTexto.jsx'
import { Modal } from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAvisos } from '../context/AvisosContext.jsx'
import { useCanais } from '../hooks/useCanais.js'
import estilos from './MinhaLoja.module.css'

/** Uma linha da lista de canais: nome, renomear e arquivar/apagar (ou reativar). */
function LinhaCanal({ canal, aoMudar, aoPedirApagar }) {
  const { avisar } = useAvisos()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(canal.nome)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function alterar(dados, mensagem) {
    setOcupado(true)
    setErro('')
    try {
      await canaisApi.atualizar(canal.id, dados)
      avisar(mensagem)
      setEditando(false)
      await aoMudar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setOcupado(false)
    }
  }

  function salvarNome(e) {
    e.preventDefault()
    const novo = nome.trim()
    if (novo === canal.nome) return setEditando(false)
    alterar({ nome: novo }, `Canal renomeado para "${novo}".`)
  }

  function cancelarEdicao() {
    setNome(canal.nome)
    setErro('')
    setEditando(false)
  }

  if (editando) {
    return (
      <li className={estilos.linha}>
        <form className={estilos.edicao} onSubmit={salvarNome}>
          <CampoTexto
            rotulo={`Novo nome para "${canal.nome}"`}
            value={nome}
            maxLength={40}
            autoFocus
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && cancelarEdicao()}
            erro={erro}
          />
          <div className={estilos.acoes}>
            <Botao type="submit" carregando={ocupado}>
              Salvar
            </Botao>
            <Botao variante="secundario" onClick={cancelarEdicao}>
              Cancelar
            </Botao>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={estilos.linha}>
      <div className={estilos.resumoLinha}>
        <span className={estilos.nome}>{canal.nome}</span>
        <div className={estilos.acoes}>
          {canal.ativo ? (
            <>
              <Botao variante="fantasma" onClick={() => setEditando(true)}>
                Renomear
              </Botao>
              {canal.temVendas ? (
                <Botao
                  variante="fantasma"
                  carregando={ocupado}
                  onClick={() => alterar({ ativo: false }, `Canal "${canal.nome}" arquivado.`)}
                >
                  Arquivar
                </Botao>
              ) : (
                <Botao variante="fantasma" onClick={() => aoPedirApagar(canal)}>
                  Apagar
                </Botao>
              )}
            </>
          ) : (
            <Botao
              variante="secundario"
              carregando={ocupado}
              onClick={() => alterar({ ativo: true }, `Canal "${canal.nome}" reativado.`)}
            >
              Reativar
            </Botao>
          )}
        </div>
      </div>
      {erro && <Alerta>{erro}</Alerta>}
    </li>
  )
}

export default function MinhaLoja() {
  const { loja } = useAuth()
  const { avisar } = useAvisos()
  const { canais, ativos, carregando, erro, recarregar } = useCanais()
  const [novo, setNovo] = useState('')
  const [erroNovo, setErroNovo] = useState('')
  const [adicionando, setAdicionando] = useState(false)
  const [apagar, setApagar] = useState(null) // canal a confirmar
  const [apagando, setApagando] = useState(false)
  const [erroApagar, setErroApagar] = useState('')

  const arquivados = canais.filter((c) => !c.ativo)

  async function adicionar(e) {
    e.preventDefault()
    setAdicionando(true)
    setErroNovo('')
    try {
      const { canal } = await canaisApi.criar({ nome: novo })
      avisar(`Canal "${canal.nome}" adicionado.`)
      setNovo('')
      await recarregar()
    } catch (err) {
      setErroNovo(err.details?.nome ?? err.message)
    } finally {
      setAdicionando(false)
    }
  }

  async function confirmarApagar() {
    setApagando(true)
    setErroApagar('')
    try {
      await canaisApi.remover(apagar.id)
      avisar(`Canal "${apagar.nome}" apagado.`)
      setApagar(null)
      await recarregar()
    } catch (err) {
      setErroApagar(err.message)
    } finally {
      setApagando(false)
    }
  }

  return (
    <div className={estilos.pagina}>
      <header>
        <h1 className={estilos.titulo}>Minha loja</h1>
        <p className={estilos.info}>{loja.nome}</p>
      </header>

      <section className={estilos.secao} aria-labelledby="t-canais">
        <div>
          <h2 id="t-canais" className={estilos.subtitulo}>
            Canais de venda
          </h2>
          <p className={estilos.info}>Marque de onde veio cada venda, se quiser. Ex.: Instagram, encomenda.</p>
        </div>

        <form className={estilos.novo} onSubmit={adicionar}>
          <CampoTexto
            rotulo="Novo canal"
            placeholder="Ex.: Instagram"
            value={novo}
            maxLength={40}
            onChange={(e) => setNovo(e.target.value)}
            erro={erroNovo}
          />
          <Botao type="submit" carregando={adicionando} disabled={!novo.trim()}>
            Adicionar
          </Botao>
        </form>

        {erro && (
          <div className={estilos.erro}>
            <Alerta>{erro}</Alerta>
            <Botao variante="secundario" onClick={recarregar}>
              Tentar de novo
            </Botao>
          </div>
        )}
        {carregando && <p className={estilos.info}>Carregando canais…</p>}

        {!carregando && !erro && ativos.length === 0 && (
          <p className={estilos.vazio}>Nenhum canal ainda. Sem canais, as vendas são registradas sem origem.</p>
        )}

        {ativos.length > 0 && (
          <ul className={estilos.lista}>
            {ativos.map((c) => (
              <LinhaCanal key={`${c.id}-${c.nome}`} canal={c} aoMudar={recarregar} aoPedirApagar={setApagar} />
            ))}
          </ul>
        )}

        {arquivados.length > 0 && (
          <details className={estilos.arquivados}>
            <summary>Arquivados ({arquivados.length})</summary>
            <p className={estilos.info}>Não aparecem na hora de vender, mas continuam nas vendas antigas.</p>
            <ul className={estilos.lista}>
              {arquivados.map((c) => (
                <LinhaCanal key={c.id} canal={c} aoMudar={recarregar} aoPedirApagar={setApagar} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <Modal
        aberto={apagar !== null}
        aoFechar={() => {
          setApagar(null)
          setErroApagar('')
        }}
        titulo="Apagar canal"
      >
        {apagar && (
          <div className={estilos.confirmar}>
            <p>
              Apagar o canal <strong>{apagar.nome}</strong>? Ele ainda não tem vendas, então nada do histórico muda.
            </p>
            {erroApagar && <Alerta>{erroApagar}</Alerta>}
            <div className={estilos.acoes}>
              <Botao variante="perigo" carregando={apagando} onClick={confirmarApagar}>
                Apagar canal
              </Botao>
              <Botao variante="secundario" onClick={() => setApagar(null)}>
                Cancelar
              </Botao>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
