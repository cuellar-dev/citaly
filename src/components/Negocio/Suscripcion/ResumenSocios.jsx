import { Banknote, ChevronRight, Inbox, Timer, UserPlus, Users } from 'lucide-react'
import '../resumenNegocio.css'

/* El panel rápido de un local de suscripción. Mismas piezas que el de citas
   (ResumenNegocio), con otras cuentas: quién paga ahora, cómo van los socios
   y cuánto entra este mes. */
function ResumenSocios({ proximo, socios, mes, solicitudes, onProximo, onSocios, onMes, onNuevoSocio, onSolicitudes }) {
  const segmentos = socios.segmentos.filter((s) => s.cantidad > 0)
  const cobradoPct = mes.esperado ? Math.round((mes.cobrado / mes.esperado) * 100) : 0

  return (
    <section className="resumen-negocio" aria-label="Resumen de socios">
      <button
        type="button"
        className={`resumen-negocio-siguiente${proximo ? '' : ' resumen-negocio-siguiente--vacia'}`}
        onClick={onProximo}
      >
        <span className="resumen-negocio-etiqueta">
          <Timer size={14} strokeWidth={2.25} aria-hidden="true" />
          Próximo cobro
        </span>
        <span className="resumen-negocio-siguiente-cuerpo">
          <span className="resumen-negocio-siguiente-valor">
            {proximo ? (
              proximo.dias === 0 ? (
                'Hoy'
              ) : proximo.dias === 1 ? (
                'Mañana'
              ) : (
                <>
                  <small>en</small>
                  {proximo.dias} días
                </>
              )
            ) : (
              'Nadie'
            )}
          </span>
          <span className="resumen-negocio-siguiente-quien">
            {proximo ? (
              <>
                <span className="resumen-negocio-siguiente-cliente">
                  {proximo.nombre}
                  {proximo.mas > 0 && ` +${proximo.mas}`}
                </span>
                <span className="resumen-negocio-siguiente-hora">{proximo.monto} CUP</span>
              </>
            ) : (
              <span className="resumen-negocio-siguiente-hora resumen-negocio-siguiente-hora--suave">Sin cobros a la vista</span>
            )}
          </span>
          {proximo && <ChevronRight className="resumen-negocio-siguiente-flecha" size={18} strokeWidth={2} aria-hidden="true" />}
        </span>
        {proximo && (
          <span className="resumen-negocio-barra" role="presentation">
            <span
              className="resumen-negocio-barra-llenado"
              style={{ '--ancho': `${Math.round((1 - Math.min(proximo.dias, 7) / 7) * 100)}%` }}
            />
          </span>
        )}
      </button>

      <div className="resumen-negocio-metricas">
        <button type="button" className="resumen-negocio-tarjeta" onClick={onSocios}>
          <span className="resumen-negocio-etiqueta">
            <Users size={14} strokeWidth={2.25} aria-hidden="true" />
            Socios
          </span>
          <span className="resumen-negocio-valor">{socios.activos}</span>
          <span className="resumen-negocio-pie">
            <b>{socios.alDia}</b> al día
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

        <button type="button" className="resumen-negocio-tarjeta" onClick={onMes}>
          <span className="resumen-negocio-etiqueta">
            <Banknote size={14} strokeWidth={2.25} aria-hidden="true" />
            Este mes
          </span>
          <span className="resumen-negocio-valor">
            {mes.cobrado}
            <small>CUP</small>
          </span>
          <span className="resumen-negocio-pie">
            de <b>{mes.esperado}</b> esperados
          </span>
          <span className="resumen-negocio-barra" role="presentation">
            <span className="resumen-negocio-barra-llenado" style={{ '--ancho': `${cobradoPct}%` }} />
          </span>
        </button>
      </div>

      <div className="resumen-negocio-acciones">
        <button
          type="button"
          className={`resumen-negocio-accion resumen-negocio-accion--pausa${solicitudes ? ' resumen-negocio-accion--pausada' : ''}`}
          onClick={onSolicitudes}
        >
          <Inbox size={17} strokeWidth={2} aria-hidden="true" />
          {solicitudes ? (
            <span className="resumen-negocio-accion-pausa">
              {solicitudes} {solicitudes === 1 ? 'solicitud' : 'solicitudes'}
              <small>quieren unirse</small>
            </span>
          ) : (
            <span>Sin solicitudes</span>
          )}
        </button>
        <button type="button" className="resumen-negocio-accion resumen-negocio-accion--express" onClick={onNuevoSocio}>
          <UserPlus size={17} strokeWidth={2} aria-hidden="true" />
          <span>Nuevo socio</span>
        </button>
      </div>
    </section>
  )
}

export default ResumenSocios
