import { Navigate, useLocation } from 'react-router-dom'
import TalyMomento from '../Taly/TalyMomento.jsx'
import { PaginaEsqueleto } from '../Esqueletos/Esqueletos.jsx'
import { useSesion } from '../../hooks/useSesion.js'
import { cargarSesion } from '../../services/sesion.js'

/* Envuelve las pantallas que solo tienen sentido con una cuenta: reservar,
   Mis citas, Mi negocio, notificaciones. Sin sesión lleva a /auth y, al
   entrar, devuelve a donde iba (?volver=).

   sinSesion: lo que se enseña en vez de llevar a /auth (Mi Negocio y Mis
   citas tienen su propia pantalla que explica por qué hace falta entrar).

   Mientras la sesión carga no se pinta la pantalla: así lo que dentro lea el
   usuario actual (idUsuarioActual) ya tiene respuesta. */

function RequiereSesion({ children, pantallaCompleta = false, sinSesion = null }) {
  const { estado, usuario, sinConexion } = useSesion()
  const { pathname, search } = useLocation()

  if (estado === 'cargando') {
    return pantallaCompleta ? (
      <div style={{ minHeight: '100dvh', background: 'var(--background-color, #121413)' }} role="status">
        <span className="sr-only">Cargando…</span>
      </div>
    ) : (
      <PaginaEsqueleto />
    )
  }

  /* No es que no haya cuenta: no hemos podido preguntar. No se manda a
     iniciar sesión a alguien que ya la tiene. */
  if (!usuario && sinConexion) {
    /* Centrado en el alto de la pantalla, entre la cabecera y la barra. */
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70dvh' }}>
        <TalyMomento
          escena="vacio"
          titulo="No pudimos comprobar tu sesión"
          texto="Citaly no responde ahora mismo. Revisa tu internet o vuelve a probar en un momento."
          accion="Reintentar"
          onAccion={() => cargarSesion({ forzar: true })}
        />
      </div>
    )
  }

  if (!usuario) {
    if (sinSesion) return sinSesion
    return <Navigate to={`/auth?volver=${encodeURIComponent(pathname + search)}`} replace />
  }

  return children
}

export default RequiereSesion
