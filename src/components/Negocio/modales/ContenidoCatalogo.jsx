import { useState } from 'react'
import { ChevronRight, Minus, Plus, Trash2 } from 'lucide-react'
import ServicioItem from '../../ServicioItem/ServicioItem.jsx'
import { duracionAMinutos, duracionTexto, nuevoId, precioTexto } from '../../../utils/fichaLocal.js'
import { Dato, Seccion } from './piezas.jsx'
import '../modalCatalogo.css'

const DURACIONES_RAPIDAS = [15, 30, 45, 60, 90, 120]
const PASO_DURACION = 5

/* Botón de borrar en dos toques, para no perder datos de un roce. */
export function BotonEliminar({ texto, aviso, onEliminar }) {
  const [armado, setArmado] = useState(false)
  return (
    <div className="catalogo-eliminar">
      {armado && aviso && <p className="catalogo-eliminar-aviso">{aviso}</p>}
      <button
        type="button"
        className={`catalogo-boton-peligro${armado ? ' catalogo-boton-peligro--armado' : ''}`}
        onClick={() => (armado ? onEliminar() : setArmado(true))}
        onBlur={() => setArmado(false)}
      >
        <Trash2 size={15} strokeWidth={2.25} aria-hidden="true" />
        {armado ? 'Toca otra vez para confirmar' : texto}
      </button>
    </div>
  )
}

/* ---------- Servicios ---------- */

function ListaServicios({ local, onNavegar }) {
  const servicios = local.servicios ?? []
  const precios = servicios.map((s) => Number(s.precio) || 0)
  const minutos = servicios.map((s) => duracionAMinutos(s.duracion))
  const media = (lista) => (lista.length ? Math.round(lista.reduce((t, n) => t + n, 0) / lista.length) : 0)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Servicios" valor={servicios.length} />
        <Dato etiqueta="Desde CUP" valor={servicios.length ? `${Math.min(...precios)}` : '—'} tono="verde" />
        <Dato etiqueta="Duración media" valor={servicios.length ? duracionTexto(media(minutos)) : '—'} tono="amarillo" />
      </div>

      {servicios.length ? (
        <ul className="catalogo-lista" data-entra>
          {servicios.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="catalogo-fila"
                onClick={() => onNavegar({ tipo: 'servicio', id: s.id, titulo: 'Editar servicio' })}
              >
                <span className="catalogo-fila-textos">
                  <span className="catalogo-fila-titulo">{s.nombre}</span>
                  <span className="catalogo-fila-meta">
                    {duracionTexto(duracionAMinutos(s.duracion))}
                    {s.nota ? ` · ${s.nota}` : ''}
                  </span>
                </span>
                <span className="catalogo-precio">{precioTexto(s.precio)}</span>
                <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="modal-negocio-lead" data-entra>
          Todavía no ofreces ningún servicio. Añade el primero y aparecerá al reservar.
        </p>
      )}

      <button
        type="button"
        className="modal-negocio-accion-principal catalogo-accion"
        onClick={() => onNavegar({ tipo: 'servicio', id: null, titulo: 'Nuevo servicio' })}
        data-entra
      >
        <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
        Añadir servicio
      </button>
      <p className="modal-negocio-nota" data-entra>
        Aparecen así, en este orden, cuando un cliente reserva.
      </p>
    </div>
  )
}

