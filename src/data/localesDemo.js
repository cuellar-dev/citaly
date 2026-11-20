import locales from './locales.json'
import { puntoEn } from './zonas.js'

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
  'Peluquería': [
    { id: 'corte-dama', nombre: 'Corte de Dama', precio: 900 },
    { id: 'tinte', nombre: 'Tinte Completo', precio: 2200 },
    { id: 'peinado', nombre: 'Peinado para Evento', precio: 1300 },
    { id: 'tratamiento-capilar', nombre: 'Tratamiento Capilar', precio: 1600 },
  ],
  'Bar': [
    { id: 'mojito', nombre: 'Mojito de la Casa', precio: 550 },
    { id: 'cerveza-nacional', nombre: 'Cerveza Nacional', precio: 400 },
    { id: 'coctel-especial', nombre: 'Cóctel Especial', precio: 750 },
    { id: 'tapas', nombre: 'Tapas Variadas', precio: 900 },
  ],
  'Tatuajes': [
    { id: 'tatuaje-pequeno', nombre: 'Tatuaje Pequeño', precio: 1800 },
    { id: 'tatuaje-mediano', nombre: 'Tatuaje Mediano', precio: 3500 },
    { id: 'retoque', nombre: 'Retoque', precio: 800 },
    { id: 'diseno-personalizado', nombre: 'Diseño Personalizado', precio: 1200 },
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
  'Peluquería': ['snow', 'wifi', 'transfer'],
  'Bar': ['cigarrete', 'transfer', 'parking'],
  'Tatuajes': ['snow', 'transfer', 'no-cigarrete'],
}

/* Opiniones de relleno para los locales nuevos, según lo que son. Se reparten
   por id para que dos locales de la misma categoría no digan lo mismo. */
const NOMBRES_OPINION = [
  'Yoandri Pérez', 'Mailén Cruz', 'Alejandro Rivas', 'Dayami Hernández', 'Raidel Gómez',
  'Yaima Suárez', 'Osmany Díaz', 'Lisandra Morales', 'Ernesto Valdés', 'Yanet Ramos',
]
const OPINIONES_POR_CATEGORIA = {
  'Cafetería': ['El café sale en su punto y el sitio es tranquilo.', 'Buen desayuno y atención rápida.', 'Ideal para conversar un rato sin ruido.', 'Los dulces de la casa son lo mejor.'],
  'Restaurante': ['Comida abundante y bien sazonada.', 'Nos atendieron muy bien, volveremos.', 'El ambiente es familiar y los precios, justos.', 'Reservamos para seis y todo salió perfecto.'],
  'Bar': ['Buena música y tragos bien servidos.', 'Ambiente alegre, los fines de semana se llena.', 'El mojito es de los mejores del pueblo.', 'Atención amable y sitio limpio.'],
  'Barbería': ['Corte limpio y puntual.', 'Me arreglaron la barba justo como la quería.', 'Local cómodo y trato muy cordial.', 'Salí como nuevo, sin esperar demasiado.'],
  'Peluquería': ['Me dejaron el tinte exacto al que pedí.', 'Muy cuidadosas con el cabello.', 'Atención personalizada y buen ambiente.', 'Puntuales y con buen gusto para peinar.'],
  'Uñas': ['Diseños preciosos y duran semanas.', 'Muy higiénico y detallista.', 'Salí encantada con el acabado.', 'Atienden con calma y sin prisas.'],
  'Gimnasio': ['Buenas máquinas y entrenadores atentos.', 'Se entrena a gusto, nunca está saturado.', 'Las clases grupales son muy motivadoras.', 'Limpio y con buen horario.'],
  'Comida saludable': ['Ingredientes frescos y porciones generosas.', 'Opciones ligeras que de verdad saben bien.', 'Los batidos naturales son una delicia.', 'Buena opción para comer sin culpa.'],
  'Terraza': ['Un sitio fresco para pasar la tarde.', 'Buenas vistas y mejor ambiente.', 'Los aperitivos acompañan de maravilla.', 'Se está muy bien al atardecer.'],
  'Spa': ['Salí completamente relajada.', 'Personal profesional y muy amable.', 'Un lugar para desconectar de verdad.', 'El masaje valió cada peso.'],
  'Arte y talleres': ['Aprendí mucho en una sola tarde.', 'La profesora explica con paciencia.', 'Espacio creativo y acogedor.', 'Salimos con una pieza hecha por nosotros.'],
  'Ocio': ['Buen plan para ir con amigos.', 'Instalaciones cuidadas y personal atento.', 'Pasamos un rato muy divertido.', 'Buen precio para lo que ofrece.'],
  'Tatuajes': ['Trazo limpio y muy profesional.', 'Me explicaron todo el cuidado posterior.', 'Higiene impecable y buen diseño.', 'Quedó mejor de lo que imaginaba.'],
}
const CALIFICACIONES = [5, 4, 5, 4]

