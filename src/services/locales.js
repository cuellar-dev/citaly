import locales from '../data/locales.json'

export function getAllLocales() {
  return locales
}

export function getLocalById(id) {
  return locales.find((local) => local.id === id) ?? null
}
