import { useMemo } from 'react'
import { getAllLocales } from '../../services/locales.js'
import { cercanosA, textoDistancia } from '../../utils/distancia.js'
import RailDescubre from '../Descubre/RailDescubre.jsx'
import TarjetaLocalCompacta from '../Descubre/TarjetaLocalCompacta.jsx'
import './localesCercanos.css'

/* Final de la ficha: los locales que quedan cerca de este, del más cercano al
   más lejos, con la distancia en línea recta (haversine) sobre cada tarjeta.
   Es la misma fila deslizable de Descubre. Si el local no tiene coordenadas o
   no hay nada a menos de 30 km, la sección no sale. */

function LocalesCercanos({ local, id = 'local-cercanos', style }) {
  const cercanos = useMemo(() => cercanosA(local, getAllLocales()), [local])
  if (!cercanos.length) return null

  return (
    <section id={id} className="detalle-local-cercanos detalle-local-entra" style={style}>
      <RailDescubre
        titulo="Cerca de aquí"
        nota={cercanos.length === 1 ? '1 sitio' : `${cercanos.length} sitios`}
      >
        {cercanos.map(({ local: otro, metros }) => (
          <TarjetaLocalCompacta key={otro.id} local={otro} distancia={textoDistancia(metros)} />
        ))}
      </RailDescubre>
    </section>
  )
}

export default LocalesCercanos
