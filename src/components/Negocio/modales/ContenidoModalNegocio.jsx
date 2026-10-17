import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Clock, MessageCircle, Phone, Scissors, UtensilsCrossed } from 'lucide-react'
import { minutosHastaCita, textoEnCita } from '../../../utils/citasVista.js'
import { Dato, FilaDato, Seccion } from './piezas.jsx'

gsap.registerPlugin(useGSAP)

const ESTADO_RESERVA = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const limitar = (v, min, max) => Math.min(Math.max(v, min), max)

function iniciales(nombre) {
  const partes = String(nombre || '').replace(/^(Dr|Dra)\.\s*/i, '').trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '·'
}

function digitos(telefono) {
  return String(telefono || '').replace(/\D/g, '')
}

function textoDuracion(min) {
  if (!min) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

/* Número que sube desde cero al abrir. React no pinta dentro: el texto lo pone GSAP. */
function Contador({ valor, formato = String, retraso = 0.25, duracion = 1.1, className }) {
  const ref = useRef(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (reducirMovimiento()) {
        el.textContent = formato(valor)
        return
      }
      const proxy = { n: 0 }
      el.textContent = formato(0)
      gsap.to(proxy, {
        n: valor,
        duration: duracion,
        delay: retraso,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = formato(Math.round(proxy.n))
        },
      })
    },
    { dependencies: [valor] }
  )
  return <span ref={ref} className={className} />
}

/* ---------- Siguiente cita ---------- */

function formatoCuenta(n) {
  if (n < 60) return String(n)
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
}

