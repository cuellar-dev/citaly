import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Layout from './layout/Layout.jsx'
import Auth from './pages/Auth.jsx'
import Descubre from './pages/Descubre.jsx'
import MisCitas from './pages/MisCitas.jsx'
import MiNegocio from './pages/MiNegocio.jsx'
import CompartirNegocio from './pages/CompartirNegocio.jsx'
import Perfil from './pages/Perfil.jsx'
import DetalleLocal from './pages/DetalleLocal.jsx'
import ReservarConLugar from './pages/ReservarConLugar.jsx'
import ReservarSinLugar from './pages/ReservarSinLugar.jsx'
import NotFound from './pages/NotFound.jsx'
import Busqueda from './pages/Busqueda.jsx'

function ReservarConLugarPage() {
  const { id } = useParams()
  return <ReservarConLugar key={id} />
}

function ReservarSinLugarPage() {
  const { id } = useParams()
  return <ReservarSinLugar key={id} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth fuera del Layout: sin navbar ni header, pantalla a foco. */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Descubre />} />
          <Route path="buscar" element={<Busqueda />} />
          <Route path="local/:id" element={<DetalleLocal />} />
          <Route path="local/:id/reservar" element={<ReservarConLugarPage />} />
          <Route path="local/:id/reservar-cita" element={<ReservarSinLugarPage />} />
          <Route path="citas" element={<MisCitas />} />
          <Route path="negocio" element={<MiNegocio />} />
          <Route path="negocio/compartir" element={<CompartirNegocio />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
