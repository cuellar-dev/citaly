/* Título, descripción y si Google puede indexar cada ruta.

   Lo usan dos sitios, por eso es JS puro (sin React ni Vite):
   - la app (components/MetaRuta/MetaRuta.jsx): al cambiar de ruta;
   - el deploy (scripts/rutas-estaticas.mjs): lo escribe en el HTML de cada
     ruta fija, para que WhatsApp, Facebook y Google lo vean sin ejecutar JS.

   Las fichas de local (/local/:id) ponen sus datos encima con useMetaPagina. */

export const SITIO = 'Citaly'

export const META_INICIAL = {
  titulo: 'Citaly · Reserva en los lugares de tu barrio',
  descripcion:
    'Descubre barberías, restaurantes, veterinarias y más cerca de ti, mira cómo son por dentro y reserva tu turno o tu mesa en un par de toques.',
  indexar: true,
}

/* Páginas privadas o de paso: útiles para quien entra, sin valor en Google. */
const PRIVADA = { indexar: false }

/* El orden importa: gana la primera que encaja. */
const RUTAS = [
  { patron: /^\/$/, meta: META_INICIAL },
  {
    patron: /^\/buscar\/seccion\/[^/]+$/,
    meta: { titulo: 'Lugares en Citaly', descripcion: 'Todos los lugares de esta sección en Citaly.' },
  },
  {
    patron: /^\/buscar$/,
    meta: {
      titulo: 'Buscar lugares · Citaly',
      descripcion: 'Busca barberías, restaurantes, gimnasios y más por nombre, categoría o zona, y mira cuáles están abiertos ahora.',
    },
  },
  { patron: /^\/local\/[^/]+\/(reservar|reservar-cita|unirse)$/, meta: { titulo: 'Reservar · Citaly', ...PRIVADA } },
  {
    patron: /^\/local\/[^/]+$/,
    meta: { titulo: 'Lugar en Citaly', descripcion: 'Mira cómo es por dentro, sus precios y opiniones, y reserva en Citaly.' },
  },
  {
    patron: /^\/nosotros$/,
    meta: {
      titulo: 'Sobre nosotros · Citaly',
      descripcion: 'Quiénes hacemos Citaly y por qué: reservar en los lugares de tu barrio, sin llamadas ni colas.',
    },
  },
  {
    patron: /^\/ayuda$/,
    meta: {
      titulo: 'Ayuda · Citaly',
      descripcion: 'Respuestas sobre reservas, citas, cuentas y negocios en Citaly, y cómo escribirnos.',
    },
  },
  {
    patron: /^\/terminos$/,
    meta: { titulo: 'Términos de uso · Citaly', descripcion: 'Las condiciones de uso de Citaly para clientes y negocios.' },
  },
  {
    patron: /^\/privacidad$/,
    meta: { titulo: 'Privacidad · Citaly', descripcion: 'Qué datos guarda Citaly, para qué y cómo puedes borrarlos.' },
  },
  { patron: /^\/citas$/, meta: { titulo: 'Mis citas · Citaly', ...PRIVADA } },
  { patron: /^\/negocio\/compartir$/, meta: { titulo: 'Compartir mi negocio · Citaly', ...PRIVADA } },
  { patron: /^\/negocio\/nuevo$/, meta: { titulo: 'Poner mi local en Citaly', ...PRIVADA } },
  { patron: /^\/negocio\/completar\/[^/]+$/, meta: { titulo: 'Completar mi local · Citaly', ...PRIVADA } },
  { patron: /^\/negocio\/plano\/[^/]+$/, meta: { titulo: 'Plano de la sala · Citaly', ...PRIVADA } },
  {
    patron: /^\/negocio$/,
    meta: {
      titulo: 'Mi negocio · Citaly',
      descripcion: 'Pon tu local en Citaly y recibe reservas: citas, mesas o socios, todo desde el móvil.',
      indexar: false,
    },
  },
  { patron: /^\/perfil$/, meta: { titulo: 'Mi perfil · Citaly', ...PRIVADA } },
  { patron: /^\/notificaciones$/, meta: { titulo: 'Avisos · Citaly', ...PRIVADA } },
  { patron: /^\/favoritos$/, meta: { titulo: 'Favoritos · Citaly', ...PRIVADA } },
  { patron: /^\/opinion$/, meta: { titulo: 'Tu opinión · Citaly', ...PRIVADA } },
  { patron: /^\/auth$/, meta: { titulo: 'Entrar · Citaly', ...PRIVADA } },
]

const NO_ENCONTRADA = { titulo: 'Página no encontrada · Citaly', ...PRIVADA }

/** Meta de una ruta de la app (sin la base /citaly). Siempre devuelve los tres campos. */
export function metaDeRuta(pathname) {
  const limpia = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const ruta = RUTAS.find((r) => r.patron.test(limpia))
  return { ...META_INICIAL, ...(ruta ? ruta.meta : NO_ENCONTRADA) }
}

/** Rutas públicas fijas que van al sitemap (las fichas se añaden aparte). */
export const RUTAS_SITEMAP = ['/', '/buscar', '/nosotros', '/ayuda', '/terminos', '/privacidad']
