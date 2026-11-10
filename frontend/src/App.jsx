import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AvisosProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
