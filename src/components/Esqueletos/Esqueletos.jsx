import '../Foto/foto.css'
import './esqueletos.css'

/* Maquetas grises que ocupan el sitio de lo que está llegando.

   Ocupan el MISMO espacio que lo real (misma caja de foto, mismas líneas)
   para que al llegar el contenido no salte nada (CLS). Son decorativas para
   la vista; al lector de pantalla se le dice una sola vez "Cargando…". */

/** Una tarjeta de lugar como las de Descubre (TarjetaLocal). */
export function TarjetaEsqueleto() {
  return (
    <div className="tarjeta-esqueleto" aria-hidden="true">
      <div className="tarjeta-esqueleto-foto esqueleto" />
      <div className="tarjeta-esqueleto-cuerpo">
        <span className="esqueleto tarjeta-esqueleto-linea" style={{ width: '46%' }} />
        <span className="esqueleto tarjeta-esqueleto-linea" style={{ width: '88%' }} />
        <span className="esqueleto tarjeta-esqueleto-linea" style={{ width: '64%' }} />
      </div>
    </div>
  )
}

/** Varias tarjetas seguidas, con aviso para lectores de pantalla. */
export function ListaEsqueleto({ cantidad = 2, texto = 'Cargando más lugares…' }) {
  return (
    <div className="lista-esqueleto" role="status">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: cantidad }, (_, i) => (
        <TarjetaEsqueleto key={i} />
      ))}
    </div>
  )
}

/** Lo que se ve mientras baja el trozo de una página (ver src/paginas.js). */
export function PaginaEsqueleto() {
  return (
    <div className="pagina-esqueleto" role="status">
      <span className="sr-only">Cargando…</span>
      <span className="esqueleto pagina-esqueleto-titulo" aria-hidden="true" />
      <span className="esqueleto pagina-esqueleto-bloque" aria-hidden="true" />
      <span className="esqueleto pagina-esqueleto-linea" style={{ width: '72%' }} aria-hidden="true" />
      <span className="esqueleto pagina-esqueleto-linea" style={{ width: '54%' }} aria-hidden="true" />
      <span className="esqueleto pagina-esqueleto-bloque pagina-esqueleto-bloque--bajo" aria-hidden="true" />
    </div>
  )
}
