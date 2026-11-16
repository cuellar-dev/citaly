import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronRight, Plus, Star, X } from 'lucide-react'
import PlanesPrecio from '../../PlanesPrecio/PlanesPrecio.jsx'
import { nuevoId, precioPlanTexto } from '../../../utils/fichaLocal.js'
import { recargoDe, sumarPeriodo } from '../../../utils/socios.js'
import { BotonEliminar } from './ContenidoCatalogo.jsx'
import { Dato, Seccion } from './piezas.jsx'
import '../modalCatalogo.css'
import '../negocioMesas.css'
import '../Suscripcion/negocioSuscripcion.css'

/* Hojas del dueño de un local de suscripción:
   - planes:     los precios que ofrece, en orden.
   - plan:       nombre, precio, cada cuánto se paga, qué incluye, destacado.
   - recargo:    lo que se suma por cada día de atraso.
   - nuevoSocio: apuntar a alguien que se apunta en el mostrador. */

const PERIODOS = [
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'trimestre', label: '3 meses' },
  { id: 'anio', label: 'Año' },
]
const MAX_INCLUYE = 6
const POR_DIA = [0, 25, 50, 100]
const GRACIA = [0, 1, 2, 3, 5]
const TOPES = [0, 300, 600, 1000]

/* ---------- Planes ---------- */

function ListaPlanes({ local, sociosPorPlan, onNavegar }) {
  const planes = local.planes ?? []
  const precios = planes.map((p) => Number(p.precio) || 0)
  const socios = Object.values(sociosPorPlan).reduce((t, n) => t + n, 0)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Planes" valor={planes.length} />
        <Dato etiqueta="Desde CUP" valor={planes.length ? Math.min(...precios) : '—'} tono="verde" />
        <Dato etiqueta="Socios" valor={socios} tono="amarillo" />
      </div>

      {planes.length ? (
        <ul className="catalogo-lista" data-entra>
          {planes.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="catalogo-fila"
                onClick={() => onNavegar({ tipo: 'plan', id: p.id, titulo: 'Editar plan' })}
              >
                <span className="catalogo-fila-textos">
                  <span className="catalogo-fila-titulo">
                    {p.nombre}
                    {p.destacado && <Star className="planes-estrella" size={13} strokeWidth={2} fill="currentColor" aria-label="destacado" />}
                  </span>
                  <span className="catalogo-fila-meta">
                    {p.incluye?.length ? `${p.incluye.length} cosas incluidas` : 'Solo el precio'}
                  </span>
                  <span className="catalogo-quienes">
                    {sociosPorPlan[p.id] ?? 0} {sociosPorPlan[p.id] === 1 ? 'socio' : 'socios'}
                  </span>
                </span>
                <span className="catalogo-precio">{precioPlanTexto(p)}</span>
                <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="modal-negocio-lead" data-entra>
          Todavía no tienes planes. Añade el primero y la gente podrá unirse desde tu página.
        </p>
      )}

      <button
        type="button"
        className="modal-negocio-accion-principal catalogo-accion"
        onClick={() => onNavegar({ tipo: 'plan', id: null, titulo: 'Nuevo plan' })}
        data-entra
      >
        <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
        Añadir plan
      </button>
      <p className="modal-negocio-nota" data-entra>
        Con un solo plan, tu página lo enseña en grande. Con varios, se pueden deslizar y comparar.
      </p>
    </div>
  )
}

