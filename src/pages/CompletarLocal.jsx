import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Camera, Info, MapPinned, PencilRuler, Plus, Star, Trash2, X } from 'lucide-react'
import Asistente from '../components/NuevoLocal/Asistente.jsx'
import MapaPin from '../components/NuevoLocal/MapaPin.jsx'
import MapaMesas from '../components/MapaMesas/MapaMesas.jsx'
import TalyPixel from '../components/Ayuda/TalyPixel.jsx'
import { getMunicipio } from '../data/cuba.js'
import { getTipo } from '../data/tiposLocal.js'
import { actualizarMiLocal, getMiLocal, guardarSeleccion, sincronizarMisLocales } from '../services/misLocales.js'
import { hayApi } from '../services/api.js'
import { PaginaEsqueleto } from '../components/Esqueletos/Esqueletos.jsx'
import { COMODIDADES, DIAS, aMinutos, horarioTexto, nuevoId } from '../utils/fichaLocal.js'
import { comprimirFoto, errorDeFoto } from '../utils/imagenes.js'
import { RESERVA_MESA_BASE, TOLERANCIAS } from '../utils/mesas.js'
import { planoDeLocal, tienePlanoPropio } from '../plano/local.js'
import { MAX, errorDescripcion, errorPrecio, errorServicioNombre, limpiar } from '../utils/validarLocal.js'

/* Completar el local, segundo formulario: ya está aprobado y ahora se pide
   lo que hace falta para que los clientes puedan reservar. Cada paso se
   guarda al seguir, así que se puede dejar a medias y volver otro día.

   El paso del mapa es opcional (con mala conexión puede no cargar), pero
   Taly insiste en que es de lo más importante. */

const OFERTA = { servicio: 'Servicios', mesa: 'Reservas', suscripcion: 'Planes' }
const DURACIONES = {
  servicio: [15, 30, 45, 60, 90, 120],
  mesa: [60, 90, 120, 180],
}
const MAX_FOTOS = 8
const MAX_ITEMS = 20

