import { useState } from 'react'
import CitaServicio from '../components/CitaServicio/CitaServicio.jsx'
import CitaLugar from '../components/CitaLugar/CitaLugar.jsx'

import './misCitas.css'

function MisCitas() {
  const [vista, setVista] = useState('proximas')

  const esProximas = vista === 'proximas'

  return (
    <section className={`citas ${esProximas ? 'citas--proximas' : 'citas--pasadas'}`}>
      <div className="switch-color-container">
        <div
          className={`switch-color-color ${esProximas ? 'switch-color-proximas' : 'switch-color-pasadas'}`}
        />
        <button
          type="button"
          className="switch-color-button"
          onClick={() => setVista('proximas')}
          aria-pressed={esProximas}
        >
          <span className="switch-color-button-text-proximas">Proximas</span>
        </button>
        <button
          type="button"
          className="switch-color-button"
          onClick={() => setVista('pasadas')}
          aria-pressed={!esProximas}
        >
          <span className="switch-color-button-text-pasadas">Pasadas</span>
        </button>
      </div>

      <CitaLugar
        lugar="Al Medio"
        estadoReserva="CONFIRMADO"
        mesaId="m-1"
        mesaCodigo="MESA-1"
        mesaUbicacion="Junto a la entrada"
        capacidad={2}
        fechaTexto="Vie-08, 8:30 PM"
        estadoTexto="Quedan 2 días"
        consumoTexto="2000 CUP mínimo"
        coste="GRATIS (consumo)"
        wasa="53512345678"
        telefono="+53 5 12345678"
        mapsHref="https://maps.google.com"
      />
      <CitaLugar
        lugar="Al Medio"
        estadoReserva="PENDIENTE"
        mesaId="m-6"
        mesaCodigo="MESA-6"
        mesaUbicacion="Zona central"
        capacidad={4}
        fechaTexto="Sáb-09, 9:00 PM"
        estadoTexto="Esperando confirmación"
        consumoTexto="2000 CUP mínimo"
        coste="GRATIS (consumo)"
        wasa="53512345678"
        telefono="+53 5 12345678"
        mapsHref="https://maps.google.com"
      />
      <CitaLugar
        lugar="Itaka"
        estadoReserva="CONFIRMADO"
        mesaId="m-3"
        mesaCodigo="MESA-3"
        mesaUbicacion="Terraza"
        capacidad={2}
        fechaTexto="Dom-10, 7:00 PM"
        estadoTexto="Quedan 5 h"
        consumoTexto="1500 CUP mínimo"
        coste="GRATIS (consumo)"
        wasa="53599887766"
        telefono="+53 5 99887766"
        mapsHref="https://maps.google.com"
      />

      <CitaServicio
        lugar="Sara"
        fecha="2026-08-02"
        hora="09:30"
        wasa="+53587654321"
        coste="750 CUP"
        telefono="+53 41 654321"
        profesional="Laura Méndez"
        servicios="Corte dama, Manicura"
        fechaTexto="Mar-02, 9:30 AM"
        estadoTexto="Quedan 45 min"
      />
      <CitaServicio
        lugar="Sara"
        fecha="2026-08-05"
        hora="15:00"
        wasa="+53587654321"
        coste="1200 CUP"
        telefono="+53 41 654321"
        profesional="Carlos Ruiz"
        servicios="Tinte completo"
        fechaTexto="Vie-05, 3:00 PM"
        estadoTexto="Quedan 3 días"
      />
      <CitaServicio
        lugar="Sara"
        fecha="2026-08-08"
        hora="11:30"
        wasa="+53587654321"
        coste="300 CUP"
        telefono="+53 41 654321"
        profesional="Laura Méndez"
        servicios="Corte caballero"
        fechaTexto="Lun-08, 11:30 AM"
        estadoTexto="Quedan 1 semana"
      />
    </section>
  )
}

export default MisCitas
