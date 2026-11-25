import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { aplicarDatosEstructurados, aplicarMeta } from '../../hooks/useMetaPagina.js'
import { metaDeRuta } from '../../utils/metaRutas.js'

/* Al cambiar de ruta, pone el título y los metadatos de esa ruta
   (utils/metaRutas.js). Va en App ANTES de <Routes>: su efecto corre antes
   que los de la página, así una ficha de local (useMetaPagina) escribe
   encima y no al revés. */
export default function MetaRuta() {
  const { pathname } = useLocation()
  useEffect(() => {
    aplicarMeta({ ...metaDeRuta(pathname), ruta: pathname })
    /* Los datos estructurados de una ficha no deben seguir en la siguiente página. */
    aplicarDatosEstructurados('ld-pagina', null)
  }, [pathname])
  return null
}
