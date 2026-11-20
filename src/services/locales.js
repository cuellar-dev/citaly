import locales from '../data/locales.json'
import { localesDemo } from '../data/localesDemo.js'
import { conOpinionesVariadas } from '../data/opinionesDemo.js'
import { getFichas } from './storage.js'
import { getLocalPropioPorId, getLocalesPublicados } from './misLocales.js'

/* Las fichas guardadas antes podían traer `profesionales`: ya no existen, se ignoran. */
function conCambios(local, fichas) {
  if (!fichas[local.id]) return local
  // eslint-disable-next-line no-unused-vars
  const { profesionales, ...cambios } = fichas[local.id]
  return { ...local, ...cambios }
}

/* Los locales de demo, con opiniones y estrellas variadas (data/opinionesDemo.js).
   Se calcula una sola vez. */
let demoCache = null
function baseDemo() {
  demoCache ??= [...locales, ...localesDemo].map(conOpinionesVariadas)
  return demoCache
}

/* Los ocultos (por su dueño) no salen en Descubre ni en la búsqueda. Los
   locales que crean los usuarios entran cuando están aprobados y completos. */
export function getAllLocales() {
  const fichas = getFichas()
  return [...baseDemo(), ...getLocalesPublicados()]
    .map((local) => conCambios(local, fichas))
    .filter((local) => !local.oculto)
}

export function getLocalById(id) {
  const local = baseDemo().find((l) => l.id === id) ?? getLocalPropioPorId(id)
  return local ? conCambios(local, getFichas()) : null
}
