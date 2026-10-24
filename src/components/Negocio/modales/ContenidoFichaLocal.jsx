import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, MessageCircle, Pencil, Phone, Star } from 'lucide-react'
import {
  COMODIDADES,
  DIAS,
  DURACIONES_TURNO,
  aMinutos,
  codigoDia,
  diasTexto,
  digitos,
  duracionTexto,
  fotoAncho,
  fotosDe,
  horaAmPm,
  horarioTexto,
  estaAbierto,
  minutosAbierto,
  notaDeComentarios,
  tipoLocalTexto,
  turnosDelDia,
} from '../../../utils/fichaLocal.js'
import { Dato, Seccion } from './piezas.jsx'
import '../modalFicha.css'

const PESTANAS = [
  { id: 'horario', label: 'Horario' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'local', label: 'Local' },
  { id: 'opiniones', label: 'Opiniones' },
]

const CATEGORIAS = [
  'Restaurante',
  'Bar',
  'Cafetería',
  'Peluquería',
  'Barbería',
  'Salón de uñas',
  'Spa',
  'Gimnasio',
  'Clínica',
  'Estudio de tatuajes',
]

const LARGO_DESCRIPCION = 220

const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function etiquetaDuracion(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m}` : `${h} h`
}

function Estrellas({ valor, tamano = 14 }) {
  const llenas = Math.round(valor)
  return (
    <span className="ficha-estrellas" aria-label={`${valor} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={tamano}
          strokeWidth={2}
          fill={i < llenas ? 'currentColor' : 'none'}
          className={i < llenas ? undefined : 'ficha-estrella-vacia'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/* ---------- Ficha: cuatro pestañas ---------- */

function PanelHorario({ local, ahora }) {
  const ini = aMinutos(local.horarioApertura)
  const total = minutosAbierto(local.horarioApertura, local.horarioCierre)
  const turnos = turnosDelDia(local.horarioApertura, local.horarioCierre, local.intervaloMinutos)
  const hoy = codigoDia(ahora)

  return (
    <>
      <div className="ficha-horas">
        <span className="ficha-horas-valor">
          {horaAmPm(ini)}
          <i aria-hidden="true">–</i>
          {horaAmPm(ini + total)}
        </span>
        <span className="modal-negocio-hero-sub">
          {duracionTexto(total)} abierto · {diasTexto(local.dias)}
        </span>
      </div>

      <Seccion titulo="La semana" extra={`${local.dias.length} de 7 días`}>
        <ol className="ficha-semana">
          {DIAS.map((d) => {
            const abre = local.dias.includes(d.id)
            const esHoy = d.id === hoy
            return (
              <li
                key={d.id}
                className={`ficha-dia${abre ? ' ficha-dia--abre' : ''}${esHoy ? ' ficha-dia--hoy' : ''}`}
                aria-label={`${d.corto}: ${abre ? 'abre' : 'cerrado'}${esHoy ? ', hoy' : ''}`}
              >
                <span className="ficha-dia-circulo">{d.letra}</span>
                <span className="ficha-dia-hoy">{esHoy ? 'Hoy' : ''}</span>
              </li>
            )
          })}
        </ol>
      </Seccion>

      <Seccion titulo="Turnos">
        <div className="modal-negocio-datos">
          <Dato etiqueta="Duración" valor={duracionTexto(local.intervaloMinutos)} tono="amarillo" />
          <Dato etiqueta="Al día" valor={turnos.length} />
          <Dato etiqueta="A la semana" valor={turnos.length * local.dias.length} tono="verde" />
        </div>
        {turnos.length > 0 && (
          <ul className="ficha-turnos" aria-label="Hora a la que empieza cada turno">
            {turnos.map((t) => {
              const [hora, sufijo] = horaAmPm(t).split(' ')
              return (
                <li key={t}>
                  {hora}
                  <small>{sufijo.toLowerCase()}</small>
                </li>
              )
            })}
          </ul>
        )}
      </Seccion>
    </>
  )
}

function PanelContacto({ local }) {
  const tel = digitos(local.telefono)
  const wa = digitos(local.whatsapp ?? local.telefono)
  const filas = [
    { id: 'tel', Icono: Phone, etiqueta: 'Teléfono', valor: local.telefono, href: tel && `tel:+${tel}`, accion: 'Llamar' },
    {
      id: 'wa',
      Icono: MessageCircle,
      etiqueta: 'WhatsApp',
      valor: local.whatsapp ?? local.telefono,
      href: wa && `https://wa.me/${wa}`,
      accion: 'Abrir',
      externo: true,
    },
    {
      id: 'dir',
      Icono: MapPin,
      etiqueta: 'Dirección',
      valor: local.direccion,
      href: local.direccion && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.direccion)}`,
      accion: 'Mapa',
      externo: true,
    },
  ]

  return (
    <>
      <ul className="ficha-contacto">
        {filas.map(({ id, Icono, etiqueta, valor, href, accion, externo }) => (
          <li key={id}>
            <span className="ficha-contacto-icono" aria-hidden="true">
              <Icono size={17} strokeWidth={2} />
            </span>
            <span className="ficha-contacto-textos">
              <span className="ficha-contacto-etiqueta">{etiqueta}</span>
              <span className="ficha-contacto-valor">{valor || 'Sin rellenar'}</span>
            </span>
            {href && (
              <a
                className="ficha-contacto-accion"
                href={href}
                {...(externo ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {accion}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="modal-negocio-nota">Así aparecen en tu página pública: tus clientes llaman y escriben desde ahí.</p>
    </>
  )
}

function PanelLocal({ local, onGaleria }) {
  const fotos = fotosDe(local)
  const comodidades = COMODIDADES.filter((c) => local.iconos?.some((i) => i.id === c.id))
  const extra = fotos.length - 4

  return (
    <>
      <div className="ficha-identidad">
        <img src={fotoAncho(local.url, 160)} alt="" className="ficha-identidad-foto" decoding="async" />
        <div className="ficha-identidad-textos">
          <p className="ficha-identidad-nombre">{local.localName}</p>
          <p className="ficha-identidad-sub">{local.categoria}</p>
        </div>
        <span className="ficha-etiqueta">{tipoLocalTexto(local.lugar)}</span>
      </div>

      <Seccion titulo="Descripción">
        <p className="ficha-descripcion">{local.descripcion || 'Todavía no has escrito una descripción.'}</p>
      </Seccion>

      <Seccion titulo="Comodidades" extra={comodidades.length || 'Ninguna'}>
        {comodidades.length ? (
          <ul className="ficha-comodidades">
            {comodidades.map(({ id, label, Icono }) => (
              <li key={id}>
                <Icono size={15} strokeWidth={2} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="modal-negocio-nota">No has marcado ninguna. Se añaden desde Editar.</p>
        )}
      </Seccion>

      <Seccion titulo="Galería" extra={`${fotos.length} fotos`}>
        <button
          type="button"
          className="ficha-galeria-atajo"
          onClick={onGaleria}
          aria-label={`Ver la galería, ${fotos.length} fotos`}
        >
          {fotos.slice(0, 4).map((foto, i) => (
            <span key={foto} className="ficha-galeria-celda">
              <img src={fotoAncho(foto, 200)} alt="" loading="lazy" decoding="async" />
              {i === 3 && extra > 0 && <span className="ficha-galeria-mas">+{extra}</span>}
            </span>
          ))}
        </button>
      </Seccion>

      <Seccion titulo="Visibilidad">
        <p className={`ficha-visibilidad${estaAbierto(local) ? '' : ' ficha-visibilidad--cerrado'}`}>
          <span aria-hidden="true" />
          {estaAbierto(local) ? 'Ahora mismo está abierto, según su horario' : 'Ahora mismo está cerrado, según su horario'}
        </p>
      </Seccion>
    </>
  )
}

function PanelOpiniones({ local }) {
  const [abierto, setAbierto] = useState(null)
  const { nota, cantidad } = notaDeComentarios(local)
  const comentarios = local.comentarios ?? []
  const reparto = [5, 4, 3, 2, 1].map((n) => ({
    n,
    cantidad: comentarios.filter((c) => Math.round(c.calificacion) === n).length,
  }))
  const maximo = Math.max(1, ...reparto.map((r) => r.cantidad))

  return (
    <>
      <div className="ficha-nota">
        <span className="ficha-nota-valor">{nota.toFixed(1)}</span>
        <span className="ficha-nota-textos">
          <Estrellas valor={nota} tamano={16} />
          <span className="ficha-nota-sub">{cantidad} opiniones en total</span>
        </span>
      </div>

      {comentarios.length > 0 && (
        <Seccion titulo="Comentarios recientes" extra={comentarios.length}>
          <ul className="ficha-reparto" aria-label="Reparto de estrellas en los comentarios recientes">
            {reparto.map(({ n, cantidad }, i) => (
              <li key={n}>
                <span className="ficha-reparto-n">
                  {n}
                  <Star size={11} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                </span>
                <span className="ficha-reparto-pista">
                  <span style={{ '--ancho': `${(cantidad / maximo) * 100}%`, '--i': i }} />
                </span>
                <span className="ficha-reparto-cantidad">{cantidad}</span>
              </li>
            ))}
          </ul>

          <ul className="ficha-comentarios">
            {comentarios.map((c) => {
              const largo = String(c.comentario).length > 110
              const expandido = abierto === c.id
              return (
                <li key={c.id}>
                  <header className="ficha-comentario-cabecera">
                    {c.imagenPerfil ? (
                      <img src={fotoAncho(c.imagenPerfil, 80)} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="ficha-comentario-inicial" aria-hidden="true">
                        {String(c.nombre || '?').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="ficha-comentario-quien">
                      <strong>{c.nombre}</strong>
                      <time dateTime={c.fecha}>{format(parseISO(c.fecha), 'd MMM yyyy', { locale: es })}</time>
                    </span>
                    <Estrellas valor={c.calificacion} tamano={11} />
                  </header>
                  <p className={`ficha-comentario-texto${expandido ? ' ficha-comentario-texto--abierto' : ''}`}>
                    {c.comentario}
                  </p>
                  {largo && (
                    <button
                      type="button"
                      className="ficha-comentario-mas"
                      aria-expanded={expandido}
                      onClick={() => setAbierto(expandido ? null : c.id)}
                    >
                      {expandido ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </Seccion>
      )}
    </>
  )
}

function ModalFicha({ local, pestanaInicial = 'horario', ahora, onEditar, onGaleria }) {
  const [pestana, setPestana] = useState(pestanaInicial)

  return (
    <div className="modal-negocio-stack">
      <div
        className="modal-negocio-segmentado modal-negocio-segmentado--tono"
        role="tablist"
        aria-label="Secciones de la ficha"
        data-entra
      >
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`ficha-pestana-${p.id}`}
            aria-selected={pestana === p.id}
            aria-controls="ficha-panel"
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        key={pestana}
        id="ficha-panel"
        className="ficha-panel"
        role="tabpanel"
        aria-labelledby={`ficha-pestana-${pestana}`}
      >
        {pestana === 'horario' && <PanelHorario local={local} ahora={ahora} />}
        {pestana === 'contacto' && <PanelContacto local={local} />}
        {pestana === 'local' && <PanelLocal local={local} onGaleria={onGaleria} />}
        {pestana === 'opiniones' && <PanelOpiniones local={local} />}
      </div>

      {pestana !== 'opiniones' && (
        <button type="button" className="ficha-editar" onClick={onEditar} data-entra>
          <Pencil size={15} strokeWidth={2.25} aria-hidden="true" />
          Editar estos datos
        </button>
      )}
    </div>
  )
}

/* ---------- Galería ---------- */

function ModalGaleria({ local, onPortada }) {
  const fotos = fotosDe(local)
  const [indice, setIndice] = useState(0)
  const pistaRef = useRef(null)
  const actual = fotos[Math.min(indice, fotos.length - 1)]
  const esPortada = actual === local.url

  const ir = (i) => {
    const pista = pistaRef.current
    if (!pista) return
    pista.scrollTo({ left: i * pista.clientWidth, behavior: reducirMovimiento() ? 'auto' : 'smooth' })
  }

  const alDesplazar = (e) => {
    const pista = e.currentTarget
    setIndice(Math.round(pista.scrollLeft / pista.clientWidth))
  }

  if (!fotos.length) {
    return <p className="modal-negocio-lead">Tu local todavía no tiene fotos.</p>
  }

  return (
    <div className="modal-negocio-stack">
      <div className="galeria" data-entra>
        <div
          className="galeria-pista"
          ref={pistaRef}
          onScroll={alDesplazar}
          tabIndex={0}
          role="region"
          aria-label={`Fotos de ${local.localName}`}
        >
          {fotos.map((foto, i) => (
            <figure key={foto} className="galeria-foto">
              <img
                src={fotoAncho(foto, 720)}
                alt={`Foto ${i + 1} de ${local.localName}`}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
              {foto === local.url && <figcaption className="galeria-portada">Portada</figcaption>}
            </figure>
          ))}
        </div>
        <span className="galeria-contador" aria-live="polite">
          {indice + 1} / {fotos.length}
        </span>
      </div>

      <div className="galeria-miniaturas" data-entra>
        {fotos.map((foto, i) => (
          <button
            key={foto}
            type="button"
            className="galeria-miniatura"
            aria-current={i === indice ? 'true' : undefined}
            aria-label={`Ver la foto ${i + 1}`}
            onClick={() => ir(i)}
          >
            <img src={fotoAncho(foto, 160)} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="modal-negocio-accion-principal"
        disabled={esPortada}
        onClick={() => onPortada(actual)}
        data-entra
      >
        {esPortada ? 'Esta es tu portada' : 'Usar como portada'}
      </button>
      <p className="modal-negocio-nota" data-entra>
        La portada es la foto que ven tus clientes en Descubre y arriba de tu página.
      </p>
    </div>
  )
}

/* ---------- Editar ---------- */

function formularioDesde(local) {
  return {
    localName: local.localName ?? '',
    categoria: local.categoria ?? '',
    descripcion: local.descripcion ?? '',
    horarioApertura: local.horarioApertura ?? '09:00',
    horarioCierre: local.horarioCierre ?? '18:00',
    dias: [...(local.dias ?? [])],
    intervaloMinutos: Number(local.intervaloMinutos) || 60,
    telefono: local.telefono ?? '',
    whatsapp: local.whatsapp ?? '',
    direccion: local.direccion ?? '',
    iconos: (local.iconos ?? []).map((i) => i.id),
  }
}

function ModalEditarLocal({ local, onGuardar }) {
  const [form, setForm] = useState(() => formularioDesde(local))
  const [original] = useState(() => formularioDesde(local))

  const cambiar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const alternar = (campo, id) =>
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id],
    }))

  const abierto = minutosAbierto(form.horarioApertura, form.horarioCierre)
  const turnos = turnosDelDia(form.horarioApertura, form.horarioCierre, form.intervaloMinutos).length
  const madrugada = aMinutos(form.horarioCierre) < aMinutos(form.horarioApertura)

  let error = null
  if (!form.localName.trim()) error = 'Ponle un nombre al local.'
  else if (form.horarioApertura === form.horarioCierre) error = 'La hora de abrir y la de cerrar no pueden ser la misma.'
  else if (!form.dias.length) error = 'Marca al menos un día de apertura.'

  const hayCambios = JSON.stringify(form) !== JSON.stringify(original)

  const guardar = (e) => {
    e.preventDefault()
    if (error || !hayCambios) return
    onGuardar({
      ...form,
      localName: form.localName.trim(),
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      telefono: form.telefono.trim(),
      whatsapp: form.whatsapp.trim(),
      direccion: form.direccion.trim(),
      dias: DIAS.map((d) => d.id).filter((id) => form.dias.includes(id)),
      iconos: COMODIDADES.filter((c) => form.iconos.includes(c.id)).map((c) => ({ id: c.id })),
      horario: horarioTexto(form.horarioApertura, form.horarioCierre),
    })
  }

  return (
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate>
      <Seccion titulo="Tu local">
        <label className="modal-negocio-campo">
          <span>Nombre</span>
          <input
            className="modal-negocio-input"
            value={form.localName}
            maxLength={40}
            onChange={(e) => cambiar('localName', e.target.value)}
          />
        </label>
        <label className="modal-negocio-campo">
          <span>Categoría</span>
          <input
            className="modal-negocio-input"
            list="ficha-categorias"
            value={form.categoria}
            maxLength={30}
            onChange={(e) => cambiar('categoria', e.target.value)}
          />
          <datalist id="ficha-categorias">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="modal-negocio-campo">
          <span className="ficha-campo-cabecera">
            Descripción
            <em>
              {form.descripcion.length}/{LARGO_DESCRIPCION}
            </em>
          </span>
          <textarea
            className="modal-negocio-input ficha-textarea"
            rows={4}
            maxLength={LARGO_DESCRIPCION}
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
        </label>
      </Seccion>

      <Seccion titulo="Horario" extra={`${duracionTexto(abierto)} abierto`}>
        <div className="ficha-horas-campos">
          <label className="modal-negocio-campo">
            <span>Abre</span>
            <input
              type="time"
              step={900}
              className="modal-negocio-input ficha-input-hora"
              value={form.horarioApertura}
              onChange={(e) => cambiar('horarioApertura', e.target.value)}
            />
          </label>
          <label className="modal-negocio-campo">
            <span>Cierra</span>
            <input
              type="time"
              step={900}
              className="modal-negocio-input ficha-input-hora"
              value={form.horarioCierre}
              onChange={(e) => cambiar('horarioCierre', e.target.value)}
            />
          </label>
        </div>
        {madrugada && <p className="modal-negocio-nota">Cierra de madrugada, al día siguiente.</p>}
        <div className="ficha-dias-campo" role="group" aria-label="Días que abre">
          {DIAS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={form.dias.includes(d.id)}
              aria-label={d.corto}
              onClick={() => alternar('dias', d.id)}
            >
              {d.letra}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Duración de cada turno" extra={`${turnos} turnos al día`}>
        <div
          className="modal-negocio-segmentado modal-negocio-segmentado--cinco modal-negocio-segmentado--tono"
          role="group"
          aria-label="Duración del turno"
        >
          {DURACIONES_TURNO.map((min) => (
            <button
              key={min}
              type="button"
              aria-pressed={form.intervaloMinutos === min}
              onClick={() => cambiar('intervaloMinutos', min)}
            >
              {etiquetaDuracion(min)}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Contacto">
        <label className="modal-negocio-campo">
          <span>Teléfono</span>
          <input
            type="tel"
            className="modal-negocio-input"
            value={form.telefono}
            placeholder="+53 41 …"
            onChange={(e) => cambiar('telefono', e.target.value)}
          />
        </label>
        <label className="modal-negocio-campo">
          <span>WhatsApp</span>
          <input
            type="tel"
            className="modal-negocio-input"
            value={form.whatsapp}
            placeholder="+53 5 …"
            onChange={(e) => cambiar('whatsapp', e.target.value)}
          />
        </label>
        <label className="modal-negocio-campo">
          <span>Dirección</span>
          <input
            className="modal-negocio-input"
            value={form.direccion}
            maxLength={80}
            onChange={(e) => cambiar('direccion', e.target.value)}
          />
        </label>
      </Seccion>

      <Seccion titulo="Comodidades" extra={form.iconos.length || 'Ninguna'}>
        <div className="modal-negocio-opciones" role="group" aria-label="Comodidades del local">
          {COMODIDADES.map(({ id, label, Icono }) => (
            <button
              key={id}
              type="button"
              className="modal-negocio-chip modal-negocio-chip--verde ficha-chip"
              aria-pressed={form.iconos.includes(id)}
              onClick={() => alternar('iconos', id)}
            >
              <Icono size={15} strokeWidth={2} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Ahora">
        <p className="modal-negocio-nota">
          Abierto o cerrado lo marca el horario y los días. No hay un interruptor aparte, y nunca bloquea la reserva.
        </p>
      </Seccion>

      {error && (
        <p className="ficha-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="modal-negocio-accion-principal" disabled={!hayCambios || Boolean(error)}>
        {hayCambios ? 'Guardar cambios' : 'Sin cambios'}
      </button>
      <p className="modal-negocio-nota">Se guarda en este dispositivo y se ve al momento en tu página pública.</p>
    </form>
  )
}

export default function ContenidoFichaLocal({ modal, local, ahora, onEditar, onGaleria, onPortada, onGuardar }) {
  switch (modal?.tipo) {
    case 'ficha':
      return (
        <ModalFicha
          key={modal.pestana}
          local={local}
          pestanaInicial={modal.pestana}
          ahora={ahora}
          onEditar={onEditar}
          onGaleria={onGaleria}
        />
      )
    case 'galeria':
      return <ModalGaleria local={local} onPortada={onPortada} />
    case 'editar':
      return <ModalEditarLocal local={local} onGuardar={onGuardar} />
    default:
      return null
  }
}
