import { useState } from 'react'
import { differenceInCalendarDays, format, isSameMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRightLeft, Banknote, Check, ChevronLeft, ChevronRight, MessageCircle, Minus, Phone, Plus, X } from 'lucide-react'
import SelectorTurno from '../../Turnos/SelectorTurno.jsx'
import { BarraDinero, Contador, Dona } from '../modales/ContenidoModalNegocio.jsx'
import { Dato, Seccion } from '../modales/piezas.jsx'
import { iniciales, precioPlanTexto } from '../../../utils/fichaLocal.js'
import { fechaCorta, mensajeRecordatorio, textoSituacion } from '../../../utils/socios.js'
import {
  CUPO_MAX,
  CUPO_MIN,
  DURACIONES_TURNO,
  estadoTurno,
  franjaDelDia,
  listaTurnos,
  ocupacionTurnos,
  turnoDeSocio,
} from '../../../utils/turnos.js'
import '../modalCatalogo.css'
import '../negocioMesas.css'
import './contenidoSocios.css'

/* Hojas del panel rápido de un local de suscripción:
   - cobros:      quién paga en el próximo día de cobro (y quién debe ya).
   - socios:      el pastel de cómo van los pagos, por plan y por turno.
   - mes:         lo cobrado este mes contra lo esperado.
   - solicitudes: la gente que pidió unirse, para aceptarla o no.
   - turnos:      duración de los turnos y cupo de cada uno.
   - turno:       quién va a un turno, su cupo y mover a la gente de turno. */

const COLOR = {
  verde: 'var(--primary-color)',
  amarillo: 'var(--yellow-color)',
  rosa: 'var(--rosa)',
  neutro: 'var(--neutro-apagado)',
}
const PALETA = [COLOR.verde, COLOR.amarillo, 'var(--primary-color-weak)', COLOR.rosa, COLOR.neutro]
const CUPOS_RAPIDOS = [8, 10, 12, 15, 20, 25]

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
const tel = (s) => String(s?.telefono || '').replace(/\D/g, '')
const primerNombre = (nombre) => String(nombre || '').split(' ')[0]

/* ---------- Piezas ---------- */

function Persona({ socio, meta, tono = 'verde', children, lado }) {
  return (
    <li className={`hoja-persona hoja-persona--${tono}`}>
      <div className="hoja-persona-fila">
        <span className="hoja-persona-avatar" aria-hidden="true">
          {iniciales(socio.nombre)}
        </span>
        <span className="hoja-persona-textos">
          <span className="hoja-persona-nombre">{socio.nombre}</span>
          {meta && <span className="hoja-persona-meta">{meta}</span>}
        </span>
        {lado && <span className="hoja-persona-lado">{lado}</span>}
      </div>
      {children}
    </li>
  )
}

function Contacto({ socio, situacion, local, recordar = false }) {
  const t = tel(socio)
  if (!t) return null
  const texto = recordar ? `?text=${encodeURIComponent(mensajeRecordatorio(socio, situacion, local))}` : ''
  return (
    <>
      <a className="hoja-boton hoja-boton--suave" href={`https://wa.me/${t}${texto}`} target="_blank" rel="noreferrer">
        <MessageCircle size={15} strokeWidth={2.25} aria-hidden="true" />
        {recordar ? 'Recordarle' : 'WhatsApp'}
      </a>
      <a className="hoja-boton hoja-boton--suave hoja-boton--icono" href={`tel:+${t}`} aria-label={`Llamar a ${socio.nombre}`}>
        <Phone size={15} strokeWidth={2.25} aria-hidden="true" />
      </a>
    </>
  )
}

function Vacio({ children }) {
  return (
    <div className="modal-negocio-vacio" data-entra>
      <span className="modal-negocio-vacio-luna" aria-hidden="true" />
      <p className="modal-negocio-lead">{children}</p>
    </div>
  )
}

