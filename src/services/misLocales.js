import { idUsuarioActual } from './sesion.js'
import { hayApi } from './api.js'
import { borrarLocalApi, cargarMisLocalesApi, crearLocalApi, guardarCambiosApi, subirFotosDeCambios } from './localesApi.js'
import { banderasDeTipo } from '../data/tiposLocal.js'
import { getMunicipio, getProvincia } from '../data/cuba.js'
import { claveNombre, limpiar } from '../utils/validarLocal.js'

/* Con VITE_API_URL los locales viven en el backend. Esta lista de
   localStorage pasa a ser una copia (para pintar al momento y para las
   funciones síncronas): se rellena con sincronizarMisLocales() y cada cambio
   se guarda aquí y se manda al servidor por detrás, en orden. Si el servidor
   falla, se avisa con el evento ERROR_GUARDAR_EVENTO. */
export const MIS_LOCALES_EVENTO = 'citaly:mis-locales'
export const ERROR_GUARDAR_EVENTO = 'citaly:error-guardar'

/* Los locales que crea el usuario. Hoy viven en localStorage; mañana esto
   es una tabla `locales` con `dueno_id` apuntando a la cuenta de Citaly.

   Vida de un local:
     1. revision   → lo acaba de enviar. Una persona del equipo comprueba que
                     existe y que los datos tienen sentido. No sale en Citaly.
     2. aprobado   → ya es de Citaly, pero le faltan datos (completado: false):
                     el dueño los rellena en /negocio/completar/:id.
     3. completado → sale en Descubre y en la búsqueda, salvo que esté oculto.

   ─── Todos los datos que se piden, y cuándo ───────────────────────────────
   Primer formulario (/negocio/nuevo), lo justo para revisarlo:
     tipo            servicio | mesa | suscripcion (decide el panel)
     localName       nombre que ven los clientes
     categoria       Peluquería, Restaurante, Gimnasio…
     formaLegal      TCP, mipyme… (opcional; solo para quien revisa)
     provincia       id de data/cuba.js
     municipio       id de data/cuba.js
     calle           calle y número
     entreCalles     opcional
     referencia      opcional («frente al parque»)
     whatsapp        móvil cubano, obligatorio
     telefono        fijo, opcional
     correoContacto  donde avisamos de la aprobación
     declaraDueno    lo gestiona con derecho a hacerlo
     aceptaNormas    normas de Citaly
   Segundo formulario (/negocio/completar/:id), ya aprobado:
     lat, lng        el pin en el mapa (opcional, pero se insiste)
     dias, horarioApertura, horarioCierre, intervaloMinutos
     servicios       (citas) nombre, precio, duración
     reservaMesa     (mesas) cobro, precio o consumo mínimo, tolerancia
     planes, recargo (mensual) planes con lo que incluyen, multa por atraso
     url, urls       portada y galería
     descripcion, iconos (comodidades), metros (opcional)
   ────────────────────────────────────────────────────────────────────────── */

const CLAVE = 'citaly_mis_locales'
const CLAVE_SELECCION = 'citaly_negocio_seleccion'

/* En la demo la revisión «humana» tarda esto y siempre aprueba. */
export const SEGUNDOS_REVISION_DEMO = 20

/* Topes por cuenta: nadie normal abre seis negocios en una tarde. */
export const MAX_LOCALES = 5
export const MAX_EN_REVISION = 2

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(lista) ? lista.filter((l) => l && typeof l.id === 'string') : []
  } catch {
    return []
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
    return true
  } catch {
    return false
  }
}

/* Los locales son de la cuenta con la sesión abierta. Sin sesión, ninguno. */
export function getMisLocales(duenoId = idUsuarioActual()) {
  return duenoId ? leer().filter((l) => l.duenoId === duenoId) : []
}

export function getMiLocal(id) {
  const yo = idUsuarioActual()
  return yo ? (leer().find((l) => l.id === id && l.duenoId === yo) ?? null) : null
}

/* Los que ya pueden ver los clientes. */
export function getLocalesPublicados() {
  return leer().filter((l) => l.estado === 'aprobado' && l.completado && !l.oculto)
}

/* Cualquiera, publicado o no (para abrir su ficha por id). */
export function getLocalPropioPorId(id) {
  return leer().find((l) => l.id === id) ?? null
}

function nuevoId() {
  const azar = Math.random().toString(36).slice(2, 8)
  return `propio-${Date.now().toString(36)}-${azar}`
}

export function direccionCompleta({ calle, provincia, municipio }) {
  const mun = getMunicipio(provincia, municipio)?.nombre
  const prov = getProvincia(provincia)?.nombre
  return [calle, mun, mun === prov ? null : prov].filter(Boolean).join(', ')
}

