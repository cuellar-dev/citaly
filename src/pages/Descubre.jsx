import TarjetaLocal from '../components/TarjetaLocal/TarjetaLocal.jsx'
import { getAllLocales } from '../services/locales.js'
import './Descubre.css'

const locales = getAllLocales()

function Descubre() {
  return (
    <section className="descubre">
      <div className="tarjeta-container">
        {locales.map((local) => (
          <TarjetaLocal key={local.id} {...local} />
        ))}
      </div>
    </section>
  )
}

export default Descubre
