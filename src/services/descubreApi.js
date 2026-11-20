import { pedir } from './api.js'
import { getAnonimoId } from './identidad.js'

/* Descubre contra el backend (fase 1: el backend manda el resumen de todos
   los candidatos y el orden se calcula aquí, en utils/ranking/).

   Endpoints (backend-citaly-main/Routes/DescubreRouter.js, montado en
   /api/descubre):
     GET  /local/resumen?provincia=   resumen ligero de los locales del feed
     POST /eventos                    impresiones (vista / toque)
     POST /uso-filtros                filtro por categoría (necesita sesión)

   Los cambios hechos en el backend para esto están en
   docs/backend-descubre-cambios.md. */

/**
 * Del resumen del backend a la forma de local que usa el front (la misma de
 * locales.json), para que tarjetas, ficha y ranking no tengan que saber de
 * dónde vienen los datos. Lo que el resumen no trae (comentarios, servicios)
 * llega ya calculado: nota y opiniones, frase destacada y precio "desde".
 */
export function adaptarResumen(r) {
  return {
    id: r.id,
    localName: r.nombre,
    categoria: r.categoria,
    categoriaId: r.categoriaId,
    modo: r.modo,
    direccion: r.direccion ?? '',
    url: r.foto ?? '',
    urls: r.foto ? [r.foto] : [],
    /* Nota y opiniones ya contadas por el backend (rating_cache). */
    notaResumen: Number(r.nota) || 0,
    opinionesResumen: Number(r.opiniones) || 0,
    repetidores: Number(r.repetidores) || 0,
    fechaAlta: r.fechaAlta ?? null,
    ultimaVezTopGlobal: r.ultimaVezTop ?? null,
    vistas24h: Number(r.vistas24h) || 0,
    iconos: (r.comodidades ?? []).map((id) => ({ id })),
    precioDesde: r.precioDesde ?? null,
    frase: r.frase ?? null,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    provincia: r.provincia ?? null,
    metros: r.metros ?? null,
    lugar: Boolean(r.tieneLugar),
    horarioApertura: r.horarioApertura ?? null,
    horarioCierre: r.horarioCierre ?? null,
    dias: r.dias ?? [],
    aceptaReservas: r.aceptaReservas !== false,
    deApi: true,
  }
}

export async function cargarResumen({ provincia = null } = {}) {
  const ruta = provincia ? `/api/descubre/local/resumen?provincia=${encodeURIComponent(provincia)}` : '/api/descubre/local/resumen'
  const datos = await pedir(ruta)
  return (Array.isArray(datos) ? datos : []).map(adaptarResumen)
}

/** Manda un lote de impresiones. keepalive: sale aunque se cierre la pestaña. */
export async function enviarEventos(eventos) {
  return pedir('/api/descubre/eventos', {
    metodo: 'POST',
    keepalive: true,
    cuerpo: {
      anonimoId: getAnonimoId(),
      eventos: eventos.map(({ id, localId, bloque, posicion, tipo, semilla }) => ({
        id,
        localId,
        bloque,
        posicion,
        tipo,
        semilla: semilla ?? null,
      })),
    },
  })
}

/** Filtro por categoría. Sin sesión el backend responde 401: se ignora. */
export async function enviarUsoFiltro(categoria) {
  try {
    await pedir('/api/descubre/uso-filtros', { metodo: 'POST', cuerpo: { categoria } })
  } catch {
    /* Sin sesión o sin conexión: el contador local sigue valiendo. */
  }
}
