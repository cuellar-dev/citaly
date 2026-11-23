import { pedir } from './api.js'
import { banderasDeTipo } from '../data/tiposLocal.js'

/* Locales contra el backend (backend-citaly-main/Routes/LocalRouter.js):

     GET    /api/local/:id         ficha pública (servicios, horarios, comodidades)
     GET    /api/local/mios        los del usuario, con estado y ficha (panel)
     POST   /api/local             crear (nace en revisión)
     PUT    /api/local/:id         cambios: { localData, horario, servicios, amenidades }
     DELETE /api/local/:id         borrar (si no tiene citas)
     POST   /api/media/locales/:id/firma  →  subir foto a Cloudinary  →  POST /api/media/locales/:id

   El backend guarda en columnas lo que conoce (nombre, dirección, horario…)
   y el resto de la ficha del front (municipio, reserva de mesa, planes,
   plano…) en `ficha`, un JSON que devuelve tal cual. Aquí se traduce en los
   dos sentidos para que las pantallas sigan con la forma de locales.json. */

const hora = (v) => (v ? String(v).slice(0, 5) : '')
const numero = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

/* Lo que va a columnas propias; todo lo demás del local viaja en `ficha`. */
const A_COLUMNA = {
  localName: 'nombre',
  descripcion: 'descripcion',
  direccion: 'direccion',
  lat: 'lat',
  lng: 'lng',
  telefono: 'telefono',
  whatsapp: 'whatsapp',
  intervaloMinutos: 'intervalo_minutos',
  tipo: 'tipo',
  completado: 'completado',
  oculto: 'oculto',
  provincia: 'provincia',
}

/* Lo que no se guarda en ningún sitio: son del navegador o se calculan. */
const NO_SE_GUARDA = new Set([
  'id', 'propio', 'duenoId', 'estado', 'creadoEn', 'aprobadoEn', 'deApi',
  'lugar', 'suscripcion', 'points', 'opiniones', 'comentarios',
  'servicios', 'iconos', 'dias', 'horarioApertura', 'horarioCierre', 'horario',
  'categoria',
])

/** De una fila del backend (GET /:id o /mios) a la forma de locales.json. */
export function adaptarLocalApi(r) {
  const ficha = r.ficha && typeof r.ficha === 'object' ? r.ficha : {}
  const tipo = r.tipo ?? (r.tiene_lugar ? 'mesa' : 'servicio')
  const horarios = Array.isArray(r.horarios) ? r.horarios : []
  const diasHorario = horarios.filter((h) => !h.cerrado && h.abre).map((h) => h.dia_semana)
  const abierto = horarios.find((h) => !h.cerrado && h.abre)
  const imagenes = Array.isArray(r.imagenes) ? r.imagenes : []
  const fotos = Array.isArray(ficha.urls) && ficha.urls.length ? ficha.urls : imagenes.map((i) => i.url)
  return {
    ...ficha,
    id: r.id,
    tipo,
    ...banderasDeTipo(tipo),
    localName: r.nombre,
    categoria: r.categoria_nombre || ficha.categoria || '',
    descripcion: r.descripcion ?? ficha.descripcion ?? '',
    direccion: r.direccion ?? '',
    lat: numero(r.lat),
    lng: numero(r.lng),
    telefono: r.telefono ?? '',
    whatsapp: r.whatsapp ?? '',
    provincia: ficha.provincia ?? r.provincia ?? null,
    horarioApertura: hora(abierto?.abre ?? r.horario_apertura),
    horarioCierre: hora(abierto?.cierra ?? r.horario_cierre),
    intervaloMinutos: Number(r.intervalo_minutos) || 60,
    dias: horarios.length ? diasHorario : (ficha.dias ?? []),
    servicios: (r.servicios ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precio: Number(s.precio) || 0,
      duracion: Number(s.duracion_minutos) || 0,
      ...(s.nota ? { nota: s.nota } : null),
    })),
    iconos: (r.amenidades ?? []).map((a) => ({ id: typeof a === 'string' ? a : a.id })),
    url: ficha.url || fotos[0] || '',
    urls: fotos,
    points: String(Number(r.rating_cache ?? 0).toFixed(1)),
    opiniones: Number(r.opiniones_count) || 0,
    comentarios: ficha.comentarios ?? [],
    estado: r.estado ?? 'aprobado',
    completado: r.completado !== false,
    oculto: Boolean(r.oculto),
    creadoEn: r.creado_en ?? null,
    aprobadoEn: r.aprobado_en ?? null,
    deApi: true,
  }
}

