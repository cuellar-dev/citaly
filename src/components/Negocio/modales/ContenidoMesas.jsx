import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Footprints, Minus, PencilRuler, Plus } from 'lucide-react'
import MapaMesas from '../../MapaMesas/MapaMesas.jsx'
import ServiciosLocal from '../../DetalleLocal/ServiciosLocal.jsx'
import { duracionTexto } from '../../../utils/fichaLocal.js'
import {
  TOLERANCIAS,
  mesasDeLocal,
  ofertaMesas,
  reservaMesaDe,
  textoCobroMesa,
} from '../../../utils/mesas.js'
import { Dato, Seccion } from './piezas.jsx'
import { planoDeLocal, tienePlanoPropio } from '../../../plano/local.js'
import { LIMITES, RASGOS, validarPlano, zonaDe } from '../../../plano/modelo.js'
import { maxPersonas } from '../../../plano/reserva.js'
import '../modalCatalogo.css'
import '../negocioMesas.css'

/* Hojas del dueño de un local de mesas:
   - mesas:       el plano y la lista. Tocar una mesa abre su ficha.
   - mesa:        nombre, personas (mínimo, cómoda, apretados), cómo es y
                  si se reserva por Citaly. El sitio en la sala se cambia en el
                  editor (/negocio/plano/:id).
   - reservaMesa: cuánto cuesta reservar (lo mismo para todas las mesas). */

const CONSUMOS = [0, 500, 1000, 1500, 2000]

function mesasConEstado(local) {
  return mesasDeLocal(local).map((m) => ({ ...m, estado: m.online ? 'disponible' : 'calle' }))
}

/** "2 a 4 personas (hasta 6 apretados)" */
function textoCapacidad(m) {
  const base = m.capMin === m.capacidad ? `${m.capacidad}` : `${m.capMin} a ${m.capacidad}`
  const tope = m.capMax > m.capacidad ? ` (hasta ${m.capMax} apretados)` : ''
  return `${base} ${m.capacidad === 1 ? 'persona' : 'personas'}${tope}`
}

/* ---------- El plano ---------- */

