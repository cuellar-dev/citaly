import { useEffect, useState } from 'react'
import { hayApi } from '../services/api.js'
import { cargarLocal, getLocalById } from '../services/locales.js'

/**
 * La ficha de un local para una pantalla. Empieza con lo que ya se sabe (la
 * demo o lo último que dio el servidor) para pintar al momento, y con backend
 * pide la ficha fresca: así los servicios llegan con sus ids reales, que son
 * los que hacen falta para reservar.
 *
 * `estado`: 'listo' | 'cargando' (sin nada que enseñar aún) | 'error'.
 */
export function useLocal(id) {
  const [res, setRes] = useState(() => ({ id, local: getLocalById(id), fresco: !hayApi, error: null }))

  /* Cambió el id (de una ficha a otra): se empieza de nuevo, en el render. */
  let actual = res
  if (res.id !== id) {
    actual = { id, local: getLocalById(id), fresco: !hayApi, error: null }
    setRes(actual)
  }

  useEffect(() => {
    if (!hayApi || !id) return undefined
    let vivo = true
    cargarLocal(id)
      .then((local) => {
        if (vivo) setRes({ id, local, fresco: true, error: null })
      })
      .catch((error) => {
        if (vivo) setRes((r) => (r.id === id ? { ...r, fresco: true, error } : r))
      })
    return () => {
      vivo = false
    }
  }, [id])

  const { local, fresco, error } = actual
  const estado = local ? 'listo' : !fresco ? 'cargando' : 'error'
  /* Como el setState de React: acepta el valor o una función del anterior. */
  const setLocal = (siguiente) =>
    setRes((r) => ({ ...r, local: typeof siguiente === 'function' ? siguiente(r.local) : siguiente }))
  return { local, estado, fresco, error, setLocal }
}
