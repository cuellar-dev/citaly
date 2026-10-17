/* Bloques comunes de las hojas del panel del dueño. */

export function Seccion({ titulo, extra, children }) {
  return (
    <section className="modal-negocio-seccion" data-entra>
      {(titulo || extra) && (
        <header className="modal-negocio-seccion-cabecera">
          {titulo && <h3 className="modal-negocio-seccion-titulo">{titulo}</h3>}
          {extra && <span className="modal-negocio-seccion-extra">{extra}</span>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Dato({ etiqueta, valor, tono }) {
  return (
    <div className={`modal-negocio-dato${tono ? ` modal-negocio-dato--${tono}` : ''}`}>
      <span className="modal-negocio-dato-etiqueta">{etiqueta}</span>
      <span className="modal-negocio-dato-valor">{valor}</span>
    </div>
  )
}

export function FilaDato({ etiqueta, valor }) {
  return (
    <div className="modal-negocio-fila">
      <span className="modal-negocio-fila-etiqueta">{etiqueta}</span>
      <span className="modal-negocio-fila-valor">{valor}</span>
    </div>
  )
}