function FormPlan({ local, id, sociosPorPlan, onGuardar, onNavegar }) {
  const planes = local.planes ?? []
  const actual = planes.find((p) => p.id === id)
  const [form, setForm] = useState(() => ({
    nombre: actual?.nombre ?? '',
    precio: actual ? String(actual.precio ?? '') : '',
    periodo: actual?.periodo ?? 'mes',
    incluye: [...(actual?.incluye ?? [])],
    destacado: Boolean(actual?.destacado),
  }))
  const [linea, setLinea] = useState('')
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const agregarLinea = () => {
    const texto = linea.trim()
    if (!texto || form.incluye.length >= MAX_INCLUYE || form.incluye.includes(texto)) return
    cambiar('incluye', [...form.incluye, texto])
    setLinea('')
  }

  const nombre = form.nombre.trim()
  const precio = Number(form.precio)
  let error = null
  if (!nombre) error = 'Ponle un nombre al plan.'
  else if (planes.some((p) => p.id !== id && p.nombre.trim().toLowerCase() === nombre.toLowerCase()))
    error = 'Ya tienes un plan con ese nombre.'
  else if (form.precio === '' || !Number.isFinite(precio) || precio < 0) error = 'Escribe el precio (0 si es gratis).'

  const plan = {
    ...actual,
    id: id ?? 'nuevo',
    nombre: nombre || 'Nombre del plan',
    precio: Number.isFinite(precio) ? Math.round(precio) : 0,
    periodo: form.periodo,
    incluye: form.incluye,
    destacado: form.destacado,
  }

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    const limpio = { ...plan, id: id ?? nuevoId('plan'), nombre }
    if (!limpio.incluye.length) delete limpio.incluye
    if (!limpio.destacado) delete limpio.destacado
    /* Solo un destacado: si este lo es, los demás dejan de serlo. */
    const resto = planes.map((p) => (limpio.destacado && p.id !== limpio.id ? { ...p, destacado: undefined } : p))
    onGuardar(
      { planes: actual ? resto.map((p) => (p.id === id ? limpio : p)) : [...resto, limpio] },
      { tipo: 'planes' },
    )
  }

  const enUso = id ? (sociosPorPlan[id] ?? 0) : 0

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="catalogo-previa" data-entra>
        <span className="catalogo-previa-etiqueta">Así lo ve el cliente</span>
        <div className="planes-previa" inert>
          <PlanesPrecio planes={[{ ...plan, destacado: false }]} />
        </div>
      </div>

      <Seccion titulo="Plan">
        <label className="modal-negocio-campo">
          <span>Nombre</span>
          <input
            className="modal-negocio-input"
            value={form.nombre}
            maxLength={28}
            placeholder="Completo"
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        </label>
        <label className="modal-negocio-campo">
          <span>Precio</span>
          <span className="catalogo-precio-campo">
            <input
              className="modal-negocio-input"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              value={form.precio}
              placeholder="1500"
              onChange={(e) => cambiar('precio', e.target.value)}
            />
            <em>CUP</em>
          </span>
        </label>
      </Seccion>

      <Seccion titulo="Se paga cada">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono" role="group" aria-label="Cada cuánto se paga">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" aria-pressed={form.periodo === p.id} onClick={() => cambiar('periodo', p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Qué incluye" extra={form.incluye.length ? `${form.incluye.length} de ${MAX_INCLUYE}` : 'Opcional'}>
        {form.incluye.length > 0 && (
          <ul className="planes-incluye">
            {form.incluye.map((t, i) => (
              <li key={t}>
                <span>{t}</span>
                <button
                  type="button"
                  aria-label={`Quitar «${t}»`}
                  onClick={() => cambiar('incluye', form.incluye.filter((_, j) => j !== i))}
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {form.incluye.length < MAX_INCLUYE && (
          <div className="planes-linea">
            <input
              className="modal-negocio-input"
              value={linea}
              maxLength={44}
              placeholder={form.incluye.length ? 'Otra cosa que incluya' : 'Clases dirigidas sin límite'}
              onChange={(e) => setLinea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarLinea()
                }
              }}
            />
            <button type="button" aria-label="Añadir a la lista" disabled={!linea.trim()} onClick={agregarLinea}>
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}
        <p className="modal-negocio-nota">Si no pones nada, el plan sale solo con su precio.</p>
      </Seccion>

      {planes.length > 1 || !actual ? (
        <Seccion titulo="Destacarlo">
          <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Destacar este plan">
            <button type="button" aria-pressed={form.destacado} onClick={() => cambiar('destacado', true)}>
              «El más elegido»
            </button>
            <button type="button" aria-pressed={!form.destacado} onClick={() => cambiar('destacado', false)}>
              Normal
            </button>
          </div>
          <p className="modal-negocio-nota">Solo uno puede ir destacado: sale centrado y con su cinta.</p>
        </Seccion>
      ) : null}

      {error && (
        <p className="catalogo-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogo-botones">
        <button type="button" className="catalogo-boton-secundario" onClick={() => onNavegar({ tipo: 'planes' })}>
          Volver
        </button>
        <button type="submit" className="modal-negocio-accion-principal" disabled={Boolean(error)}>
          {actual ? 'Guardar plan' : 'Añadir plan'}
        </button>
      </div>

      {actual &&
        (enUso ? (
          <p className="modal-negocio-nota">
            {enUso} {enUso === 1 ? 'socio tiene' : 'socios tienen'} este plan. Pásalos a otro antes de quitarlo.
          </p>
        ) : (
          <BotonEliminar
            texto="Quitar este plan"
            aviso="Deja de salir en tu página."
            onEliminar={() => onGuardar({ planes: planes.filter((p) => p.id !== id) }, { tipo: 'planes' })}
          />
        ))}
    </form>
  )
}

/* ---------- Recargo ---------- */

function FormRecargo({ local, onGuardar }) {
  const [form, setForm] = useState(() => {
    const r = recargoDe(local)
    return { porDia: String(r.porDia), diasGracia: r.diasGracia, tope: r.tope }
  })
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const porDia = Math.max(0, Math.round(Number(form.porDia) || 0))

  /* Un ejemplo con números, que se entiende mejor que la regla. */
  const ejemplo = 7
  const dias = Math.max(0, ejemplo - form.diasGracia)
  const sinTope = dias * porDia
  const conTope = form.tope > 0 ? Math.min(sinTope, form.tope) : sinTope

  return (
    <form
      className="modal-negocio-stack"
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar({ recargo: { porDia, diasGracia: form.diasGracia, tope: form.tope } }, null)
      }}
      noValidate
    >
      <div className="modal-negocio-hueco recargo-ejemplo" data-entra>
        <span className="modal-negocio-hueco-etiqueta">Si alguien paga {ejemplo} días tarde</span>
        <span className="modal-negocio-numero">{porDia ? `+${conTope} CUP` : 'Sin recargo'}</span>
        <span className="modal-negocio-hueco-sub">
          {porDia
            ? `${dias} ${dias === 1 ? 'día' : 'días'} × ${porDia} CUP${form.diasGracia ? ` (los primeros ${form.diasGracia} no cuentan)` : ''}${
                form.tope > 0 && sinTope > form.tope ? `, con tope de ${form.tope}` : ''
              }`
            : 'Paga lo mismo aunque llegue tarde.'}
        </span>
      </div>

      <Seccion titulo="Por cada día de atraso">
        <label className="modal-negocio-campo">
          <span>Recargo diario</span>
          <span className="catalogo-precio-campo">
            <input
              className="modal-negocio-input"
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              value={form.porDia}
              onChange={(e) => cambiar('porDia', e.target.value)}
            />
            <em>CUP</em>
          </span>
        </label>
        <div className="modal-negocio-opciones" role="group" aria-label="Recargos habituales">
          {POR_DIA.map((n) => (
            <button
              key={n}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde"
              aria-pressed={porDia === n}
              onClick={() => cambiar('porDia', String(n))}
            >
              {n ? `${n} CUP` : 'Sin recargo'}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Días de gracia" extra={form.diasGracia ? `${form.diasGracia} días` : 'Ninguno'}>
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono modal-negocio-segmentado--cinco" role="group" aria-label="Días de gracia">
          {GRACIA.map((n) => (
            <button key={n} type="button" aria-pressed={form.diasGracia === n} onClick={() => cambiar('diasGracia', n)}>
              {n}
            </button>
          ))}
        </div>
        <p className="modal-negocio-nota">Días después de la fecha en que todavía se puede pagar sin recargo.</p>
      </Seccion>

      <Seccion titulo="Como mucho">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono" role="group" aria-label="Tope del recargo">
          {TOPES.map((n) => (
            <button key={n} type="button" aria-pressed={form.tope === n} onClick={() => cambiar('tope', n)}>
              {n ? n : 'Sin tope'}
            </button>
          ))}
        </div>
        <p className="modal-negocio-nota">El recargo deja de crecer al llegar a esta cifra.</p>
      </Seccion>

      <button type="submit" className="modal-negocio-accion-principal">
        Guardar recargo
      </button>
      <p className="modal-negocio-nota">Se aplica solo: lo ves en cada socio atrasado al cobrarle.</p>
    </form>
  )
}

/* ---------- Socio nuevo ---------- */

function FormNuevoSocio({ local, hoy, onAgregarSocio }) {
  const planes = local.planes ?? []
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [planId, setPlanId] = useState(planes.find((p) => p.destacado)?.id ?? planes[0]?.id ?? null)
  const [pagado, setPagado] = useState(true)
  const [intento, setIntento] = useState(false)

  const plan = planes.find((p) => p.id === planId)
  const errorNombre = nombre.trim().length < 2 ? 'Escribe su nombre.' : null
  const errorTel = telefono.replace(/\D/g, '').length < 8 ? 'Pon un teléfono con al menos 8 números.' : null
  const valido = plan && !errorNombre && !errorTel
  const proximo = pagado ? sumarPeriodo(hoy, plan?.periodo) : hoy

  const agregar = (e) => {
    e.preventDefault()
    setIntento(true)
    if (!valido) return
    const fecha = format(hoy, 'yyyy-MM-dd')
    onAgregarSocio({
      id: nuevoId('socio'),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      planId,
      desde: fecha,
      proximoPago: format(proximo, 'yyyy-MM-dd'),
      estado: 'activo',
      pagos: pagado ? [{ fecha, monto: Number(plan.precio) || 0, recargo: 0 }] : [],
    })
  }

  if (!planes.length) {
    return (
      <div className="modal-negocio-stack">
        <p className="modal-negocio-lead">Primero crea un plan en «Planes» para poder apuntar socios.</p>
      </div>
    )
  }

  return (
    <form className="modal-negocio-stack" onSubmit={agregar} noValidate>
      <Seccion titulo="Quién es">
        <label className="modal-negocio-campo">
          <span>Nombre</span>
          <input
            className="modal-negocio-input"
            autoComplete="off"
            placeholder="Ej. Laura Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={intento && Boolean(errorNombre)}
          />
          {intento && errorNombre && <em className="express-error">{errorNombre}</em>}
        </label>
        <label className="modal-negocio-campo">
          <span>Teléfono</span>
          <input
            type="tel"
            inputMode="tel"
            className="modal-negocio-input"
            autoComplete="off"
            placeholder="+53 5…"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            aria-invalid={intento && Boolean(errorTel)}
          />
          {intento && errorTel && <em className="express-error">{errorTel}</em>}
        </label>
      </Seccion>

      <Seccion titulo="Plan">
        <div className="modal-negocio-opciones" role="group" aria-label="Plan">
          {planes.map((p) => (
            <button
              key={p.id}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde"
              aria-pressed={planId === p.id}
              onClick={() => setPlanId(p.id)}
            >
              {p.nombre} · {precioPlanTexto(p)}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="El primer pago">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Si ya pagó">
          <button type="button" aria-pressed={pagado} onClick={() => setPagado(true)}>
            Ya pagó
          </button>
          <button type="button" aria-pressed={!pagado} onClick={() => setPagado(false)}>
            Paga después
          </button>
        </div>
        <p className="modal-negocio-nota">
          {pagado
            ? `Le toca volver a pagar el ${format(proximo, 'd/M')}. Ese será su día de pago.`
            : 'Queda apuntado con el pago para hoy.'}
        </p>
      </Seccion>

      <button type="submit" className="modal-negocio-accion-principal">
        Apuntar socio
      </button>
    </form>
  )
}

export default function ContenidoPlanes({ modal, local, hoy, sociosPorPlan, onNavegar, onGuardar, onAgregarSocio }) {
  switch (modal?.tipo) {
    case 'planes':
      return <ListaPlanes local={local} sociosPorPlan={sociosPorPlan} onNavegar={onNavegar} />
    case 'plan':
      return (
        <FormPlan
          key={modal.id ?? 'nuevo'}
          local={local}
          id={modal.id}
          sociosPorPlan={sociosPorPlan}
          onGuardar={onGuardar}
          onNavegar={onNavegar}
        />
      )
    case 'recargo':
      return <FormRecargo local={local} onGuardar={onGuardar} />
    case 'nuevoSocio':
      return <FormNuevoSocio local={local} hoy={hoy} onAgregarSocio={onAgregarSocio} />
    default:
      return null
  }
}