/** [−] 12 [+] para el cupo de un turno. */
export function Pasos({ valor, onCambiar, min = CUPO_MIN, max = CUPO_MAX, etiqueta }) {
  return (
    <span className="hoja-pasos" role="group" aria-label={etiqueta}>
      <button type="button" aria-label="Uno menos" disabled={valor <= min} onClick={() => onCambiar(valor - 1)}>
        <Minus size={15} strokeWidth={2.5} />
      </button>
      <output aria-live="polite">{valor}</output>
      <button type="button" aria-label="Uno más" disabled={valor >= max} onClick={() => onCambiar(valor + 1)}>
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </span>
  )
}

/* ---------- Próximo cobro ---------- */

function HojaCobros({ lista, local, turnos, ahora, onCobrar }) {
  const activos = lista.filter((x) => x.socio.estado === 'activo')
  const proximos = activos.filter((x) => x.situacion.dias >= 0).sort((a, b) => a.situacion.dias - b.situacion.dias)
  const dia = proximos[0]?.situacion.dias
  const grupo = proximos.filter((x) => x.situacion.dias === dia)
  const deben = activos.filter((x) => x.situacion.dias < 0).sort((a, b) => a.situacion.dias - b.situacion.dias)
  const total = grupo.reduce((t, x) => t + x.situacion.total, 0)

  if (!grupo.length && !deben.length) return <Vacio>No hay ningún cobro pendiente. Todos tus clientes están pagados.</Vacio>

  const cuando =
    dia === 0
      ? 'Pagan hoy'
      : dia === 1
        ? 'Pagan mañana'
        : dia != null
          ? `Pagan el ${format(parseISO(grupo[0].socio.proximoPago), "EEEE d 'de' MMMM", { locale: es })}`
          : null

  const fila = (x) => {
    const turno = turnoDeSocio(turnos, x.socio)
    const atrasado = x.situacion.dias < 0
    return (
      <Persona
        key={x.socio.id}
        socio={x.socio}
        tono={x.situacion.clave === 'atrasado' ? 'rosa' : atrasado || x.situacion.dias <= 1 ? 'amarillo' : 'verde'}
        meta={[
          x.situacion.plan?.nombre,
          turno?.texto,
          atrasado && (-x.situacion.dias === 1 ? '1 día tarde' : `${-x.situacion.dias} días tarde`),
        ]
          .filter(Boolean)
          .join(' · ')}
        lado={
          <span className="hoja-monto">
            {x.situacion.total}
            <small>CUP</small>
            {x.situacion.recargo > 0 && <em>+{x.situacion.recargo} recargo</em>}
          </span>
        }
      >
        <div className="hoja-persona-acciones">
          <button type="button" className="hoja-boton hoja-boton--principal" onClick={() => onCobrar(x)}>
            <Banknote size={15} strokeWidth={2.25} aria-hidden="true" />
            Cobrar
          </button>
          <Contacto socio={x.socio} situacion={x.situacion} local={local} recordar />
        </div>
      </Persona>
    )
  }

  return (
    <div className="modal-negocio-stack">
      {grupo.length > 0 && (
        <>
          <div className="modal-negocio-hero" data-entra>
            <span className="modal-negocio-numero modal-negocio-numero--grande">
              <Contador valor={total} />
              <small>CUP</small>
            </span>
            <span className="modal-negocio-hero-sub">
              {cuando} · {grupo.length} {grupo.length === 1 ? 'persona' : 'personas'}
            </span>
          </div>

          <Seccion titulo={cuando} extra={format(ahora, "'Hoy es' d/M")}>
            <ul className="hoja-personas">{grupo.map(fila)}</ul>
          </Seccion>
        </>
      )}

      {deben.length > 0 && (
        <Seccion
          titulo="Ya se pasaron de fecha"
          extra={`${deben.reduce((t, x) => t + x.situacion.total, 0)} CUP`}
        >
          <ul className="hoja-personas">{deben.map(fila)}</ul>
          <p className="modal-negocio-nota">El recargo ya va sumado. Al cobrar, su próxima fecha pasa al periodo siguiente.</p>
        </Seccion>
      )}
    </div>
  )
}

