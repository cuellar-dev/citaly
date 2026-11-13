/* Estrella con rayitas para la tabla de Favoritos. Mismo trazo que los iconos
   de lucide (24×24, línea redonda) para que conviva con los demás del cartel.
   Las rayitas van en su propio grupo: el CSS del cartel las hace parpadear
   una vez cuando la tabla termina de caer. */
function IconoFavoritos({ size = 17, strokeWidth = 2.2, className = '', ...resto }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...resto}
    >
      <path d="M12 8.1 13.7 11.5 17.4 12 14.7 14.6 15.4 18.3 12 16.5 8.6 18.3 9.3 14.6 6.6 12 10.3 11.5Z" />
      <g className="icono-favoritos-rayas">
        <path d="M12 2.6v2.2" />
        <path d="m18.4 5.2-1.5 1.5" />
        <path d="m5.6 5.2 1.5 1.5" />
        <path d="M21.4 11.4h-1.9" />
        <path d="M2.6 11.4h1.9" />
      </g>
    </svg>
  )
}

export default IconoFavoritos