function FormServicio({ local, id, onGuardar, onNavegar }) {
  const servicios = local.servicios ?? []
  const actual = servicios.find((s) => s.id === id)

  const [form, setForm] = useState(() => ({
    nombre: actual?.nombre ?? '',
    precio: actual ? String(actual.precio ?? 0) : '',
    minutos: actual ? duracionAMinutos(actual.duracion) || 30 : 30,
    nota: actual?.nota ?? '',
  }))
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const nombre = form.nombre.trim()
  const precio = Number(form.precio)
  let error = null
  if (!nombre) error = 'Ponle un nombre al servicio.'
  else if (servicios.some((s) => s.id !== id && s.nombre.trim().toLowerCase() === nombre.toLowerCase()))
    error = 'Ya tienes un servicio con ese nombre.'
  else if (form.precio === '' || !Number.isFinite(precio) || precio < 0) error = 'Escribe un precio (0 si es gratis).'

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    const idServicio = id ?? nuevoId('srv')
    const servicio = {
      ...actual,
      id: idServicio,
      nombre,
      precio: Math.round(precio),
      duracion: form.minutos,
      nota: form.nota.trim() || undefined,
    }
    onGuardar(
      {
        servicios: actual ? servicios.map((s) => (s.id === id ? servicio : s)) : [...servicios, servicio],
      },
      { tipo: 'servicios' }
    )
  }

  const eliminar = () => onGuardar({ servicios: servicios.filter((s) => s.id !== id) }, { tipo: 'servicios' })

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="catalogo-previa" data-entra>
        <span className="catalogo-previa-etiqueta">Así lo ve el cliente</span>
        <ul className="catalogo-previa-servicio" inert>
          <ServicioItem
            nombre={nombre || 'Nombre del servicio'}
            precio={Number.isFinite(precio) ? Math.round(precio) : 0}
            duracion={form.minutos}
            nota={form.nota.trim()}
          />
        </ul>
      </div>

      <Seccion titulo="Servicio">
        <label className="modal-negocio-campo">
          <span>Nombre</span>
          <input
            className="modal-negocio-input"
            value={form.nombre}
            maxLength={40}
            placeholder="Corte dama"
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
              step={10}
              value={form.precio}
              placeholder="0"
              onChange={(e) => cambiar('precio', e.target.value)}
            />
            <em>CUP</em>
          </span>
        </label>
        <label className="modal-negocio-campo">
          <span className="catalogo-campo-cabecera">
            Nota <small>opcional</small>
          </span>
          <input
            className="modal-negocio-input"
            value={form.nota}
            maxLength={50}
            placeholder="Incluye lavado y secado"
            onChange={(e) => cambiar('nota', e.target.value)}
          />
        </label>
      </Seccion>

      <Seccion titulo="Duración">
        <div className="catalogo-paso">
          <button
            type="button"
            aria-label="Cinco minutos menos"
            disabled={form.minutos <= PASO_DURACION}
            onClick={() => cambiar('minutos', Math.max(PASO_DURACION, form.minutos - PASO_DURACION))}
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <output className="catalogo-paso-valor" aria-live="polite">
            {duracionTexto(form.minutos)}
          </output>
          <button
            type="button"
            aria-label="Cinco minutos más"
            disabled={form.minutos >= 480}
            onClick={() => cambiar('minutos', Math.min(480, form.minutos + PASO_DURACION))}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="modal-negocio-opciones" role="group" aria-label="Duraciones habituales">
          {DURACIONES_RAPIDAS.map((min) => (
            <button
              key={min}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde"
              aria-pressed={form.minutos === min}
              onClick={() => cambiar('minutos', min)}
            >
              {duracionTexto(min)}
            </button>
          ))}
        </div>
      </Seccion>

      {error && (
        <p className="catalogo-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogo-botones">
        <button type="button" className="catalogo-boton-secundario" onClick={() => onNavegar({ tipo: 'servicios' })}>
          Cancelar
        </button>
        <button type="submit" className="modal-negocio-accion-principal" disabled={Boolean(error)}>
          {actual ? 'Guardar' : 'Añadir servicio'}
        </button>
      </div>

      {actual && <BotonEliminar texto="Eliminar servicio" onEliminar={eliminar} />}
    </form>
  )
}

export default function ContenidoCatalogo({ modal, local, onNavegar, onGuardar }) {
  switch (modal?.tipo) {
    case 'servicios':
      return <ListaServicios local={local} onNavegar={onNavegar} />
    case 'servicio':
      return <FormServicio key={modal.id ?? 'nuevo'} local={local} id={modal.id} onGuardar={onGuardar} onNavegar={onNavegar} />
    default:
      return null
  }
}
