import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { FILTRO_VENDAS_PADRAO, filtrosDeVendas, useAntecipar } from '../dados/hooks.js'
import { useNavegarApp } from '../hooks/useNavegarApp.js'
import { ehAba } from '../utils/navegacao.js'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEstadoDaAba } from '../hooks/useEstadoDaAba.js'
import { useInstalarApp } from '../hooks/useInstalarApp.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { deveConvidar } from '../utils/instalacao.js'
import { BuscaRapida } from './BuscaRapida.jsx'
import { ConviteInstalar } from './ConviteInstalar.jsx'
import { IconeCaixa, IconeEstoque, IconeInicio, IconeLoja, IconeMais, IconeRecibo } from './Icones.jsx'
import { Marca } from './Marca.jsx'
import estilos from './LayoutApp.module.css'

// Ordem do celular: Vender no centro do menu inferior.
const INICIO = { para: '/', rotulo: 'Início', Icone: IconeInicio, numero: '01' }
const PRODUTOS = { para: '/produtos', rotulo: 'Produtos', Icone: IconeCaixa, numero: '02' }
const ESTOQUE = { para: '/estoque', rotulo: 'Estoque', Icone: IconeEstoque, numero: '03' }
const VENDAS = { para: '/vendas', rotulo: 'Vendas', Icone: IconeRecibo, numero: '04' }
const MINHA_LOJA = { para: '/minha-loja', rotulo: 'Minha loja', Icone: IconeLoja, numero: '05' }
const MENU_LATERAL = [INICIO, PRODUTOS, ESTOQUE, VENDAS, MINHA_LOJA]

/** Clique comum (sem Ctrl/⌘/Shift nem botão do meio): deixa o navegador abrir em nova aba. */
const cliqueSimples = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

function ItemMenu({ item, aoIr, aoAntecipar, className, comNumero = false, rotulo = true }) {
  const { para, rotulo: texto, Icone, numero } = item
  return (
    <NavLink
      to={para}
      end={para === '/'}
      className={({ isActive }) => [estilos.item, className, isActive && estilos.ativo].filter(Boolean).join(' ')}
      onClick={(e) => {
        if (!cliqueSimples(e)) return
        e.preventDefault()
        aoIr(para)
      }}
      onMouseEnter={() => aoAntecipar?.(para)}
      onFocus={() => aoAntecipar?.(para)}
    >
      <Icone />
      {rotulo && <span>{texto}</span>}
      {comNumero && <sup className={estilos.numero}>{numero}</sup>}
    </NavLink>
  )
}

