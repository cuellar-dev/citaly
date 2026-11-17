import locales from '../data/locales.json'
import { localesDemo } from '../data/localesDemo.js'
import { getFichas } from './storage.js'

/* Las fichas guardadas antes podían traer `profesionales`: ya no existen, se ignoran. */
function conCambios(local, fichas) {
  if (!fichas[local.id]) return local
  // eslint-disable-next-line no-unused-vars
  const { profesionales, ...cambios } = fichas[local.id]
  return { ...local, ...cambios }
}

export function getAllLocales() {
  const fichas = getFichas()
  return [...locales, ...localesDemo].map((local) => conCambios(local, fichas))
}

export function getLocalById(id) {
  const local = [...locales, ...localesDemo].find((l) => l.id === id)
  return local ? conCambios(local, getFichas()) : null
}
