import { useState } from 'react'
import { MODO_DE_CATEGORIA } from '../../utils/ranking/modos.js'
import './depuracionRanking.css'

/* Solo en desarrollo, con ?debug=ranking. Responde a "¿por qué sale este
   local aquí?": perfil del usuario y, bloque a bloque, el score de cada local
   con su desglose. Los modos (antojo, confianza…) solo se ven AQUÍ. */

const f2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : '—')
const pct = (n) => `${Math.round(n * 100)}%`

function Fila({ c, i }) {
  const d = c.desglose
  const marcas = [c.cuota && 'cuota', c.exploracion && 'explora', c.nuevo && 'nuevo'].filter(Boolean)
  return (
    <li>
      <span className="dbg-pos">{i + 1}</span>
      <span className="dbg-nombre">
        {c.local.localName}
        <small>
          {c.local.categoria} · {MODO_DE_CATEGORIA[c.local.categoria]}
          {marcas.length ? ` · ${marcas.join(' · ')}` : ''}
        </small>
      </span>
      <span className="dbg-num" title="calidad · contexto · afinidad · novedad · jitter">
        <b>{f2(c.score)}</b>
        <small>
          cal {f2(d.calidad)} · ctx {f2(d.contexto)} · af {f2(d.afinidad)} · nov {f2(d.novedad)} · jit{' '}
          {d.jitter >= 0 ? '+' : ''}
          {f2(d.jitter)}
        </small>
      </span>
    </li>
  )
}

function DepuracionRanking({ resultado, perfil }) {
  const [abierto, setAbierto] = useState(false)
  const { bloques, explicacion, heroLista, stats } = resultado
  const heroe = heroLista.map((local) => ({ local, ...explicacion.get(local.id) }))
  const afinidad = Object.entries(perfil.afinidad).sort((a, b) => b[1] - a[1])

  return (
    <div className={`dbg-ranking${abierto ? ' dbg-ranking--abierto' : ''}`}>
      <button type="button" className="dbg-ranking-boton" onClick={() => setAbierto((v) => !v)}>
        {abierto ? 'Cerrar' : 'Ranking'}
      </button>
      {abierto ? (
        <div className="dbg-ranking-panel">
          <section>
            <h3>Perfil</h3>
            <p>
              {perfil.esNuevo ? 'Usuario nuevo (sin señales)' : `${perfil.senales} puntos de interés`} · nota media{' '}
              {f2(stats.m)} · C = {f2(stats.C)}
            </p>
            {afinidad.length ? (
              <p>Afinidad: {afinidad.map(([c, v]) => `${c} ${pct(v)}`).join(' · ')}</p>
            ) : null}
            {perfil.subtipoPreferido ? (
              <p>
                Preferido: {perfil.subtipoPreferido.categoria} → cuota {pct(perfil.subtipoPreferido.cuota)}
              </p>
            ) : null}
            {perfil.categoriasResueltas.size ? (
              <p>Resueltas (fuera del feed): {[...perfil.categoriasResueltas.keys()].join(', ')}</p>
            ) : null}
          </section>

          <section>
            <h3>heroe</h3>
            <ol>
              {heroe.map((c, i) => (
                <Fila key={c.local.id} c={c} i={i} />
              ))}
            </ol>
          </section>

          {bloques.map((b) => (
            <section key={b.clave}>
              <h3>
                {b.clave} <small>{b.titulo}</small>
              </h3>
              <ol>
                {b.puntuados.map((c, i) => (
                  <Fila key={c.local.id} c={c} i={i} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default DepuracionRanking
