import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ProvedorDeDados } from './dados/ProvedorDeDados.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'
import { LayoutApp } from './components/LayoutApp.jsx'
import { RotaProtegida, SomenteVisitante } from './components/Rotas.jsx'
import Entrar from './pages/Entrar.jsx'
import CriarConta from './pages/CriarConta.jsx'
import Inicio from './pages/Inicio.jsx'
import Produtos from './pages/Produtos.jsx'
import Vender from './pages/Vender.jsx'
import Vendas from './pages/Vendas.jsx'
import Estoque from './pages/Estoque.jsx'
import MinhaLoja from './pages/MinhaLoja.jsx'
import Relatorio from './pages/Relatorio.jsx'

/** Cada loja tem o próprio cache: o provedor é remontado quando a loja muda. */
function DadosDaLoja({ children }) {
  const { loja } = useAuth()
  return (
    <ProvedorDeDados key={loja?.id ?? 'anonimo'} lojaId={loja?.id}>
      {children}
    </ProvedorDeDados>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DadosDaLoja>
          <AvisosProvider>
            <Routes>
              <Route element={<SomenteVisitante />}>
                <Route path="/entrar" element={<Entrar />} />
                <Route path="/criar-conta" element={<CriarConta />} />
              </Route>
              <Route element={<RotaProtegida />}>
                <Route element={<LayoutApp />}>
                  <Route index element={<Inicio />} />
                  <Route path="/vender" element={<Vender />} />
                  <Route path="/vendas" element={<Vendas />} />
                  <Route path="/estoque" element={<Estoque />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/minha-loja" element={<MinhaLoja />} />
                  <Route path="/relatorio" element={<Relatorio />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AvisosProvider>
        </DadosDaLoja>
      </AuthProvider>
    </BrowserRouter>
  )
}
