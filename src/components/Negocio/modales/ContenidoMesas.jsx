import { useState } from 'react'
import { ChevronRight, Footprints, Minus, Plus } from 'lucide-react'
import MapaMesas from '../../MapaMesas/MapaMesas.jsx'
import ServiciosLocal from '../../DetalleLocal/ServiciosLocal.jsx'
import { duracionTexto } from '../../../utils/fichaLocal.js'
import {
  TOLERANCIAS,
  mesasDeLocal,
  mesasParaGuardar,
  ofertaMesas,
  reservaMesaDe,
  textoCobroMesa,
} from '../../../utils/mesas.js'
import { Dato, Seccion } from './piezas.jsx'
import '../modalCatalogo.css'
import '../negocioMesas.css'

/* Hojas del dueño de un local de mesas:
   - mesas:       el plano y la lista. Tocar una mesa abre su ficha.
   - mesa:        capacidad, dónde está y si se reserva por Citaly.
   - reservaMesa: cuánto cuesta reservar (lo mismo para todas las mesas). */

const UBICACIONES = ['Junto a la ventana', 'Salón principal', 'Terraza', 'Junto a la barra', 'Junto a la entrada', 'En la esquina']
const CONSUMOS = [0, 500, 1000, 1500, 2000]
const MAX_CAPACIDAD = 12

function mesasConEstado(local) {
  return mesasDeLocal(local).map((m) => ({ ...m, estado: m.online ? 'disponible' : 'calle' }))
}

/* ---------- El plano ---------- */

function ListaMesas({ local, onNavegar }) {
  const mesas = mesasConEstado(local)
  const online = mesas.filter((m) => m.online)
  const asientos = mesas.reduce((t, m) => t + m.capacidad, 0)
  const abrir = (mesa) => onNavegar({ tipo: 'mesa', id: mesa.id, titulo: mesa.codigo.replace('-', ' ') })

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
            <MapaMesas mesas={mesas} editable onMesaClick={abrir} />
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
        <p className="modal-negocio-nota">Toca una mesa en el plano para cambiarla.</p>
      </div>

      <ul className="catalogo-lista" data-entra>
        {mesas.map((m) => (
          <li key={m.id}>
            <button type="button" className="catalogo-fila" onClick={() => abrir(m)}>
              <span className={`mesas-ficha-forma mesas-ficha-forma--${m.tipo}${m.online ? '' : ' mesas-ficha-forma--calle'}`} aria-hidden="true">
                {m.capacidad}
              </span>
              <span className="catalogo-fila-textos">
                <span className="catalogo-fila-titulo">{m.codigo.replace('-', ' ')}</span>
                <span className="catalogo-fila-meta">
                  {m.capacidad} {m.capacidad === 1 ? 'asiento' : 'asientos'} · {m.ubicacion}
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
      <p className="modal-negocio-nota" data-entra>
        El dibujo del plano es el mismo para todos por ahora. Lo que cambias aquí es lo que tiene cada mesa.
      </p>
    </div>
  )
}

/* ---------- Una mesa ---------- */

function FormMesa({ local, id, onGuardar, onNavegar }) {
  const mesas = mesasDeLocal(local)
  const actual = mesas.find((m) => m.id === id)
  const [form, setForm] = useState(() => ({
    capacidad: actual?.capacidad ?? 2,
    ubicacion: actual?.ubicacion ?? '',
    online: actual?.online ?? true,
  }))
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  if (!actual) return null

  const otrasOnline = mesas.filter((m) => m.id !== id && m.online).length
  let error = null
  if (!form.ubicacion.trim()) error = 'Di dónde está la mesa: ayuda al cliente a elegir.'
  else if (!form.online && otrasOnline === 0) error = 'Deja al menos una mesa que se pueda reservar por Citaly.'

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    const siguiente = mesas.map((m) => (m.id === id ? { ...m, ...form, ubicacion: form.ubicacion.trim() } : m))
    onGuardar({ mesas: mesasParaGuardar(siguiente) }, { tipo: 'mesas' })
  }

  const previa = mesasConEstado(local).map((m) =>
    m.id === id ? { ...m, capacidad: form.capacidad, estado: form.online ? 'disponible' : 'calle' } : m,
  )

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="mesas-plano" data-entra>
        <div className="mapa-mesas-container">
          <div className="mapa-mesas-viewport">
            <MapaMesas mesas={previa} mesaSeleccionada={actual} soloLectura />
          </div>
        </div>
      </div>

      <Seccion titulo="Asientos">
        <div className="catalogo-paso">
          <button
            type="button"
            aria-label="Un asiento menos"
            disabled={form.capacidad <= 1}
            onClick={() => cambiar('capacidad', Math.max(1, form.capacidad - 1))}
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <output className="catalogo-paso-valor" aria-live="polite">
            {form.capacidad} {form.capacidad === 1 ? 'persona' : 'personas'}
          </output>
          <button
            type="button"
            aria-label="Un asiento más"
            disabled={form.capacidad >= MAX_CAPACIDAD}
            onClick={() => cambiar('capacidad', Math.min(MAX_CAPACIDAD, form.capacidad + 1))}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </Seccion>

      <Seccion titulo="Dónde está">
        <label className="modal-negocio-campo">
          <span>Ubicación</span>
          <input
            className="modal-negocio-input"
            value={form.ubicacion}
            maxLength={32}
            placeholder="Junto a la ventana"
            onChange={(e) => cambiar('ubicacion', e.target.value)}
          />
        </label>
        <div className="modal-negocio-opciones" role="group" aria-label="Ubicaciones habituales">
          {UBICACIONES.map((u) => (
            <button
              key={u}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde"
              aria-pressed={form.ubicacion === u}
              onClick={() => cambiar('ubicacion', u)}
            >
              {u}
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
  const mayor = Math.max(...mesasDeLocal(local).filter((m) => m.online).map((m) => m.capacidad))

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

      <Seccion titulo="Grupos grandes" extra={`Más de ${mayor}`}>
        <div className="modal-negocio-segmentado modal-negocio-segmentado--tono mesas-segmentado--dos" role="group" aria-label="Grupos más grandes que la mesa mayor">
          <button type="button" aria-pressed={form.gruposGrandes} onClick={() => cambiar('gruposGrandes', true)}>
            Juntamos mesas
          </button>
          <button type="button" aria-pressed={!form.gruposGrandes} onClick={() => cambiar('gruposGrandes', false)}>
            No aceptamos
          </button>
        </div>
        <p className="modal-negocio-nota">
          {form.gruposGrandes
            ? `Un grupo de más de ${mayor} puede reservar igual; las mesas las juntáis al llegar.`
            : `El cliente solo puede reservar hasta ${mayor} personas.`}
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
