import { format } from 'date-fns'
import { getLocalById } from './locales.js'
import { getPerfiles, saveFicha } from './storage.js'
import { getUsuarioById } from './usuarios.js'
import { USUARIO_ACTUAL_ID } from './sesion.js'

/* La opinión que el cliente deja desde Mis citas se publica en la ficha del
   local, la primera de la lista. Si la edita, se reemplaza la misma. */

function nombreParaOpiniones(nombre) {
  try {
    const avisos = JSON.parse(localStorage.getItem('citaly_perfil_avisos'))
    /* Ajuste de Mi Perfil: «Nombre en opiniones · Solo el nombre». */
    if (avisos?.nombreCorto) return String(nombre).split(' ')[0]
  } catch {
    /* sin ajuste guardado: nombre completo */
  }
  return nombre
}

export function publicarOpinion(cita, { puntuacion, texto }) {
  const local = getLocalById(cita.localId)
  if (!local) return false
  const usuario = { ...getUsuarioById(USUARIO_ACTUAL_ID), ...getPerfiles()[USUARIO_ACTUAL_ID] }
  const id = `op-${cita.id}`
  const opinion = {
    id,
    nombre: nombreParaOpiniones(usuario.nombre ?? 'Cliente de Citaly'),
    fecha: format(new Date(), 'yyyy-MM-dd'),
    calificacion: puntuacion,
    comentario: texto || '',
    imagenPerfil: usuario.foto ?? null,
  }
  const resto = (local.comentarios ?? []).filter((c) => c.id !== id)
  return saveFicha(cita.localId, { comentarios: [opinion, ...resto] })
}
