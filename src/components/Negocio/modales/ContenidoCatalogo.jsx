import { useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Clock3,
  Copy,
  Lock,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  UserX,
} from 'lucide-react'
import SelectPro from '../../SelectPro/SelectPro.jsx'
import ServicioItem from '../../ServicioItem/ServicioItem.jsx'
import { buscarUsuarios, getUsuarioById, profesionalesActivos, sinPerfil } from '../../../services/usuarios.js'
import {
  duracionAMinutos,
  duracionTexto,
  fotoAncho,
  iniciales,
  nuevoId,
  precioTexto,
  primerNombre,
} from '../../../utils/fichaLocal.js'
import { Dato, Seccion } from './piezas.jsx'
import '../modalCatalogo.css'

const DURACIONES_RAPIDAS = [15, 30, 45, 60, 90, 120]
const PASO_DURACION = 5

function Avatar({ pro, tamano = 40 }) {
  return pro.url ? (
    <img
      className="catalogo-avatar"
      src={fotoAncho(pro.url, tamano * 2)}
      alt=""
      width={tamano}
      height={tamano}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="catalogo-avatar catalogo-avatar--iniciales" style={{ width: tamano, height: tamano, fontSize: Math.round(tamano * 0.4) }}>
      {iniciales(pro.name)}
    </span>
  )
}

function quienHace(profesionales, idServicio) {
  return profesionales.filter((p) => p.servicios?.includes(idServicio))
}

