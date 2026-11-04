const fotos = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop',
]

const base = {
  urls: [],
  horario: '9AM - 8PM',
  horarioApertura: '09:00',
  horarioCierre: '20:00',
  intervaloMinutos: 60,
  dias: ['m', 'x', 'j', 'v', 's'],
  telefono: '+53 41 000000',
  whatsapp: '+53 5 8000000',
  descripcion: 'Un lugar preparado para recibirte con atención cercana y una experiencia sencilla.',
  iconos: [],
  opiniones: 0,
  servicios: [],
  comentarios: [],
  lugar: false,
}

export const localesDemo = [
  ['brisa-cafe', 'Brisa Café', 'Cafetería', '250', 'Centro, Sancti Spiritus', '4.7', true],
  ['la-esquina-verde', 'La Esquina Verde', 'Restaurante', '700', 'Centro, Sancti Spiritus', '4.5', false],
  ['studio-norte', 'Studio Norte', 'Barbería', '550', 'Kilo 12, Sancti Spiritus', '4.8', true],
  ['zen-movimiento', 'Zen Movimiento', 'Gimnasio', '900', 'Parque central, Cabaiguan', '4.2', false],
  ['luna-manicura', 'Luna Manicura', 'Uñas', '300', 'Parque central, Cabaiguan', '4.6', false],
  ['bambu-poke', 'Bambú Poke', 'Comida saludable', '1100', 'Colon, Sancti Spiritus', '4.4', true],
  ['la-plaza-cine', 'La Plaza Cine', 'Ocio', '1400', 'Centro, Sancti Spiritus', '4.1', false],
  ['patio-azul', 'Patio Azul', 'Terraza', '650', 'Colon, Sancti Spiritus', '4.6', true],
  ['casa-mimo', 'Casa Mimo', 'Spa', '480', 'Kilo 12, Sancti Spiritus', '4.9', false],
  ['taller-23', 'Taller 23', 'Arte y talleres', '1000', 'Centro, Cabaiguan', '4.3', false],
].map(([id, localName, categoria, metros, direccion, points, lugar], index) => ({
  ...base,
  id,
  localName,
  categoria,
  metros,
  direccion,
  points,
  lugar,
  url: fotos[index % fotos.length],
}))
