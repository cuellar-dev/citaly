import { Banknote, UserPlus, Zap, ZapOff } from 'lucide-react'
import './resumenNegocio.css'

/**
 * Panel rápido del día: siguiente cita, ocupación y estimado.
 * Solo presentación; MiNegocio (o un hook) arma los objetos y callbacks.
 */
function ResumenNegocio({
  siguiente,
  ocupacion,
  estimado,
  onPausarAgenda,
  onClienteExpress,
}) {
  return (
    <section className="resumen-negocio" aria-label="Resumen del día">
      <div className="resumen-negocio-metricas">
        <TarjetaSiguiente datos={siguiente} />
        <TarjetaOcupacion datos={ocupacion} />
        <TarjetaEstimado datos={estimado} />
      </div>

      <div className="resumen-negocio-acciones">
        <button
          type="button"
          className="resumen-negocio-accion resumen-negocio-accion--pausa"
          onClick={onPausarAgenda}
        >
          <span className="resumen-negocio-accion-icono" aria-hidden="true">
            <ZapOff size={20} strokeWidth={2} />
          </span>
          <span className="resumen-negocio-accion-textos">
            <span className="resumen-negocio-accion-titulo">Una pausa</span>
            <span className="resumen-negocio-accion-detalle">Se fue la luz/ algun lío</span>
          </span>
        </button>
        <button
          type="button"
          className="resumen-negocio-accion resumen-negocio-accion--express"
          onClick={onClienteExpress}
        >
          <span className="resumen-negocio-accion-icono" aria-hidden="true">
            <UserPlus size={20} strokeWidth={2} />
          </span>
          <span className="resumen-negocio-accion-textos">
            <span className="resumen-negocio-accion-titulo">Abierto a la calle</span>
            <span className="resumen-negocio-accion-detalle">Puerta / sin reserva</span>
          </span>
        </button>
      </div>
    </section>
  )
}

function TarjetaSiguiente({ datos }) {
  const vacia = !datos
  return (
    <article
      className={`resumen-negocio-tarjeta resumen-negocio-tarjeta--siguiente${vacia ? ' resumen-negocio-tarjeta--vacia' : ''}`}
    >
      <header className="resumen-negocio-tarjeta-cabecera">
        <span className="resumen-negocio-etiqueta resumen-negocio-etiqueta--activa">Siguiente</span>
        <Zap size={14} strokeWidth={2.5} aria-hidden="true" />
      </header>
      {vacia ? (
        <p className="resumen-negocio-valor">—</p>
      ) : (
        <>
          <p className="resumen-negocio-valor">{datos.valor}</p>
          <p className="resumen-negocio-detalle">{datos.cliente}</p>
          <p className="resumen-negocio-hora-cita">
            <span className="resumen-negocio-punto" aria-hidden="true" />
            {datos.hora}
          </p>
        </>
      )}
    </article>
  )
}

function TarjetaOcupacion({ datos }) {
  const porcentaje = Math.min(Math.max(datos?.porcentaje ?? 0, 0), 100)
  return (
    <article className="resumen-negocio-tarjeta">
      <header className="resumen-negocio-tarjeta-cabecera">
        <span className="resumen-negocio-etiqueta">Ocupación</span>
        <span className="resumen-negocio-anillo" style={{ '--p': porcentaje }} aria-hidden="true" />
      </header>
      <p className="resumen-negocio-valor">{datos?.valor ?? `${porcentaje}%`}</p>
      <p className="resumen-negocio-detalle">{datos?.detalle ?? '—'}</p>
      <div className="resumen-negocio-barra" role="presentation">
        <div className="resumen-negocio-barra-llenado" style={{ width: `${porcentaje}%` }} />
      </div>
    </article>
  )
}

function TarjetaEstimado({ datos }) {
  return (
    <article className="resumen-negocio-tarjeta">
      <header className="resumen-negocio-tarjeta-cabecera">
        <span className="resumen-negocio-etiqueta">Estimado</span>
        <Banknote size={14} strokeWidth={2} aria-hidden="true" />
      </header>
      <p className="resumen-negocio-valor">{datos?.valor ?? '—'}</p>
      <p className="resumen-negocio-detalle">{datos?.detalle ?? '—'}</p>
      {datos?.nota && <p className="resumen-negocio-nota">{datos.nota}</p>}
    </article>
  )
}

export default ResumenNegocio
