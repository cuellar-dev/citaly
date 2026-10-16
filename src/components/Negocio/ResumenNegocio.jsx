import { Banknote, ChevronRight, Timer, UserPlus, Users, ZapOff } from 'lucide-react'
import './resumenNegocio.css'

/**
 * Panel rápido del día: siguiente cita, ocupación y estimado.
 * Solo presentación; MiNegocio (o un hook) arma los objetos y callbacks.
 * Cada pieza enseña una cifra y una línea; el desglose vive en su modal.
 */
function ResumenNegocio({
  siguiente,
  ocupacion,
  estimado,
  onSiguiente,
  onOcupacion,
  onEstimado,
  onPausarAgenda,
  onClienteExpress,
}) {
  return (
    <section className="resumen-negocio" aria-label="Resumen del día">
      <TarjetaSiguiente datos={siguiente} onClick={onSiguiente} />

      <div className="resumen-negocio-metricas">
        <TarjetaOcupacion datos={ocupacion} onClick={onOcupacion} />
        <TarjetaEstimado datos={estimado} onClick={onEstimado} />
      </div>

      <div className="resumen-negocio-acciones">
        <button
          type="button"
          className="resumen-negocio-accion resumen-negocio-accion--pausa"
          onClick={onPausarAgenda}
          title="Se fue la luz, algún lío"
        >
          <ZapOff size={17} strokeWidth={2} aria-hidden="true" />
          <span>Una pausa</span>
        </button>
        <button
          type="button"
          className="resumen-negocio-accion resumen-negocio-accion--express"
          onClick={onClienteExpress}
          title="Cliente sin reserva"
        >
          <UserPlus size={17} strokeWidth={2} aria-hidden="true" />
          <span>Abierto a la calle</span>
        </button>
      </div>
    </section>
  )
}

function TarjetaSiguiente({ datos, onClick }) {
  const vacia = !datos
  /* Cuánto falta dentro de una ventana de dos horas: lleno = ya está aquí. */
  const cercania = vacia ? 0 : Math.round((1 - Math.min(Math.max(datos.minutos, 0), 120) / 120) * 100)
  const enMinutos = !vacia && datos.minutos >= 0
  return (
    <button
      type="button"
      className={`resumen-negocio-siguiente${vacia ? ' resumen-negocio-siguiente--vacia' : ''}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <span className="resumen-negocio-etiqueta">
        <Timer size={14} strokeWidth={2.25} aria-hidden="true" />
        Siguiente
      </span>

      <span className="resumen-negocio-siguiente-cuerpo">
        <span className="resumen-negocio-siguiente-valor">
          {vacia ? (
            'Libre'
          ) : (
            <>
              {enMinutos && <small>en</small>}
              {datos.valor}
            </>
          )}
        </span>
        <span className="resumen-negocio-siguiente-quien">
          {vacia ? (
            <span className="resumen-negocio-siguiente-hora resumen-negocio-siguiente-hora--suave">Sin más citas hoy</span>
          ) : (
            <>
              <span className="resumen-negocio-siguiente-cliente">{datos.cliente}</span>
              <span className="resumen-negocio-siguiente-hora">{datos.hora}</span>
            </>
          )}
        </span>
        {!vacia && <ChevronRight className="resumen-negocio-siguiente-flecha" size={18} strokeWidth={2} aria-hidden="true" />}
      </span>

      {!vacia && (
        <span className="resumen-negocio-barra" role="presentation">
          <span className="resumen-negocio-barra-llenado" style={{ '--ancho': `${cercania}%` }} />
        </span>
      )}
    </button>
  )
}

function TarjetaOcupacion({ datos, onClick }) {
  const porcentaje = Math.min(Math.max(datos?.porcentaje ?? 0, 0), 100)
  const segmentos = (datos?.segmentos ?? []).filter((s) => s.cantidad > 0)
  return (
    <button type="button" className="resumen-negocio-tarjeta" onClick={onClick} disabled={!onClick}>
      <span className="resumen-negocio-etiqueta">
        <Users size={14} strokeWidth={2.25} aria-hidden="true" />
        Ocupación
      </span>
      <span className="resumen-negocio-valor">
        {porcentaje}
        <small>%</small>
      </span>
      <span className="resumen-negocio-pie">
        {datos?.ocupados ?? 0} de {datos?.capacidad ?? 0} turnos
      </span>
      <span className="resumen-negocio-segmentos" role="presentation">
        {segmentos.map((s, i) => (
          <span
            key={s.id}
            className="resumen-negocio-segmento"
            style={{ flexGrow: s.cantidad, background: s.color, '--i': i }}
          />
        ))}
      </span>
    </button>
  )
}

function TarjetaEstimado({ datos, onClick }) {
  const total = datos?.total ?? 0
  const cobradoPct = total ? Math.round(((datos?.cobrado ?? 0) / total) * 100) : 0
  return (
    <button type="button" className="resumen-negocio-tarjeta" onClick={onClick} disabled={!onClick}>
      <span className="resumen-negocio-etiqueta">
        <Banknote size={14} strokeWidth={2.25} aria-hidden="true" />
        Estimado
      </span>
      <span className="resumen-negocio-valor">
        {total}
        <small>CUP</small>
      </span>
      <span className="resumen-negocio-pie">
        <b>{datos?.cobrado ?? 0}</b> ya cobrados
      </span>
      <span className="resumen-negocio-barra" role="presentation">
        <span className="resumen-negocio-barra-llenado" style={{ '--ancho': `${cobradoPct}%` }} />
      </span>
    </button>
  )
}

export default ResumenNegocio
