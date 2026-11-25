import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clock, Download, Printer } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import talyAMano from '../components/Taly/taly-a-mano.svg'
import { PaginaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { cargarLocal, getLocalById } from '../services/locales.js'
import { leerSeleccion } from '../services/misLocales.js'
import { enlaceDeLocal, urlDeLocal } from '../utils/enlaceLocal.js'
import { LADO_QR, descargarPoster, horarioDe } from '../utils/posterLocal.js'
import './compartirNegocio.css'

/* Sin local en la URL ni elegido en Mi Negocio, el de la demo. */
const ID_DEMO = 'sara'

/* Zona de silencio en módulos. El estándar pide 4; con menos hay lectores que
   simplemente no enganchan el código. */
const MARGEN_QR = 4

/* Los nombres largos bajan de cuerpo para no partirse en tres líneas. */
function tallaNombre(nombre = '') {
  if (nombre.length > 28) return 'compartir-nombre--s'
  if (nombre.length > 16) return 'compartir-nombre--m'
  return ''
}

function CompartirNegocio() {
  const [params] = useSearchParams()
  const id = params.get('local') || leerSeleccion()?.id || ID_DEMO
  const enMemoria = getLocalById(id)
  /* Si se entra directo (recarga, enlace guardado) el local puede no estar en
     memoria todavía: se pide al servidor. */
  const [remoto, setRemoto] = useState(null)
  const qrRef = useRef(null)
  const [estado, setEstado] = useState('listo')

  useEffect(() => {
    if (getLocalById(id)) return undefined
    let vivo = true
    cargarLocal(id)
      .catch(() => null)
      .then((l) => vivo && setRemoto({ id, local: l ?? getLocalById(ID_DEMO) }))
    return () => {
      vivo = false
    }
  }, [id])

  const local = enMemoria ?? (remoto?.id === id ? remoto.local : null)
  const buscando = !enMemoria && remoto?.id !== id

  if (buscando) {
    return (
      <section className="compartir" aria-busy="true">
        <PaginaEsqueleto />
      </section>
    )
  }
  if (!local) return null

  const enlace = enlaceDeLocal(local.id)
  const url = urlDeLocal(local.id)
  const horario = horarioDe(local)

  const descargar = async () => {
    const canvasQR = qrRef.current
    if (!canvasQR) return
    setEstado('generando')
    try {
      await descargarPoster(
        {
          canvasQR,
          nombre: local.localName,
          categoria: local.categoria,
          direccion: local.direccion,
          horario,
          enlace,
        },
        `citaly-${local.id}-qr.png`,
      )
      setEstado('listo')
    } catch {
      setEstado('error')
    }
  }

  return (
    <section className="compartir" aria-label={`Compartir ${local.localName}`}>
      <div className="compartir-barra">
        <Link to="/negocio" className="compartir-volver">
          <ArrowLeft size={18} strokeWidth={2.25} aria-hidden="true" />
          Volver
        </Link>
      </div>

      <h1 className="compartir-titulo">El cartel de tu local</h1>
      <p className="compartir-lead">
        Imprímelo y ponlo en la puerta, en el mostrador o junto a la caja. También puedes bajar la imagen y mandarla por
        WhatsApp: al escanear el código, tus clientes llegan directo a tu página en Citaly.
      </p>

      {/* La hoja es lo único que se imprime y lo que se recrea en la descarga.
          Va sobre papel claro a propósito: un QR se lee mejor oscuro sobre
          claro, y así no se gasta medio cartucho. Todo se mide en unidades
          del contenedor (cqi), así que en pantalla y en el A4 guarda las
          mismas proporciones. */}
      <div className="compartir-hoja">
        <article className="compartir-tarjeta">
          <svg className="compartir-toldo" viewBox="0 0 200 26" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                d={`M${i * 20} -2 H${i * 20 + 20} V16 A10 10 0 0 1 ${i * 20} 16 Z`}
                fill={i % 2 ? '#F7F5EF' : '#00C2AD'}
                stroke="#0E2E2A"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
            ))}          </svg>

          <header className="compartir-tarjeta-cabecera">
            {local.categoria && <p className="compartir-categoria">{local.categoria}</p>}
            <h2 className={`compartir-nombre ${tallaNombre(local.localName)}`}>{local.localName}</h2>
            {local.direccion && <p className="compartir-direccion">{local.direccion}</p>}
            {horario && (
              <p className="compartir-horario">
                <Clock aria-hidden="true" strokeWidth={2.4} />
                {horario}
              </p>
            )}
          </header>

          <div className="compartir-qr">
            <QRCodeSVG
              value={url}
              size={248}
              level="M"
              marginSize={MARGEN_QR}
              bgColor="#ffffff"
              fgColor="#0E2E2A"
              title={`Código QR de ${local.localName}`}
            />
          </div>

          <div className="compartir-invita">
            <img className="compartir-taly" src={talyAMano} alt="" aria-hidden="true" />
            <div className="compartir-bocadillo">
              <p className="compartir-cta">¡Escanea con la cámara y pide tu cita!</p>
            </div>
          </div>
          {/* A todo el ancho: los enlaces de los locales propios llevan un id
              largo y en el bocadillo se partían en tres líneas. */}
          <p className="compartir-enlace">{enlace}</p>

          <footer className="compartir-tarjeta-pie">
            <span className="compartir-marca">Citaly</span>
            <span className="compartir-lema">Reserva en los lugares de tu barrio</span>
          </footer>
        </article>
      </div>

      <div className="compartir-acciones">
        <button type="button" className="compartir-accion compartir-accion--principal" onClick={() => window.print()}>
          <Printer size={17} strokeWidth={2.25} aria-hidden="true" />
          Imprimir
        </button>
        <button type="button" className="compartir-accion" onClick={descargar} disabled={estado === 'generando'}>
          <Download size={17} strokeWidth={2.25} aria-hidden="true" />
          {estado === 'generando' ? 'Preparando…' : 'Descargar imagen'}
        </button>
      </div>

      <p className="compartir-nota" role={estado === 'error' ? 'alert' : undefined}>
        {estado === 'error'
          ? 'No se pudo generar la imagen. Inténtalo otra vez.'
          : 'Sale en un A4 entero. La imagen baja en 1080 × 1575, de sobra para imprimirla también.'}
      </p>

      {/* Fuente del QR de la descarga: grande y fuera de pantalla. No se puede
          usar `display: none`, un canvas oculto así no llega a pintarse. */}
      <div className="compartir-oculto" aria-hidden="true">
        <QRCodeCanvas
          ref={qrRef}
          value={url}
          size={LADO_QR}
          level="M"
          marginSize={MARGEN_QR}
          bgColor="#ffffff"
          fgColor="#0E2E2A"
        />
      </div>
    </section>
  )
}

export default CompartirNegocio
