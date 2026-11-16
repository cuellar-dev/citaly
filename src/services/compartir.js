/* Compartir Citaly. Lo usan el cartel de tablas del header y el pie de
   página.

   Con menú nativo de compartir (móvil), solo si el usuario comparte de
   verdad se le agradece: si lo cierra sin compartir (AbortError) no pasa
   nada. Donde no hay menú (escritorio), se copia el enlace y se avisa. */
const DATOS_COMPARTIR = {
  title: 'Citaly',
  text: 'Reserva en tus sitios favoritos sin llamar ni esperar. Mira Citaly:',
}

export function compartirCitaly(alTerminar) {
  const url = `${window.location.origin}${import.meta.env.BASE_URL}`
  if (navigator.share) {
    /* Se llama sin esperar nada antes: el navegador solo abre el menú si
       viene directo del toque. */
    navigator
      .share({ ...DATOS_COMPARTIR, url })
      .then(() => alTerminar({ copiado: false, vez: Date.now() }))
      .catch(() => {})
    return
  }
  navigator.clipboard
    ?.writeText(`${DATOS_COMPARTIR.text} ${url}`)
    .then(() => alTerminar({ copiado: true, vez: Date.now() }))
    .catch(() => {})
}
