const fotos = [
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop',
]

const serviciosPorCategoria = {
  'Cafetería': [
    { id: 'cafe-espresso', nombre: 'Café Espresso', precio: 350 },
    { id: 'cafe-cappuccino', nombre: 'Cappuccino', precio: 450 },
    { id: 'cafe-latte', nombre: 'Café Latte', precio: 480 },
    { id: 'cafe-americano', nombre: 'Café Americano', precio: 320 },
    { id: 'desayuno-cafe', nombre: 'Desayuno Completo', precio: 950 },
  ],
  'Restaurante': [
    { id: 'almuerzo-menu', nombre: 'Menú del Día', precio: 1200 },
    { id: 'cena-especial', nombre: 'Cena Especial', precio: 1800 },
    { id: 'bebidas', nombre: 'Bebidas Variadas', precio: 500 },
    { id: 'postres', nombre: 'Postres de la Casa', precio: 650 },
  ],
  'Barbería': [
    { id: 'corte-basico', nombre: 'Corte Básico', precio: 800 },
    { id: 'corte-premium', nombre: 'Corte Premium', precio: 1200 },
    { id: 'afeitado', nombre: 'Afeitado Tradicional', precio: 600 },
    { id: 'barba-arreglo', nombre: 'Arreglo de Barba', precio: 500 },
    { id: 'paquete', nombre: 'Paquete Completo', precio: 1500 },
  ],
  'Gimnasio': [
    { id: 'clase-crossfit', nombre: 'Clase CrossFit', precio: 800 },
    { id: 'clase-yoga', nombre: 'Clase de Yoga', precio: 700 },
    { id: 'entrenamiento-personal', nombre: 'Sesión Personal', precio: 1500 },
    { id: 'clase-spinning', nombre: 'Clase de Spinning', precio: 750 },
  ],
  'Uñas': [
    { id: 'manicura-basica', nombre: 'Manicura Básica', precio: 600 },
    { id: 'pedicura-basica', nombre: 'Pedicura Básica', precio: 700 },
    { id: 'unas-acrilo', nombre: 'Uñas Acrílicas', precio: 1200 },
    { id: 'diseno-unas', nombre: 'Diseño Especial', precio: 1500 },
  ],
  'Comida saludable': [
    { id: 'bowl-verde', nombre: 'Bowl Verde', precio: 950 },
    { id: 'poke-salmon', nombre: 'Poke Salmón', precio: 1100 },
    { id: 'smoothie', nombre: 'Smoothie Natural', precio: 450 },
    { id: 'ensalada-premium', nombre: 'Ensalada Premium', precio: 1000 },
  ],
  'Ocio': [
    { id: 'entrada-cine', nombre: 'Entrada Cine 2D', precio: 1200 },
    { id: 'entrada-3d', nombre: 'Entrada Cine 3D', precio: 1400 },
    { id: 'combo-pop', nombre: 'Combo Palomitas', precio: 800 },
  ],
  'Terraza': [
    { id: 'copa-vino', nombre: 'Copa de Vino', precio: 600 },
    { id: 'cerveza-premium', nombre: 'Cerveza Premium', precio: 500 },
    { id: 'tabla-quesos', nombre: 'Tabla de Quesos', precio: 1300 },
    { id: 'aperitivo', nombre: 'Tabla Aperitivo', precio: 1500 },
  ],
  'Spa': [
    { id: 'masaje-relajante', nombre: 'Masaje Relajante', precio: 1800 },
    { id: 'facial-completo', nombre: 'Facial Completo', precio: 1500 },
    { id: 'paquete-spa', nombre: 'Paquete Spa Completo', precio: 3500 },
    { id: 'reflexoterapia', nombre: 'Reflexoterapia', precio: 1200 },
  ],
  'Arte y talleres': [
    { id: 'taller-pintura', nombre: 'Taller de Pintura', precio: 1500 },
    { id: 'taller-ceramica', nombre: 'Taller de Cerámica', precio: 1800 },
    { id: 'taller-dibujo', nombre: 'Taller de Dibujo', precio: 1200 },
  ],
}

/* Mismo formato que locales.json: [{ id }] con ids de COMODIDADES (utils/fichaLocal.js). */
const comodidadesPorCategoria = {
  'Cafetería': ['wifi', 'transfer', 'no-cigarrete'],
  'Restaurante': ['parking', 'snow', 'transfer'],
  'Barbería': ['snow', 'wifi', 'transfer'],
  'Gimnasio': ['parking', 'snow', 'no-cigarrete'],
  'Uñas': ['snow', 'wifi', 'transfer'],
  'Comida saludable': ['wifi', 'transfer', 'no-cigarrete'],
  'Ocio': ['parking', 'snow', 'no-cigarrete'],
  'Terraza': ['cigarrete', 'wifi', 'transfer'],
  'Spa': ['snow', 'parking', 'no-cigarrete'],
  'Arte y talleres': ['wifi', 'snow', 'transfer'],
}

