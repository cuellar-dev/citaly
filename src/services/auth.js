/**
 * Capa de auth. Hoy es mock; mañana solo cambias el cuerpo de estas funciones
 * (Supabase, Clerk, tu API…) sin tocar la pantalla.
 */

function esperar(ms = 450) {
  return new Promise((r) => setTimeout(r, ms))
}

/** @param {{ correo: string, contrasena: string }} datos */
export async function iniciarSesion(datos) {
  await esperar()
  const correo = String(datos.correo || '').trim().toLowerCase()
  const contrasena = String(datos.contrasena || '')

  if (!correo.includes('@')) {
    throw new Error('Pon un correo válido.')
  }
  if (contrasena.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  /* TODO: return await supabase.auth.signInWithPassword({ email: correo, password: contrasena }) */
  return { ok: true, correo }
}

/** @param {{ nombre: string, correo: string, contrasena: string }} datos */
export async function registrarse(datos) {
  await esperar()
  const nombre = String(datos.nombre || '').trim()
  const correo = String(datos.correo || '').trim().toLowerCase()
  const contrasena = String(datos.contrasena || '')

  if (nombre.length < 2) {
    throw new Error('Pon tu nombre.')
  }
  if (!correo.includes('@')) {
    throw new Error('Pon un correo válido.')
  }
  if (contrasena.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  /* TODO: return await supabase.auth.signUp({ email: correo, password: contrasena, options: { data: { nombre } } }) */
  return { ok: true, correo, nombre }
}
