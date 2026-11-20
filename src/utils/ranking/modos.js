/* Los 4 modos de consumo (docs/descubre-ranking.md, punto 4).

   ⚠️ Son INTERNOS: el usuario nunca ve "antojo" ni "confianza". Solo sirven
   para que compitan entre sí los locales que de verdad se sustituyen (un
   restaurante contra otro restaurante, nunca contra una barbería).

   Toda la personalidad del sistema está aquí, como DATOS: para cambiar cómo
   se comporta un modo se cambia un número, no se busca un if. */

export const MODO_DE_CATEGORIA = {
  Restaurante: 'antojo',
  Cafetería: 'antojo',
  Bar: 'antojo',
  Terraza: 'antojo',
  'Comida saludable': 'antojo',
  Peluquería: 'confianza',
  Barbería: 'confianza',
  Uñas: 'confianza',
  Spa: 'capricho',
  Tatuajes: 'capricho',
  'Arte y talleres': 'capricho',
  Ocio: 'capricho',
  Gimnasio: 'rutina',
}

/* Pesos de la puntuación (suman 1). "contexto" (si está abierto ahora) pesa
   POCO a propósito: que esté abierto ayuda a desempatar, pero no sube a un
   local por encima de otro mejor. Para "lo que puedo visitar ya" está la fila
   "Puedes ir ahora mismo". La afinidad también pesa poco: el gusto del
   usuario entra sobre todo por la CUOTA (10-30 % de huecos, perfil.js), no
   empujando cada score. El modo "general" es el de los bloques que mezclan
   todo (héroe, mejor valorados): ahí manda la calidad. */
export const CONFIG_MODO = {
  antojo: { quiereVariedad: true, pesos: { calidad: 0.55, contexto: 0.08, afinidad: 0.12, novedad: 0.25 } },
  confianza: { quiereVariedad: false, pesos: { calidad: 0.75, contexto: 0.07, afinidad: 0.1, novedad: 0.08 } },
  capricho: { quiereVariedad: true, pesos: { calidad: 0.6, contexto: 0.05, afinidad: 0.15, novedad: 0.2 } },
  rutina: { quiereVariedad: false, pesos: { calidad: 0.7, contexto: 0.05, afinidad: 0.15, novedad: 0.1 } },
  general: { quiereVariedad: true, pesos: { calidad: 0.82, contexto: 0.05, afinidad: 0.03, novedad: 0.1 } },
}

/* Categorías que no van en un feed de descubrimiento (se llega a ellas
   buscando). Dentista y veterinaria ya no existen en Citaly; queda el hueco
   por si entra otra categoría de ese tipo. */
export const FUERA_DEL_FEED = new Set()

export const modoDe = (local) => MODO_DE_CATEGORIA[local?.categoria] ?? 'capricho'
