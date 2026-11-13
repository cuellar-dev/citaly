import { flushSync } from 'react-dom'

/* Tema de la app: 'oscuro' (el de siempre, por defecto) o 'claro'.

   Se guarda en localStorage y se refleja en <html data-tema="...">, que es
   de donde cuelga la paleta clara (index.css). index.html ya lo pone antes de
   pintar, para que al recargar en claro no haya un fogonazo oscuro. */

const CLAVE = 'citaly_tema'
export const TEMA_EVENTO = 'citaly:tema'

/* Lo que dura el fundido sin View Transitions (debe cuadrar con index.css). */
const FUNDIDO_MS = 550

export function leerTema() {
  try {
    return localStorage.getItem(CLAVE) === 'claro' ? 'claro' : 'oscuro'
  } catch {
    return 'oscuro'
  }
}

export function ponerTema(tema) {
  const valor = tema === 'claro' ? 'claro' : 'oscuro'
  try {
    localStorage.setItem(CLAVE, valor)
  } catch {
    /* Sin almacenamiento (modo privado): vale para esta visita. */
  }
  document.documentElement.dataset.tema = valor
  window.dispatchEvent(new Event(TEMA_EVENTO))
}

/* El cambio, lo más suave posible.

   - Con View Transitions: el navegador fotografía la app en el tema viejo y
     la funde sobre la nueva (0.7 s, en index.css). Todo cambia a la vez,
     fotos, SVG y canvas incluidos. flushSync obliga a React a repintar DENTRO
     del cambio; si no, la foto "nueva" saldría con componentes a medias.
   - Sin ellas (Firefox): una clase da transición de color a todo mientras
     dura el cambio y se quita al acabar.
   - Con movimiento reducido: cambio directo, sin fundido. */
export function alternarTema() {
  const siguiente = leerTema() === 'claro' ? 'oscuro' : 'claro'
  const aplicar = () => flushSync(() => ponerTema(siguiente))

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    aplicar()
    return
  }

  if (document.startViewTransition) {
    document.startViewTransition(aplicar)
    return
  }

  const html = document.documentElement
  html.classList.add('tema-cambiando')
  aplicar()
  window.setTimeout(() => html.classList.remove('tema-cambiando'), FUNDIDO_MS)
}
