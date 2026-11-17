import usuarios from '../data/usuarios.json'
import { getPerfiles } from './storage.js'

/* Cuentas de la plataforma (mock). Nombre y foto los edita cada usuario desde su perfil. */

export function getUsuarioById(id) {
  const base = usuarios.find((u) => u.id === id) ?? null
  if (!base) return null
  /* Overlay de lo que el usuario guardó en su perfil (local por ahora). */
  return { ...base, ...getPerfiles()[id] }
}
