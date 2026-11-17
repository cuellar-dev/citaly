/* División político-administrativa de Cuba (la de 2011): 15 provincias y el
   municipio especial Isla de la Juventud, 168 municipios en total.

   Cada municipio lleva el punto aproximado de su cabecera [lat, lng]. Solo
   sirve para centrar el mapa cuando el dueño elige dónde está su local; el
   punto exacto lo pone él con el pin. */

const P = (id, nombre, municipios) => ({
  id,
  nombre,
  municipios: municipios.map(([nombre, lat, lng]) => ({ id: slug(nombre), nombre, lat, lng })),
})

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const PROVINCIAS = [
  P('pinar-del-rio', 'Pinar del Río', [
    ['Consolación del Sur', 22.505, -83.515],
    ['Guane', 22.203, -84.087],
    ['La Palma', 22.748, -83.552],
    ['Los Palacios', 22.586, -83.248],
    ['Mantua', 22.29, -84.287],
    ['Minas de Matahambre', 22.587, -83.946],
    ['Pinar del Río', 22.417, -83.698],
    ['San Juan y Martínez', 22.267, -83.835],
    ['San Luis', 22.283, -83.767],
    ['Sandino', 22.08, -84.207],
    ['Viñales', 22.616, -83.708],
  ]),
  P('artemisa', 'Artemisa', [
    ['Alquízar', 22.807, -82.585],
    ['Artemisa', 22.813, -82.759],
    ['Bahía Honda', 22.906, -83.163],
    ['Bauta', 22.983, -82.549],
    ['Caimito', 22.958, -82.596],
    ['Candelaria', 22.744, -82.958],
    ['Guanajay', 22.924, -82.688],
    ['Güira de Melena', 22.794, -82.507],
    ['Mariel', 22.993, -82.754],
    ['San Antonio de los Baños', 22.889, -82.499],
    ['San Cristóbal', 22.715, -83.054],
  ]),
  P('la-habana', 'La Habana', [
    ['Arroyo Naranjo', 23.043, -82.333],
    ['Boyeros', 23.01, -82.4],
    ['Centro Habana', 23.138, -82.366],
    ['Cerro', 23.11, -82.38],
    ['Cotorro', 23.04, -82.27],
    ['Diez de Octubre', 23.09, -82.36],
    ['Guanabacoa', 23.124, -82.3],
    ['La Habana del Este', 23.163, -82.28],
    ['La Habana Vieja', 23.136, -82.354],
    ['La Lisa', 23.06, -82.46],
    ['Marianao', 23.083, -82.43],
    ['Playa', 23.11, -82.44],
    ['Plaza de la Revolución', 23.125, -82.385],
    ['Regla', 23.13, -82.333],
    ['San Miguel del Padrón', 23.08, -82.31],
  ]),
  P('mayabeque', 'Mayabeque', [
    ['Batabanó', 22.72, -82.29],
    ['Bejucal', 22.932, -82.388],
    ['Güines', 22.836, -82.028],
    ['Jaruco', 23.043, -82.01],
    ['Madruga', 22.911, -81.856],
    ['Melena del Sur', 22.788, -82.15],
    ['Nueva Paz', 22.765, -81.758],
    ['Quivicán', 22.825, -82.358],
    ['San José de las Lajas', 22.963, -82.151],
    ['San Nicolás', 22.783, -81.917],
    ['Santa Cruz del Norte', 23.153, -81.925],
  ]),
  P('matanzas', 'Matanzas', [
    ['Calimete', 22.534, -80.909],
    ['Cárdenas', 23.039, -81.204],
    ['Ciénaga de Zapata', 22.282, -81.192],
    ['Colón', 22.72, -80.906],
    ['Jagüey Grande', 22.528, -81.129],
    ['Jovellanos', 22.808, -81.195],
    ['Limonar', 22.956, -81.41],
    ['Los Arabos', 22.731, -80.718],
    ['Martí', 22.95, -80.917],
    ['Matanzas', 23.041, -81.578],
    ['Pedro Betancourt', 22.729, -81.29],
    ['Perico', 22.771, -81.017],
    ['Unión de Reyes', 22.796, -81.536],
  ]),
  P('cienfuegos', 'Cienfuegos', [
    ['Abreus', 22.278, -80.567],
    ['Aguada de Pasajeros', 22.384, -80.849],
    ['Cienfuegos', 22.146, -80.446],
    ['Cruces', 22.342, -80.267],
    ['Cumanayagua', 22.15, -80.2],
    ['Lajas', 22.415, -80.29],
    ['Palmira', 22.24, -80.392],
    ['Rodas', 22.341, -80.556],
  ]),
  P('villa-clara', 'Villa Clara', [
    ['Caibarién', 22.516, -79.472],
    ['Camajuaní', 22.465, -79.723],
    ['Cifuentes', 22.645, -80.046],
    ['Corralillo', 22.983, -80.583],
    ['Encrucijada', 22.617, -79.867],
    ['Manicaragua', 22.15, -79.981],
    ['Placetas', 22.312, -79.654],
    ['Quemado de Güines', 22.794, -80.25],
    ['Ranchuelo', 22.374, -80.15],
    ['Remedios', 22.494, -79.546],
    ['Sagua la Grande', 22.808, -80.077],
    ['Santa Clara', 22.406, -79.965],
    ['Santo Domingo', 22.584, -80.236],
  ]),
  P('sancti-spiritus', 'Sancti Spíritus', [
    ['Cabaiguán', 22.079, -79.497],
    ['Fomento', 22.104, -79.718],
    ['Jatibonico', 21.946, -79.167],
    ['La Sierpe', 21.762, -79.24],
    ['Sancti Spíritus', 21.928, -79.443],
    ['Taguasco', 22.006, -79.263],
    ['Trinidad', 21.802, -79.984],
    ['Yaguajay', 22.326, -79.237],
  ]),
  P('ciego-de-avila', 'Ciego de Ávila', [
    ['Baraguá', 21.66, -78.5],
    ['Bolivia', 22.073, -78.348],
    ['Chambas', 22.194, -78.913],
    ['Ciego de Ávila', 21.84, -78.763],
    ['Ciro Redondo', 22.02, -78.7],
    ['Florencia', 22.149, -78.967],
    ['Majagua', 21.924, -78.991],
    ['Morón', 22.11, -78.627],
    ['Primero de Enero', 21.947, -78.419],
    ['Venezuela', 21.735, -78.796],
  ]),
  P('camaguey', 'Camagüey', [
    ['Camagüey', 21.379, -77.917],
    ['Carlos Manuel de Céspedes', 21.574, -78.278],
    ['Esmeralda', 21.852, -78.116],
    ['Florida', 21.528, -78.226],
    ['Guáimaro', 21.058, -77.347],
    ['Jimaguayú', 21.243, -77.833],
    ['Minas', 21.489, -77.604],
    ['Najasa', 21.07, -77.77],
    ['Nuevitas', 21.545, -77.264],
    ['Santa Cruz del Sur', 20.716, -77.995],
    ['Sibanicú', 21.237, -77.524],
    ['Sierra de Cubitas', 21.68, -77.78],
    ['Vertientes', 21.259, -78.149],
  ]),
  P('las-tunas', 'Las Tunas', [
    ['Amancio', 20.818, -77.581],
    ['Colombia', 20.988, -77.428],
    ['Jesús Menéndez', 21.164, -76.479],
    ['Jobabo', 20.907, -77.283],
    ['Las Tunas', 20.962, -76.951],
    ['Majibacoa', 20.92, -76.88],
    ['Manatí', 21.312, -76.937],
    ['Puerto Padre', 21.195, -76.602],
  ]),
  P('holguin', 'Holguín', [
    ['Antilla', 20.833, -75.737],
    ['Báguanos', 20.753, -76.032],
    ['Banes', 20.963, -75.712],
    ['Cacocum', 20.743, -76.333],
    ['Calixto García', 20.87, -76.45],
    ['Cueto', 20.648, -75.932],
    ['Frank País', 20.661, -75.272],
    ['Gibara', 21.11, -76.132],
    ['Holguín', 20.887, -76.263],
    ['Mayarí', 20.661, -75.679],
    ['Moa', 20.657, -74.94],
    ['Rafael Freyre', 21.04, -75.99],
    ['Sagua de Tánamo', 20.583, -75.243],
    ['Urbano Noris', 20.6, -76.135],
  ]),
  P('granma', 'Granma', [
    ['Bartolomé Masó', 20.168, -76.943],
    ['Bayamo', 20.379, -76.643],
    ['Buey Arriba', 20.18, -76.75],
    ['Campechuela', 20.233, -77.279],
    ['Cauto Cristo', 20.56, -76.476],
    ['Guisa', 20.257, -76.538],
    ['Jiguaní', 20.369, -76.425],
    ['Manzanillo', 20.343, -77.117],
    ['Media Luna', 20.143, -77.435],
    ['Niquero', 20.043, -77.58],
    ['Pilón', 19.906, -77.32],
    ['Río Cauto', 20.56, -76.916],
    ['Yara', 20.276, -76.95],
  ]),
  P('santiago-de-cuba', 'Santiago de Cuba', [
    ['Contramaestre', 20.3, -76.25],
    ['Guamá', 19.976, -76.408],
    ['Mella', 20.37, -75.91],
    ['Palma Soriano', 20.212, -75.995],
    ['San Luis', 20.188, -75.849],
    ['Santiago de Cuba', 20.02, -75.821],
    ['Segundo Frente', 20.414, -75.528],
    ['Songo-La Maya', 20.17, -75.645],
    ['Tercer Frente', 20.17, -76.25],
  ]),
  P('guantanamo', 'Guantánamo', [
    ['Baracoa', 20.347, -74.496],
    ['Caimanera', 19.993, -75.159],
    ['El Salvador', 20.208, -75.32],
    ['Guantánamo', 20.144, -75.209],
    ['Imías', 20.073, -74.63],
    ['Maisí', 20.245, -74.15],
    ['Manuel Tames', 20.18, -75.05],
    ['Niceto Pérez', 20.13, -75.33],
    ['San Antonio del Sur', 20.057, -74.807],
    ['Yateras', 20.3, -75.02],
  ]),
  P('isla-de-la-juventud', 'Isla de la Juventud', [['Isla de la Juventud', 21.884, -82.801]]),
]

/* Para encuadrar el mapa cuando aún no hay municipio, o para la vista de
   toda la isla. */
export const CENTRO_CUBA = { lat: 21.6, lng: -79.4, zoom: 6 }

/* Más o menos el rectángulo de Cuba con sus cayos: un pin fuera de aquí es
   un error (o alguien jugando), no un local. */
export const LIMITES_CUBA = { latMin: 19.6, latMax: 23.4, lngMin: -85.1, lngMax: -73.9 }

export function getProvincia(id) {
  return PROVINCIAS.find((p) => p.id === id) ?? null
}

export function getMunicipio(provinciaId, municipioId) {
  return getProvincia(provinciaId)?.municipios.find((m) => m.id === municipioId) ?? null
}

/* El centro de una provincia: la media de sus municipios. */
export function centroProvincia(provinciaId) {
  const lista = getProvincia(provinciaId)?.municipios ?? []
  if (!lista.length) return null
  const lat = lista.reduce((t, m) => t + m.lat, 0) / lista.length
  const lng = lista.reduce((t, m) => t + m.lng, 0) / lista.length
  return { lat, lng }
}

export function dentroDeCuba(lat, lng) {
  const { latMin, latMax, lngMin, lngMax } = LIMITES_CUBA
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax
}
