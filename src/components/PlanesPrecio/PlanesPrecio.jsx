import { useEffect, useId, useRef } from 'react'
import { Check } from 'lucide-react'
import { periodoDe } from '../../utils/fichaLocal.js'
import './planesPrecio.css'

/* Tarjetas de precio de los locales de suscripción (gimnasios, cursos…).
   Cada plan es un abono: arriba el nombre y el precio, una línea troquelada
   y debajo lo que incluye. "Lo que incluye" es opcional: si el dueño no lo
   escribe, la tarjeta se queda en el precio y ya.

   Dos modos:
   - vista:  en la ficha del local. Cada tarjeta lleva su botón "Elegir".
   - elegir: en la pantalla de unirse. Es un grupo de radios; toda la
             tarjeta se puede tocar. */
function PlanesPrecio({ planes = [], modo = 'vista', elegido = null, onElegir, nombreLocal }) {
  const grupo = useId()
  const railRef = useRef(null)
  const solo = planes.length === 1

  /* Con varios planes, el destacado (o el elegido) arranca a la vista. Se
     mueve el rail, no la página: scrollIntoView bajaría todo. */
  const enfocar = elegido ?? planes.find((p) => p.destacado)?.id ?? null
  useEffect(() => {
    const rail = railRef.current
    if (!rail || !enfocar) return
    const tarjeta = rail.querySelector(`[data-plan="${CSS.escape(enfocar)}"]`)
    if (!tarjeta) return
    const izquierda = tarjeta.offsetLeft - (rail.clientWidth - tarjeta.clientWidth) / 2
    rail.scrollTo({ left: Math.max(0, izquierda), behavior: 'auto' })
    /* Solo al montar: si el usuario mueve el rail, no se lo devolvemos. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!planes.length) {
    return (
      <p className="planes-vacio">
        Este local aún no publicó sus precios. Escríbeles por WhatsApp y pregúntales.
      </p>
    )
  }

  return (
    <div
      ref={railRef}
      className={`planes${solo ? ' planes--solo' : ''}`}
      role={modo === 'elegir' ? 'radiogroup' : undefined}
      aria-label={modo === 'elegir' ? 'Planes' : undefined}
    >
      {planes.map((plan) => (
        <TarjetaPlan
          key={plan.id}
          plan={plan}
          modo={modo}
          solo={solo}
          grupo={grupo}
          marcado={elegido === plan.id}
          onElegir={() => onElegir?.(plan.id)}
          nombreLocal={nombreLocal}
        />
      ))}
    </div>
  )
}

function TarjetaPlan({ plan, modo, solo, grupo, marcado, onElegir, nombreLocal }) {
  const idInput = `${grupo}-${plan.id}`
  const incluye = (plan.incluye ?? []).map((t) => String(t).trim()).filter(Boolean)
  const periodo = periodoDe(plan)
  const precio = Number(plan.precio) || 0
  const elegible = modo === 'elegir'

  const clases = [
    'plan',
    solo ? 'plan--solo' : '',
    plan.destacado && !solo ? 'plan--destacado' : '',
    incluye.length ? '' : 'plan--sin-lista',
    elegible ? 'plan--elegible' : '',
    marcado ? 'plan--marcado' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={clases} data-plan={plan.id}>
      <header className="plan-cabeza">
        <div className="plan-fila">
          {elegible ? (
            <>
              <input
                id={idInput}
                className="plan-radio"
                type="radio"
                name={grupo}
                checked={marcado}
                onChange={onElegir}
              />
              <span className="plan-marca" aria-hidden="true">
                {marcado ? <Check size={13} strokeWidth={3.2} /> : null}
              </span>
            </>
          ) : null}

          {elegible ? (
            <label htmlFor={idInput} className="plan-nombre">
              {plan.nombre}
            </label>
          ) : (
            <h3 className="plan-nombre">{plan.nombre}</h3>
          )}
          {plan.destacado && !solo ? <span className="plan-cinta">El más elegido</span> : null}
        </div>

        <p className="plan-precio">
          {precio > 0 ? (
            <>
              <span className="plan-cifra">{precio.toLocaleString('es')}</span>
              <span className="plan-moneda">
                CUP
                <span className="plan-periodo">/{periodo.corto}</span>
              </span>
            </>
          ) : (
            <span className="plan-cifra">Gratis</span>
          )}
        </p>
        <p className="plan-cobro">{precio > 0 ? `Se paga ${periodo.largo}` : 'Sin cuota'}</p>
      </header>

      {incluye.length ? (
        <>
          <span className="plan-corte" aria-hidden="true" />
          <ul className="plan-incluye" aria-label={`Qué incluye ${plan.nombre}`}>
            {incluye.map((linea) => (
              <li key={linea}>
                <Check size={15} strokeWidth={2.8} aria-hidden="true" />
                <span>{linea}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!elegible ? (
        <button
          type="button"
          className="plan-boton"
          onClick={onElegir}
          aria-label={`Unirme a ${nombreLocal ?? 'este local'} con el plan ${plan.nombre}`}
        >
          {solo ? 'Unirme' : 'Elegir este'}
        </button>
      ) : null}
    </article>
  )
}

export default PlanesPrecio