const comentariosPorLocal = {
  'brisa-cafe': [
    { usuario: 'María Rodríguez', texto: 'Excelente café y ambiente acogedor', puntuacion: 5 },
    { usuario: 'Carlos López', texto: 'Servicio rápido, muy recomendado', puntuacion: 5 },
    { usuario: 'Ana García', texto: 'Buena calidad, precios justos', puntuacion: 4 },
  ],
  'la-esquina-verde': [
    { usuario: 'Jorge Martínez', texto: 'Comida deliciosa y fresca', puntuacion: 5 },
    { usuario: 'Sofía Pérez', texto: 'Muy buen servicio, volvería', puntuacion: 5 },
    { usuario: 'David Sánchez', texto: 'Ambiente familiar muy agradable', puntuacion: 4 },
  ],
  'studio-norte': [
    { usuario: 'Luis Fernández', texto: 'Barbero profesional y atento', puntuacion: 5 },
    { usuario: 'Roberto Silva', texto: 'Excelente corte de cabello', puntuacion: 5 },
    { usuario: 'Miguel Torres', texto: 'Muy limpio y ordenado', puntuacion: 4 },
  ],
  'zen-movimiento': [
    { usuario: 'Carmen Díaz', texto: 'Instructores muy preparados', puntuacion: 5 },
    { usuario: 'Patricia Gómez', texto: 'Excelentes instalaciones', puntuacion: 5 },
    { usuario: 'Valentina Castro', texto: 'Ambiente motivador', puntuacion: 4 },
  ],
  'luna-manicura': [
    { usuario: 'Elena Ruiz', texto: 'Trabajo impecable en las uñas', puntuacion: 5 },
    { usuario: 'Isabela Moreno', texto: 'Muy atenta con los detalles', puntuacion: 5 },
    { usuario: 'Rosa Fernández', texto: 'Recomendado 100%', puntuacion: 5 },
  ],
  'bambu-poke': [
    { usuario: 'Lucas Herrera', texto: 'Comida saludable y sabrosa', puntuacion: 5 },
    { usuario: 'Andrés Vega', texto: 'Ingredientes frescos de calidad', puntuacion: 5 },
    { usuario: 'Felipe Romero', texto: 'Muy buena relación calidad-precio', puntuacion: 4 },
  ],
  'la-plaza-cine': [
    { usuario: 'Sandra López', texto: 'Salas limpias y cómodas', puntuacion: 4 },
    { usuario: 'Raúl González', texto: 'Buena experiencia cinematográfica', puntuacion: 4 },
    { usuario: 'Marta Jiménez', texto: 'Servicio amable del personal', puntuacion: 4 },
  ],
  'patio-azul': [
    { usuario: 'Vicente Ortega', texto: 'Terraza con muy buen ambiente', puntuacion: 5 },
    { usuario: 'Gloria Sáenz', texto: 'Bebidas de excelente calidad', puntuacion: 5 },
    { usuario: 'Ernesto Ruiz', texto: 'Lugar perfecto para relajarse', puntuacion: 5 },
  ],
  'casa-mimo': [
    { usuario: 'Lucía Marín', texto: 'Masajes muy relajantes', puntuacion: 5 },
    { usuario: 'Gabriela López', texto: 'Personal muy profesional', puntuacion: 5 },
    { usuario: 'Silvana Torres', texto: 'Ambiente zen y pacífico', puntuacion: 5 },
  ],
  'taller-23': [
    { usuario: 'Óscar Navarro', texto: 'Talleres muy interesantes', puntuacion: 4 },
    { usuario: 'Teresa Blanco', texto: 'Instructores con mucha experiencia', puntuacion: 5 },
    { usuario: 'Beatriz Campos', texto: 'Espacios creativos inspiradores', puntuacion: 4 },
  ],
}

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
  iconos: [{ id: 'wifi' }, { id: 'transfer' }],
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
  urls: [fotos[index % fotos.length], fotos[(index + 1) % fotos.length], fotos[(index + 2) % fotos.length]],
  servicios: serviciosPorCategoria[categoria] || [],
  iconos: (comodidadesPorCategoria[categoria] ?? ['wifi', 'transfer']).map((id) => ({ id })),
  comentarios: (comentariosPorLocal[id] || []).map((c, i) => ({
    id: `${id}-${i + 1}`,
    nombre: c.usuario,
    fecha: `2026-02-${String(10 + i).padStart(2, '0')}`,
    calificacion: c.puntuacion,
    comentario: c.texto,
    imagenPerfil: fotos[(index + i) % fotos.length],
  })),
  opiniones: comentariosPorLocal[id]?.length || 0,
}))
