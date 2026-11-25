/* Paso 6 — Nivel 1: qué bloques salen, en qué orden, de qué modo y cuántos
   huecos tiene cada uno (sección 10). Son DATOS: cambiar la forma de la
   pantalla es editar estos arrays.

   Hay dos tipos de bloque y no se mezclan:
   - LISTAS: tarjetas grandes en vertical. Entre ellas nunca se repite un
     local. Después de las de aquí, index.js añade trozos de 5 con TODOS los
     locales que quedan ("Más lugares"), así Descubre acaba enseñándolos todos.
   - FILAS (rail): carruseles horizontales. Entre ellas tampoco se repiten, y
     no repiten nada de las listas de aquí arriba ni del héroe: lo que ya viste
     arriba no te vuelve a salir al lado. Sí pueden salir luego en "Más lugares".

   index.js alterna lista, fila, lista, fila… (intercalar) para que nunca salgan
   dos filas seguidas.

   Campos:
   modos:    de qué modos salen sus candidatos (null = de todos).
   pesos:    qué pesos de CONFIG_MODO usa (si no, el de su único modo).
   riesgo:   ε de exploración (0 = solo lo seguro). Arriba poco, abajo más.
   afinidad: si recibe la cuota del subtipo preferido del usuario.
   filtro:   condición especial de la fila ('valorado', 'lugar', 'nuevo', 'tarde', 'barato',
             'cerca'); ver FILTROS en index.js.
   taly:     una frase corta de Taly bajo el título (opcional). */

export const HEROE = { id: 'heroe', huecos: 5, pesos: 'general', riesgo: 0 }

/* "Puedes ir ahora mismo": lo abierto, ordenado por calidad. No repite el
   héroe ni la primera lista, que salen justo encima y debajo. */
export const ABIERTOS = { id: 'abiertos', huecos: 10, pesos: 'general', riesgo: 0 }

/* El primer bloque cambia con la hora: lo primero que ves no es igual por la
   mañana que de noche. `preferir` son las categorías que ganan un empujón
   pequeño en ese bloque (desglose.franja en el modo depuración). */
const FRANJAS = [
  { desde: 5, hasta: 11, titulo: 'Para desayunar', nota: 'Café y algo rico', preferir: ['Cafetería', 'Comida saludable'] },
  { desde: 11, hasta: 16, titulo: 'Para almorzar', nota: 'Comida de verdad', preferir: ['Restaurante', 'Comida saludable'] },
  { desde: 16, hasta: 20, titulo: 'Para la tarde', nota: 'Un café, una terraza', preferir: ['Cafetería', 'Terraza'] },
  { desde: 20, hasta: 29, titulo: 'Para esta noche', nota: 'Cenar o tomar algo', preferir: ['Bar', 'Terraza', 'Restaurante'] },
]
export const EMPUJON_FRANJA = 0.06

export function franjaDe(ahora) {
  const h = ahora.getHours()
  return FRANJAS.find((f) => (h >= f.desde && h < f.hasta) || (h + 24 >= f.desde && h + 24 < f.hasta)) ?? FRANJAS[0]
}

const LISTAS = [
  { id: 'antojo-1', formato: 'lista', modos: ['antojo'], huecos: 5, riesgo: 0.05, afinidad: true, franja: true },
  {
    id: 'antojo-2',
    titulo: 'Más para comer',
    nota: 'Otras cocinas, otros sitios',
    formato: 'lista',
    modos: ['antojo'],
    huecos: 5,
    riesgo: 0.15,
    afinidad: true,
  },
  {
    id: 'descubrir',
    titulo: 'Para descubrir',
    nota: 'Sitios que quizá no conoces',
    formato: 'lista',
    modos: null,
    pesos: 'general',
    huecos: 6,
    riesgo: 0.5,
  },
]

/* El orden de las filas es el orden en que van saliendo entre las listas. */
const FILAS = [
  { id: 'mejores', titulo: 'Mejor valorados', nota: 'Los que más gustan', formato: 'rail', modos: null, pesos: 'general', huecos: 8, riesgo: 0.05, filtro: 'valorado' },
  {
    id: 'cerca',
    titulo: 'Cerca de ti',
    nota: 'Del más cerca al más lejos',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0,
    filtro: 'cerca',
  },
  { id: 'guardaste', formato: 'rail', huecos: 8, riesgo: 0.1 },
  {
    id: 'nuevos',
    titulo: 'Nuevos en Citaly',
    nota: 'Acaban de llegar',
    taly: 'Acaban de llegar. Dales una oportunidad.',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0,
    filtro: 'nuevo',
  },
  { id: 'capricho', titulo: 'Date un capricho', nota: 'Para un día distinto', formato: 'rail', modos: ['capricho'], huecos: 8, riesgo: 0.3 },
  {
    id: 'mesa',
    titulo: 'Para sentarte a la mesa',
    nota: 'Con reserva de sitio',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0.1,
    filtro: 'lugar',
  },
  { id: 'cuidado', titulo: 'Para cuidarte', nota: 'Pelo, barba y uñas', formato: 'rail', modos: ['confianza'], huecos: 6, riesgo: 0.2 },
  {
    id: 'tarde',
    titulo: 'Abiertos hasta tarde',
    nota: 'Hasta las 10:00 PM o más',
    taly: 'Para cuando se te hace tarde.',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0.1,
    filtro: 'tarde',
  },
  { id: 'rutina', titulo: 'Para entrenar', nota: 'Gimnasios', formato: 'rail', modos: ['rutina'], huecos: 6, riesgo: 0.1 },
  {
    id: 'baratos',
    titulo: 'Por menos de 500 CUP',
    nota: 'Buenos y sin gastar mucho',
    taly: 'Buenos sitios sin gastar mucho.',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0.2,
    filtro: 'barato',
  },
]

/**
 * La plantilla ajustada a este usuario y a esta hora:
 *  - el primer bloque se titula según la franja del día;
 *  - con una categoría de confianza resuelta (ya tiene barbero), sus huecos
 *    de "cuidarte" pasan a comida y caprichos;
 *  - "Porque guardaste X" solo si tiene algún favorito.
 * Devuelve { listas, filas }.
 */
export function plantillaPara(perfil, { favorito, ahora = new Date() } = {}) {
  const resueltas = perfil?.categoriasResueltas?.size ?? 0
  const franja = franjaDe(ahora)

  const listas = LISTAS.map((bloque) => {
    let b = bloque
    if (b.franja) b = { ...b, titulo: franja.titulo, nota: franja.nota, preferir: franja.preferir }
    if (resueltas && b.id === 'antojo-2') b = { ...b, huecos: b.huecos + 2 }
    return b
  })

  const filas = FILAS.flatMap((bloque) => {
    if (bloque.id === 'guardaste') {
      if (!favorito) return []
      return [
        {
          ...bloque,
          titulo: `Porque guardaste ${favorito.localName}`,
          nota: 'Del mismo estilo',
          soloCategoria: favorito.categoria,
          excluir: favorito.id,
        },
      ]
    }
    if (resueltas && bloque.id === 'capricho') return [{ ...bloque, huecos: bloque.huecos + 2 }]
    return [bloque]
  })

  return { listas, filas }
}
