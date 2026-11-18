import { Component } from 'react'
import { esErrorDeDescarga, recargarUnaVez } from '../../utils/recarga.js'
import './errorPagina.css'

/* Red de seguridad para las páginas.

   Desde que cada página se descarga al entrar, puede pasar que:
   - se cae la conexión justo al cambiar de pestaña, o
   - hubo un deploy nuevo y el archivo viejo que la pestaña abierta busca ya
     no existe en el servidor.
   En vez de dejar la pantalla en blanco, se ofrece reintentar (recargar trae
   la versión nueva). Cualquier otro error de render cae aquí también. */

class ErrorPagina extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    if (esErrorDeDescarga(error) && navigator.onLine !== false) recargarUnaVez()
  }

  componentDidUpdate(prev) {
    /* Al cambiar de ruta se vuelve a intentar pintar. */
    if (this.state.error && prev.clave !== this.props.clave) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    const sinRed = navigator.onLine === false || esErrorDeDescarga(this.state.error)
    return (
      <div className="error-pagina" role="alert">
        <h2>{sinRed ? 'No pudimos abrir esta parte' : 'Algo se rompió aquí'}</h2>
        <p>
          {sinRed
            ? 'Parece que la conexión falló a mitad de camino. Cuando vuelva, prueba otra vez.'
            : 'Ya lo estamos mirando. Mientras, puedes recargar la página.'}
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }
}

export default ErrorPagina
