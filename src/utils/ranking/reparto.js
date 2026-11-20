/* Paso 6 — Nivel 1: qué bloques salen, en qué orden, de qué modo y cuántos
   huecos tiene cada uno (sección 10). Son DATOS: cambiar la forma de la
   pantalla es editar este array.

   formato: 'lista' (tarjetas grandes en vertical) o 'rail' (fila horizontal).
   modos:   de qué modos salen sus candidatos (null = de todos).
   pesos:   qué pesos de CONFIG_MODO usa (si no, el de su único modo).
   riesgo:  ε de exploración (0 = solo lo seguro). Arriba poco, abajo más.
   afinidad: si recibe la cuota del subtipo preferido del usuario.
   nuevos:  huecos protegidos para locales recién dados de alta. */

export const HEROE = { id: 'heroe', huecos: 5, pesos: 'general', riesgo: 0 }

/* "Puedes ir ahora mismo": una VISTA de lo abierto, no un bloque del reparto.
   No gasta locales (pueden repetirse más abajo) y se ordena por calidad. */
export const ABIERTOS = { id: 'abiertos', huecos: 10, pesos: 'general', riesgo: 0 }

const PLANTILLA = [
  {
    id: 'antojo-1',
    titulo: 'Para comer y tomar algo',
    nota: 'Lo que mejor sale hoy',
    formato: 'lista',
    modos: ['antojo'],
    huecos: 6,
    riesgo: 0.05,
    afinidad: true,
  },
  {
    id: 'mejores',
    titulo: 'Mejor valorados',
    nota: 'Los que más gustan',
    formato: 'rail',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0.05,
  },
  { id: 'guardaste', formato: 'rail', huecos: 8, riesgo: 0.1 },
  {
    id: 'antojo-2',
    titulo: 'Más para comer',
    nota: 'Otras cocinas, otros sitios',
    formato: 'lista',
    modos: ['antojo'],
    huecos: 6,
    riesgo: 0.15,
    afinidad: true,
  },
  {
    id: 'capricho',
    titulo: 'Date un capricho',
    nota: 'Para un día distinto',
    formato: 'rail',
    modos: ['capricho'],
    huecos: 6,
    riesgo: 0.3,
  },
  {
    id: 'cuidado',
    titulo: 'Para cuidarte',
    nota: 'Pelo, barba y uñas',
    formato: 'rail',
    modos: ['confianza'],
    huecos: 6,
    riesgo: 0.2,
  },
  {
    id: 'rutina',
    titulo: 'Para entrenar',
    nota: 'Gimnasios',
    formato: 'rail',
    modos: ['rutina'],
    huecos: 6,
    riesgo: 0.1,
  },
  {
    id: 'descubrir',
    titulo: 'Para descubrir',
    nota: 'Sitios que quizá no conoces',
    formato: 'lista',
    modos: null,
    pesos: 'general',
    huecos: 8,
    riesgo: 0.5,
    nuevos: 2,
  },
]

/**
 * La plantilla ajustada a este usuario:
 *  - con una categoría de confianza resuelta (ya tiene barbero), sus huecos
 *    de "cuidarte" pasan a antojo y capricho;
 *  - "Porque guardaste X" solo si tiene algún favorito.
 */
export function plantillaPara(perfil, { favorito } = {}) {
  const resueltas = perfil?.categoriasResueltas?.size ?? 0
  return PLANTILLA.flatMap((bloque) => {
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
    if (resueltas && (bloque.id === 'antojo-2' || bloque.id === 'capricho')) {
      return [{ ...bloque, huecos: bloque.huecos + 2 }]
    }
    return [bloque]
  })
}
