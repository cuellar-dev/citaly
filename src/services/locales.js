import locales from '../data/locales.json'
import { localesDemo } from '../data/localesDemo.js'
import { conOpinionesVariadas } from '../data/opinionesDemo.js'
import { hayApi } from './api.js'
import { cargarLocalApi, cargarOpinionesApi } from './localesApi.js'
import { getFichas } from './storage.js'
import { getLocalPropioPorId, getLocalesPublicados } from './misLocales.js'

/* Las fichas guardadas antes podían traer `profesionales`: ya no existen, se ignoran. */
function conCambios(local, fichas) {
  if (!fichas[local.id]) return local
  // eslint-disable-next-line no-unused-vars
  const { profesionales, ...cambios } = fichas[local.id]
  return { ...local, ...cambios }
}

/* Los locales de demo, con opiniones y estrellas variadas (data/opinionesDemo.js).
   Se calcula una sola vez. */
let demoCache = null
function baseDemo() {
  demoCache ??= [...locales, ...localesDemo].map(conOpinionesVariadas)
  return demoCache
}

/* ---------- Locales que llegan del backend ----------
   Con VITE_API_URL, la ficha de un local se pide al servidor (cargarLocal) y
   se guarda aquí, para que las funciones síncronas de abajo la encuentren.
   Si el local existe también en la demo (mismo id: el backend se sembró con
   ella), se mezclan: manda el servidor (servicios con sus ids reales, horario,
   nota) y la demo rellena lo que el servidor aún no guarda (opiniones de
   ejemplo, mesas del plano, galería). */
const remotos = new Map()

function mezclar(base, delServidor) {
  if (!base) return delServidor
  const fusion = { ...base, ...delServidor }
  if (!delServidor.urls?.length) {
    fusion.urls = base.urls
    fusion.url = base.url
  }
  if (!delServidor.comentarios?.length) fusion.comentarios = base.comentarios
  if (!delServidor.descripcion) fusion.descripcion = base.descripcion
  if (!delServidor.mesas && base.mesas) fusion.mesas = base.mesas
  if (!delServidor.reservaMesa && base.reservaMesa) fusion.reservaMesa = base.reservaMesa
  if (!delServidor.servicios?.length) fusion.servicios = base.servicios
  return fusion
}

export function recordarLocal(local) {
  if (!local?.id) return
  const base = baseDemo().find((l) => l.id === local.id)
  remotos.set(local.id, mezclar(base, local))
}

/** Pide la ficha al servidor. Sin backend, la de la demo. */
export async function cargarLocal(id) {
  if (!hayApi) return getLocalById(id)
  const local = await cargarLocalApi(id)
  /* Si las opiniones fallan (un corte, el servidor lento) no es lo mismo que
     «nadie ha opinado»: se reintenta una vez y, si sigue fallando, se conservan
     las que ya se tenían. Sin opiniones de verdad se quedan las de la demo. */
  let opiniones = null
  for (let intento = 0; intento < 2 && opiniones === null; intento++) {
    opiniones = await cargarOpinionesApi(id).catch(() => null)
  }
  if (opiniones === null) {
    const previas = remotos.get(id)?.comentarios
    recordarLocal(previas?.length ? { ...local, comentarios: previas } : local)
  } else {
    recordarLocal(opiniones.length ? { ...local, comentarios: opiniones } : local)
  }
  return remotos.get(id)
}

/* Los ocultos (por su dueño) no salen en Descubre ni en la búsqueda. Los
   locales que crean los usuarios entran cuando están aprobados y completos. */
export function getAllLocales() {
  const fichas = getFichas()
  const vistos = new Set()
  const todos = []
  const meter = (local) => {
    if (!local || vistos.has(local.id)) return
    vistos.add(local.id)
    todos.push(local)
  }
  baseDemo().forEach((l) => meter(remotos.get(l.id) ?? l))
  remotos.forEach((l) => {
    if (l.estado === 'aprobado' && l.completado !== false) meter(l)
  })
  getLocalesPublicados().forEach(meter)
  return todos.map((local) => conCambios(local, fichas)).filter((local) => !local.oculto)
}

export function getLocalById(id) {
  const local = remotos.get(id) ?? baseDemo().find((l) => l.id === id) ?? getLocalPropioPorId(id)
  return local ? conCambios(local, getFichas()) : null
}