const textoMinutos = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`)

const PRESETS_DIAS = [
  { label: 'Lunes a viernes', dias: ['l', 'm', 'x', 'j', 'v'] },
  { label: 'Lunes a sábado', dias: ['l', 'm', 'x', 'j', 'v', 's'] },
  { label: 'Todos los días', dias: DIAS.map((d) => d.id) },
]

function datosIniciales(local) {
  return {
    lat: local.lat ?? null,
    lng: local.lng ?? null,
    dias: local.dias ?? [],
    horarioApertura: local.horarioApertura || '09:00',
    horarioCierre: local.horarioCierre || '18:00',
    intervaloMinutos: local.intervaloMinutos || (local.tipo === 'mesa' ? 90 : 30),
    servicios: local.servicios?.length ? local.servicios : [{ id: nuevoId('srv'), nombre: '', precio: '', duracion: 30 }],
    reservaMesa: { ...RESERVA_MESA_BASE, ...(local.reservaMesa ?? {}) },
    planes: local.planes?.length
      ? local.planes.map((p) => ({ ...p, incluyeTexto: (p.incluye ?? []).join('\n') }))
      : [{ id: nuevoId('plan'), nombre: '', precio: '', incluyeTexto: '' }],
    conRecargo: Boolean(local.recargo),
    recargo: local.recargo ?? { porDia: 50, diasGracia: 2, tope: 600 },
    urls: local.urls ?? [],
    url: local.url ?? '',
    descripcion: local.descripcion ?? '',
    iconos: (local.iconos ?? []).map((i) => i.id),
  }
}

/* Lo que se guarda de cada paso (y nada más). */
function cambiosDelPaso(paso, d, tipo) {
  if (paso === 0) return { lat: d.lat, lng: d.lng }
  if (paso === 1)
    return {
      dias: DIAS.map((x) => x.id).filter((id) => d.dias.includes(id)),
      horarioApertura: d.horarioApertura,
      horarioCierre: d.horarioCierre,
      horario: horarioTexto(d.horarioApertura, d.horarioCierre),
      intervaloMinutos: tipo === 'suscripcion' ? 60 : Number(d.intervaloMinutos),
    }
  if (paso === 2) {
    if (tipo === 'servicio')
      return {
        servicios: d.servicios.map((s) => ({
          id: s.id,
          nombre: limpiar(s.nombre, MAX.servicio),
          precio: Number(s.precio),
          duracion: Number(s.duracion),
        })),
      }
    if (tipo === 'mesa') {
      const r = d.reservaMesa
      return {
        reservaMesa: {
          ...r,
          precio: r.cobro === 'precio' ? Number(r.precio) : 0,
          consumoMinimo: r.cobro === 'gratis' ? Number(r.consumoMinimo) || 0 : 0,
        },
      }
    }
    return {
      planes: d.planes.map((p, i) => ({
        id: p.id,
        nombre: limpiar(p.nombre, 30),
        precio: Number(p.precio),
        periodo: 'mes',
        destacado: d.planes.length > 1 && i === 1 ? true : undefined,
        incluye: p.incluyeTexto
          .split('\n')
          .map((l) => limpiar(l, MAX.incluye))
          .filter(Boolean)
          .slice(0, 6),
      })),
      recargo: d.conRecargo
        ? { porDia: Number(d.recargo.porDia), diasGracia: Number(d.recargo.diasGracia), tope: Number(d.recargo.porDia) * 12 }
        : null,
    }
  }
  if (paso === 3) return { urls: d.urls, url: d.url || d.urls[0] || '' }
  if (paso === 4)
    return {
      descripcion: limpiar(d.descripcion, MAX.descripcion, { lineas: true }),
      iconos: d.iconos.map((id) => ({ id })),
    }
  return {}
}

function erroresDelPaso(paso, d, tipo) {
  const e = []
  const poner = (campo, msg) => msg && e.push([campo, msg])
  if (paso === 1) {
    poner('dias', !d.dias.length && 'Marca al menos un día. Si no abres nunca, no te van a poder reservar…')
    poner('horarioApertura', !d.horarioApertura && '¿A qué hora abres?')
    poner('horarioCierre', !d.horarioCierre && '¿Y a qué hora cierras?')
    if (d.horarioApertura && d.horarioApertura === d.horarioCierre)
      poner('horarioCierre', 'Abres y cierras a la misma hora. Así no da tiempo ni a barrer.')
  }
  if (paso === 2 && tipo === 'servicio') {
    d.servicios.forEach((s, i) => {
      poner(`srv-nombre-${i}`, errorServicioNombre(s.nombre))
      poner(`srv-precio-${i}`, errorPrecio(s.precio))
    })
  }
  if (paso === 2 && tipo === 'mesa') {
    const r = d.reservaMesa
    if (r.cobro === 'precio') poner('mesa-precio', errorPrecio(r.precio))
    if (r.cobro === 'gratis' && r.consumoMinimo !== '' && r.consumoMinimo != null)
      poner('mesa-consumo', errorPrecio(r.consumoMinimo, { cero: true }))
  }
  if (paso === 2 && tipo === 'suscripcion') {
    d.planes.forEach((p, i) => {
      const nombre = limpiar(p.nombre, 30)
      poner(`plan-nombre-${i}`, nombre.length < 3 ? 'Ponle nombre al plan, como «Básico» o «Completo».' : null)
      poner(`plan-precio-${i}`, errorPrecio(p.precio))
      poner(`plan-incluye-${i}`, !limpiar(p.incluyeTexto) && 'Di qué incluye el plan, aunque sea una línea.')
    })
    if (d.conRecargo) {
      poner('recargo-dia', errorPrecio(d.recargo.porDia))
      const g = Number(d.recargo.diasGracia)
      poner('recargo-gracia', (!Number.isInteger(g) || g < 0 || g > 15) && 'Los días de gracia van de 0 a 15.')
    }
  }
  if (paso === 4) poner('descripcion', errorDescripcion(d.descripcion))
  return e
}

/* Con backend, el local puede no estar aún en la copia de este navegador
   (se creó en otro dispositivo, o se acaba de aprobar): se pide primero. */
function CompletarLocal() {
  const { id } = useParams()
  const [listoSync, setListoSync] = useState(() => !hayApi || Boolean(getMiLocal(id)))
  useEffect(() => {
    if (listoSync) return undefined
    let vivo = true
    sincronizarMisLocales()
      .catch(() => {})
      .finally(() => {
        if (vivo) setListoSync(true)
      })
    return () => {
      vivo = false
    }
  }, [listoSync])
  if (!listoSync) return <PaginaEsqueleto />
  return <FormularioCompletar key={id} />
}

function FormularioCompletar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const local = useMemo(() => getMiLocal(id), [id])
  const tipoId = local?.tipo ?? 'servicio'
  const tipo = getTipo(tipoId)
  const PASOS = useMemo(() => ['Ubicación', 'Horario', OFERTA[tipoId], 'Fotos', 'Detalles'], [tipoId])

  const [paso, setPaso] = useState(() => Math.min(local?.pasoCompletar ?? 0, 4))
  const [datos, setDatos] = useState(() => (local ? datosIniciales(local) : null))
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [listo, setListo] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const formRef = useRef(null)
  const archivoRef = useRef(null)

  if (!local) return <Navigate to="/negocio" replace />
  if (local.estado !== 'aprobado') return <Navigate to="/negocio" replace />

  const municipio = getMunicipio(local.provincia, local.municipio)
  const centro = municipio ? { lat: municipio.lat, lng: municipio.lng, zoom: 15 } : { lat: 21.6, lng: -79.4, zoom: 6 }

  const cambiar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: typeof valor === 'function' ? valor(d[campo]) : valor }))
    setError(null)
    setAviso(null)
  }

  const fallar = (campo, texto) => {
    setError((prev) => ({ campo, texto, vez: (prev?.vez ?? 0) + 1 }))
    if (!campo) return
    window.setTimeout(() => {
      const el = formRef.current?.querySelector(`[name="${campo}"]`)
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 0)
  }

  const guardar = (p, extra = {}) => {
    const ok = actualizarMiLocal(id, { ...cambiosDelPaso(p, datos, tipoId), ...extra })
    if (!ok) fallar(null, 'El navegador se quedó sin sitio para guardarlo. Prueba con menos fotos o más pequeñas.')
    return ok
  }

  const seguir = () => {
    const errores = erroresDelPaso(paso, datos, tipoId)
    if (errores.length) {
      fallar(...errores[0])
      return
    }

    /* Saltarse el mapa o las fotos se puede, pero Taly pregunta antes. */
    if (paso === 0 && datos.lat == null && aviso?.clave !== 'sin-mapa') {
      setAviso({
        clave: 'sin-mapa',
        tono: 'duda',
        texto: 'Sin el punto, los clientes solo verán la dirección escrita y más de uno se perderá. Puedes marcarlo luego desde Mi Negocio.',
      })
      return
    }
    if (paso === 3 && !datos.urls.length && aviso?.clave !== 'sin-fotos') {
      setAviso({
        clave: 'sin-fotos',
        tono: 'duda',
        texto: 'Un local con fotos recibe muchas más reservas. ¿Seguro que sigues sin ninguna? Las puedes subir luego.',
      })
      return
    }

    const ultimo = paso === PASOS.length - 1
    if (!guardar(paso, { pasoCompletar: ultimo ? paso : paso + 1, ...(ultimo ? { completado: true } : null) })) return
    setError(null)
    setAviso(null)
    if (ultimo) {
      guardarSeleccion({ tipo: 'propio', id })
      setListo(true)
      return
    }
    setPaso(paso + 1)
  }

  const atras = () => {
    setError(null)
    setAviso(null)
    setPaso((p) => Math.max(0, p - 1))
  }

  const salir = () => {
    /* Lo del paso actual se guarda aunque no esté completo del todo, si es válido. */
    if (!erroresDelPaso(paso, datos, tipoId).length) guardar(paso)
    navigate('/negocio')
  }

  const subirFotos = async (archivos) => {
    const lista = [...archivos].slice(0, MAX_FOTOS - datos.urls.length)
    if (!lista.length) {
      fallar(null, `Ya tienes ${MAX_FOTOS} fotos, que es el máximo. Quita alguna si quieres poner otra.`)
      return
    }
    for (const f of lista) {
      const malo = errorDeFoto(f)
      if (malo) {
        fallar(null, `${malo} Esa no me la puedo quedar.`)
        return
      }
    }
    setSubiendo(true)
    try {
      const nuevas = await Promise.all(lista.map(comprimirFoto))
      cambiar('urls', (u) => [...u, ...nuevas])
      setAviso({ tono: 'bien', texto: nuevas.length === 1 ? '¡Qué buena pinta! Si tienes más, súbelas.' : `¡${nuevas.length} fotos! Así da gusto.` })
    } catch {
      fallar(null, 'Alguna foto no se pudo leer. Prueba con otra.')
    } finally {
      setSubiendo(false)
    }
  }

  const invalido = (campo) => (error?.campo === campo ? 'true' : undefined)
  const describe = (campo) => (error?.campo === campo ? 'asistente-taly' : undefined)

  /* ---------- Terminado ---------- */
  if (listo) {
    return (
      <Asistente titulo={local.localName} pasos={[]} paso={0} onCerrar={() => navigate('/negocio')} sinPie>
        <div className="asistente-final">
          <span className="asistente-final-taly" aria-hidden="true">
            <TalyPixel estado="llave" />
          </span>
          <h2 className="paso-titulo" tabIndex={-1}>
            ¡{local.localName} ya está abierto en Citaly!
          </h2>
          <p className="paso-texto">
            Ya te pueden encontrar y reservar. En Mi Negocio tienes tu panel de{' '}
            {tipoId === 'mesa' ? 'mesas' : tipoId === 'suscripcion' ? 'socios' : 'citas'}: ahí llegan las reservas.
          </p>
          {datos.lat == null && (
            <p className="nota-caja">
              <MapPinned size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>
                Te falta el <strong>punto en el mapa</strong>. Cuando tengas buena conexión, márcalo desde tu panel.
              </span>
            </p>
          )}
          <div className="asistente-final-acciones">
            <Link to="/negocio" className="asistente-seguir">
              Ir a mi panel
            </Link>
            <Link to={`/local/${id}`} className="boton-suave">
              Ver mi ficha como cliente
            </Link>
          </div>
        </div>
      </Asistente>
    )
  }

  const consejos = [
    'Toca el mapa justo en la puerta. Si estás en el local, el botón «Estoy en el local» lo hace por ti.',
    tipoId === 'mesa'
      ? 'Las reservas solo se pueden hacer dentro de este horario.'
      : tipoId === 'suscripcion'
        ? 'Es el horario del local. Los turnos por grupos los configuras luego en el panel.'
        : 'Los huecos de tu agenda salen de aquí: si abres a las 9 y das citas cada 30 min, la primera es a las 9:00.',
    tipoId === 'servicio'
      ? 'Pon lo que más piden. Puedes añadir o cambiar servicios cuando quieras.'
      : tipoId === 'mesa'
        ? 'Si no estás seguro, empieza gratis: es lo que menos asusta al cliente.'
        : 'Explica bien qué incluye cada plan. La gente compara antes de apuntarse.',
    'La primera foto es la portada: la que sale en Descubre. Mejor la fachada o lo más bonito del local.',
    'Cuenta qué te hace especial. Y marca las comodidades: el wifi convence a más de uno.',
  ]

  const taly = error
    ? { tono: 'error', texto: error.texto, vez: error.vez }
    : aviso
      ? { tono: aviso.tono, texto: aviso.texto }
      : paso === 0 && datos.lat != null
        ? { tono: 'bien', texto: '¡Punto guardado! Si no es exacto, arrastra el pin hasta la puerta.' }
        : { tono: 'consejo', texto: consejos[paso] }

  const textoSeguir =
    paso === PASOS.length - 1
      ? 'Abrir mi local'
      : aviso?.clave === 'sin-mapa'
        ? 'Seguir sin el punto'
        : aviso?.clave === 'sin-fotos'
          ? 'Seguir sin fotos'
          : 'Guardar y seguir'

  return (
    <Asistente
      titulo={local.localName}
      pasos={PASOS}
      paso={paso}
      onCerrar={salir}
      onAtras={paso > 0 ? atras : undefined}
      onSeguir={seguir}
      textoSeguir={textoSeguir}
      taly={taly}
    >
      <form
        ref={formRef}
        className="paso"
        key={paso}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          seguir()
        }}
      >
        {paso === 0 && (
          <>
            <div className="paso-cabeza">
              <span className="paso-sello">Opcional, pero muy importante</span>
              <h2 className="paso-titulo" tabIndex={-1}>
                Marca tu puerta en el mapa
              </h2>
              <p className="paso-texto">
                Es lo que más ayuda a que lleguen. Con la dirección escrita ({local.direccion}) muchos dan vueltas; con el
                punto, el móvil los lleva directo.
              </p>
            </div>
            <MapaPin
              centro={centro}
              valor={datos.lat != null ? { lat: datos.lat, lng: datos.lng } : null}
              etiqueta="Mapa para marcar el local"
              onCambiar={({ lat, lng }) => {
                setDatos((d) => ({ ...d, lat, lng }))
                setError(null)
                setAviso(null)
              }}
              onFuera={(motivo) =>
                fallar(
                  null,
                  motivo === 'sin-permiso'
                    ? 'No me dejaste ver dónde estás. Da igual: toca el mapa en tu puerta.'
                    : motivo === 'sin-gps'
                      ? 'Este móvil no me dice dónde está. Toca el mapa en tu puerta.'
                      : 'Eso ya es el mar (u otro país). Pon el pin en Cuba, en tu puerta.',
                )
              }
            />
            {datos.lat != null && (
              <div className="punto-guardado">
                <span>
                  Punto: {datos.lat.toFixed(5)}, {datos.lng.toFixed(5)}
                </span>
                <button type="button" className="resumen-editar" onClick={() => setDatos((d) => ({ ...d, lat: null, lng: null }))}>
                  Quitar
                </button>
              </div>
            )}
            <p className="nota-caja">
              <Info size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>¿Va lento el mapa? No pasa nada: sigue sin él y márcalo otro día desde Mi Negocio.</span>
            </p>
          </>
        )}

        {paso === 1 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Cuándo abres?
              </h2>
              <p className="paso-texto">Los días y las horas en que se puede reservar.</p>
            </div>
            <fieldset className="campo" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="campo-label">Días que abres</legend>
              <div className="chips" aria-describedby={describe('dias')}>
                {DIAS.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    name={i === 0 ? 'dias' : undefined}
                    className="chip-opcion chip-opcion--dia"
                    aria-pressed={datos.dias.includes(d.id)}
                    aria-label={d.corto}
                    onClick={() => cambiar('dias', (lista) => (lista.includes(d.id) ? lista.filter((x) => x !== d.id) : [...lista, d.id]))}
                  >
                    {d.letra}
                  </button>
                ))}
              </div>
              <div className="chips chips--atajos">
                {PRESETS_DIAS.map((p) => (
                  <button key={p.label} type="button" className="boton-suave" onClick={() => cambiar('dias', p.dias)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="campo-fila">
              <label className="campo">
                <span className="campo-label">Abres a las</span>
                <input
                  className="campo-input"
                  type="time"
                  name="horarioApertura"
                  value={datos.horarioApertura}
                  aria-invalid={invalido('horarioApertura')}
                  aria-describedby={describe('horarioApertura')}
                  onChange={(e) => cambiar('horarioApertura', e.target.value)}
                />
              </label>
              <label className="campo">
                <span className="campo-label">Cierras a las</span>
                <input
                  className="campo-input"
                  type="time"
                  name="horarioCierre"
                  value={datos.horarioCierre}
                  aria-invalid={invalido('horarioCierre')}
                  aria-describedby={describe('horarioCierre')}
                  onChange={(e) => cambiar('horarioCierre', e.target.value)}
                />
              </label>
            </div>
            {datos.horarioApertura && datos.horarioCierre && aMinutos(datos.horarioCierre) < aMinutos(datos.horarioApertura) && (
              <p className="nota-caja nota-caja--verde">
                <Info size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>Cierras pasada la medianoche. Perfecto, lo tenemos en cuenta.</span>
              </p>
            )}
            {tipoId !== 'suscripcion' && (
              <fieldset className="campo" style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="campo-label">
                  {tipoId === 'mesa' ? '¿Cuánto dura una reserva de mesa?' : '¿Cada cuánto puedes dar una cita?'}
                </legend>
                <p className="campo-ayuda">
                  {tipoId === 'mesa'
                    ? 'El tiempo que la mesa queda para ellos. Después se libera para la siguiente.'
                    : 'Es el hueco de tu agenda. Si un servicio tarda más, ocupa varios huecos seguidos.'}
                </p>
                <div className="chips" role="radiogroup" aria-label="Duración">
                  {DURACIONES[tipoId].map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      className="chip-opcion"
                      aria-checked={Number(datos.intervaloMinutos) === m}
                      onClick={() => cambiar('intervaloMinutos', m)}
                    >
                      {textoMinutos(m)}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </>
        )}

        {paso === 2 && tipoId === 'servicio' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Qué ofreces?
              </h2>
              <p className="paso-texto">Lo que el cliente elige al pedir cita: nombre, precio y lo que tardas.</p>
            </div>
            <div className="items">
              {datos.servicios.map((s, i) => (
                <div className="item" key={s.id}>
                  <div className="item-cabeza">
                    <span className="item-numero">Servicio {i + 1}</span>
                    {datos.servicios.length > 1 && (
                      <button
                        type="button"
                        className="item-quitar"
                        aria-label={`Quitar servicio ${i + 1}`}
                        onClick={() => cambiar('servicios', (l) => l.filter((x) => x.id !== s.id))}
                      >
                        <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <label className="campo">
                    <span className="campo-label">Nombre</span>
                    <input
                      className="campo-input"
                      name={`srv-nombre-${i}`}
                      value={s.nombre}
                      maxLength={MAX.servicio}
                      placeholder={i === 0 ? 'Ej.: Corte de caballero' : 'Ej.: Arreglo de barba'}
                      aria-invalid={invalido(`srv-nombre-${i}`)}
                      aria-describedby={describe(`srv-nombre-${i}`)}
                      onChange={(e) => cambiar('servicios', (l) => l.map((x) => (x.id === s.id ? { ...x, nombre: e.target.value } : x)))}
                    />
                  </label>
                  <div className="campo-fila">
                    <label className="campo">
                      <span className="campo-label">Precio (CUP)</span>
                      <input
                        className="campo-input"
                        name={`srv-precio-${i}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={s.precio}
                        placeholder="300"
                        aria-invalid={invalido(`srv-precio-${i}`)}
                        aria-describedby={describe(`srv-precio-${i}`)}
                        onChange={(e) => cambiar('servicios', (l) => l.map((x) => (x.id === s.id ? { ...x, precio: e.target.value } : x)))}
                      />
                    </label>
                    <label className="campo">
                      <span className="campo-label">Tarda</span>
                      <select
                        className="campo-input"
                        value={s.duracion}
                        onChange={(e) =>
                          cambiar('servicios', (l) => l.map((x) => (x.id === s.id ? { ...x, duracion: Number(e.target.value) } : x)))
                        }
                      >
                        {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                          <option key={m} value={m}>
                            {textoMinutos(m)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {datos.servicios.length < MAX_ITEMS && (
              <button
                type="button"
                className="boton-suave boton-suave--verde"
                onClick={() => cambiar('servicios', (l) => [...l, { id: nuevoId('srv'), nombre: '', precio: '', duracion: 30 }])}
              >
                <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
                Añadir otro servicio
              </button>
            )}
          </>
        )}

        {paso === 2 && tipoId === 'mesa' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                ¿Cómo se reserva una mesa?
              </h2>
              <p className="paso-texto">Decide si reservar cuesta algo. Es igual para todas las mesas.</p>
            </div>
            <div className="tipos" role="radiogroup" aria-label="Cobro de la reserva">
              {[
                { id: 'gratis', titulo: 'Gratis', texto: 'Reservan sin pagar nada. Puedes pedir un consumo mínimo.' },
                { id: 'precio', titulo: 'Con precio', texto: 'Pagan por reservar (por ejemplo, para eventos o noches llenas).' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  className="tipo-opcion"
                  aria-checked={datos.reservaMesa.cobro === o.id}
                  onClick={() => cambiar('reservaMesa', (r) => ({ ...r, cobro: o.id }))}
                >
                  <span className="tipo-nombre">{o.titulo}</span>
                  <span className="tipo-corto">{o.texto}</span>
                  <span className="tipo-marca" aria-hidden="true" />
                </button>
              ))}
            </div>
            {datos.reservaMesa.cobro === 'precio' ? (
              <label className="campo">
                <span className="campo-label">Precio de la reserva (CUP)</span>
                <input
                  className="campo-input"
                  name="mesa-precio"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={datos.reservaMesa.precio || ''}
                  placeholder="500"
                  aria-invalid={invalido('mesa-precio')}
                  aria-describedby={describe('mesa-precio')}
                  onChange={(e) => cambiar('reservaMesa', (r) => ({ ...r, precio: e.target.value }))}
                />
              </label>
            ) : (
              <label className="campo">
                <span className="campo-label">
                  Consumo mínimo por mesa (CUP) <span className="campo-opcional">opcional</span>
                </span>
                <p className="campo-ayuda">Lo que hay que gastar como mínimo. Déjalo vacío si no pides nada.</p>
                <input
                  className="campo-input"
                  name="mesa-consumo"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={datos.reservaMesa.consumoMinimo || ''}
                  placeholder="0"
                  aria-invalid={invalido('mesa-consumo')}
                  aria-describedby={describe('mesa-consumo')}
                  onChange={(e) => cambiar('reservaMesa', (r) => ({ ...r, consumoMinimo: e.target.value }))}
                />
              </label>
            )}
            <fieldset className="campo" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="campo-label">Si llegan tarde, guardas la mesa…</legend>
              <div className="chips" role="radiogroup" aria-label="Tolerancia">
                {TOLERANCIAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    className="chip-opcion"
                    aria-checked={datos.reservaMesa.tolerancia === m}
                    onClick={() => cambiar('reservaMesa', (r) => ({ ...r, tolerancia: m }))}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="campo">
              <span className="campo-label">Tu sala</span>
              <p className="campo-ayuda">
                {tienePlanoPropio(local)
                  ? 'Así la verán tus clientes al reservar. Puedes cambiarla cuando quieras, también desde Mi Negocio.'
                  : 'Dibuja tu sala: dónde está cada mesa, la barra, los baños… Tus clientes elegirán dónde sentarse. Son unos minutos y Taly te guía.'}
              </p>
              <div className="sala-muestra">
                <MapaMesas plano={planoDeLocal(local)} soloLectura />
              </div>
              <button
                type="button"
                className="sala-boton"
                onClick={() => {
                  /* Lo escrito en este paso se guarda antes de ir al editor. */
                  if (!erroresDelPaso(paso, datos, tipoId).length) guardar(paso)
                  navigate(`/negocio/plano/${id}?volver=completar`)
                }}
              >
                <PencilRuler size={18} strokeWidth={2.3} aria-hidden="true" />
                {tienePlanoPropio(local) ? 'Editar mi sala' : 'Diseñar mi sala'}
              </button>
            </div>
          </>
        )}

        {paso === 2 && tipoId === 'suscripcion' && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Tus planes
              </h2>
              <p className="paso-texto">Lo que paga cada socio al mes y qué le da. Con uno basta para empezar.</p>
            </div>
            <div className="items">
              {datos.planes.map((p, i) => (
                <div className="item" key={p.id}>
                  <div className="item-cabeza">
                    <span className="item-numero">Plan {i + 1}</span>
                    {datos.planes.length > 1 && (
                      <button
                        type="button"
                        className="item-quitar"
                        aria-label={`Quitar plan ${i + 1}`}
                        onClick={() => cambiar('planes', (l) => l.filter((x) => x.id !== p.id))}
                      >
                        <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="campo-fila">
                    <label className="campo">
                      <span className="campo-label">Nombre</span>
                      <input
                        className="campo-input"
                        name={`plan-nombre-${i}`}
                        value={p.nombre}
                        maxLength={30}
                        placeholder={['Básico', 'Completo', 'Con entrenador'][i] ?? 'Plan'}
                        aria-invalid={invalido(`plan-nombre-${i}`)}
                        aria-describedby={describe(`plan-nombre-${i}`)}
                        onChange={(e) => cambiar('planes', (l) => l.map((x) => (x.id === p.id ? { ...x, nombre: e.target.value } : x)))}
                      />
                    </label>
                    <label className="campo">
                      <span className="campo-label">Al mes (CUP)</span>
                      <input
                        className="campo-input"
                        name={`plan-precio-${i}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={p.precio}
                        placeholder="1500"
                        aria-invalid={invalido(`plan-precio-${i}`)}
                        aria-describedby={describe(`plan-precio-${i}`)}
                        onChange={(e) => cambiar('planes', (l) => l.map((x) => (x.id === p.id ? { ...x, precio: e.target.value } : x)))}
                      />
                    </label>
                  </div>
                  <label className="campo">
                    <span className="campo-label">Qué incluye</span>
                    <p className="campo-ayuda">Una cosa por línea. Máximo 6.</p>
                    <textarea
                      className="campo-input"
                      name={`plan-incluye-${i}`}
                      rows={3}
                      value={p.incluyeTexto}
                      placeholder={'Área de pesas y cardio\nDe 6 de la mañana a 4 de la tarde'}
                      aria-invalid={invalido(`plan-incluye-${i}`)}
                      aria-describedby={describe(`plan-incluye-${i}`)}
                      onChange={(e) =>
                        cambiar('planes', (l) => l.map((x) => (x.id === p.id ? { ...x, incluyeTexto: e.target.value.slice(0, 400) } : x)))
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            {datos.planes.length < 4 && (
              <button
                type="button"
                className="boton-suave boton-suave--verde"
                onClick={() => cambiar('planes', (l) => [...l, { id: nuevoId('plan'), nombre: '', precio: '', incluyeTexto: '' }])}
              >
                <Plus size={17} strokeWidth={2.4} aria-hidden="true" />
                Añadir otro plan
              </button>
            )}
            <label className="check">
              <input type="checkbox" checked={datos.conRecargo} onChange={(e) => cambiar('conRecargo', e.target.checked)} />
              <span>
                Cobrar recargo si pagan tarde
                <small>Una cantidad por cada día de atraso, después de unos días de gracia.</small>
              </span>
            </label>
            {datos.conRecargo && (
              <div className="campo-fila">
                <label className="campo">
                  <span className="campo-label">CUP por día</span>
                  <input
                    className="campo-input"
                    name="recargo-dia"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={datos.recargo.porDia}
                    aria-invalid={invalido('recargo-dia')}
                    aria-describedby={describe('recargo-dia')}
                    onChange={(e) => cambiar('recargo', (r) => ({ ...r, porDia: e.target.value }))}
                  />
                </label>
                <label className="campo">
                  <span className="campo-label">Días de gracia</span>
                  <input
                    className="campo-input"
                    name="recargo-gracia"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={15}
                    value={datos.recargo.diasGracia}
                    aria-invalid={invalido('recargo-gracia')}
                    aria-describedby={describe('recargo-gracia')}
                    onChange={(e) => cambiar('recargo', (r) => ({ ...r, diasGracia: e.target.value }))}
                  />
                </label>
              </div>
            )}
          </>
        )}

        {paso === 3 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Fotos del local
              </h2>
              <p className="paso-texto">
                Hasta {MAX_FOTOS}. La que tenga la <Star size={13} strokeWidth={2.6} aria-label="estrella" /> es la portada; toca otra para
                cambiarla.
              </p>
            </div>
            <div className="fotos">
              {datos.urls.map((u, i) => {
                const portada = (datos.url || datos.urls[0]) === u
                return (
                  <div className={`fotol${portada ? ' fotol--portada' : ''}`} key={i}>
                    <button
                      type="button"
                      className="fotol-elegir"
                      aria-label={portada ? `Foto ${i + 1}, es la portada` : `Usar la foto ${i + 1} de portada`}
                      aria-pressed={portada}
                      onClick={() => cambiar('url', u)}
                    >
                      <img src={u} alt="" />
                      {portada && (
                        <span className="fotol-sello">
                          <Star size={12} strokeWidth={2.8} aria-hidden="true" /> Portada
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="fotol-quitar"
                      aria-label={`Quitar la foto ${i + 1}`}
                      onClick={() => {
                        setDatos((d) => ({ ...d, urls: d.urls.filter((_, j) => j !== i), url: d.url === u ? '' : d.url }))
                      }}
                    >
                      <X size={15} strokeWidth={2.8} aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
              {datos.urls.length < MAX_FOTOS && (
                <button type="button" className="fotol fotol--subir" onClick={() => archivoRef.current?.click()} disabled={subiendo}>
                  <Camera size={24} strokeWidth={2.1} aria-hidden="true" />
                  <span>{subiendo ? 'Subiendo…' : 'Añadir fotos'}</span>
                </button>
              )}
            </div>
            <input
              ref={archivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                subirFotos(e.target.files)
                e.target.value = ''
              }}
            />
            <p className="nota-caja nota-caja--verde">
              <Camera size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Con luz de día y sin gente de frente. Las reducimos para que carguen rápido aunque la conexión vaya mal.</span>
            </p>
          </>
        )}

        {paso === 4 && (
          <>
            <div className="paso-cabeza">
              <h2 className="paso-titulo" tabIndex={-1}>
                Cuéntales más
              </h2>
              <p className="paso-texto">Lo que leen antes de decidirse.</p>
            </div>
            <label className="campo">
              <span className="campo-label">Descripción</span>
              <textarea
                className="campo-input"
                name="descripcion"
                rows={5}
                maxLength={MAX.descripcion}
                value={datos.descripcion}
                placeholder={
                  tipo?.id === 'mesa'
                    ? 'Ej.: Comida criolla casera, ambiente tranquilo y terraza con vista al parque.'
                    : tipo?.id === 'suscripcion'
                      ? 'Ej.: Gimnasio con pesas, cardio y clases dirigidas. Entrenadores atentos.'
                      : 'Ej.: Barbería de barrio con 10 años. Cortes clásicos y degradados.'
                }
                aria-invalid={invalido('descripcion')}
                aria-describedby={describe('descripcion')}
                onChange={(e) => cambiar('descripcion', e.target.value)}
              />
              <span className="campo-cuenta" aria-hidden="true">
                {datos.descripcion.length}/{MAX.descripcion}
              </span>
            </label>
            <fieldset className="campo" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="campo-label">
                Comodidades <span className="campo-opcional">opcional</span>
              </legend>
              <div className="chips">
                {COMODIDADES.map(({ id: cid, label, Icono }) => (
                  <button
                    key={cid}
                    type="button"
                    className="chip-opcion"
                    aria-pressed={datos.iconos.includes(cid)}
                    onClick={() =>
                      cambiar('iconos', (l) => {
                        if (l.includes(cid)) return l.filter((x) => x !== cid)
                        /* Fumar y libre de humo no van juntos. */
                        const opuesto = { cigarrete: 'no-cigarrete', 'no-cigarrete': 'cigarrete' }[cid]
                        return [...l.filter((x) => x !== opuesto), cid]
                      })
                    }
                  >
                    <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Asistente>
  )
}

export default CompletarLocal
