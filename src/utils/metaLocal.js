import { admiteTamanos, fotoUrl } from './fotos.js'
import { fotosDe, notaDeComentarios } from './fichaLocal.js'

/* Metadatos de la ficha de un local: lo que sale en la pestaña, en Google y
   en la vista previa al compartir, más sus datos estructurados (schema.org)
   para que Google entienda que es un negocio con dirección, horario y nota. */

const DIAS = { l: 'Monday', m: 'Tuesday', x: 'Wednesday', j: 'Thursday', v: 'Friday', s: 'Saturday', d: 'Sunday' }

/* Tipo de schema.org según la categoría: más concreto que LocalBusiness ayuda
   a Google a clasificarlo. Lo que no está aquí queda como LocalBusiness. */
const TIPO_SCHEMA = {
  Restaurante: 'Restaurant',
  Cafetería: 'CafeOrCoffeeShop',
  Bar: 'BarOrPub',
  Terraza: 'BarOrPub',
  'Comida saludable': 'Restaurant',
  Peluquería: 'HairSalon',
  Barbería: 'HairSalon',
  Uñas: 'NailSalon',
  Spa: 'DaySpa',
  Tatuajes: 'TattooParlor',
  Gimnasio: 'ExerciseGym',
}

function recortar(texto, max = 155) {
  const limpio = String(texto ?? '').replace(/\s+/g, ' ').trim()
  if (limpio.length <= max) return limpio
  return `${limpio.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

/* Solo fotos públicas: una data: (subida del dueño sin backend) no se puede compartir. */
function fotoPublica(local) {
  const foto = fotosDe(local).find((u) => /^https?:\/\//.test(u))
  if (!foto) return null
  return admiteTamanos(foto)
    ? { url: fotoUrl(foto, { ancho: 1200, alto: 630, calidad: 75 }), ancho: 1200, alto: 630 }
    : { url: foto }
}

/** Título, descripción e imagen para useMetaPagina. null si aún no hay local. */
export function metaDeLocal(local) {
  if (!local?.localName) return null
  const nombre = local.localName
  const donde = local.direccion ? ` en ${local.direccion}` : ''
  const base = local.descripcion || `${local.categoria ?? 'Lugar'}${donde}.`
  const foto = fotoPublica(local)
  return {
    titulo: `${nombre} · ${local.categoria ? `${local.categoria} · ` : ''}Citaly`,
    descripcion: recortar(`${base} Mira precios, opiniones y reserva en Citaly.`),
    imagen: foto?.url,
    imagenAncho: foto?.ancho,
    imagenAlto: foto?.alto,
    imagenAlt: foto ? `Foto de ${nombre}` : undefined,
  }
}

/** JSON-LD del local (schema.org LocalBusiness o su subtipo). */
export function datosEstructuradosLocal(local, url) {
  if (!local?.localName) return null
  const { nota, cantidad } = notaDeComentarios(local)
  const fotos = fotosDe(local).filter((u) => /^https?:\/\//.test(u)).slice(0, 5)
  const datos = {
    '@context': 'https://schema.org',
    '@type': TIPO_SCHEMA[local.categoria] ?? 'LocalBusiness',
    name: local.localName,
    url,
    ...(local.descripcion && { description: recortar(local.descripcion, 300) }),
    ...(fotos.length && { image: fotos }),
    ...(local.telefono && { telephone: local.telefono }),
    ...(local.direccion && {
      address: { '@type': 'PostalAddress', streetAddress: local.direccion, addressCountry: 'CU' },
    }),
    ...(Number.isFinite(local.lat) &&
      Number.isFinite(local.lng) && { geo: { '@type': 'GeoCoordinates', latitude: local.lat, longitude: local.lng } }),
  }
  const dias = (local.dias ?? []).map((d) => DIAS[d]).filter(Boolean)
  if (dias.length && local.horarioApertura && local.horarioCierre) {
    datos.openingHoursSpecification = [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: dias, opens: local.horarioApertura, closes: local.horarioCierre },
    ]
  }
  /* La nota solo con opiniones de verdad detrás. */
  if (cantidad > 0 && nota > 0) {
    datos.aggregateRating = { '@type': 'AggregateRating', ratingValue: nota, reviewCount: cantidad, bestRating: 5, worstRating: 1 }
  }
  return datos
}
