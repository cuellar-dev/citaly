export const MESAS_MAPA = [
  {
    id: 'm-1',
    codigo: 'MESA-1',
    capacidad: 2,
    precio: 0,
    consumoMinimo : 2000,
    estado: 'disponible',
    tipo: 'circulo',
    ubicacion: 'Junto a la entrada',
    posicion: { x: 86, y: 46 },
  },
  {
    id: 'm-2',
    codigo: 'MESA-2',
    capacidad: 2,
    precio: 0,
    consumoMinimo : 2000,
    estado: 'disponible',
    tipo: 'circulo',
    ubicacion: 'Zona central',
    posicion: { x: 135, y: 46 },
  },
  // Índice 2 → círculo (201,46) en el SVG = etiqueta M-6
  {
    id: 'm-6',
    codigo: 'MESA-6',
    capacidad: 4,
    precio: 0,
    consumoMinimo : 2000,
    estado: 'ocupado',
    tipo: 'circulo',
    ubicacion: 'En la esquina',
    posicion: { x: 201, y: 46 },
  },
  // Índice 3 → rect centro (140,85) = etiqueta M-7
  {
    id: 'm-7',
    codigo: 'MESA-7',
    precio: 0,
    consumoMinimo : 2000,
    capacidad: 6,
    estado: 'disponible',
    tipo: 'rectangulo',
    ubicacion: 'Barra lateral',
    posicion: { x: 130, y: 100 },
  },
  // Índice 4 → rect (89,139) = etiqueta M-3
  {
    id: 'm-3',
    codigo: 'MESA-3',
    precio: 0,
    consumoMinimo : 2000,
    capacidad: 2,
    estado: 'ocupado',
    tipo: 'rectangulo',
    ubicacion: 'Vista a la ventana',
    posicion: { x: 119, y: 154 },
  },
  // Índice 5 → rect (171,139) = etiqueta M-4
  {
    id: 'm-4',
    codigo: 'MESA-4',
    precio: 0,
    consumoMinimo : 2000,
    capacidad: 4,
    estado: 'disponible',
    tipo: 'rectangulo',
    ubicacion: 'Salón principal',
    posicion: { x: 110, y: 154 },
  },
  // Índice 6 → rect rotado izquierda = etiqueta M-5
  {
    id: 'm-5',
    codigo: 'MESA-5',
    precio: 0,
    consumoMinimo : 2000,
    capacidad: 4,
    estado: 'disponible',
    tipo: 'rectangulo',
    ubicacion: 'Frente al escenario',
    posicion: { x: 22, y: 60 },
  },
]

export function getMesaById(id) {
  return MESAS_MAPA.find((mesa) => mesa.id === id) ?? null
}
