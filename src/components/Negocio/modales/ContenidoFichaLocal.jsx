import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Megaphone, Plus, Star, Trash2 } from 'lucide-react'
import { comprimirFoto, errorDeFoto } from '../../../utils/imagenes.js'
import {
  COMODIDADES,
  DIAS,
  DURACIONES_TURNO,
  aMinutos,
  duracionTexto,
  fotoAncho,
  fotosDe,
  horarioTexto,
  minutosAbierto,
  notaDeComentarios,
  turnosDelDia,
} from '../../../utils/fichaLocal.js'
import { Seccion } from './piezas.jsx'
import '../modalFicha.css'

const MOTIVOS_REPORTE = [
  { id: 'obsceno', titulo: 'Lenguaje obsceno', texto: 'Insultos, sexo o palabras que no deberían estar a la vista.' },
  { id: 'privado', titulo: 'Datos privados', texto: 'Teléfono, dirección u otro dato personal de alguien.' },
  { id: 'spam', titulo: 'Sin sentido o spam', texto: 'Publicidad, texto vacío o que no habla de este local.' },
  { id: 'dano', titulo: 'Hecho para dañar', texto: 'Parece escrito solo para hundir la nota, sin una visita real.' },
  { id: 'otra', titulo: 'Otra razón', texto: 'Ninguna de las de arriba. Cuéntala en el cuadro de abajo.' },
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

/* ---------- Opiniones ---------- */

function PanelOpiniones({ local, onGuardar }) {
  const [abierto, setAbierto] = useState(null)
  const [reporteId, setReporteId] = useState(null)
  const [motivo, setMotivo] = useState(null)
  const [detalleReporte, setDetalleReporte] = useState('')
  const [errorReporte, setErrorReporte] = useState('')
  const [respondiendo, setRespondiendo] = useState(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')
  const { nota, cantidad } = notaDeComentarios(local)
  const comentarios = local.comentarios ?? []

  const guardarComentarios = (next) => {
    const { nota: notaNueva, cantidad: cantidadNueva } = notaDeComentarios({ comentarios: next })
    onGuardar?.({
      comentarios: next,
      points: String(notaNueva),
      opiniones: cantidadNueva,
    })
  }

  const abrirReporte = (id) => {
    setReporteId(id)
    setMotivo(null)
    setDetalleReporte('')
    setErrorReporte('')
  }

  const enviarReporte = (e) => {
    e.preventDefault()
    const detalle = detalleReporte.trim()
    if (!motivo) {
      setErrorReporte('Elige un motivo.')
      return
    }
    if (motivo === 'otra' && detalle.length < 8) {
      setErrorReporte('Cuéntanos la razón, aunque sea en una frase.')
      return
    }
    guardarComentarios(
      comentarios.map((c) =>
        c.id === reporteId
          ? { ...c, reporte: { motivo, detalle: detalle || null, fecha: format(new Date(), 'yyyy-MM-dd') } }
          : c
      )
    )
    setReporteId(null)
  }

  const enviarRespuesta = (id) => {
    const texto = textoRespuesta.trim()
    if (texto.length < 2) return
    guardarComentarios(
      comentarios.map((c) =>
        c.id === id
          ? { ...c, respuesta: { texto, fecha: format(new Date(), 'yyyy-MM-dd'), autor: 'Dueño' } }
          : c
      )
    )
    setRespondiendo(null)
    setTextoRespuesta('')
  }
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
              const escribiendo = respondiendo === c.id
              return (
                <li key={c.id} className="ficha-comentario">
                  <button
                    type="button"
                    className={`ficha-reportar${c.reporte ? ' ficha-reportar--hecho' : ''}`}
                    aria-label={c.reporte ? `Comentario de ${c.nombre} ya reportado` : `Reportar el comentario de ${c.nombre}`}
                    disabled={Boolean(c.reporte)}
                    onClick={() => abrirReporte(c.id)}
                  >
                    <Megaphone size={15} strokeWidth={2.25} />
                  </button>
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
                  {c.respuesta && !escribiendo && (
                    <div className="ficha-respuesta">
                      <span className="ficha-respuesta-pill">Dueño</span>
                      <p>{c.respuesta.texto}</p>
                    </div>
                  )}
                  {escribiendo ? (
                    <form
                      className="ficha-respuesta-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        enviarRespuesta(c.id)
                      }}
                    >
                      <textarea
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        rows={2}
                        placeholder="Tu respuesta se verá debajo de este comentario"
                        aria-label={`Responder a ${c.nombre}`}
                      />
                      <div className="ficha-respuesta-acciones">
                        <button type="button" onClick={() => setRespondiendo(null)}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={textoRespuesta.trim().length < 2}>
                          Publicar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="ficha-responder"
                      onClick={() => {
                        setRespondiendo(c.id)
                        setTextoRespuesta(c.respuesta?.texto ?? '')
                      }}
                    >
                      {c.respuesta ? 'Editar respuesta' : 'Responder'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </Seccion>
      )}

      {reporteId && createPortal(
        <div className="ficha-reporte-velo" role="presentation" onClick={() => setReporteId(null)}>
          <form
            className="ficha-reporte"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ficha-reporte-titulo"
            onClick={(e) => e.stopPropagation()}
            onSubmit={enviarReporte}
          >
            <div className="ficha-reporte-cuerpo">
              <h3 id="ficha-reporte-titulo">¿Por qué lo reportas?</h3>
              <p className="ficha-reporte-lead">Elige una razón. El comentario sigue visible hasta que se revise.</p>
              <div className="ficha-reporte-opciones" role="radiogroup" aria-label="Motivo del reporte">
                {MOTIVOS_REPORTE.map((op) => (
                  <label key={op.id} className={`ficha-reporte-opcion${motivo === op.id ? ' ficha-reporte-opcion--activa' : ''}`}>
                    <input
                      type="radio"
                      name="motivo-reporte"
                      value={op.id}
                      checked={motivo === op.id}
                      onChange={() => {
                        setMotivo(op.id)
                        setErrorReporte('')
                      }}
                    />
                    <span>
                      <strong>{op.titulo}</strong>
                      <small>{op.texto}</small>
                    </span>
                  </label>
                ))}
              </div>
              <label className="ficha-reporte-propia">
                <span>{motivo === 'otra' ? 'Tu razón' : 'Detalle, si quieres'}</span>
                <textarea
                  value={detalleReporte}
                  onChange={(e) => {
                    setDetalleReporte(e.target.value)
                    setErrorReporte('')
                  }}
                  rows={3}
                  placeholder="Qué viste en este comentario"
                />
              </label>
              {errorReporte && <p className="ficha-error">{errorReporte}</p>}
              <div className="ficha-respuesta-acciones">
                <button type="button" onClick={() => setReporteId(null)}>
                  Cancelar
                </button>
                <button type="submit" className="ficha-reporte-enviar">
                  Enviar reporte
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}

/* ---------- Galería ---------- */

/* Un tope para no llenar el almacenamiento del navegador: cada foto reducida
   pesa unos 200 KB y el navegador da unos 5 MB para toda la app. */
const MAX_FOTOS = 12
/* Quitar una foto no se puede deshacer: el primer toque pregunta, el segundo
   quita. Si no hay segundo toque en este tiempo, se olvida la pregunta. */
const ESPERA_CONFIRMAR = 3000

function ModalGaleria({ local, onPortada, onAgregarFotos, onQuitarFoto }) {
  const fotos = fotosDe(local)
  const [indice, setIndice] = useState(0)
  const [confirmar, setConfirmar] = useState(null)
  const [estado, setEstado] = useState(null)
  const pistaRef = useRef(null)
  const archivoRef = useRef(null)
  const temporizador = useRef(null)

  const enAnadir = indice >= fotos.length
  const actual = enAnadir ? null : fotos[indice]
  const esPortada = actual === local.url
  const caben = MAX_FOTOS - fotos.length
  const unaSola = fotos.length <= 1

  const ir = (i) => {
    const pista = pistaRef.current
    if (!pista) return
    pista.scrollTo({ left: i * pista.clientWidth, behavior: reducirMovimiento() ? 'auto' : 'smooth' })
  }

  const alDesplazar = (e) => {
    const pista = e.currentTarget
    const nuevo = Math.round(pista.scrollLeft / pista.clientWidth)
    if (nuevo !== indice) {
      setIndice(nuevo)
      setConfirmar(null)
    }
  }

  const pedirArchivos = () => {
    setEstado(null)
    archivoRef.current?.click()
  }

  const alElegir = async (e) => {
    const archivos = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!archivos.length) return
    const malo = archivos.map(errorDeFoto).find(Boolean)
    if (malo) {
      setEstado({ tipo: 'error', texto: malo })
      return
    }
    const tomadas = archivos.slice(0, caben)
    setEstado({ tipo: 'cargando', texto: tomadas.length === 1 ? 'Preparando la foto…' : `Preparando ${tomadas.length} fotos…` })
    try {
      const nuevas = await Promise.all(tomadas.map(comprimirFoto))
      const guardado = onAgregarFotos(nuevas)
      if (!guardado) {
        setEstado({ tipo: 'error', texto: 'No queda espacio en este dispositivo. Quita alguna foto e inténtalo de nuevo.' })
        return
      }
      setEstado(
        archivos.length > tomadas.length
          ? { tipo: 'aviso', texto: `Solo cabían ${tomadas.length}: el máximo son ${MAX_FOTOS} fotos.` }
          : null,
      )
      /* Lleva a la primera foto nueva, que es lo que quieres ver. */
      requestAnimationFrame(() => ir(fotos.length))
    } catch {
      setEstado({ tipo: 'error', texto: 'No se pudo leer alguna foto. Prueba con otra.' })
    }
  }

  const quitar = () => {
    if (!actual || unaSola) return
    clearTimeout(temporizador.current)
    if (confirmar !== actual) {
      setConfirmar(actual)
      temporizador.current = setTimeout(() => setConfirmar(null), ESPERA_CONFIRMAR)
      return
    }
    setConfirmar(null)
    onQuitarFoto(actual)
    setIndice((i) => Math.max(0, Math.min(i, fotos.length - 2)))
  }

  return (
    <div className="modal-negocio-stack">
      <input
        ref={archivoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={alElegir}
      />

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

          {/* La última "foto" es el sitio para añadir más. */}
          <figure className="galeria-foto galeria-foto--anadir">
            <button type="button" className="galeria-anadir" onClick={pedirArchivos} disabled={caben <= 0}>
              <span className="galeria-anadir-icono" aria-hidden="true">
                <Plus size={26} strokeWidth={2.2} />
              </span>
              <span className="galeria-anadir-texto">{caben > 0 ? 'Añadir fotos' : 'Galería llena'}</span>
              <span className="galeria-anadir-sub">
                {caben > 0 ? `Te caben ${caben} más` : `El máximo son ${MAX_FOTOS}. Quita alguna para subir otra.`}
              </span>
            </button>
          </figure>
        </div>

        {actual && (
          <button
            type="button"
            className={`galeria-quitar${confirmar === actual ? ' galeria-quitar--confirmar' : ''}`}
            onClick={quitar}
            disabled={unaSola}
            title={unaSola ? 'Tu local necesita al menos una foto' : undefined}
            aria-label={confirmar === actual ? 'Toca otra vez para quitar esta foto' : 'Quitar esta foto'}
          >
            <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
            {confirmar === actual && <span>¿Quitar?</span>}
          </button>
        )}

        {actual && (
          <span className="galeria-contador" aria-live="polite">
            {indice + 1} / {fotos.length}
          </span>
        )}
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
        <button
          type="button"
          className="galeria-miniatura galeria-miniatura--anadir"
          aria-current={enAnadir ? 'true' : undefined}
          aria-label="Añadir fotos"
          onClick={caben > 0 ? pedirArchivos : () => ir(fotos.length)}
        >
          <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      {estado && (
        <p className={`galeria-estado galeria-estado--${estado.tipo}`} role={estado.tipo === 'error' ? 'alert' : 'status'}>
          {estado.texto}
        </p>
      )}

      {actual && (
        <>
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
        </>
      )}
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

function ModalEditarLocal({ local, seccion, onGuardar }) {
  const [form, setForm] = useState(() => formularioDesde(local))
  const [original] = useState(() => formularioDesde(local))
  const formRef = useRef(null)

  /* Desde una fila de "Tu local" se llega con la sección ya a la vista.
     Un frame de espera para que la hoja haya terminado de montarse. */
  useEffect(() => {
    if (!seccion) return undefined
    const frame = requestAnimationFrame(() => {
      formRef.current?.querySelector(`[data-seccion="${seccion}"]`)?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [seccion])

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
    <form className="modal-negocio-stack" onSubmit={guardar} noValidate ref={formRef}>
      <Seccion titulo="Tu local" seccion="local">
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

      <Seccion titulo="Horario" seccion="horario" extra={`${duracionTexto(abierto)} abierto`}>
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

      <Seccion titulo="Contacto" seccion="contacto">
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

export default function ContenidoFichaLocal({
  modal,
  local,
  onPortada,
  onAgregarFotos,
  onQuitarFoto,
  onGuardar,
}) {
  switch (modal?.tipo) {
    case 'opiniones':
      return (
        <div className="modal-negocio-stack">
          <PanelOpiniones local={local} onGuardar={onGuardar} />
        </div>
      )
    case 'galeria':
      return (
        <ModalGaleria local={local} onPortada={onPortada} onAgregarFotos={onAgregarFotos} onQuitarFoto={onQuitarFoto} />
      )
    case 'editar':
      return <ModalEditarLocal key={modal.seccion ?? 'todo'} local={local} seccion={modal.seccion} onGuardar={onGuardar} />
    default:
      return null
  }
}