function AnilloCuenta({ minutos }) {
  const ref = useRef(null)
  const cercania = (1 - limitar(minutos, 0, 120) / 120) * 100
  useGSAP(
    () => {
      if (reducirMovimiento()) return
      gsap.from('.modal-negocio-anillo-progreso', {
        attr: { 'stroke-dasharray': '0 100' },
        duration: 1.2,
        delay: 0.25,
        ease: 'power3.out',
      })
    },
    { scope: ref, dependencies: [minutos] }
  )
  return (
    <div className="modal-negocio-anillo" ref={ref}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="58" pathLength="100" className="modal-negocio-anillo-pista" />
        <circle
          cx="70"
          cy="70"
          r="58"
          pathLength="100"
          className="modal-negocio-anillo-progreso"
          strokeDasharray={`${cercania} 100`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <p className="modal-negocio-anillo-centro">
        <Contador valor={Math.max(minutos, 0)} formato={formatoCuenta} className="modal-negocio-numero" />
        <span className="modal-negocio-anillo-unidad">{minutos < 60 ? 'minutos' : 'horas'}</span>
      </p>
    </div>
  )
}

function ModalSiguiente({ cita, despues, ahora }) {
  if (!cita) {
    return (
      <div className="modal-negocio-vacio" data-entra>
        <span className="modal-negocio-vacio-luna" aria-hidden="true" />
        <p className="modal-negocio-lead">No quedan citas por hoy. El resto del turno está libre.</p>
      </div>
    )
  }

  const minutos = minutosHastaCita(cita, ahora)
  const tel = digitos(cita.telefono)
  const IconoTipo = cita.tipo === 'mesa' ? UtensilsCrossed : Scissors

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-hero-anillo" data-entra>
        <AnilloCuenta minutos={minutos} />
        <p className="modal-negocio-hero-sub">Llega {textoEnCita(cita, ahora)}</p>
      </div>

      <div className="modal-negocio-cliente" data-entra>
        <span className="modal-negocio-avatar" aria-hidden="true">
          {iniciales(cita.cliente)}
        </span>
        <div className="modal-negocio-cliente-textos">
          <p className="modal-negocio-cliente-nombre">{cita.cliente}</p>
          <p className="modal-negocio-cliente-tel">{cita.telefono ?? 'Sin teléfono'}</p>
        </div>
        <span className={`modal-negocio-chip-estado modal-negocio-chip-estado--${cita.estado}`}>
          {ESTADO_RESERVA[cita.estado] ?? cita.estado}
        </span>
      </div>

      {tel && (
        <div className="modal-negocio-contacto" data-entra>
          <a className="modal-negocio-boton modal-negocio-boton--suave" href={`tel:+${tel}`}>
            <Phone size={16} strokeWidth={2.25} aria-hidden="true" />
            Llamar
          </a>
          <a
            className="modal-negocio-boton modal-negocio-boton--suave"
            href={`https://wa.me/${tel}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} strokeWidth={2.25} aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      )}

      <Seccion titulo="La reserva">
        <div className="modal-negocio-datos">
          <Dato etiqueta="Hora" valor={cita.horaTexto ?? cita.horario} tono="amarillo" />
          <Dato etiqueta="Duración" valor={textoDuracion(cita.duracion)} />
          <Dato etiqueta="Importe" valor={cita.precio != null ? `${cita.precio} CUP` : '—'} tono="verde" />
        </div>
        <div className="modal-negocio-bloque">
          <div className="modal-negocio-servicio">
            <IconoTipo size={16} strokeWidth={2} aria-hidden="true" />
            <span>{cita.linea}</span>
          </div>
          {cita.detalle && <FilaDato etiqueta="Detalle" valor={cita.detalle} />}
        </div>
      </Seccion>

      {despues && (
        <Seccion titulo="Después">
          <div className="modal-negocio-despues">
            <Clock size={14} strokeWidth={2.25} aria-hidden="true" />
            <strong>{despues.horaTexto ?? despues.horario}</strong>
            <span>{despues.cliente}</span>
            <em>{despues.linea}</em>
          </div>
        </Seccion>
      )}
    </div>
  )
}

/* ---------- Ocupación ---------- */

function Dona({ segmentos, capacidad, porcentaje }) {
  const ref = useRef(null)
  const separacion = 1.2
  const arcos = segmentos
    .filter((s) => s.cantidad > 0)
    .reduce((lista, s) => {
      const previo = lista[lista.length - 1]
      const inicio = previo ? previo.inicio + previo.pct : 0
      return [...lista, { ...s, pct: (s.cantidad / capacidad) * 100, inicio }]
    }, [])

  useGSAP(
    () => {
      if (reducirMovimiento()) return
      gsap.from('.modal-negocio-dona-arco', {
        attr: { 'stroke-dasharray': '0 100' },
        duration: 0.8,
        delay: 0.25,
        stagger: 0.16,
        ease: 'power2.out',
      })
    },
    { scope: ref, dependencies: [porcentaje] }
  )

  return (
    <div className="modal-negocio-dona" ref={ref}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="54" pathLength="100" className="modal-negocio-dona-pista" />
        {arcos.map((a) => (
          <circle
            key={a.id}
            cx="70"
            cy="70"
            r="54"
            pathLength="100"
            className="modal-negocio-dona-arco"
            style={{ stroke: a.color }}
            strokeDasharray={`${Math.max(a.pct - separacion, 0.5)} 100`}
            strokeDashoffset={-a.inicio}
            transform="rotate(-90 70 70)"
          />
        ))}
      </svg>
      <p className="modal-negocio-dona-centro">
        <span className="modal-negocio-numero">
          <Contador valor={porcentaje} />
          <small>%</small>
        </span>
        <span className="modal-negocio-dona-sub">ocupado</span>
      </p>
    </div>
  )
}

function BarrasHora({ franjas }) {
  const ref = useRef(null)
  const maximo = Math.max(1, ...franjas.map((f) => f.cantidad))
  useGSAP(
    () => {
      if (reducirMovimiento()) return
      gsap.from('.modal-negocio-columna-barra', {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.6,
        delay: 0.35,
        stagger: 0.04,
        ease: 'back.out(1.6)',
      })
    },
    { scope: ref, dependencies: [franjas.length] }
  )

  return (
    <div className="modal-negocio-barras" ref={ref} role="img" aria-label="Reservas por hora del turno">
      {franjas.map((f) => (
        <div
          key={f.etiqueta}
          className={`modal-negocio-columna${f.esAhora ? ' modal-negocio-columna--ahora' : ''}${f.pasada ? ' modal-negocio-columna--pasada' : ''}`}
        >
          <span className="modal-negocio-columna-valor">{f.cantidad || ''}</span>
          <span className="modal-negocio-columna-pista">
            <span
              className={`modal-negocio-columna-barra${f.cantidad ? '' : ' modal-negocio-columna-barra--vacia'}`}
              style={{ height: f.cantidad ? `${(f.cantidad / maximo) * 100}%` : undefined }}
            />
          </span>
          <span className="modal-negocio-columna-hora">{f.etiqueta}</span>
        </div>
      ))}
    </div>
  )
}

function ModalOcupacion({ ocupacion }) {
  const segmentos = ocupacion.segmentos ?? []
  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-ocupacion" data-entra>
        <Dona segmentos={segmentos} capacidad={ocupacion.capacidad} porcentaje={ocupacion.porcentaje} />
        <ul className="modal-negocio-leyenda">
          {segmentos.map((s) => (
            <li key={s.id}>
              <span className="modal-negocio-leyenda-muestra" style={{ background: s.color }} />
              <span className="modal-negocio-leyenda-nombre">{s.label}</span>
              <strong>{s.cantidad}</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Capacidad" valor={`${ocupacion.capacidad} turnos`} />
        <Dato etiqueta="Ocupados" valor={ocupacion.ocupados} tono="verde" />
        <Dato etiqueta="Libres" valor={ocupacion.libres} tono="amarillo" />
      </div>

      <Seccion titulo="Reservas por hora" extra={ocupacion.ventana}>
        <BarrasHora franjas={ocupacion.porHora ?? []} />
        <p className="modal-negocio-nota">
          {ocupacion.horaPico
            ? `Hora más cargada: ${ocupacion.horaPico}. ${ocupacion.detalle}.`
            : `${ocupacion.detalle}.`}
        </p>
      </Seccion>
    </div>
  )
}

/* ---------- Estimado ---------- */

function BarraDinero({ partes, total }) {
  const ref = useRef(null)
  useGSAP(
    () => {
      if (reducirMovimiento()) return
      gsap.from('.modal-negocio-dinero-parte', {
        scaleX: 0,
        transformOrigin: '0% 50%',
        duration: 0.7,
        delay: 0.3,
        stagger: 0.12,
        ease: 'power3.out',
      })
    },
    { scope: ref, dependencies: [total] }
  )
  return (
    <div className="modal-negocio-dinero" ref={ref} role="presentation">
      {partes
        .filter((p) => p.monto > 0)
        .map((p) => (
          <span
            key={p.id}
            className="modal-negocio-dinero-parte"
            style={{ flexGrow: p.monto, background: p.color }}
          />
        ))}
    </div>
  )
}

function ModalEstimado({ estimado }) {
  const total = estimado.total || 0
  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-hero" data-entra>
        <span className="modal-negocio-numero modal-negocio-numero--grande">
          <Contador valor={total} />
          <small>CUP</small>
        </span>
        <span className="modal-negocio-hero-sub">Ingreso estimado de hoy</span>
      </div>

      <Seccion titulo="De dónde sale">
        <BarraDinero partes={estimado.partes} total={total} />
        <ul className="modal-negocio-desglose">
          {estimado.partes.map((p) => (
            <li key={p.id}>
              <span className="modal-negocio-leyenda-muestra" style={{ background: p.color }} />
              <span className="modal-negocio-desglose-textos">
                <span className="modal-negocio-desglose-nombre">{p.label}</span>
                <span className="modal-negocio-desglose-ayuda">{p.ayuda}</span>
              </span>
              <span className="modal-negocio-desglose-monto">
                {p.monto} CUP
                <small>{total ? Math.round((p.monto / total) * 100) : 0}%</small>
              </span>
            </li>
          ))}
        </ul>
      </Seccion>

      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Citas" valor={estimado.citasHoy} />
        <Dato etiqueta="Ticket medio" valor={`${estimado.promedio} CUP`} />
        <Dato etiqueta="Propinas" valor={`+${estimado.propinas} CUP`} tono="verde" />
      </div>

      <p className="modal-negocio-nota" data-entra>
        Las citas canceladas no cuentan. Las propinas son una estimación del 10% de lo cobrado.
      </p>
    </div>
  )
}

/* ---------- Pausa ---------- */

const MOTIVOS_PAUSA = ['Corte de luz', 'Brecha entre citas', 'Emergencia', 'Otro']
const DURACIONES_PAUSA = [15, 30, 60, 90]

function ModalPausa({ citas, ahora }) {
  const [motivo, setMotivo] = useState(null)
  const [duracion, setDuracion] = useState(30)

  const afectadas = citas.filter((c) => {
    if (c.estado === 'cancelada') return false
    const min = minutosHastaCita(c, ahora)
    return min >= 0 && min <= duracion
  })

  return (
    <div className="modal-negocio-stack">
      <p className="modal-negocio-lead" data-entra>
        Mientras la agenda esté en pausa no entran reservas nuevas. Úsala si se fue la luz, hay una brecha o
        surge un imprevisto.
      </p>

      <Seccion titulo="Motivo">
        <div className="modal-negocio-opciones" role="group" aria-label="Motivo de pausa">
          {MOTIVOS_PAUSA.map((m) => (
            <button
              key={m}
              type="button"
              className="modal-negocio-chip"
              aria-pressed={motivo === m}
              onClick={() => setMotivo(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Cuánto tiempo">
        <div className="modal-negocio-segmentado" role="group" aria-label="Duración de la pausa">
          {DURACIONES_PAUSA.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={duracion === d}
              onClick={() => setDuracion(d)}
            >
              {d} min
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Citas que caen en la pausa" extra={afectadas.length || 'Ninguna'}>
        {afectadas.length ? (
          <ul className="modal-negocio-afectadas">
            {afectadas.map((c) => (
              <li key={c.id}>
                <strong>{c.horaTexto ?? c.horario}</strong>
                <span>{c.cliente}</span>
                <em>{textoEnCita(c, ahora)}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="modal-negocio-nota">Nadie tiene cita en los próximos {duracion} minutos.</p>
        )}
      </Seccion>

      <button type="button" className="modal-negocio-accion-principal" disabled={!motivo} data-entra>
        {motivo ? `Pausar ${duracion} min` : 'Elige un motivo'}
      </button>
    </div>
  )
}

/* ---------- Cliente express ---------- */

function ModalExpress({ hueco, profesionales }) {
  const [nombre, setNombre] = useState('')
  const [profesional, setProfesional] = useState(profesionales[0] ?? null)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-hueco" data-entra>
        <span className="modal-negocio-hueco-etiqueta">Próximo hueco libre</span>
        <span className="modal-negocio-numero">{hueco ?? 'Sin huecos'}</span>
        <span className="modal-negocio-hueco-sub">Cliente en puerta sin reserva: anótalo y encájalo ahí.</span>
      </div>

      <Seccion titulo="Cliente">
        <label className="modal-negocio-campo">
          <span>Nombre</span>
          <input
            type="text"
            placeholder="Ej. Luis"
            className="modal-negocio-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="modal-negocio-campo">
          <span>Servicio</span>
          <input type="text" placeholder="Corte, mesa, etc." className="modal-negocio-input" />
        </label>
        <label className="modal-negocio-campo">
          <span>Teléfono (opcional)</span>
          <input type="tel" placeholder="+53 …" className="modal-negocio-input" />
        </label>
      </Seccion>

      {profesionales.length > 0 && (
        <Seccion titulo="Quién lo atiende">
          <div className="modal-negocio-opciones" role="group" aria-label="Profesional">
            {profesionales.map((p) => (
              <button
                key={p}
                type="button"
                className="modal-negocio-chip modal-negocio-chip--verde"
                aria-pressed={profesional === p}
                onClick={() => setProfesional(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </Seccion>
      )}

      <button
        type="button"
        className="modal-negocio-accion-principal"
        disabled={!nombre.trim() || !hueco}
        data-entra
      >
        Agregar a la fila
      </button>
    </div>
  )
}

export default function ContenidoModalNegocio({ modal, resumen, citas, citaSiguiente, ahora }) {
  if (!modal) return null

  switch (modal.tipo) {
    case 'siguiente':
      return <ModalSiguiente cita={citaSiguiente} despues={resumen.despues} ahora={ahora} />
    case 'ocupacion':
      return <ModalOcupacion ocupacion={resumen.ocupacion} />
    case 'estimado':
      return <ModalEstimado estimado={resumen.estimado} />
    case 'pausa':
      return <ModalPausa citas={citas} ahora={ahora} />
    case 'express':
      return <ModalExpress hueco={resumen.hueco} profesionales={resumen.profesionales} />
    default:
      return null
  }
}