/** Cambios del front → cuerpo de PUT /api/local/:id. */
export function cuerpoCambios(cambios) {
  const localData = {}
  const ficha = {}
  Object.entries(cambios).forEach(([clave, valor]) => {
    if (valor === undefined) return
    if (A_COLUMNA[clave]) localData[A_COLUMNA[clave]] = valor
    else if (!NO_SE_GUARDA.has(clave)) ficha[clave] = valor
  })
  /* La provincia también va a la ficha: la columna la usa Descubre para
     filtrar y el front necesita el id tal cual. */
  if (cambios.provincia !== undefined) ficha.provincia = cambios.provincia
  if (cambios.urls !== undefined) ficha.urls = cambios.urls
  if (cambios.url !== undefined) ficha.url = cambios.url
  if (cambios.dias !== undefined) ficha.dias = cambios.dias
  if (Object.keys(ficha).length) localData.ficha = ficha

  const cuerpo = { localData }
  if (cambios.dias !== undefined && cambios.horarioApertura && cambios.horarioCierre) {
    cuerpo.horario = { dias: cambios.dias, abre: cambios.horarioApertura, cierra: cambios.horarioCierre }
  }
  if (cambios.servicios !== undefined) cuerpo.servicios = cambios.servicios
  if (cambios.iconos !== undefined) cuerpo.amenidades = cambios.iconos
  return cuerpo
}

export async function cargarLocalApi(id) {
  return adaptarLocalApi(await pedir(`/api/local/${encodeURIComponent(id)}`))
}

/** Opiniones visibles del local, con la forma de locales.json (comentarios). */
export async function cargarOpinionesApi(id) {
  const filas = await pedir(`/api/opiniones/local/${encodeURIComponent(id)}/visibles`)
  return (Array.isArray(filas) ? filas : []).map((o) => ({
    id: o.id,
    nombre: o.autor_nombre || 'Cliente de Citaly',
    fecha: String(o.creado_en ?? '').slice(0, 10),
    calificacion: Number(o.calificacion) || 0,
    comentario: o.comentario ?? '',
    imagenPerfil: o.autor_foto ?? '',
  }))
}

export async function cargarMisLocalesApi() {
  const filas = await pedir('/api/local/mios')
  return (Array.isArray(filas) ? filas : []).map(adaptarLocalApi)
}

export async function crearLocalApi(datos) {
  const { localData } = cuerpoCambios(datos)
  const creado = await pedir('/api/local', {
    metodo: 'POST',
    cuerpo: { localData: { ...localData, categoria: datos.categoria } },
  })
  return adaptarLocalApi(creado)
}

export async function guardarCambiosApi(id, cambios) {
  const cuerpo = cuerpoCambios(cambios)
  if (!Object.keys(cuerpo.localData).length) delete cuerpo.localData
  if (Object.keys(cuerpo).length === 0) return null
  return pedir(`/api/local/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo, espera: 20000 })
}

export const borrarLocalApi = (id) => pedir(`/api/local/${encodeURIComponent(id)}`, { metodo: 'DELETE' })

/* ---------- Fotos ----------
   El navegador sube la foto directo a Cloudinary con una firma del backend
   (el secreto nunca llega aquí) y luego se la presenta al backend, que
   comprueba que está en la carpeta del local y la registra. */

async function subirFoto(localId, dataUrl) {
  const firma = await pedir(`/api/media/locales/${encodeURIComponent(localId)}/firma`, { metodo: 'POST' })
  const archivo = await (await fetch(dataUrl)).blob()
  const form = new FormData()
  form.append('file', archivo)
  form.append('api_key', firma.apiKey)
  form.append('timestamp', String(firma.timestamp))
  form.append('signature', firma.signature)
  form.append('public_id', firma.publicId)
  form.append('asset_folder', firma.assetFolder)
  form.append('allowed_formats', firma.allowedFormats)
  const subida = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(firma.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!subida.ok) throw Object.assign(new Error('No se pudo subir la foto.'), { code: 'CLOUDINARY' })
  const registrada = await pedir(`/api/media/locales/${encodeURIComponent(localId)}`, {
    metodo: 'POST',
    cuerpo: { publicId: firma.publicId },
    espera: 20000,
  })
  return registrada.url
}

/** Cambia las fotos `data:` de los cambios por su URL en Cloudinary. */
export async function subirFotosDeCambios(localId, cambios) {
  const fuera = { ...cambios }
  const cache = new Map()
  const subir = async (url) => {
    if (typeof url !== 'string' || !url.startsWith('data:')) return url
    if (!cache.has(url)) cache.set(url, await subirFoto(localId, url))
    return cache.get(url)
  }
  if (Array.isArray(cambios.urls)) fuera.urls = await Promise.all(cambios.urls.map(subir))
  if (cambios.url !== undefined) fuera.url = await subir(cambios.url)
  return fuera
}
