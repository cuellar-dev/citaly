/* Lo que dice el pie de página. Los enlaces viven aquí y no en el JSX para
   poder cambiarlos sin tocar el diseño.

   ⚠️ PENDIENTE: los datos de contacto y las redes son DE PRUEBA. Cuando
   Citaly tenga cuentas reales, se cambian aquí y en ningún otro sitio:
   - WhatsApp: falta el número (formato wa.me/53XXXXXXXX).
   - Correo: citaly.example es un dominio reservado para ejemplos; no
     llega a nadie.
   - Instagram y Facebook: apuntan a la portada de cada red.
   - El correo de aquí es el que sale en /terminos y /privacidad
     (components/Legal/textoLegal.jsx). */

export const CONTACTO = {
  whatsapp: 'https://wa.me/',
  correo: 'mailto:contacto@citaly.example',
  ciudad: 'Sancti Spíritus, Cuba',
}

export const REDES = [
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/' },
  { id: 'facebook', nombre: 'Facebook', url: 'https://www.facebook.com/' },
]

/* Explora: las categorías con más sitios. Cada una abre la búsqueda con
   ese filtro ya puesto; `categoria` es el valor exacto de los datos. */
export const EXPLORA = [
  { texto: 'Restaurantes', categoria: 'Restaurante' },
  { texto: 'Cafeterías', categoria: 'Cafetería' },
  { texto: 'Bares', categoria: 'Bar' },
  { texto: 'Peluquerías', categoria: 'Peluquería' },
  { texto: 'Barberías', categoria: 'Barbería' },
  { texto: 'Spas', categoria: 'Spa' },
]

export const CITALY = [
  { texto: 'Sobre Citaly', ruta: '/nosotros' },
  { texto: 'Preguntas frecuentes', ruta: '/ayuda' },
  { texto: 'Tus favoritos', ruta: '/favoritos' },
  { texto: 'Compartir Citaly', accion: 'compartir' },
]

export const LEGALES = [
  { texto: 'Privacidad', ruta: '/privacidad' },
  { texto: 'Términos', ruta: '/terminos' },
]
