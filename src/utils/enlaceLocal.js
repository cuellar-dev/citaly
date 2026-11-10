/* El enlace público de un local.

   Ficticio mientras no haya dominio de verdad. Vive aquí solo (y no escrito a
   mano en cada pantalla) para que el día que se compre el dominio se cambie
   DOMINIO y siga funcionando el QR, lo que se comparte y lo que se imprime. */

export const DOMINIO = 'citaly.cu'

/** Para enseñar: sin esquema, que es como la gente escribe una dirección. */
export function enlaceDeLocal(id) {
  return `${DOMINIO}/${id}`
}

/** Para el QR y para compartir: con esquema, o el lector no abre nada. */
export function urlDeLocal(id) {
  return `https://${DOMINIO}/${id}`
}