/* Botón de borrar en dos toques, para no perder datos de un roce. */
function BotonEliminar({ texto, aviso, onEliminar }) {
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
  const profesionales = profesionalesActivos(local)
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
          {servicios.map((s) => {
            const pros = quienHace(profesionales, s.id)
            return (
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
                    {pros.length ? (
                      <span className="catalogo-quienes">
                        <span className="catalogo-pila" aria-hidden="true">
                          {pros.slice(0, 3).map((p) => (
                            <Avatar key={p.id} pro={p} tamano={20} />
                          ))}
                        </span>
                        {pros.length === 1 ? primerNombre(pros[0].name) : `${pros.length} profesionales`}
                      </span>
                    ) : (
                      <span className="catalogo-quienes catalogo-quienes--nadie">
                        <AlertTriangle size={12} strokeWidth={2.25} aria-hidden="true" />
                        Nadie lo hace todavía
                      </span>
                    )}
                  </span>
                  <span className="catalogo-precio">{precioTexto(s.precio)}</span>
                  <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            )
          })}
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
  const profesionales = local.profesionales ?? []
  const actual = servicios.find((s) => s.id === id)

  const [form, setForm] = useState(() => ({
    nombre: actual?.nombre ?? '',
    precio: actual ? String(actual.precio ?? 0) : '',
    minutos: actual ? duracionAMinutos(actual.duracion) || 30 : 30,
    nota: actual?.nota ?? '',
    pros: actual
      ? quienHace(profesionales, actual.id).map((p) => p.id)
      : profesionalesActivos(local).map((p) => p.id),
  }))
  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const alternarPro = (idPro) =>
    cambiar('pros', form.pros.includes(idPro) ? form.pros.filter((x) => x !== idPro) : [...form.pros, idPro])

  const nombre = form.nombre.trim()
  const precio = Number(form.precio)
  let error = null
  if (!nombre) error = 'Ponle un nombre al servicio.'
  else if (servicios.some((s) => s.id !== id && s.nombre.trim().toLowerCase() === nombre.toLowerCase()))
    error = 'Ya tienes un servicio con ese nombre.'
  else if (form.precio === '' || !Number.isFinite(precio) || precio < 0) error = 'Escribe un precio (0 si es gratis).'
  else if (profesionales.length && !form.pros.length) error = 'Marca quién hace este servicio.'

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
        profesionales: profesionales.map((p) => {
          const resto = (p.servicios ?? []).filter((x) => x !== idServicio)
          return sinPerfil({ ...p, servicios: form.pros.includes(p.id) ? [...resto, idServicio] : resto })
        }),
      },
      { tipo: 'servicios' }
    )
  }

  const eliminar = () =>
    onGuardar(
      {
        servicios: servicios.filter((s) => s.id !== id),
        profesionales: profesionales.map((p) =>
          sinPerfil({ ...p, servicios: (p.servicios ?? []).filter((x) => x !== id) })
        ),
      },
      { tipo: 'servicios' }
    )

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

      <Seccion titulo="Quién lo hace" extra={profesionales.length ? `${form.pros.length} de ${profesionales.length}` : null}>
        {profesionales.length ? (
          <div className="modal-negocio-opciones" role="group" aria-label="Profesionales que hacen este servicio">
            {profesionales.map((p) => (
              <button
                key={p.id}
                type="button"
                className="modal-negocio-chip modal-negocio-chip--verde catalogo-chip-pro"
                aria-pressed={form.pros.includes(p.id)}
                onClick={() => alternarPro(p.id)}
              >
                <Avatar pro={p} tamano={24} />
                {primerNombre(p.name)}
                {p.estado === 'pendiente' && (
                  <Clock3 size={13} strokeWidth={2.25} aria-label="invitación pendiente" className="catalogo-chip-pendiente" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="modal-negocio-nota">Todavía no tienes equipo. Añade profesionales desde Equipo.</p>
        )}
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

/* ---------- Equipo ---------- */

/* Los trabajadores son cuentas de Citaly: el local los invita y ellos aceptan desde su sesión. */

function EstadoPro({ pro }) {
  if (pro.estado === 'pendiente') {
    return (
      <span className="catalogo-pendiente">
        <Clock3 size={12} strokeWidth={2.25} aria-hidden="true" />
        Pendiente
      </span>
    )
  }
  return Number(pro.points) > 0 ? (
    <span className="catalogo-nota">
      <Star size={12} strokeWidth={2} fill="currentColor" aria-hidden="true" />
      {Number(pro.points).toFixed(1)}
    </span>
  ) : (
    <span className="catalogo-nuevo">Nuevo</span>
  )
}

function ListaEquipo({ local, onNavegar }) {
  const servicios = local.servicios ?? []
  const profesionales = local.profesionales ?? []
  const activos = profesionalesActivos(local)
  const pendientes = profesionales.length - activos.length
  const sinNadie = servicios.filter((s) => !quienHace(activos, s.id).length)
  const notas = activos.map((p) => Number(p.points)).filter((n) => n > 0)

  return (
    <div className="modal-negocio-stack">
      <div className="modal-negocio-datos" data-entra>
        <Dato etiqueta="Activos" valor={activos.length} />
        <Dato
          etiqueta="Cubren"
          valor={servicios.length ? `${servicios.length - sinNadie.length}/${servicios.length}` : '—'}
          tono="verde"
        />
        <Dato
          etiqueta="Nota media"
          valor={notas.length ? (notas.reduce((t, n) => t + n, 0) / notas.length).toFixed(1) : '—'}
          tono="amarillo"
        />
      </div>

      {sinNadie.length > 0 && (
        <p className="catalogo-aviso" data-entra>
          <AlertTriangle size={15} strokeWidth={2.25} aria-hidden="true" />
          <span>
            {sinNadie.map((s) => s.nombre).join(', ')} {sinNadie.length === 1 ? 'no lo hace' : 'no los hace'} nadie
            activo: no se podrá reservar.
          </span>
        </p>
      )}

      {profesionales.length ? (
        <ul className="catalogo-lista" data-entra>
          {profesionales.map((p) => {
            const suyos = servicios.filter((s) => p.servicios?.includes(s.id)).map((s) => s.nombre)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="catalogo-fila"
                  onClick={() => onNavegar({ tipo: 'profesional', id: p.id, titulo: primerNombre(p.name) })}
                >
                  <Avatar pro={p} tamano={44} />
                  <span className="catalogo-fila-textos">
                    <span className="catalogo-fila-titulo">{p.name}</span>
                    <span className="catalogo-fila-meta catalogo-fila-meta--corta">
                      {p.usuario && <span className="catalogo-arroba">@{p.usuario}</span>}
                      {suyos.length ? suyos.join(' · ') : 'Sin servicios asignados'}
                    </span>
                  </span>
                  <EstadoPro pro={p} />
                  <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="modal-negocio-lead" data-entra>
          Añade a las personas que atienden. Tus clientes las eligen al reservar.
        </p>
      )}

      <button
        type="button"
        className="modal-negocio-accion-principal catalogo-accion"
        onClick={() => onNavegar({ tipo: 'buscar' })}
        data-entra
      >
        <UserPlus size={17} strokeWidth={2.5} aria-hidden="true" />
        Añadir profesional
      </button>
      <p className="modal-negocio-nota" data-entra>
        Cada profesional entra con su propia cuenta de Citaly. Hasta que acepte tu invitación
        {pendientes > 0 ? ` (${pendientes} pendiente${pendientes > 1 ? 's' : ''})` : ''} no aparece en las reservas.
      </p>
    </div>
  )
}

const TEXTO_INVITACION =
  'Te quiero en el equipo de mi local en Citaly. Créate una cuenta en citaly.app y avísame para añadirte.'

function BuscarProfesional({ local, onNavegar }) {
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)
  const resultados = buscarUsuarios(texto)
  const enEquipo = new Map((local.profesionales ?? []).map((p) => [p.usuarioId, p]))
  const buscando = texto.trim().replace(/^@/, '').length >= 2

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(TEXTO_INVITACION)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="modal-negocio-stack">
      <label className="catalogo-buscador" data-entra>
        <Search size={18} strokeWidth={2.25} aria-hidden="true" />
        <input
          type="search"
          className="modal-negocio-input"
          value={texto}
          placeholder="Nombre, @usuario, correo o teléfono"
          aria-label="Buscar una cuenta de Citaly"
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>

      {!buscando && (
        <div className="catalogo-explica" data-entra>
          <ShieldCheck size={20} strokeWidth={2} aria-hidden="true" />
          <p>
            Tus trabajadores necesitan <strong>su propia cuenta</strong> en Citaly. Búscala aquí y envíales una
            invitación. Su nombre y su foto los gestionan ellos desde su perfil.
          </p>
        </div>
      )}

      {buscando && resultados.length > 0 && (
        <ul className="catalogo-lista" aria-label="Cuentas encontradas">
          {resultados.map((u) => {
            const ya = enEquipo.get(u.id)
            const pro = { name: u.nombre, url: u.foto }
            return (
              <li key={u.id}>
                <button
                  type="button"
                  className="catalogo-fila"
                  disabled={Boolean(ya)}
                  onClick={() => onNavegar({ tipo: 'profesional', usuarioId: u.id, titulo: 'Invitar al equipo' })}
                >
                  <Avatar pro={pro} tamano={44} />
                  <span className="catalogo-fila-textos">
                    <span className="catalogo-fila-titulo">{u.nombre}</span>
                    <span className="catalogo-fila-meta catalogo-fila-meta--corta">
                      <span className="catalogo-arroba">@{u.usuario}</span>
                      {[u.oficio, u.ciudad].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {ya ? (
                    <span className="catalogo-ya">{ya.estado === 'pendiente' ? 'Invitado' : 'En tu equipo'}</span>
                  ) : (
                    <ChevronRight className="catalogo-flecha" size={16} strokeWidth={2} aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {buscando && resultados.length === 0 && (
        <div className="catalogo-explica catalogo-explica--vacio">
          <UserX size={20} strokeWidth={2} aria-hidden="true" />
          <div>
            <p>
              Nadie en Citaly coincide con «{texto.trim()}». Si todavía no tiene cuenta, pídele que se registre: después
              podrás añadirlo.
            </p>
            <button type="button" className="catalogo-boton-secundario catalogo-boton-icono" onClick={copiar}>
              <Copy size={15} strokeWidth={2.25} aria-hidden="true" />
              {copiado ? 'Invitación copiada' : 'Copiar invitación'}
            </button>
          </div>
        </div>
      )}

      <button type="button" className="catalogo-boton-secundario" onClick={() => onNavegar({ tipo: 'equipo' })}>
        Volver al equipo
      </button>
    </div>
  )
}

function FormProfesional({ local, id, usuarioId, onGuardar, onNavegar }) {
  const servicios = local.servicios ?? []
  const profesionales = local.profesionales ?? []
  const actual = profesionales.find((p) => p.id === id)
  const cuenta = getUsuarioById(actual?.usuarioId ?? usuarioId)
  const pendiente = actual?.estado === 'pendiente'

  const [marcados, setMarcados] = useState(() => (actual ? [...(actual.servicios ?? [])] : []))
  const alternar = (idServicio) =>
    setMarcados((m) => (m.includes(idServicio) ? m.filter((x) => x !== idServicio) : [...m, idServicio]))

  if (!cuenta) {
    return (
      <div className="modal-negocio-stack">
        <p className="modal-negocio-lead">Esta cuenta ya no existe en Citaly.</p>
        {actual && (
          <BotonEliminar
            texto="Quitar del equipo"
            onEliminar={() =>
              onGuardar({ profesionales: profesionales.filter((p) => p.id !== id).map(sinPerfil) }, { tipo: 'equipo' })
            }
          />
        )}
      </div>
    )
  }

  const error = servicios.length && !marcados.length ? 'Marca al menos un servicio que haga.' : null
  const activos = profesionalesActivos(local)
  const soloEl =
    actual && !pendiente
      ? servicios.filter((s) => {
          const pros = quienHace(activos, s.id)
          return pros.length === 1 && pros[0].id === id
        })
      : []

  const guardarLista = (lista) => onGuardar({ profesionales: lista.map(sinPerfil) }, { tipo: 'equipo' })
  const ordenados = servicios.map((s) => s.id).filter((x) => marcados.includes(x))

  const guardar = (e) => {
    e.preventDefault()
    if (error) return
    if (actual) {
      guardarLista(profesionales.map((p) => (p.id === id ? { ...p, servicios: ordenados } : p)))
      return
    }
    guardarLista([
      ...profesionales,
      { id: nuevoId('pro'), usuarioId: cuenta.id, estado: 'pendiente', points: null, servicios: ordenados },
    ])
  }

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <div className="catalogo-perfil" data-entra>
        <div className="catalogo-perfil-tarjeta" inert>
          <SelectPro url={cuenta.foto} name={cuenta.nombre} points={actual?.points} seleccionado={false} />
        </div>
        <div className="catalogo-perfil-acciones">
          <span className="catalogo-previa-etiqueta">Cuenta de Citaly</span>
          <p className="catalogo-perfil-usuario">@{cuenta.usuario}</p>
          <p className="catalogo-perfil-meta">{[cuenta.oficio, cuenta.ciudad].filter(Boolean).join(' · ')}</p>
          <p className="catalogo-perfil-candado">
            <Lock size={12} strokeWidth={2.25} aria-hidden="true" />
            Nombre y foto los cambia {primerNombre(cuenta.nombre)} desde su perfil.
          </p>
        </div>
      </div>

      {pendiente && (
        <div className="catalogo-invitacion" data-entra>
          <Clock3 size={18} strokeWidth={2.25} aria-hidden="true" />
          <p>
            <strong>Invitación enviada.</strong> {primerNombre(cuenta.nombre)} tiene que aceptarla iniciando sesión en
            Citaly. Hasta entonces no aparece en tus reservas.
          </p>
        </div>
      )}

      <Seccion
        titulo={actual ? 'Servicios que hace aquí' : 'Servicios que hará aquí'}
        extra={
          servicios.length > 1 && (
            <button
              type="button"
              className="catalogo-enlace"
              onClick={() => setMarcados(marcados.length === servicios.length ? [] : servicios.map((s) => s.id))}
            >
              {marcados.length === servicios.length ? 'Ninguno' : 'Todos'}
            </button>
          )
        }
      >
        {servicios.length ? (
          <ul className="catalogo-checks" role="group" aria-label="Servicios que hace">
            {servicios.map((s) => {
              const marcado = marcados.includes(s.id)
              return (
                <li key={s.id}>
                  <button type="button" className="catalogo-check" aria-pressed={marcado} onClick={() => alternar(s.id)}>
                    <span className="catalogo-check-caja" aria-hidden="true" />
                    <span className="catalogo-fila-textos">
                      <span className="catalogo-fila-titulo">{s.nombre}</span>
                      <span className="catalogo-fila-meta">{duracionTexto(duracionAMinutos(s.duracion))}</span>
                    </span>
                    <span className="catalogo-precio">{precioTexto(s.precio)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="modal-negocio-nota">Todavía no tienes servicios. Créalos desde Servicios.</p>
        )}
      </Seccion>

      {actual && Number(actual.points) > 0 && (
        <p className="modal-negocio-nota">
          Su valoración aquí ({Number(actual.points).toFixed(1)}) la ponen tus clientes.
        </p>
      )}

      {error && (
        <p className="catalogo-error" role="alert">
          {error}
        </p>
      )}

      <div className="catalogo-botones">
        <button
          type="button"
          className="catalogo-boton-secundario"
          onClick={() => onNavegar({ tipo: actual ? 'equipo' : 'buscar' })}
        >
          {actual ? 'Cancelar' : 'Volver'}
        </button>
        <button type="submit" className="modal-negocio-accion-principal" disabled={Boolean(error)}>
          {actual ? 'Guardar' : 'Enviar invitación'}
        </button>
      </div>

      {pendiente && import.meta.env.DEV && (
        <button
          type="button"
          className="catalogo-enlace catalogo-simular"
          onClick={() => guardarLista(profesionales.map((p) => (p.id === id ? { ...p, estado: 'activo' } : p)))}
        >
          Simular que acepta (solo en desarrollo)
        </button>
      )}

      {actual && (
        <BotonEliminar
          texto={pendiente ? 'Cancelar invitación' : 'Quitar del equipo'}
          aviso={
            soloEl.length
              ? `${soloEl.map((s) => s.nombre).join(', ')} se ${soloEl.length === 1 ? 'queda' : 'quedan'} sin nadie que lo haga.`
              : null
          }
          onEliminar={() => guardarLista(profesionales.filter((p) => p.id !== id))}
        />
      )}
    </form>
  )
}

export default function ContenidoCatalogo({ modal, local, onNavegar, onGuardar }) {
  switch (modal?.tipo) {
    case 'servicios':
      return <ListaServicios local={local} onNavegar={onNavegar} />
    case 'servicio':
      return <FormServicio key={modal.id ?? 'nuevo'} local={local} id={modal.id} onGuardar={onGuardar} onNavegar={onNavegar} />
    case 'equipo':
      return <ListaEquipo local={local} onNavegar={onNavegar} />
    case 'buscar':
      return <BuscarProfesional local={local} onNavegar={onNavegar} />
    case 'profesional':
      return (
        <FormProfesional
          key={modal.id ?? modal.usuarioId}
          local={local}
          id={modal.id}
          usuarioId={modal.usuarioId}
          onGuardar={onGuardar}
          onNavegar={onNavegar}
        />
      )
    default:
      return null
  }
}