/* ¿Hay ya un local con ese nombre en ese municipio? Devuelve 'propio' si es
   uno tuyo (no se deja repetir) u 'otro' si es de otra persona (se avisa;
   lo mira quien revisa). */
export function nombreRepetido(nombre, provincia, municipio, todos = []) {
  const clave = claveNombre(nombre)
  if (!clave) return null
  const mun = getMunicipio(provincia, municipio)?.nombre
  if (getMisLocales().some((l) => claveNombre(l.localName) === clave && l.municipio === municipio)) return 'propio'
  const enOtro = todos.some(
    (l) => !l.propio && claveNombre(l.localName) === clave && mun && String(l.direccion ?? '').includes(mun),
  )
  return enOtro ? 'otro' : null
}

export class ErrorLimite extends Error {}

/* ---------- Backend ---------- */

function avisarCambio() {
  window.dispatchEvent(new Event(MIS_LOCALES_EVENTO))
}

function avisarError(error) {
  window.dispatchEvent(
    new CustomEvent(ERROR_GUARDAR_EVENTO, {
      detail: { mensaje: error?.message || 'No se pudo guardar en el servidor.', code: error?.code },
    }),
  )
}

/** Trae del servidor los locales de la cuenta y los deja en la copia local. */
export async function sincronizarMisLocales() {
  const yo = idUsuarioActual()
  if (!hayApi || !yo) return getMisLocales()
  const delServidor = (await cargarMisLocalesApi()).map((l) => ({ ...l, propio: true, duenoId: yo }))
  escribir([...leer().filter((l) => l.duenoId !== yo), ...delServidor])
  avisarCambio()
  return delServidor
}

/* Los cambios se mandan uno detrás de otro, en el orden en que se hicieron. */
let cola = Promise.resolve()

function mandarCambios(id, cambios) {
  cola = cola
    .then(async () => {
      const conFotos = await subirFotosDeCambios(id, cambios)
      const respuesta = await guardarCambiosApi(id, conFotos)
      /* Las fotos ya son URLs de Cloudinary y los servicios nuevos tienen id
         del servidor: se apuntan en la copia para no volver a subirlos. */
      const arreglo = {}
      if (conFotos.urls !== cambios.urls) arreglo.urls = conFotos.urls
      if (conFotos.url !== cambios.url) arreglo.url = conFotos.url
      if (Array.isArray(respuesta?.servicios) && cambios.servicios) {
        arreglo.servicios = respuesta.servicios.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          precio: Number(s.precio) || 0,
          duracion: Number(s.duracion_minutos) || 0,
        }))
      }
      if (Object.keys(arreglo).length) {
        escribir(leer().map((l) => (l.id === id ? { ...l, ...arreglo } : l)))
        avisarCambio()
      }
    })
    .catch(avisarError)
  return cola
}

/** Espera a que el servidor tenga todo lo que se guardó (para no adelantarse). */
export const esperarGuardado = () => cola

/** Crea el local en revisión. Lanza ErrorLimite si la cuenta llegó al tope. */
export async function crearMiLocal(datos) {
  if (!hayApi) return crearMiLocalDemo(datos)
  const yo = idUsuarioActual()
  if (!yo) throw new Error('Inicia sesión para crear tu local.')
  const local = crearMiLocalDemo(datos, { soloArmar: true })
  let creado
  try {
    creado = await crearLocalApi(local)
  } catch (error) {
    if (error.code === 'LIMITE_LOCALES' || error.code === 'LIMITE_REVISION') throw new ErrorLimite(error.message)
    throw error
  }
  /* La respuesta de crear no trae el nombre de la categoría: se queda el elegido. */
  const final = { ...local, ...creado, categoria: creado.categoria || local.categoria, propio: true, duenoId: yo }
  escribir([...leer().filter((l) => l.id !== final.id), final])
  avisarCambio()
  return final
}

