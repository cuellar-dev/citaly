import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { getLocalById } from '../services/locales.js'
import { enlaceDeLocal, urlDeLocal } from '../utils/enlaceLocal.js'
import { LADO_QR, descargarPoster } from '../utils/posterLocal.js'
import './compartirNegocio.css'

/* El mismo local de prueba que usa Mi Negocio mientras no haya sesión. */
const ID_LOCAL = 'sara'

/* Zona de silencio en módulos. El estándar pide 4; con menos hay lectores que
   simplemente no enganchan el código. */
const MARGEN_QR = 4

function CompartirNegocio() {
  const local = getLocalById(ID_LOCAL)
  const qrRef = useRef(null)
  const [estado, setEstado] = useState('listo')

  if (!local) return null

  const enlace = enlaceDeLocal(local.id)
  const url = urlDeLocal(local.id)

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
          horario: local.horario,
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

      <p className="compartir-lead">
        Puedes imprimir esta imagen y pegarlo por el local o para compartirla vía WhatsApp, al escanear el código los lleva directo a la pagina de tu local en Citaly
      </p>

      {/* Esta tarjeta es lo único que se imprime y lo que se recrea en la
          descarga. Va sobre papel claro a propósito: un QR se lee mejor
          oscuro sobre claro, y así no se gasta medio cartucho. */}
      <article className="compartir-tarjeta">
        <span className="compartir-chispa compartir-chispa--1" aria-hidden="true" />
        <span className="compartir-chispa compartir-chispa--2" aria-hidden="true" />

        <header className="compartir-tarjeta-cabecera">
          <h1 className="compartir-nombre">{local.localName}</h1>
          <p className="compartir-meta">
            {[local.categoria, local.direccion].filter(Boolean).join('  ·  ')}
          </p>
          {local.horario && <p className="compartir-horario">{local.horario}</p>}
        </header>

        <div className="compartir-qr">
          <QRCodeSVG
            value={url}
            size={248}
            level="M"
            marginSize={MARGEN_QR}
            bgColor="#ffffff"
            fgColor="#121413"
            title={`Código QR de ${local.localName}`}
          />
        </div>

        <footer className="compartir-tarjeta-pie">
          <p className="compartir-cta">Escanea y mira nuestro lugar</p>
          <p className="compartir-enlace">{enlace}</p>
          <p className="compartir-marca">Citaly</p>
        </footer>
      </article>

      <div className="compartir-acciones">
        <button type="button" className="compartir-accion compartir-accion--principal" onClick={descargar} disabled={estado === 'generando'}>
          <Download size={17} strokeWidth={2.25} aria-hidden="true" />
          {estado === 'generando' ? 'Preparando…' : 'Descargar imagen'}
        </button>
        <button type="button" className="compartir-accion" onClick={() => window.print()}>
          <Printer size={17} strokeWidth={2.25} aria-hidden="true" />
          Imprimir
        </button>
      </div>

      <p className="compartir-nota" role={estado === 'error' ? 'alert' : undefined}>
        {estado === 'error'
          ? 'No se pudo generar la imagen. Inténtalo otra vez.'
          : 'La imagen baja en 1080 × 1500, de sobra para imprimir en una hoja.'}
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
          fgColor="#121413"
        />
      </div>
    </section>
  )
}

export default CompartirNegocio
