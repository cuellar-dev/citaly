import { Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Layout from './layout/Layout.jsx'
/* Todas las páginas bajan al entrar (paginas.js), Descubre incluida: así
   quien abre /negocio o /perfil no descarga ni ejecuta la portada. Para que
   la portada no pierda velocidad, el deploy anuncia su archivo en el
   index.html (scripts/rutas-estaticas.mjs) y baja a la vez que el JS común.
   NotFound es mínima y se queda en el JS común. */
import NotFound from './pages/NotFound.jsx'
import {
  Auth,
  Ayuda,
  Busqueda,
  CompartirNegocio,
  CompletarLocal,
  Descubre,
  DetalleLocal,
  Favoritos,
  MiNegocio,
  MisCitas,
  Nosotros,
  Notificaciones,
  NuevoLocal,
  Opinion,
  Perfil,
  ReservarConLugar,
  ReservarSinLugar,
  ReservarSuscripcion,
} from './paginas.js'
import ErrorPagina from './components/ErrorPagina/ErrorPagina.jsx'
import { PaginaEsqueleto } from './components/Esqueletos/Esqueletos.jsx'

function CompletarLocalPage() {
  const { id } = useParams()
  return <CompletarLocal key={id} />
}

function ReservarConLugarPage() {
  const { id } = useParams()
  return <ReservarConLugar key={id} />
}

function ReservarSinLugarPage() {
  const { id } = useParams()
  return <ReservarSinLugar key={id} />
}

function ReservarSuscripcionPage() {
  const { id } = useParams()
  return <ReservarSuscripcion key={id} />
}

/* Las pantallas a foco (sin barra ni cabecera) también bajan al entrar. Su
   espera es un fondo liso del color de la app, sin esqueleto: van a pantalla
   completa y cada una tiene su propia composición. */
function PantallaCompleta({ children }) {
  const { pathname } = useLocation()
  return (
    <ErrorPagina clave={pathname}>
      <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--background-color, #121413)' }} />}>
        {children}
      </Suspense>
    </ErrorPagina>
  )
}

/* Sin la barra final: '' en local, '/citaly' en GitHub Pages. */
const BASE_RUTAS = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <BrowserRouter basename={BASE_RUTAS}>
      <Routes>
        {/* Auth fuera del Layout: sin navbar ni header, pantalla a foco. */}
        <Route path="/auth" element={<PantallaCompleta><Auth /></PantallaCompleta>} />
        {/* Crear y completar el local: también a foco, un paso cada vez. */}
        <Route path="/negocio/nuevo" element={<PantallaCompleta><NuevoLocal /></PantallaCompleta>} />
        <Route
          path="/negocio/completar/:id"
          element={<PantallaCompleta><CompletarLocalPage /></PantallaCompleta>}
        />
        {/* Sobre nosotros también va a pantalla completa: es un viaje, no una tabla.
            Su espera es la noche fija de la página (#121413 en los dos temas). */}
        <Route
          path="/nosotros"
          element={
            <ErrorPagina clave="/nosotros">
              <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#121413' }} />}>
                <Nosotros />
              </Suspense>
            </ErrorPagina>
          }
        />
        {/* Dentro del Layout, el Suspense y la red de errores van alrededor del
            <Outlet /> (layout/Layout.jsx): cabecera y barra no parpadean. */}
        <Route path="/" element={<Layout fallback={<PaginaEsqueleto />} />}>
          <Route index element={<Descubre />} />
          <Route path="buscar" element={<Busqueda />} />
          <Route path="local/:id" element={<DetalleLocal />} />
          <Route path="local/:id/reservar" element={<ReservarConLugarPage />} />
          <Route path="local/:id/reservar-cita" element={<ReservarSinLugarPage />} />
          <Route path="local/:id/unirse" element={<ReservarSuscripcionPage />} />
          <Route path="citas" element={<MisCitas />} />
          <Route path="negocio" element={<MiNegocio />} />
          <Route path="negocio/compartir" element={<CompartirNegocio />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="notificaciones" element={<Notificaciones />} />
          <Route path="favoritos" element={<Favoritos />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="opinion" element={<Opinion />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
