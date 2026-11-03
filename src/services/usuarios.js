import usuarios from '../data/usuarios.json'
import { getPerfiles } from './storage.js'

/* Cuentas de la plataforma (mock). Nombre y foto los edita cada usuario desde su perfil, nunca el local. */

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function getUsuarioById(id) {
  const base = usuarios.find((u) => u.id === id) ?? null
  if (!base) return null
  /* Overlay de lo que el usuario guardó en su perfil (local por ahora). */
  return { ...base, ...getPerfiles()[id] }
}

/* Busca por nombre, @usuario, correo o teléfono (dígitos). */
export function buscarUsuarios(texto, limite = 8) {
  const q = normalizar(texto).replace(/^@/, '')
  if (q.length < 2) return []
  const qDigitos = q.replace(/\D/g, '')
  return usuarios
    .filter((u) => {
      if (normalizar(u.nombre).includes(q) || normalizar(u.usuario).includes(q) || normalizar(u.correo) === q) return true
      return qDigitos.length >= 4 && String(u.telefono).replace(/\D/g, '').includes(qDigitos)
    })
    .slice(0, limite)
}

/* Lo que el local guarda de cada trabajador: el vínculo con la cuenta y lo propio del local. */
export function sinPerfil(p) {
  const base = {
    id: p.id,
    usuarioId: p.usuarioId,
    estado: p.estado,
    points: p.points ?? null,
    servicios: p.servicios ?? [],
  }
  if (p.origen !== 'solicito') return base
  return {
    ...base,
    origen: 'solicito',
    oficio: p.oficio,
    oficioDetalle: p.oficioDetalle,
    desdeCuando: p.desdeCuando,
    solicitadoEn: p.solicitadoEn,
  }
}

/* Une cada trabajador con su cuenta para pintarlo. `name` y `url` son los campos que ya lee la reserva. */
export function conPerfiles(local) {
  if (!local?.profesionales) return local
  return {
    ...local,
    profesionales: local.profesionales.map((p) => {
      const u = getUsuarioById(p.usuarioId)
      return u
        ? {
            ...p,
            name: u.nombre,
            url: u.foto,
            usuario: u.usuario,
            oficio: p.oficio || u.oficio,
            ciudad: u.ciudad,
          }
        : p
    }),
  }
}

/* Solo cuentan los que ya aceptaron la invitación desde su cuenta. */
export function profesionalesActivos(local) {
  return (local?.profesionales ?? []).filter((p) => p.estado !== 'pendiente')
}