/* ---------- Socios (pastel) ---------- */

function HojaSocios({ lista, local, turnos }) {
  const activos = lista.filter((x) => x.socio.estado === 'activo')
  const de = (...claves) => activos.filter((x) => claves.includes(x.situacion.clave)).length
  const segmentos = [
    { id: 'al-dia', label: 'Al día', cantidad: de('al-dia'), color: COLOR.verde },
    { id: 'por-vencer', label: 'Pagan pronto', cantidad: de('por-vencer', 'gracia'), color: COLOR.amarillo },
    { id: 'atrasado', label: 'Atrasados', cantidad: de('atrasado'), color: COLOR.rosa },
  ]
  const solicitudes = lista.filter((x) => x.socio.estado === 'solicitud').length
  const bajas = lista.filter((x) => x.socio.estado === 'baja').length

  if (!activos.length) return <Vacio>Todavía no tienes clientes pagando. Apunta al primero con «Nuevo cliente».</Vacio>

  const planes = (local.planes ?? [])
    .map((p, i) => ({
      id: p.id,
      label: p.nombre,
      ayuda: precioPlanTexto(p),
      monto: activos.filter((x) => x.socio.planId === p.id).length,
      color: PALETA[i % PALETA.length],
    }))
    .filter((p) => p.monto > 0)

  const franjas = turnos.length
    ? ['Mañana', 'Tarde', 'Noche']
        .map((f, i) => ({
          id: f,
          label: f,
          monto: activos.filter((x) => {
            const t = turnoDeSocio(turnos, x.socio)
            return t && franjaDelDia(t.inicio % 1440) === f
          }).length,
          color: [COLOR.amarillo, COLOR.verde, 'var(--primary-color-weak)'][i],
        }))
        .filter((f) => f.monto > 0)
    : []
  const sinTurno = turnos.length ? activos.filter((x) => !turnoDeSocio(turnos, x.socio)).length : 0
  const cuotas = activos.reduce((t, x) => t + x.situacion.cuota, 0)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-ocupacion" data-entra>
        <Dona segmentos={segmentos} capacidad={activos.length} porcentaje={pct(segmentos[0].cantidad, activos.length)} sub="al día" />
        <ul className="modal-negocio-leyenda">
          {segmentos.map((s) => (
            <li key={s.id}>
              <span className="modal-negocio-leyenda-muestra" style={{ background: s.color }} />
              <span className="modal-negocio-leyenda-nombre">{s.label}</span>
              <strong>
                {s.cantidad}
                <small className="hoja-pct">{pct(s.cantidad, activos.length)}%</small>
              </strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Pagando" valor={activos.length} tono="verde" />
        <Dato etiqueta="Quieren entrar" valor={solicitudes} tono="amarillo" />
        <Dato etiqueta="De baja" valor={bajas} />
      </div>

      {planes.length > 0 && (
        <Seccion titulo="Por plan" extra={`${cuotas} CUP en cuotas`}>
          <BarraDinero partes={planes} total={activos.length} />
          <ul className="modal-negocio-desglose">
            {planes.map((p) => (
              <li key={p.id}>
                <span className="modal-negocio-leyenda-muestra" style={{ background: p.color }} />
                <span className="modal-negocio-desglose-textos">
                  <span className="modal-negocio-desglose-nombre">{p.label}</span>
                  <span className="modal-negocio-desglose-ayuda">{p.ayuda}</span>
                </span>
                <span className="modal-negocio-desglose-monto">
                  {p.monto} {p.monto === 1 ? 'cliente' : 'clientes'}
                  <small>{pct(p.monto, activos.length)}%</small>
                </span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {franjas.length > 0 && (
        <Seccion titulo="A qué hora vienen">
          <BarraDinero partes={franjas} total={activos.length} />
          <ul className="modal-negocio-desglose">
            {franjas.map((f) => (
              <li key={f.id}>
                <span className="modal-negocio-leyenda-muestra" style={{ background: f.color }} />
                <span className="modal-negocio-desglose-textos">
                  <span className="modal-negocio-desglose-nombre">Por la {f.label.toLowerCase()}</span>
                </span>
                <span className="modal-negocio-desglose-monto">
                  {f.monto} {f.monto === 1 ? 'cliente' : 'clientes'}
                  <small>{pct(f.monto, activos.length)}%</small>
                </span>
              </li>
            ))}
          </ul>
          {sinTurno > 0 && (
            <p className="modal-negocio-nota">
              {sinTurno} {sinTurno === 1 ? 'cliente no tiene' : 'clientes no tienen'} turno todavía.
            </p>
          )}
        </Seccion>
      )}
    </div>
  )
}

/* ---------- Este mes ---------- */

function HojaMes({ lista, ahora }) {
  const pagos = lista
    .flatMap((x) => (x.socio.pagos ?? []).map((p) => ({ ...p, socio: x.socio })))
    .filter((p) => isSameMonth(parseISO(p.fecha), ahora))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const cobrado = pagos.reduce((t, p) => t + (p.monto || 0) + (p.recargo || 0), 0)
  const recargos = pagos.reduce((t, p) => t + (p.recargo || 0), 0)

  const activos = lista.filter((x) => x.socio.estado === 'activo')
  const porCobrar = activos.filter((x) => x.situacion.dias >= 0 && isSameMonth(parseISO(x.socio.proximoPago), ahora))
  const atrasados = activos.filter((x) => x.situacion.dias < 0)
  const sumar = (xs) => xs.reduce((t, x) => t + x.situacion.total, 0)
  const partes = [
    { id: 'cobrado', label: 'Ya cobrado', ayuda: `${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'} este mes`, monto: cobrado, color: COLOR.verde },
    {
      id: 'por-cobrar',
      label: 'Falta por cobrar',
      ayuda: `${porCobrar.length} ${porCobrar.length === 1 ? 'cliente paga' : 'clientes pagan'} antes de fin de mes`,
      monto: sumar(porCobrar),
      color: COLOR.amarillo,
    },
    {
      id: 'atrasado',
      label: 'Atrasado',
      ayuda: `${atrasados.length} ${atrasados.length === 1 ? 'cliente debe' : 'clientes deben'}, con su recargo`,
      monto: sumar(atrasados),
      color: COLOR.rosa,
    },
  ]
  const esperado = partes.reduce((t, p) => t + p.monto, 0)
  const nombreMes = format(ahora, 'MMMM', { locale: es })

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-hero" data-entra>
        <span className="modal-negocio-numero modal-negocio-numero--grande">
          <Contador valor={cobrado} />
          <small>CUP</small>
        </span>
        <span className="modal-negocio-hero-sub">
          Cobrado en {nombreMes} · {pct(cobrado, esperado)}% de {esperado} CUP
        </span>
      </div>

      <Seccion titulo="Cómo va el mes">
        <BarraDinero partes={partes} total={esperado} />
        <ul className="modal-negocio-desglose">
          {partes.map((p) => (
            <li key={p.id}>
              <span className="modal-negocio-leyenda-muestra" style={{ background: p.color }} />
              <span className="modal-negocio-desglose-textos">
                <span className="modal-negocio-desglose-nombre">{p.label}</span>
                <span className="modal-negocio-desglose-ayuda">{p.ayuda}</span>
              </span>
              <span className="modal-negocio-desglose-monto">
                {p.monto} CUP
                <small>{pct(p.monto, esperado)}%</small>
              </span>
            </li>
          ))}
        </ul>
      </Seccion>

      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Pagos" valor={pagos.length} tono="verde" />
        <Dato etiqueta="Recargos" valor={`+${recargos}`} tono="amarillo" />
        <Dato etiqueta="Pago medio" valor={pagos.length ? Math.round(cobrado / pagos.length) : '—'} />
      </div>

      <Seccion titulo="Últimos pagos" extra={pagos.length > 6 ? `6 de ${pagos.length}` : null}>
        {pagos.length ? (
          <ul className="hoja-pagos">
            {pagos.slice(0, 6).map((p, i) => (
              <li key={`${p.socio.id}-${p.fecha}-${i}`}>
                <span className="hoja-pagos-fecha">{fechaCorta(p.fecha)}</span>
                <span className="hoja-pagos-nombre">{p.socio.nombre}</span>
                <span className="hoja-pagos-monto">
                  {(p.monto || 0) + (p.recargo || 0)} CUP
                  {p.recargo > 0 && <small>con recargo</small>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="modal-negocio-nota">Nadie ha pagado todavía en {nombreMes}.</p>
        )}
      </Seccion>
    </div>
  )
}

/* ---------- Solicitudes ---------- */

function Solicitud({ x, turnos, ahora, onAceptar, onRechazar, onMover }) {
  const [cambiando, setCambiando] = useState(false)
  const turno = turnoDeSocio(turnos, x.socio)
  const lleno = turno && estadoTurno(turno.ocupados, turno.cupo) === 'lleno'
  const hace = differenceInCalendarDays(ahora, parseISO(x.socio.desde))

  return (
    <Persona
      socio={x.socio}
      tono="amarillo"
      meta={[
        x.situacion.plan ? `${x.situacion.plan.nombre} · ${precioPlanTexto(x.situacion.plan)}` : 'Sin plan',
        hace <= 0 ? 'pidió hoy' : hace === 1 ? 'pidió ayer' : `pidió hace ${hace} días`,
      ].join(' · ')}
    >
      {turnos.length > 0 && (
        <div className={`hoja-solicitud-turno${lleno ? ' hoja-solicitud-turno--lleno' : ''}`}>
          <span>
            {turno ? (
              <>
                Quiere el turno de <b>{turno.texto}</b>
                {lleno && <em>Ese turno está lleno: pásalo a otro o sube el cupo.</em>}
              </>
            ) : (
              'No eligió turno.'
            )}
          </span>
          <button type="button" className="hoja-enlace" onClick={() => setCambiando((v) => !v)}>
            {cambiando ? 'Cerrar' : turno ? 'Cambiar' : 'Elegir'}
          </button>
        </div>
      )}
      {cambiando && (
        <SelectorTurno
          turnos={turnos}
          elegido={turno?.id}
          etiqueta={`Turno para ${x.socio.nombre}`}
          onElegir={(id) => {
            onMover(x.socio, id)
            setCambiando(false)
          }}
        />
      )}
      <div className="hoja-persona-acciones">
        <button type="button" className="hoja-boton hoja-boton--peligro" onClick={() => onRechazar(x)}>
          <X size={15} strokeWidth={2.5} aria-hidden="true" />
          No aceptar
        </button>
        <button type="button" className="hoja-boton hoja-boton--principal" onClick={() => onAceptar(x)}>
          <Check size={15} strokeWidth={2.75} aria-hidden="true" />
          Aceptar
        </button>
        <Contacto socio={x.socio} situacion={x.situacion} />
      </div>
    </Persona>
  )
}

function HojaSolicitudes({ lista, turnos, ahora, onAceptar, onRechazar, onMover }) {
  const solicitudes = lista.filter((x) => x.socio.estado === 'solicitud')
  if (!solicitudes.length) {
    return (
      <Vacio>
        Nadie ha pedido unirse por ahora. Cuando alguien toque «Unirme» en tu página, te llegará aquí para que lo aceptes.
      </Vacio>
    )
  }
  return (
    <div className="modal-negocio-stack">
      <p className="modal-negocio-lead" data-entra>
        {solicitudes.length === 1 ? 'Una persona quiere' : `${solicitudes.length} personas quieren`} unirse. Al aceptar,
        entra con el primer pago para hoy: se cobra en el local.
      </p>
      <ul className="hoja-personas" data-entra>
        {solicitudes.map((x) => (
          <Solicitud
            key={x.socio.id}
            x={x}
            turnos={turnos}
            ahora={ahora}
            onAceptar={onAceptar}
            onRechazar={onRechazar}
            onMover={onMover}
          />
        ))}
      </ul>
    </div>
  )
}

/* ---------- Ajustes de turnos ---------- */

function HojaTurnos({ local, config, socios, onGuardar }) {
  const [form, setForm] = useState(() => ({ ...config, cupos: { ...config.cupos } }))
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  /* Al cambiar la duración, las excepciones de cupo ya no casan con las horas. */
  const cambiarDuracion = (duracion) => setForm((f) => ({ ...f, duracion, cupos: duracion === f.duracion ? f.cupos : {} }))
  const cupoDe = (id, valor) =>
    setForm((f) => {
      const cupos = { ...f.cupos }
      if (valor === f.cupo) delete cupos[id]
      else cupos[id] = valor
      return { ...f, cupos }
    })

  const lista = listaTurnos(local, form)
  const { cuenta } = ocupacionTurnos(lista, socios)
  const pasados = lista.filter((t) => cuenta[t.id] > t.cupo)
  const plazas = lista.reduce((t, x) => t + x.cupo, 0)

  return (
    <form
      className="modal-negocio-stack"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar({ turnos: { activo: form.activo, duracion: form.duracion, cupo: form.cupo, cupos: form.cupos } })
      }}
      noValidate
    >
      <Seccion titulo="Reservar por turnos">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Usar turnos">
          <button type="button" aria-pressed={form.activo} onClick={() => cambiar('activo', true)}>
            Sí, con turnos
          </button>
          <button type="button" aria-pressed={!form.activo} onClick={() => cambiar('activo', false)}>
            Horario libre
          </button>
        </div>
        <p className="modal-negocio-nota">
          {form.activo
            ? 'Quien se une elige a qué turno viene, y tú ves cuánta gente hay en cada uno.'
            : 'La gente viene a la hora que quiera. No se pide turno al unirse.'}
        </p>
      </Seccion>

      {form.activo && (
        <>
          <Seccion titulo="Cada turno dura">
            <div className="modal-negocio-segmentado modal-negocio-segmentado--tono hoja-segmentado--tres" role="group" aria-label="Duración del turno">
              {DURACIONES_TURNO.map((d) => (
                <button key={d.minutos} type="button" aria-pressed={form.duracion === d.minutos} onClick={() => cambiarDuracion(d.minutos)}>
                  {d.label}
                </button>
              ))}
            </div>
            <p className="modal-negocio-nota">
              De {local.horarioApertura} a {local.horarioCierre} salen {lista.length} turnos
              {lista.at(-1)?.corto ? ' (el último, más corto, hasta que cierras)' : ''}.
            </p>
          </Seccion>

          <Seccion titulo="Personas por turno" extra={`${plazas} plazas al día`}>
            <div className="hoja-cupo-general">
              <span>Cupo normal</span>
              <Pasos valor={form.cupo} etiqueta="Cupo normal por turno" onCambiar={(n) => cambiar('cupo', n)} />
            </div>
            <div className="modal-negocio-opciones" role="group" aria-label="Cupos habituales">
              {CUPOS_RAPIDOS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="modal-negocio-chip modal-negocio-chip--verde"
                  aria-pressed={form.cupo === n}
                  onClick={() => cambiar('cupo', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </Seccion>

          <Seccion titulo="Turno a turno" extra="Toca − o + para cambiar uno solo">
            <ul className="hoja-turnos">
              {lista.map((t) => {
                const ocupados = cuenta[t.id]
                const distinto = t.cupo !== form.cupo
                return (
                  <li key={t.id} className={ocupados > t.cupo ? 'hoja-turnos--pasado' : undefined}>
                    <span className="hoja-turnos-textos">
                      <span className="hoja-turnos-hora">{t.texto}</span>
                      <span className="hoja-turnos-meta">
                        {ocupados} {ocupados === 1 ? 'cliente' : 'clientes'}
                        {distinto && <em>{t.cupo < form.cupo ? ' · cupo reducido' : ' · cupo ampliado'}</em>}
                      </span>
                    </span>
                    <Pasos valor={t.cupo} etiqueta={`Cupo del turno de ${t.texto}`} onCambiar={(n) => cupoDe(t.id, n)} />
                  </li>
                )
              })}
            </ul>
            {pasados.length > 0 && (
              <p className="catalogo-error" role="alert">
                {pasados.length === 1 ? 'Un turno tiene' : `${pasados.length} turnos tienen`} más clientes que cupo. Nadie sale de su
                turno: mueve a alguien desde el turno o sube el cupo.
              </p>
            )}
          </Seccion>
        </>
      )}

      <button type="submit" className="modal-negocio-accion-principal">
        Guardar turnos
      </button>
    </form>
  )
}

/* ---------- Un turno: quién va y mover gente ---------- */

function HojaTurno({ id, moviendo: moviendoInicial, lista, turnos, onNavegar, onMover, onCupo }) {
  const [moviendo, setMoviendo] = useState(moviendoInicial ?? null)
  const indice = turnos.findIndex((t) => t.id === id)
  const turno = turnos[indice]
  if (!turno) return <Vacio>Ese turno ya no existe: cambiaste la duración de los turnos.</Vacio>

  const enTurno = lista.filter((x) => turnoDeSocio(turnos, x.socio)?.id === turno.id)
  const socios = enTurno.filter((x) => x.socio.estado === 'activo')
  const piden = enTurno.filter((x) => x.socio.estado === 'solicitud')
  const estado = estadoTurno(turno.ocupados, turno.cupo)
  const libres = turno.cupo - turno.ocupados
  const anterior = turnos[indice - 1]
  const siguiente = turnos[indice + 1]

  return (
    <div className="modal-negocio-stack">
      <nav className="hoja-turno-nav" data-entra aria-label="Otros turnos">
        <button
          type="button"
          disabled={!anterior}
          onClick={() => onNavegar({ tipo: 'turno', id: anterior.id })}
          aria-label={anterior ? `Turno anterior, ${anterior.texto}` : 'No hay turno anterior'}
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <span>
          <b>{turno.texto}</b>
          <small>
            Turno {indice + 1} de {turnos.length} · {franjaDelDia(turno.inicio % 1440).toLowerCase()}
          </small>
        </span>
        <button
          type="button"
          disabled={!siguiente}
          onClick={() => onNavegar({ tipo: 'turno', id: siguiente.id })}
          aria-label={siguiente ? `Turno siguiente, ${siguiente.texto}` : 'No hay turno siguiente'}
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
      </nav>

      <div className={`hoja-turno-cupo hoja-turno-cupo--${estado}`} data-entra>
        <span className="hoja-turno-cifra">
          <b>{turno.ocupados}</b> de {turno.cupo}
        </span>
        <span className="hoja-turno-barra" aria-hidden="true">
          <span style={{ width: `${Math.min(100, pct(turno.ocupados, turno.cupo))}%` }} />
        </span>
        <span className="hoja-turno-estado">
          {libres > 0 ? `${libres} ${libres === 1 ? 'sitio libre' : 'sitios libres'}` : libres === 0 ? 'Lleno' : `${-libres} de más`}
        </span>
        <span className="hoja-turno-ajuste">
          <span>Cupo de este turno</span>
          <Pasos valor={turno.cupo} etiqueta={`Cupo del turno de ${turno.texto}`} onCambiar={(n) => onCupo(turno.id, n)} />
        </span>
      </div>

      <Seccion titulo="Vienen a este turno" extra={socios.length ? `${socios.length}` : null}>
        {socios.length ? (
          <ul className="hoja-personas">
            {socios.map((x) => (
              <Persona
                key={x.socio.id}
                socio={x.socio}
                tono={x.situacion.clave === 'atrasado' ? 'rosa' : x.situacion.clave === 'al-dia' ? 'verde' : 'amarillo'}
                meta={`${x.situacion.plan?.nombre ?? 'Sin plan'} · ${textoSituacion(x.situacion)}`}
                lado={
                  <button
                    type="button"
                    className="hoja-boton hoja-boton--suave"
                    aria-expanded={moviendo === x.socio.id}
                    onClick={() => setMoviendo((v) => (v === x.socio.id ? null : x.socio.id))}
                  >
                    <ArrowRightLeft size={14} strokeWidth={2.25} aria-hidden="true" />
                    {moviendo === x.socio.id ? 'Cerrar' : 'Mover'}
                  </button>
                }
              >
                {moviendo === x.socio.id && (
                  <div className="hoja-mover">
                    <p>¿A qué turno pasa {primerNombre(x.socio.nombre)}?</p>
                    <SelectorTurno
                      turnos={turnos}
                      actual={turno.id}
                      elegido={turno.id}
                      etiqueta={`Nuevo turno para ${x.socio.nombre}`}
                      onElegir={(destino) => {
                        if (destino !== turno.id) onMover(x.socio, destino)
                        setMoviendo(null)
                      }}
                    />
                  </div>
                )}
              </Persona>
            ))}
          </ul>
        ) : (
          <p className="modal-negocio-nota">Nadie tiene este turno todavía.</p>
        )}
      </Seccion>

      {piden.length > 0 && (
        <Seccion titulo="Lo piden (sin aceptar)">
          <ul className="hoja-personas">
            {piden.map((x) => (
              <Persona key={x.socio.id} socio={x.socio} tono="amarillo" meta={x.situacion.plan?.nombre ?? 'Sin plan'} />
            ))}
          </ul>
          <p className="modal-negocio-nota">Las solicitudes no ocupan sitio hasta que las aceptas.</p>
        </Seccion>
      )}
    </div>
  )
}

export default function ContenidoSocios({
  modal,
  local,
  lista,
  turnos,
  configTurnos,
  ahora,
  onNavegar,
  onCobrar,
  onAceptar,
  onRechazar,
  onMover,
  onCupoTurno,
  onGuardar,
}) {
  switch (modal?.tipo) {
    case 'cobros':
      return <HojaCobros lista={lista} local={local} turnos={turnos} ahora={ahora} onCobrar={onCobrar} />
    case 'socios':
      return <HojaSocios lista={lista} local={local} turnos={turnos} />
    case 'mes':
      return <HojaMes lista={lista} ahora={ahora} />
    case 'solicitudes':
      return (
        <HojaSolicitudes
          lista={lista}
          turnos={turnos}
          ahora={ahora}
          onAceptar={onAceptar}
          onRechazar={onRechazar}
          onMover={onMover}
        />
      )
    case 'turnos':
      return <HojaTurnos local={local} config={configTurnos} socios={lista.map((x) => x.socio)} onGuardar={onGuardar} />
    case 'turno':
      return (
        <HojaTurno
          key={`${modal.id}-${modal.moviendo ?? ''}`}
          id={modal.id}
          moviendo={modal.moviendo}
          lista={lista}
          turnos={turnos}
          onNavegar={onNavegar}
          onMover={onMover}
          onCupo={onCupoTurno}
        />
      )
    default:
      return null
  }
}