function crearMiLocalDemo(datos, { soloArmar = false } = {}) {
  const yo = idUsuarioActual()
  if (!yo) throw new Error('Inicia sesión para crear tu local.')
  const mios = getMisLocales()
  if (mios.length >= MAX_LOCALES) throw new ErrorLimite(`Ya tienes ${MAX_LOCALES} locales, que es el máximo por cuenta. Escríbenos si necesitas más.`)
  if (mios.filter((l) => l.estado === 'revision').length >= MAX_EN_REVISION)
    throw new ErrorLimite('Ya tienes dos locales esperando revisión. Cuando los aprobemos, podrás enviar otro.')

  const ahora = new Date().toISOString()
  const local = {
    id: nuevoId(),
    propio: true,
    duenoId: yo,
    estado: 'revision',
    completado: false,
    pasoCompletar: 0,
    creadoEn: ahora,
    aprobadoEn: null,
    oculto: false,

    tipo: datos.tipo,
    ...banderasDeTipo(datos.tipo),
    localName: limpiar(datos.localName, 40),
    categoria: limpiar(datos.categoria, 40),
    formaLegal: datos.formaLegal || null,
    provincia: datos.provincia,
    municipio: datos.municipio,
    calle: limpiar(datos.calle, 80),
    entreCalles: limpiar(datos.entreCalles, 80),
    referencia: limpiar(datos.referencia, 120),
    direccion: direccionCompleta(datos),
    whatsapp: datos.whatsapp,
    telefono: datos.telefono || '',
    correoContacto: limpiar(datos.correoContacto, 80).toLowerCase(),

    /* Lo que aún no tiene, vacío para que el resto de la app no se rompa. */
    lat: null,
    lng: null,
    dias: [],
    horarioApertura: '',
    horarioCierre: '',
    intervaloMinutos: 60,
    servicios: [],
    iconos: [],
    url: '',
    urls: [],
    descripcion: '',
    points: '0',
    opiniones: 0,
    comentarios: [],
  }
  if (soloArmar) return local
  if (!escribir([...leer(), local])) throw new Error('El navegador no tiene sitio para guardarlo. Libera espacio y vuelve a probar.')
  return local
}

export function actualizarMiLocal(id, cambios) {
  const yo = idUsuarioActual()
  const lista = leer()
  if (!yo || !lista.some((l) => l.id === id && l.duenoId === yo)) return false
  const ok = escribir(lista.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
  /* Con backend, aunque la copia no quepa (fotos grandes), el servidor sí lo guarda. */
  if (hayApi) {
    mandarCambios(id, cambios)
    return true
  }
  return ok
}

/** Con backend es asíncrona y lanza si el servidor no deja (p. ej. tiene citas). */
export function borrarMiLocal(id) {
  const yo = idUsuarioActual()
  if (!yo) return false
  if (!hayApi) return escribir(leer().filter((l) => !(l.id === id && l.duenoId === yo)))
  return borrarLocalApi(id).then(() => {
    escribir(leer().filter((l) => !(l.id === id && l.duenoId === yo)))
    avisarCambio()
    return true
  })
}

export function aprobarMiLocal(id) {
  return actualizarMiLocal(id, { estado: 'aprobado', aprobadoEn: new Date().toISOString() })
}

/* En la demo: lo que lleva en revisión más del tiempo de mentira, aprobado. */
export function revisarAprobaciones(ahora = Date.now()) {
  /* Con backend aprueba una persona (o, en desarrollo, el propio servidor):
     lo nuevo llega con sincronizarMisLocales(). */
  if (hayApi) return false
  const lista = leer()
  let cambio = false
  const nueva = lista.map((l) => {
    if (l.estado !== 'revision') return l
    if (ahora - new Date(l.creadoEn).getTime() < SEGUNDOS_REVISION_DEMO * 1000) return l
    cambio = true
    return { ...l, estado: 'aprobado', aprobadoEn: new Date(ahora).toISOString() }
  })
  if (cambio) escribir(nueva)
  return cambio
}

/* Qué local se está mirando en Mi Negocio: { tipo: 'propio' | 'demo', id }. */
export function leerSeleccion() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE_SELECCION))
    return s && (s.tipo === 'propio' || s.tipo === 'demo') && typeof s.id === 'string' ? s : null
  } catch {
    return null
  }
}

export function guardarSeleccion(seleccion) {
  try {
    localStorage.setItem(CLAVE_SELECCION, JSON.stringify(seleccion))
  } catch {
    /* Vale para esta visita. */
  }
}

/* Avisos del proceso para la campana. */
export function notisMisLocales() {
  return getMisLocales().flatMap((l) => {
    const lista = [
      {
        id: `ml-recibido-${l.id}`,
        ambito: 'negocio',
        tipo: 'recordatorio',
        titulo: `Recibimos ${l.localName}`,
        texto: 'Una persona del equipo lo está revisando. Te escribimos al correo en cuanto esté.',
        creadaEn: l.creadoEn,
        enlace: '/negocio',
      },
    ]
    if (l.estado === 'aprobado') {
      lista.push({
        id: `ml-aprobado-${l.id}`,
        ambito: 'negocio',
        tipo: 'aceptada',
        titulo: `¡${l.localName} ya es parte de Citaly!`,
        texto: l.completado
          ? 'Tu local ya sale en Citaly. A por las primeras reservas.'
          : 'Te falta rellenar el horario y lo que ofreces para que puedan reservarte.',
        creadaEn: l.aprobadoEn,
        enlace: l.completado ? '/negocio' : `/negocio/completar/${l.id}`,
        accion: l.completado ? undefined : 'Completar mi local',
      })
    }
    return lista
  })
}