function ListaMesas({ local, onNavegar }) {
  const navigate = useNavigate()
  const plano = planoDeLocal(local)
  const mesas = mesasConEstado(local)
  const online = mesas.filter((m) => m.online)
  const asientos = mesas.reduce((t, m) => t + m.capacidad, 0)
  const abrir = (mesa) => onNavegar({ tipo: 'mesa', id: mesa.id, titulo: mesa.codigo })
  const propio = tienePlanoPropio(local)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Mesas" valor={mesas.length} />
        <Dato etiqueta="Asientos" valor={asientos} tono="verde" />
        <Dato etiqueta="Por Citaly" valor={`${online.length} de ${mesas.length}`} tono="amarillo" />
      </div>

      <div className="mesas-plano" data-entra>
        <div className="mapa-mesas-container">
          <div className="mapa-mesas-viewport">
            <MapaMesas plano={plano} mesas={mesas} editable onMesaClick={abrir} />
          </div>
        </div>
        <div className="mapa-mesas-leyenda-container">
          <div className="mapa-mesas-leyenda">
            <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--disponible" />
            <p className="mapa-mesas-leyenda-texto">Se reserva</p>
          </div>
          <div className="mapa-mesas-leyenda">
            <div className="mapa-mesas-leyenda-swatch mapa-mesas-leyenda-swatch--calle" />
            <p className="mapa-mesas-leyenda-texto">Solo en el local</p>
          </div>
        </div>
        <p className="modal-negocio-nota">Toca una mesa para cambiar sus personas o quién la puede coger.</p>
      </div>

      <button
        type="button"
        className="modal-negocio-accion-principal mesas-editar-sala"
        data-entra
        onClick={() => navigate(`/negocio/plano/${local.id}?volver=negocio`)}
      >
        <PencilRuler size={18} strokeWidth={2.3} aria-hidden="true" />
        {propio ? 'Editar mi sala' : 'Dibujar mi sala'}
      </button>
      {!propio && (
        <p className="modal-negocio-nota" data-entra>
          Ahora tienes el plano de ejemplo. Dibuja el tuyo: mesas, barra, baños, terraza y hasta tres pisos.
        </p>
      )}

      <ul className="catalogo-lista" data-entra>
        {mesas.map((m) => (
          <li key={m.id}>
            <button type="button" className="catalogo-fila" onClick={() => abrir(m)}>
              <span
                className={`mesas-ficha-forma mesas-ficha-forma--${m.tipo === 'mesa-redonda' ? 'circulo' : 'rectangulo'}${m.online ? '' : ' mesas-ficha-forma--calle'}`}
                aria-hidden="true"
              >
                {m.capacidad}
              </span>
              <span className="catalogo-fila-textos">
                <span className="catalogo-fila-titulo">{m.codigo}</span>
                <span className="catalogo-fila-meta">
                  {textoCapacidad(m)} · {m.ubicacion}
                </span>
                {!m.online && (
                  <span className="catalogo-quienes mesas-calle">
                    <Footprints size={12} strokeWidth={2.25} aria-hidden="true" />
                    Solo para quien llega
                  </span>
                )}
              </span>
              <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Una mesa ---------- */

function Paso({ etiqueta, valor, min, max, onCambiar, ayuda }) {
  return (
    <div className="mesas-rango-fila">
      <span className="mesas-rango-etiqueta">
        {etiqueta}
        {ayuda && <small>{ayuda}</small>}
      </span>
      <div className="catalogo-paso">
        <button type="button" aria-label={`${etiqueta}: una menos`} disabled={valor <= min} onClick={() => onCambiar(valor - 1)}>
          <Minus size={18} strokeWidth={2.5} />
        </button>
        <output className="catalogo-paso-valor" aria-live="polite">
          {valor}
        </output>
        <button type="button" aria-label={`${etiqueta}: una más`} disabled={valor >= max} onClick={() => onCambiar(valor + 1)}>
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function FormMesa({ local, id, onGuardar, onNavegar }) {
  const plano = planoDeLocal(local)
  const actual = plano.piezas.find((p) => p.id === id)
  const [form, setForm] = useState(() => ({
    nombre: actual?.nombre ?? '',
    min: actual?.cap?.min ?? 1,
    normal: actual?.cap?.normal ?? 2,
    max: actual?.cap?.max ?? actual?.cap?.normal ?? 2,
    online: actual?.online ?? true,
    rasgos: actual?.rasgos ?? [],
  }))
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  if (!actual) return null

  const otrasOnline = plano.piezas.filter((p) => p.id !== id && p.cap && p.online).length
  const nombre = form.nombre.trim()
  let error = null
  if (!nombre) error = 'Ponle nombre a la mesa (por ejemplo «Mesa 4»).'
  else if (plano.piezas.some((p) => p.id !== id && p.cap && p.nombre === nombre)) error = 'Ya hay otra mesa con ese nombre.'
  else if (!form.online && otrasOnline === 0) error = 'Deja al menos una mesa que se pueda reservar por Citaly.'

  /* Los tres números siempre en orden: mínimo ≤ cómoda ≤ apretados. */
  const ponerNormal = (n) => setForm((f) => ({ ...f, normal: n, min: Math.min(f.min, n), max: Math.max(f.max, n) }))
  const ponerMin = (n) => setForm((f) => ({ ...f, min: Math.min(n, f.normal) }))
  const ponerMax = (n) => setForm((f) => ({ ...f, max: Math.max(n, f.normal) }))
  const alternarRasgo = (r) =>
    cambiar('rasgos', form.rasgos.includes(r) ? form.rasgos.filter((x) => x !== r) : [...form.rasgos, r])

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    const siguiente = {
      ...plano,
      piezas: plano.piezas.map((p) =>
        p.id === id
          ? {
              ...p,
              nombre,
              cap: { min: form.min, normal: form.normal, max: form.max > form.normal ? form.max : null },
              online: form.online,
              rasgos: form.rasgos,
            }
          : p,
      ),
    }
    onGuardar({ plano: validarPlano(siguiente) }, { tipo: 'mesas' })
  }

  const zona = zonaDe(plano, actual)

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="mesas-plano" data-entra>
        <div className="mapa-mesas-container">
          <div className="mapa-mesas-viewport">
            <MapaMesas plano={plano} mesas={mesasConEstado(local)} mesaSeleccionada={{ id }} soloLectura />
          </div>
        </div>
      </div>

      <Seccion titulo="Nombre">
        <label className="modal-negocio-campo">
          <span className="sr-only">Nombre de la mesa</span>
          <input
            className="modal-negocio-input"
            value={form.nombre}
            maxLength={LIMITES.nombre}
            placeholder="Mesa 4"
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        </label>
        <p className="modal-negocio-nota">
          {zona ? `Está en la zona «${zona}».` : 'No está dentro de ninguna zona.'} La zona y el sitio se cambian al editar
          la sala.
        </p>
      </Seccion>

      <Seccion titulo="Cuántas personas">
        <Paso etiqueta="Cómoda" ayuda="Lo normal en esta mesa" valor={form.normal} min={1} max={LIMITES.capacidad} onCambiar={ponerNormal} />
        <Paso etiqueta="Mínimo" ayuda="Menos gente no la coge" valor={form.min} min={1} max={form.normal} onCambiar={ponerMin} />
        <Paso etiqueta="Apretados" ayuda="El tope si no queda otra" valor={form.max} min={form.normal} max={LIMITES.capacidad} onCambiar={ponerMax} />
        <p className="modal-negocio-nota">
          El cliente no ve estos números: solo ve las mesas que le sirven. Si no queda ninguna cómoda para su grupo, le
          ofrecemos las que admiten apretarse.
        </p>
      </Seccion>

      <Seccion titulo="Cómo es">
        <div className="modal-negocio-opciones" role="group" aria-label="Cómo es la mesa">
          {RASGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde"
              aria-pressed={form.rasgos.includes(r.id)}
              onClick={() => alternarRasgo(r.id)}
            >
              {r.nombre}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Quién la puede coger">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Cómo se reserva">
          <button type="button" aria-pressed={form.online} onClick={() => cambiar('online', true)}>
            Se reserva por Citaly
          </button>
          <button type="button" aria-pressed={!form.online} onClick={() => cambiar('online', false)}>
            Solo en el local
          </button>
        </div>
        <p className="modal-negocio-nota">
          {form.online
            ? 'Sale en el plano del cliente y se puede reservar.'
            : 'Se queda libre para quien llega sin reserva. El cliente la ve en el plano, pero no la puede coger.'}
        </p>
      </Seccion>

      {error && (
        <p className="catalogo-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogo-botones">
        <button type="button" className="catalogo-boton-secundario" onClick={() => onNavegar({ tipo: 'mesas' })}>
          Volver
        </button>
        <button type="submit" className="modal-negocio-accion-principal" disabled={Boolean(error)}>
          Guardar mesa
        </button>
      </div>
    </form>
  )
}

/* ---------- Lo que cuesta reservar ---------- */

function FormReservaMesa({ local, onGuardar }) {
  const [form, setForm] = useState(() => {
    const r = reservaMesaDe(local)
    return { ...r, precio: String(r.precio || ''), consumoMinimo: String(r.consumoMinimo || 0) }
  })
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const precio = Number(form.precio)
  const consumo = Number(form.consumoMinimo)
  let error = null
  if (form.cobro === 'precio' && (!Number.isFinite(precio) || precio <= 0)) error = 'Escribe cuánto cuesta reservar una mesa.'
  else if (form.cobro === 'gratis' && (!Number.isFinite(consumo) || consumo < 0)) error = 'El consumo mínimo no puede ser negativo.'

  const limpio = {
    cobro: form.cobro,
    precio: form.cobro === 'precio' ? Math.round(precio) || 0 : 0,
    consumoMinimo: form.cobro === 'gratis' ? Math.round(consumo) || 0 : 0,
    tolerancia: form.tolerancia,
    gruposGrandes: form.gruposGrandes,
  }
  const previa = ofertaMesas({ ...local, reservaMesa: limpio }, Number(local.intervaloMinutos) || 60)
  const tope = maxPersonas(planoDeLocal(local))

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    onGuardar({ reservaMesa: limpio }, null)
  }

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="catalogo-previa" data-entra>
        <span className="catalogo-previa-etiqueta">Así lo ve el cliente</span>
        {/* Las mismas tarjetas de la ficha pública. */}
        <div className="mesas-previa" inert>
          <ServiciosLocal servicios={previa} lugar onReservar={() => {}} />
        </div>
      </div>

      <Seccion titulo="Reservar una mesa">
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Si la reserva se paga">
          <button type="button" aria-pressed={form.cobro === 'gratis'} onClick={() => cambiar('cobro', 'gratis')}>
            Es gratis
          </button>
          <button type="button" aria-pressed={form.cobro === 'precio'} onClick={() => cambiar('cobro', 'precio')}>
            Tiene precio
          </button>
        </div>

        {form.cobro === 'precio' ? (
          <>
            <label className="modal-negocio-campo">
              <span>Precio por mesa</span>
              <span className="catalogo-precio-campo">
                <input
                  className="modal-negocio-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={50}
                  value={form.precio}
                  placeholder="300"
                  onChange={(e) => cambiar('precio', e.target.value)}
                />
                <em>CUP</em>
              </span>
            </label>
            <p className="modal-negocio-nota">Es el mismo para todas las mesas, sea de 2 o de 6.</p>
          </>
        ) : (
          <>
            <label className="modal-negocio-campo">
              <span>Consumo mínimo por mesa</span>
              <span className="catalogo-precio-campo">
                <input
                  className="modal-negocio-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={form.consumoMinimo}
                  placeholder="0"
                  onChange={(e) => cambiar('consumoMinimo', e.target.value)}
                />
                <em>CUP</em>
              </span>
            </label>
            <div className="modal-negocio-opciones" role="group" aria-label="Consumos habituales">
              {CONSUMOS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="modal-negocio-chip modal-negocio-chip--verde"
                  aria-pressed={consumo === c}
                  onClick={() => cambiar('consumoMinimo', String(c))}
                >
                  {c ? `${c} CUP` : 'Sin mínimo'}
                </button>
              ))}
            </div>
            <p className="modal-negocio-nota">Reservar no cuesta nada; a cambio, la mesa gasta al menos esto en el local.</p>
          </>
        )}
      </Seccion>

      <Seccion titulo="Si llegan tarde" extra={`${form.tolerancia} min`}>
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono" role="group" aria-label="Minutos que se guarda la mesa">
          {TOLERANCIAS.map((min) => (
            <button key={min} type="button" aria-pressed={form.tolerancia === min} onClick={() => cambiar('tolerancia', min)}>
              {min} min
            </button>
          ))}
        </div>
        <p className="modal-negocio-nota">
          Pasado ese tiempo la mesa se puede dar a otro. Se lo decimos al cliente al reservar.
        </p>
      </Seccion>

      <Seccion titulo="Grupos" extra={`Hasta ${tope}`}>
        <p className="modal-negocio-nota">
          Los grupos grandes reservan mesas juntas: las que marcas como unibles al editar la sala. Así el cliente elige
          dónde se sienta y no hay que cuadrar nada al llegar.
        </p>
      </Seccion>

      <Seccion titulo="Cuánto dura cada reserva">
        <p className="modal-negocio-nota">
          {duracionTexto(Number(local.intervaloMinutos) || 60)} por mesa. Se cambia en Horario y turnos.
        </p>
      </Seccion>

      {error && (
        <p className="catalogo-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="modal-negocio-accion-principal">
        Guardar
      </button>
      <p className="modal-negocio-nota">Ahora mismo: {textoCobroMesa(local)}.</p>
    </form>
  )
}

export default function ContenidoMesas({ modal, local, onNavegar, onGuardar }) {
  switch (modal?.tipo) {
    case 'mesas':
      return <ListaMesas local={local} onNavegar={onNavegar} />
    case 'mesa':
      return <FormMesa key={modal.id} local={local} id={modal.id} onGuardar={onGuardar} onNavegar={onNavegar} />
    case 'reservaMesa':
      return <FormReservaMesa local={local} onGuardar={onGuardar} />
    default:
      return null
  }
}
