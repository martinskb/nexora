import { useState } from 'react'
import { Link } from 'react-router-dom'
import { produtosApi } from '../api/produtos.js'
import { useFormulario } from '../hooks/useFormulario.js'
import { margem } from '../utils/custo.js'
import { formatarDecimal, lerValorMonetario } from '../utils/formato.js'
import { unidades } from '../utils/estoque.js'
import { validarProduto } from '../utils/validacaoProduto.js'
import { Alerta } from './Alerta.jsx'
import { Botao } from './Botao.jsx'
import { CampoTexto } from './CampoTexto.jsx'
import estilos from './FormularioProduto.module.css'

/**
 * Cadastro (produto = null) ou edição de produto.
 * Na edição a quantidade não é editável: ela só muda por venda ou ajuste de estoque.
 */
export function FormularioProduto({ produto, aoSalvar, aoRemover, aoCancelar }) {
  const novo = !produto
  const { valores, erros, erroGeral, enviando, alterar, enviar } = useFormulario({
    nome: produto?.nome ?? '',
    preco: produto ? formatarDecimal(produto.preco) : '',
    custo: produto?.custo != null ? formatarDecimal(produto.custo) : '',
    quantidade: '',
    estoqueMinimo: produto?.estoqueMinimo ? String(produto.estoqueMinimo) : '',
  })
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erroRemocao, setErroRemocao] = useState('')

  async function aoEnviar(e) {
    e.preventDefault()
    let salvo
    await enviar(
      (v) => validarProduto(v, { novo }).erros,
      async (v) => {
        const { dados } = validarProduto(v, { novo })
        const r = novo ? await produtosApi.criar(dados) : await produtosApi.atualizar(produto.id, dados)
        salvo = r.produto
      },
    )
    if (salvo) aoSalvar(salvo, { novo })
  }

  // Ao sair do campo de preço, mostra no formato "6,50".
  async function remover() {
    setRemovendo(true)
    setErroRemocao('')
    try {
      await produtosApi.remover(produto.id)
      aoRemover(produto)
    } catch (err) {
      setErroRemocao(err.message)
      setRemovendo(false)
    }
  }

  if (confirmandoRemocao) {
    return (
      <div className={estilos.form}>
        <p>
          Remover <strong>{produto.nome}</strong> da lista de produtos?
        </p>
        <p className={estilos.ajuda}>As vendas já registradas com este produto continuam no histórico.</p>
        <Alerta>{erroRemocao}</Alerta>
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={() => setConfirmandoRemocao(false)} disabled={removendo}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={remover} carregando={removendo}>
            Sim, remover
          </Botao>
        </div>
      </div>
    )
  }

  const margemAtual = margem(lerValorMonetario(valores.preco), lerValorMonetario(valores.custo))

  return (
    <form className={estilos.form} onSubmit={aoEnviar} noValidate>
      <Alerta>{erroGeral}</Alerta>

      <CampoTexto
        rotulo="Nome do produto"
        name="nome"
        value={valores.nome}
        onChange={alterar}
        erro={erros.nome}
        maxLength={120}
        autoComplete="off"
        autoFocus={novo}
      />

      <div className={estilos.linha}>
        <CampoTexto
          rotulo="Preço de venda"
          name="preco"
          prefixo="R$"
          formato="moeda"
          placeholder="0,00"
          value={valores.preco}
          onChange={alterar}
          erro={erros.preco}
          autoComplete="off"
        />
        {novo && (
          <CampoTexto
            rotulo="Quantidade em estoque"
            name="quantidade"
            formato="inteiro"
            value={valores.quantidade}
            onChange={alterar}
            erro={erros.quantidade}
            autoComplete="off"
          />
        )}
      </div>

      <div className={estilos.linha}>
        <CampoTexto
          rotulo="Custo (opcional)"
          name="custo"
          prefixo="R$"
          formato="moeda"
          placeholder="0,00"
          dica="Quanto você paga por unidade"
          value={valores.custo}
          onChange={alterar}
          erro={erros.custo}
        />
      </div>
      {margemAtual !== null && (
        <p className={estilos.margem} aria-live="polite">
          Margem: <strong>{margemAtual}%</strong>
        </p>
      )}

      {!novo && (
        <div className={estilos.saldo}>
          <span>
            Estoque atual: <strong>{unidades(produto.quantidade)}</strong>
          </span>
          <span className={estilos.ajuda}>A quantidade muda sozinha a cada venda.</span>
          <Link to={`/estoque?produto=${produto.id}`} className={estilos.linkAjuste}>
            Registrar entrada ou corrigir estoque
          </Link>
        </div>
      )}

      <CampoTexto
        rotulo="Avisar quando restarem (opcional)"
        name="estoqueMinimo"
        formato="inteiro"
        dica="O produto aparece como “Acabando” ao chegar nessa quantidade."
        value={valores.estoqueMinimo}
        onChange={alterar}
        erro={erros.estoqueMinimo}
        autoComplete="off"
      />

      <div className={estilos.acoes}>
        <Botao variante="secundario" onClick={aoCancelar} disabled={enviando}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={enviando}>
          {novo ? 'Cadastrar produto' : 'Salvar alterações'}
        </Botao>
      </div>

      {!novo && (
        <button type="button" className={estilos.remover} onClick={() => setConfirmandoRemocao(true)}>
          Remover produto
        </button>
      )}
    </form>
  )
}