/** Moldura das telas internas: menu lateral no PC; topo + menu inferior no celular. */
export function LayoutApp() {
  const { loja } = useAuth()
  const location = useLocation()
  const navegar = useNavegarApp()
  const antecipar = useAntecipar()
  const [buscaAberta, setBuscaAberta] = useState(false)
  const modoVender = location.pathname === '/vender'

  // Convite para instalar: no celular, uma vez por sessão, se não foi instalado nem dispensado.
  const ehCelular = !useMediaQuery('(min-width: 960px)')
  const app = useInstalarApp()
  const [jaConvidou, setJaConvidou] = useEstadoDaAba('instalar.convidou', false)
  const [convite, setConvite] = useState(false)
  const convidar =
    app.plataforma !== 'indisponivel' &&
    deveConvidar({ ehCelular, instalado: app.instalado, dispensado: app.dispensado, jaConvidou, logado: Boolean(loja) })
  useEffect(() => {
    if (!convidar) return undefined
    const t = setTimeout(() => {
      setJaConvidou(true)
      setConvite(true)
    }, 2500)
    return () => clearTimeout(t)
  }, [convidar, setJaConvidou])

  // Nova versão publicada: avisa e atualiza quando a pessoa quiser.
  const {
    needRefresh: [novaVersao],
    updateServiceWorker,
  } = useRegisterSW()

  // Tocar na aba que já está aberta rola para o topo.
  const aoIr = useCallback(
    (para) => {
      if (para === location.pathname) window.scrollTo({ top: 0, behavior: 'smooth' })
      else navegar(para)
    },
    [location.pathname, navegar],
  )

  const aoAntecipar = useCallback(
    (para) => {
      if (para === '/produtos' || para === '/estoque' || para === '/vender') antecipar.produtos()
      if (para === '/vendas') antecipar.vendas(filtrosDeVendas(FILTRO_VENDAS_PADRAO))
      if (para === '/minha-loja') antecipar.canais()
    },
    [antecipar],
  )

  // Depois que o app abre, busca em segundo plano o que as outras abas vão pedir.
  useEffect(() => {
    const t = setTimeout(() => {
      antecipar.produtos()
      antecipar.canais()
      antecipar.vendas(filtrosDeVendas(FILTRO_VENDAS_PADRAO))
    }, 1500)
    return () => clearTimeout(t)
  }, [antecipar])

  // Ctrl K / ⌘K abre a busca de produto (PC).
  useEffect(() => {
    const aoTeclar = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBuscaAberta(true)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  const contexto = useMemo(() => ({ modoVender, abrirBusca: () => setBuscaAberta(true) }), [modoVender])

  return (
    <div className={`${estilos.app} ${modoVender ? estilos.modoVender : ''}`}>
      <aside className={estilos.lateral}>
        <NavLink to="/" className={estilos.marcaLateral} aria-label="Início" onClick={(e) => cliqueSimples(e) && (e.preventDefault(), aoIr('/'))}>
          <Marca tamanho={32} />
        </NavLink>
        <nav className={estilos.menuLateral} aria-label="Menu principal">
          {MENU_LATERAL.map((item) => (
            <ItemMenu key={item.para} item={item} aoIr={aoIr} aoAntecipar={aoAntecipar} comNumero />
          ))}
          <ItemMenu
            item={{ para: '/vender', rotulo: 'Vender', Icone: IconeMais }}
            aoIr={aoIr}
            aoAntecipar={aoAntecipar}
            className={estilos.venderLateral}
          />
        </nav>
        <p className={estilos.nomeLoja}>{loja?.nome}</p>
      </aside>

      {/* Fora das abas (Vender, Minha loja) a tela tem o próprio topo, com voltar. */}
      {ehAba(location.pathname) && (
        <header className={estilos.topo}>
          <NavLink to="/" aria-label="Início" onClick={(e) => cliqueSimples(e) && (e.preventDefault(), aoIr('/'))}>
            <Marca tamanho={32} />
          </NavLink>
          <NavLink
            to="/minha-loja"
            className={({ isActive }) => `${estilos.botaoLoja} ${isActive ? estilos.ativo : ''}`}
            onClick={(e) => cliqueSimples(e) && (e.preventDefault(), aoIr('/minha-loja'))}
          >
            <IconeLoja />
            <span>Minha loja</span>
          </NavLink>
        </header>
      )}

      <main className={estilos.conteudo}>
        <Outlet context={contexto} />
      </main>

      {!modoVender && (
        <nav className={estilos.menuInferior} aria-label="Menu principal">
          <ItemMenu item={INICIO} aoIr={aoIr} />
          <ItemMenu item={PRODUTOS} aoIr={aoIr} />
          <NavLink
            to="/vender"
            className={estilos.venderCentral}
            aria-label="Vender"
            onClick={(e) => cliqueSimples(e) && (e.preventDefault(), aoIr('/vender'))}
          >
            <IconeMais strokeWidth="2.4" tamanho={24} />
          </NavLink>
          <ItemMenu item={ESTOQUE} aoIr={aoIr} />
          <ItemMenu item={VENDAS} aoIr={aoIr} />
        </nav>
      )}

      <BuscaRapida aberta={buscaAberta} aoFechar={() => setBuscaAberta(false)} />
      <ConviteInstalar aberto={convite} aoFechar={() => setConvite(false)} aoDispensar={app.dispensar} />
      {novaVersao && (
        <div className={estilos.novaVersao} role="status">
          <span>Nova versão disponível.</span>
          <button type="button" onClick={() => updateServiceWorker(true)}>
            Atualizar
          </button>
        </div>
      )}
    </div>
  )
}