/* Fotos de los locales nuevos: las de los que ya hay de su misma categoría en
   locales.json, para que la portada case con lo que es. */
const fotosPorCategoria = locales.reduce((acc, l) => {
  ;(acc[l.categoria] ??= []).push({ url: l.url, urls: l.urls ?? [] })
  return acc
}, {})

function azarId(id) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

function opinionesDe(id, categoria, cantidad) {
  const pool = OPINIONES_POR_CATEGORIA[categoria] ?? []
  const h = azarId(id)
  return Array.from({ length: Math.min(cantidad, pool.length) }, (_, i) => ({
    usuario: NOMBRES_OPINION[(h + i * 3) % NOMBRES_OPINION.length],
    texto: pool[(h + i) % pool.length],
    puntuacion: CALIFICACIONES[(h + i) % CALIFICACIONES.length],
  }))
}

/* Cuántas opiniones lleva cada local nuevo: casi todos unas pocas, unos
   cuantos una sola y otros ninguna, para que Descubre vea de todo. */
const OPINIONES_NUEVOS = {
  'cafe-yayabo': 4, 'pizzeria-la-parroquial': 4, 'barberia-el-puente': 3, 'yayabo-ink': 2,
  'bar-el-guayabero': 3, 'dulce-colon': 3, 'peluqueria-bella-vista': 3, 'nails-lab': 1,
  'fit-yayabo': 2, 'la-finca-del-12': 4, 'cuts-kilo-12': 0, 'spa-palma-real': 3,
  'terraza-los-olivos': 2, 'verde-menta': 3, 'peluqueria-dona-rosa': 1, 'cafe-del-tabaco': 3,
  'bar-la-guayabita': 2, 'tinta-del-valle': 3, 'arte-en-barro': 2, 'barberia-don-pepe': 4,
  'el-jigue': 4, 'casa-del-cafe': 3, 'terraza-la-canchanchara': 4, 'ancon-wellness': 3,
  'barro-trinitario': 2, 'bar-la-vega': 0, 'fuerza-jatibonico': 1, 'sabor-del-escambray': 3,
  'sala-yaguajay': 0, 'esmalte-taguasco': 2,
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
  /* Locales nuevos, repartidos por Sancti Spíritus y sus municipios. */
  ['cafe-yayabo', 'Café Yayabo', 'Cafetería', '120', 'Centro, Sancti Spiritus', '4.6', true],
  ['pizzeria-la-parroquial', 'Pizzería La Parroquial', 'Restaurante', '200', 'Centro, Sancti Spiritus', '4.4', true],
  ['barberia-el-puente', 'Barbería El Puente', 'Barbería', '350', 'Centro, Sancti Spiritus', '4.7', false],
  ['yayabo-ink', 'Yayabo Ink', 'Tatuajes', '420', 'Centro, Sancti Spiritus', '4.8', false],
  ['bar-el-guayabero', 'Bar El Guayabero', 'Bar', '280', 'Centro, Sancti Spiritus', '4.3', true],
  ['dulce-colon', 'Dulce Colón', 'Cafetería', '180', 'Colon, Sancti Spiritus', '4.5', true],
  ['peluqueria-bella-vista', 'Peluquería Bella Vista', 'Peluquería', '320', 'Colon, Sancti Spiritus', '4.6', false],
  ['nails-lab', 'Nails Lab', 'Uñas', '260', 'Colon, Sancti Spiritus', '5.0', false],
  ['fit-yayabo', 'Fit Yayabo', 'Gimnasio', '600', 'Colon, Sancti Spiritus', '4.2', false],
  ['la-finca-del-12', 'La Finca del 12', 'Restaurante', '1300', 'Kilo 12, Sancti Spiritus', '4.7', true],
  ['cuts-kilo-12', 'Cuts Kilo 12', 'Barbería', '1200', 'Kilo 12, Sancti Spiritus', '0', false],
  ['spa-palma-real', 'Spa Palma Real', 'Spa', '1500', 'Kilo 12, Sancti Spiritus', '4.8', false],
  ['terraza-los-olivos', 'Terraza Los Olivos', 'Terraza', '900', 'Olivos, Sancti Spiritus', '4.5', true],
  ['verde-menta', 'Verde Menta', 'Comida saludable', '850', 'Olivos, Sancti Spiritus', '4.6', false],
  ['peluqueria-dona-rosa', 'Peluquería Doña Rosa', 'Peluquería', '780', 'Olivos, Sancti Spiritus', '5.0', false],
  ['cafe-del-tabaco', 'Café del Tabaco', 'Cafetería', '150', 'Parque central, Cabaiguan', '4.4', true],
  ['bar-la-guayabita', 'Bar La Guayabita', 'Bar', '400', 'Centro, Cabaiguan', '4.2', true],
  ['tinta-del-valle', 'Tinta del Valle', 'Tatuajes', '350', 'Centro, Cabaiguan', '4.7', false],
  ['arte-en-barro', 'Arte en Barro', 'Arte y talleres', '500', 'Centro, Cabaiguan', '4.6', false],
  ['barberia-don-pepe', 'Barbería Don Pepe', 'Barbería', '230', 'Parque central, Cabaiguan', '4.9', false],
  ['el-jigue', 'El Jigüe', 'Restaurante', '90', 'Plaza Mayor, Trinidad', '4.8', true],
  ['casa-del-cafe', 'Casa del Café', 'Cafetería', '140', 'Plaza Mayor, Trinidad', '4.5', true],
  ['terraza-la-canchanchara', 'Terraza La Canchánchara', 'Terraza', '300', 'Centro, Trinidad', '4.9', true],
  ['ancon-wellness', 'Ancón Wellness', 'Spa', '5200', 'Playa Ancon, Trinidad', '4.7', false],
  ['barro-trinitario', 'Barro Trinitario', 'Arte y talleres', '450', 'Centro, Trinidad', '4.5', false],
  ['bar-la-vega', 'Bar La Vega', 'Bar', '300', 'Centro, Jatibonico', '0', true],
  ['fuerza-jatibonico', 'Fuerza Jatibonico', 'Gimnasio', '520', 'Centro, Jatibonico', '5.0', false],
  ['sabor-del-escambray', 'Sabor del Escambray', 'Restaurante', '270', 'Centro, Fomento', '4.4', true],
  ['sala-yaguajay', 'Sala de Juegos Yaguajay', 'Ocio', '380', 'Centro, Yaguajay', '0', false],
  ['esmalte-taguasco', 'Esmalte Taguasco', 'Uñas', '340', 'Centro, Taguasco', '4.3', false],
].map(([id, localName, categoria, metros, direccion, points, lugar], index) => {
  const nuevo = id in OPINIONES_NUEVOS
  const delMismoTipo = fotosPorCategoria[categoria] ?? []
  const propias = delMismoTipo[azarId(id) % (delMismoTipo.length || 1)]
  const portada = nuevo && propias ? propias.url : fotos[index % fotos.length]
  const galeria =
    nuevo && propias?.urls.length
      ? propias.urls.slice(0, 3)
      : [fotos[index % fotos.length], fotos[(index + 1) % fotos.length], fotos[(index + 2) % fotos.length]]
  const opiniones = nuevo ? opinionesDe(id, categoria, OPINIONES_NUEVOS[id]) : comentariosPorLocal[id] || []
  return {
  ...base,
  id,
  localName,
  categoria,
  metros,
  ...puntoEn(direccion, id),
  direccion,
  points,
  lugar,
  url: portada,
  urls: galeria,
  servicios: serviciosPorCategoria[categoria] || [],
  iconos: (comodidadesPorCategoria[categoria] ?? ['wifi', 'transfer']).map((id) => ({ id })),
  comentarios: opiniones.map((c, i) => ({
    id: `${id}-${i + 1}`,
    nombre: c.usuario,
    fecha: `2026-02-${String(10 + i).padStart(2, '0')}`,
    calificacion: c.puntuacion,
    comentario: c.texto,
    imagenPerfil: fotos[(index + i) % fotos.length],
  })),
  opiniones: opiniones.length,
  }
})
