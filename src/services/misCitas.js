import { hayApi } from './api.js'
import { ESTADOS_V_KEY, getCitas, saveCitas } from './storage.js'
import { publicarOpinion as publicarEnFicha } from './opiniones.js'
import {
  asistenciaCitaApi,
  cancelarCitaApi,
  cargarCitasApi,
  confirmarCitaApi,
  publicarOpinionApi,
} from './misCitasApi.js'
import { CANCELADA, CONFIRMADA, caducarPendientes } from '../utils/estadosCita.js'

/* Frontera de «Mis citas» (las del cliente). La pantalla y useMisCitas solo
   conocen estas funciones; de dónde salen los datos se decide aquí:

     · sin VITE_API_URL  → localStorage con la demo, como siempre.
     · con VITE_API_URL  → backend (misCitasApi.js).

   Lo que el backend todavía no guarda (asistencia, opinión ligada a la cita,
   «ahora no» a la opinión) se apunta en un cuaderno local (`citaly_citas_extra`)
   y se mezcla encima de lo que llega. Cuando el backend lo admita, esos campos
   vienen en la cita y el cuaderno se vacía solo. */

const EXTRAS_KEY = 'citaly_citas_extra'

/* ---------- Cuaderno local (lo que el backend aún no sabe) ---------- */

function leerExtras() {
  try {
    return JSON.parse(localStorage.getItem(EXTRAS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function guardarExtras(extras) {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras))
  } catch {
    /* Sin sitio: el cambio vale esta sesión y nada más. */
  }
}

/* `valor === undefined` quita la anotación. */
function anotar(citaId, cambios) {
  const extras = leerExtras()
  const actual = { ...extras[citaId] }
  Object.entries(cambios).forEach(([clave, valor]) => {
    if (valor === undefined) delete actual[clave]
    else actual[clave] = valor
  })
  if (Object.keys(actual).length) extras[citaId] = actual
  else delete extras[citaId]
  guardarExtras(extras)
}

/* ---------- Lectura ---------- */

/* La versión anterior usaba 1 = confirmada y 2 = pendiente de confirmar.
   Ahora 1 = por ti y 2 = confirmada. Se traduce una sola vez. */
export function leerCitasLocales() {
  let citas = getCitas()
  if (localStorage.getItem(ESTADOS_V_KEY) !== '2') {
    citas = citas.map((cita) => {
      let estado = cita.estadoReserva ?? 0
      if (estado === 1) estado = 2
      else if (estado === 2) estado = 1
      return { ...cita, estadoReserva: estado }
    })
    localStorage.setItem(ESTADOS_V_KEY, '2')
    saveCitas(citas)
  }
  const vigentes = caducarPendientes(citas)
  if (vigentes !== citas) saveCitas(vigentes)
  return vigentes
}

/**
 * Las citas del cliente, listas para pintar. Con backend es asíncrona y puede
 * lanzar (sin sesión, sin conexión…): quien la llama decide qué enseñar.
 */
export async function cargarMisCitas() {
  if (!hayApi) return leerCitasLocales()
  const delServidor = await cargarCitasApi()
  const extras = leerExtras()
  /* Lo que el servidor ya devuelve manda; el cuaderno solo rellena huecos. */
  const mezcladas = delServidor.map((c) => {
    const e = extras[c.id] ?? {}
    return {
      ...c,
      asistencia: c.asistencia ?? e.asistencia,
      opinion: c.opinion ?? e.opinion,
      opinionOmitida: e.opinionOmitida,
    }
  })
  /* Si el servidor ya trae el dato, se borra del cuaderno. */
  const limpio = {}
  mezcladas.forEach((c) => {
    const e = extras[c.id]
    if (!e) return
    const resto = { ...e }
    const original = delServidor.find((s) => s.id === c.id)
    if (original?.asistencia !== undefined) delete resto.asistencia
    if (original?.opinion) delete resto.opinion
    if (Object.keys(resto).length) limpio[c.id] = resto
  })
  guardarExtras(limpio)
  /* El plazo de 15 min del dueño se ve igual aunque el servidor tarde en
     cancelar: no se guarda, solo se pinta. */
  return caducarPendientes(mezcladas)
}

/* ---------- Escritura ----------
   Cada acción tiene dos partes: los `cambios` que se pintan al instante (los
   construye la función `cambios…`) y el `guardar…` que los manda a donde toque.
   `useMisCitas` pinta primero y guarda después; si guardar falla en una acción
   crítica (cancelar, «voy pa allá») deshace lo pintado. */

function actualizarLocal(id, cambios) {
  saveCitas(getCitas().map((c) => (c.id === id ? { ...c, ...cambios } : c)))
}

export function cambiosVoyPaAlla() {
  return { estadoReserva: CONFIRMADA, voyPaAlla: true, voyPaAllaEn: new Date().toISOString() }
}

export function cambiosCancelar() {
  return { estadoReserva: CANCELADA, canceladaEn: new Date().toISOString(), canceladaPor: 'cliente' }
}

export async function guardarVoyPaAlla(cita, cambios) {
  if (hayApi) await confirmarCitaApi(cita.id)
  else actualizarLocal(cita.id, cambios)
}

export async function guardarCancelar(cita, cambios) {
  if (hayApi) await cancelarCitaApi(cita.id)
  else actualizarLocal(cita.id, cambios)
}

/** `asistencia`: 'si' | 'no' | null (deshacer). */
export function cambiosAsistencia(asistencia) {
  return { asistencia: asistencia ?? null }
}

export async function guardarAsistencia(cita, asistencia) {
  if (!hayApi) {
    actualizarLocal(cita.id, cambiosAsistencia(asistencia))
    return
  }
  const asistio = asistencia === 'si' ? true : asistencia === 'no' ? false : null
  try {
    await asistenciaCitaApi(cita.id, asistio)
    anotar(cita.id, { asistencia: undefined })
  } catch (error) {
    anotar(cita.id, { asistencia: asistencia ?? undefined })
    throw error
  }
}

export function cambiosOpinion({ puntuacion, texto }) {
  return { opinion: { puntuacion, texto, en: new Date().toISOString() }, opinionOmitida: false }
}

export async function guardarOpinion(cita, opinion) {
  const cambios = cambiosOpinion(opinion)
  if (!hayApi) {
    publicarEnFicha(cita, opinion)
    actualizarLocal(cita.id, cambios)
    return
  }
  anotar(cita.id, { opinionOmitida: undefined })
  try {
    await publicarOpinionApi(cita, opinion)
    anotar(cita.id, { opinion: undefined })
  } catch (error) {
    anotar(cita.id, { opinion: cambios.opinion })
    throw error
  }
}

/** «Ahora no» a la opinión: preferencia de pantalla, no va al servidor. */
export function guardarOpinionOmitida(cita, omitida) {
  if (hayApi) anotar(cita.id, { opinionOmitida: omitida ? true : undefined })
  else actualizarLocal(cita.id, { opinionOmitida: omitida })
}
