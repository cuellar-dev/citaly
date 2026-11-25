/* Centra un elemento dentro de su tira horizontal SIN mover la ventana.
   `scrollIntoView` también desplaza la página en vertical para enseñar el
   elemento, y eso hacía que Mi Negocio abriera a media altura, en la tira de
   días, cuando la tira se monta después del «subir arriba» del Layout. */
export function centrarEnTira(tira, elemento, suave = false) {
  if (!tira || !elemento) return
  const t = tira.getBoundingClientRect()
  const e = elemento.getBoundingClientRect()
  const izquierda = tira.scrollLeft + (e.left - t.left) - (tira.clientWidth - e.width) / 2
  tira.scrollTo({ left: Math.max(0, izquierda), behavior: suave ? 'smooth' : 'auto' })
}
