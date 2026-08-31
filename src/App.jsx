import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Layout from './layout/Layout.jsx'
import Descubre from './pages/Descubre.jsx'
import MisCitas from './pages/MisCitas.jsx'
import MiNegocio from './pages/MiNegocio.jsx'
import Perfil from './pages/Perfil.jsx'
import DetalleLocal from './pages/DetalleLocal.jsx'
import ReservarConLugar from './pages/ReservarConLugar.jsx'
import ReservarSinLugar from './pages/ReservarSinLugar.jsx'

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
        <Route path="/" element={<Layout />}>
          <Route index element={<Descubre />} />
          <Route path="local/:id" element={<DetalleLocal />} />
          <Route path="local/:id/reservar" element={<ReservarConLugarPage />} />
          <Route path="local/:id/reservar-cita" element={<ReservarSinLugarPage />} />
          <Route path="citas" element={<MisCitas />} />
          <Route path="negocio" element={<MiNegocio />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
