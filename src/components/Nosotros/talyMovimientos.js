import gsap from 'gsap'

/* Gestos de Taly a tinta. Reciben el <svg> de TalyTinta y devuelven líneas
   de tiempo, para que cada capítulo las encadene o las pause a su gusto. */

/* Puntos de giro en coordenadas del dibujo, para svgOrigin. */
export const ORIGEN = {
  hombro: '140 214',
  hombroTrasero: '166 210',
  caderaIzq: '178 326',
  caderaDer: '226 327',
  cadera: '200 326',
  ojo: '224 116',
  centro: '200 210',
}

const parte = (svg, nombre) => svg.querySelector(`[data-parte="${nombre}"]`)

/* Aleteo: el ala de delante sube desde el hombro y la de detrás se pliega a
   la vez, que es lo que hace que parezcan dos alas y no una bandera. */
export function aletear(svg, { veces = -1, medio = 0.11, desde = -62 } = {}) {
  const ala = parte(svg, 'ala')
  const tras = parte(svg, 'ala-trasera')
  const tl = gsap.timeline({ repeat: veces, paused: true })
  /* immediateRender: false para que crear el aleteo no levante el ala de un
     Taly que todavía está posado o dormido. */
  tl.fromTo(
    ala,
    { rotation: desde, svgOrigin: ORIGEN.hombro },
    { rotation: desde + 58, svgOrigin: ORIGEN.hombro, duration: medio, ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false },
    0,
  )
  if (tras) {
    tl.fromTo(
      tras,
      { scaleY: 1, svgOrigin: ORIGEN.hombroTrasero },
      { scaleY: 0.45, svgOrigin: ORIGEN.hombroTrasero, duration: medio, ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false },
      0,
    )
  }
  return tl
}

/* Pasa de posado a volando (o al revés): recoge las patas, saca la otra
   ala y se lleva la sombra. */
export function modoVuelo(svg, volar, duracion = 0.22) {
  const tl = gsap.timeline()
  const ease = 'power2.out'
  tl.to(parte(svg, 'pata-izq'), { rotation: volar ? 38 : 0, svgOrigin: ORIGEN.caderaIzq, duration: duracion, ease }, 0)
    .to(parte(svg, 'pata-der'), { rotation: volar ? 32 : 0, svgOrigin: ORIGEN.caderaDer, duration: duracion, ease }, 0)
    .to(parte(svg, 'ala-trasera'), { autoAlpha: volar ? 1 : 0, duration: duracion * 0.6 }, 0)
    .to(parte(svg, 'sombra'), { autoAlpha: volar ? 0 : 1, duration: duracion }, 0)
  if (!volar) tl.to(parte(svg, 'ala'), { rotation: 0, svgOrigin: ORIGEN.hombro, duration: duracion, ease }, 0)
  return tl
}

/* Parpadeo de vez en cuando, con un doble parpadeo de regalo. */
export function parpadear(svg) {
  const ojo = parte(svg, 'pupila')
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.6 })
  tl.to(ojo, { scaleY: 0.1, svgOrigin: ORIGEN.ojo, duration: 0.07, ease: 'power1.in', yoyo: true, repeat: 1 })
    .to(ojo, { scaleY: 0.1, svgOrigin: ORIGEN.ojo, duration: 0.07, ease: 'power1.in', yoyo: true, repeat: 1 }, '+=3.1')
    .to(ojo, { scaleY: 0.1, svgOrigin: ORIGEN.ojo, duration: 0.07, ease: 'power1.in', yoyo: true, repeat: 1 }, '+=0.12')
  return tl
}

/* Picotazo desde la cadera: rápido al bajar, más lento al volver. */
export function picotear(svg) {
  const torso = parte(svg, 'torso')
  return gsap
    .timeline()
    .to(torso, { rotation: 24, svgOrigin: ORIGEN.cadera, duration: 0.16, ease: 'power2.in' })
    .to(torso, { rotation: 20, svgOrigin: ORIGEN.cadera, duration: 0.05, ease: 'none' })
    .to(torso, { rotation: 0, svgOrigin: ORIGEN.cadera, duration: 0.32, ease: 'power2.out' })
}

export { parte }
