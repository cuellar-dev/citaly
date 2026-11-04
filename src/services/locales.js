import locales from '../data/locales.json'
import { localesDemo } from '../data/localesDemo.js'
import { getFichas } from './storage.js'
import { conPerfiles } from './usuarios.js'

function conCambios(local, fichas) {
  return conPerfiles(fichas[local.id] ? { ...local, ...fichas[local.id] } : local)
}

export function getAllLocales() {
  const fichas = getFichas()
  return [...locales, ...localesDemo].map((local) => conCambios(local, fichas))
}

export function getLocalById(id) {
  const local = [...locales, ...localesDemo].find((l) => l.id === id)
  return local ? conCambios(local, getFichas()) : null
}
