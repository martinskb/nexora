import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useProdutos } from '../dados/hooks.js'
import { useHistoricoFolha } from '../hooks/useHistoricoFolha.js'
import { useNavegarApp } from '../hooks/useNavegarApp.js'
import { formatarMoeda, normalizarTexto } from '../utils/formato.js'
import { esperarVolta } from '../utils/historico.js'
import { IconeBusca } from './Icones.jsx'
import estilos from './BuscaRapida.module.css'

const ehMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const ATALHO_BUSCA = ehMac ? '⌘K' : 'Ctrl K'

/** Campo que abre a busca rápida (fica no cabeçalho do Início, no PC). */
export function CampoBuscaRapida() {
  const { abrirBusca } = useOutletContext() ?? {}
  return (
    <button type="button" className={estilos.campo} onClick={abrirBusca} aria-keyshortcuts="Control+K Meta+K">
      <IconeBusca tamanho={16} />
      <span>Buscar produto</span>
      <kbd className={estilos.atalho}>{ATALHO_BUSCA}</kbd>
    </button>
  )
}

/** Busca de produto por nome; Enter abre a edição do produto em Produtos. */
export function BuscaRapida({ aberta, aoFechar }) {
  const ref = useRef(null)
  const [texto, setTexto] = useState('')
  const [indice, setIndice] = useState(0)
  const { data: produtos = [] } = useProdutos()
  const navegar = useNavegarApp()
  useHistoricoFolha(aberta, aoFechar)

  useEffect(() => {
    const d = ref.current
    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  const resultados = useMemo(() => {
    const q = normalizarTexto(texto)
    return (q ? produtos.filter((p) => normalizarTexto(p.nome).includes(q)) : produtos).slice(0, 8)
  }, [produtos, texto])

  function escolher(produto) {
    aoFechar()
    setTexto('')
    // Espera a busca desfazer a própria entrada no histórico antes de navegar.
    esperarVolta().then(() => navegar('/produtos', { state: { editar: produto.id } }))
  }

  function aoTeclar(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndice((i) => Math.min(i + 1, resultados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndice((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && resultados[indice]) {
      e.preventDefault()
      escolher(resultados[indice])
    }
  }

  return (
    <dialog
      ref={ref}
      className={estilos.dialogo}
      aria-label="Buscar produto"
      onCancel={(e) => {
        e.preventDefault()
        aoFechar()
      }}
      onClick={(e) => e.target === ref.current && aoFechar()}
    >
      {aberta && (
        <div className={estilos.caixa}>
          <label className={estilos.entrada}>
            <IconeBusca />
            <input
              autoFocus
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setIndice(0)
              }}
              onKeyDown={aoTeclar}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
              role="combobox"
              aria-expanded="true"
              aria-controls="busca-rapida-lista"
              aria-activedescendant={resultados[indice] ? `busca-${resultados[indice].id}` : undefined}
            />
            <kbd className={estilos.atalho}>Esc</kbd>
          </label>
          <ul id="busca-rapida-lista" role="listbox" className={estilos.lista}>
            {resultados.map((p, i) => (
              <li
                key={p.id}
                id={`busca-${p.id}`}
                role="option"
                aria-selected={i === indice}
                className={i === indice ? estilos.selecionado : ''}
                onMouseEnter={() => setIndice(i)}
                onClick={() => escolher(p)}
              >
                <span>{p.nome}</span>
                <span className="num">{formatarMoeda(p.preco)}</span>
              </li>
            ))}
            {resultados.length === 0 && <li className={estilos.vazio}>Nenhum produto com esse nome.</li>}
          </ul>
        </div>
      )}
    </dialog>
  )
}
