import { useEffect, useRef, useState } from 'react'
import { Crosshair, RotateCw, WifiOff } from 'lucide-react'
import { dentroDeCuba } from '../../data/cuba.js'
import './mapaPin.css'

/* Mapa con un pin para marcar dónde está el local, o solo para verlo (en la
   ficha del local, con `soloVer`).

   Leaflet + teselas de OpenStreetMap: es lo más ligero que hay (unos 40 KB)
   y se descarga solo cuando aparece el mapa, no con el resto de la app.
   Si la conexión no da para cargar el mapa, se avisa y se puede seguir sin
   él: el punto se marca otro día. */

const TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
const ESPERA_CARGA = 12000

const PIN_HTML = `
  <span class="mapa-pin-forma"><span class="mapa-pin-punto"></span></span>
  <span class="mapa-pin-sombra"></span>`

function MapaPin({ centro, valor, onCambiar, onFuera, soloVer = false, etiqueta = 'Mapa del local' }) {
  const cajaRef = useRef(null)
  const mapaRef = useRef(null)
  const pinRef = useRef(null)
  const elegirRef = useRef(null)
  const avisosRef = useRef({ onCambiar, onFuera })
  const [estado, setEstado] = useState('cargando') // cargando | listo | lento | error
  const [intento, setIntento] = useState(0)
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    avisosRef.current = { onCambiar, onFuera }
  }, [onCambiar, onFuera])

  /* Montar el mapa (y volver a montarlo si se reintenta). */
  useEffect(() => {
    let cancelado = false
    let reloj = 0

    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
      .then(([modulo]) => {
        if (cancelado || !cajaRef.current) return
        const L = modulo.default ?? modulo
        const inicio = valor ?? centro
        const mapa = L.map(cajaRef.current, {
          center: [inicio.lat, inicio.lng],
          zoom: valor ? 17 : (centro.zoom ?? 14),
          zoomControl: !soloVer,
          attributionControl: true,
          scrollWheelZoom: !soloVer,
          dragging: !soloVer || !L.Browser.mobile,
          tap: false,
        })
        mapaRef.current = mapa
        mapa.attributionControl.setPrefix(false)

        let cargoAlguna = false
        const capa = L.tileLayer(TESELAS, { maxZoom: 19, attribution: ATRIBUCION, crossOrigin: true })
        capa.on('tileload', () => {
          if (cargoAlguna) return
          cargoAlguna = true
          window.clearTimeout(reloj)
          if (!cancelado) setEstado('listo')
        })
        capa.addTo(mapa)
        reloj = window.setTimeout(() => {
          if (!cancelado && !cargoAlguna) setEstado('lento')
        }, ESPERA_CARGA)

        const icono = L.divIcon({ className: 'mapa-pin', html: PIN_HTML, iconSize: [36, 46], iconAnchor: [18, 44] })
        const ponerPin = (lat, lng) => {
          if (pinRef.current) {
            pinRef.current.setLatLng([lat, lng])
            return
          }
          pinRef.current = L.marker([lat, lng], {
            icon: icono,
            draggable: !soloVer,
            keyboard: !soloVer,
            title: soloVer ? etiqueta : 'Arrástrame hasta la puerta del local',
            alt: 'Pin del local',
          }).addTo(mapa)
          pinRef.current.on('dragend', () => {
            const p = pinRef.current.getLatLng()
            elegir(p.lat, p.lng)
          })
        }
        const elegir = (lat, lng) => {
          if (!dentroDeCuba(lat, lng)) {
            avisosRef.current.onFuera?.()
            if (valor) pinRef.current?.setLatLng([valor.lat, valor.lng])
            return
          }
          ponerPin(lat, lng)
          avisosRef.current.onCambiar?.({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })
        }
        elegirRef.current = elegir

        if (valor) ponerPin(valor.lat, valor.lng)
        if (!soloVer) mapa.on('click', (e) => elegir(e.latlng.lat, e.latlng.lng))
      })
      .catch(() => {
        if (!cancelado) setEstado('error')
      })

    return () => {
      cancelado = true
      window.clearTimeout(reloj)
      pinRef.current = null
      mapaRef.current?.remove()
      mapaRef.current = null
    }
    // Solo se monta una vez por intento; los cambios de centro van aparte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento, soloVer])

  /* Cambió el municipio: el mapa viaja allí (sin mover un pin ya puesto). */
  const centroClave = `${centro.lat},${centro.lng},${centro.zoom}`
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || pinRef.current) return
    mapa.setView([centro.lat, centro.lng], centro.zoom ?? 14)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centroClave])

  const miUbicacion = () => {
    if (!navigator.geolocation) {
      avisosRef.current.onFuera?.('sin-gps')
      return
    }
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBuscando(false)
        const mapa = mapaRef.current
        if (!mapa) return
        mapa.setView([coords.latitude, coords.longitude], 18)
        elegirRef.current?.(coords.latitude, coords.longitude)
      },
      () => {
        setBuscando(false)
        avisosRef.current.onFuera?.('sin-permiso')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  return (
    <div className={`mapa-pin-caja${soloVer ? ' mapa-pin-caja--ver' : ''}`}>
      <div ref={cajaRef} className="mapa-pin-lienzo" role="application" aria-label={etiqueta} />

      {!soloVer && estado === 'listo' && !valor && (
        <p className="mapa-pin-pista" aria-hidden="true">
          Toca el mapa justo donde está la puerta
        </p>
      )}

      {!soloVer && estado === 'listo' && (
        <button type="button" className="mapa-pin-gps" onClick={miUbicacion} disabled={buscando}>
          <Crosshair size={16} strokeWidth={2.4} aria-hidden="true" />
          {buscando ? 'Buscando…' : 'Estoy en el local'}
        </button>
      )}

      {(estado === 'cargando' || estado === 'lento' || estado === 'error') && (
        <div className="mapa-pin-velo" role="status">
          {estado === 'cargando' ? (
            <>
              <span className="mapa-pin-cargando" aria-hidden="true" />
              <span>Cargando el mapa…</span>
            </>
          ) : (
            <>
              <WifiOff size={22} strokeWidth={2.2} aria-hidden="true" />
              <span>{estado === 'error' ? 'No se pudo abrir el mapa.' : 'El mapa tarda mucho. Puede ser la conexión.'}</span>
              <button type="button" className="mapa-pin-reintentar" onClick={() => {
                  setEstado('cargando')
                  setIntento((n) => n + 1)
                }}>
                <RotateCw size={15} strokeWidth={2.4} aria-hidden="true" />
                Reintentar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default MapaPin
