import usuarios from '../data/usuarios.json'

/* Cuentas de la plataforma (mock). Nombre y foto los edita cada usuario desde su perfil, nunca el local. */

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export function getUsuarioById(id) {
  return usuarios.find((u) => u.id === id) ?? null
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
export function sinPerfil({ id, usuarioId, estado, points, servicios }) {
  return { id, usuarioId, estado, points: points ?? null, servicios: servicios ?? [] }
}

/* Une cada trabajador con su cuenta para pintarlo. `name` y `url` son los campos que ya lee la reserva. */
export function conPerfiles(local) {
  if (!local?.profesionales) return local
  return {
    ...local,
    profesionales: local.profesionales.map((p) => {
      const u = getUsuarioById(p.usuarioId)
      return u ? { ...p, name: u.nombre, url: u.foto, usuario: u.usuario, oficio: u.oficio, ciudad: u.ciudad } : p
    }),
  }
}

/* Solo cuentan los que ya aceptaron la invitación desde su cuenta. */
export function profesionalesActivos(local) {
  return (local?.profesionales ?? []).filter((p) => p.estado !== 'pendiente')
}
