/* Merchant Copy solo trae el juego de caracteres US: las tildes y la ñ caerían a otra fuente
   y romperían la impresión. Como en un recibo térmico real, el texto se imprime sin diacríticos. */
export function tinta(valor) {
  if (typeof valor !== 'string') return valor
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
