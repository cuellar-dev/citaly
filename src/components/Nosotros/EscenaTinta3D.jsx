import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './escenaTinta3D.css'

/* El fondo 3D de Sobre nosotros: un viaje por dentro del mundo de Taly.

   - Plumas cayendo (instanciadas: todo el vaivén lo hace la GPU).
   - Gotas de tinta vivas, negras con filo menta, que se deforman con ruido.
     La del héroe se estira hacia el ratón.
   - Polvo de tinta flotando.
   - Un hilo de mostaza que se va cosiendo por delante de la cámara a medida
     que bajas: la puntada de las colinas de Descubre, pero en 3D.

   La cámara avanza por el túnel con el scroll de toda la página. En el
   héroe va a plena potencia; después baja la opacidad del lienzo para que el
   texto mande. Con movimiento reducido se pinta un solo fotograma. Si la
   pestaña se va al fondo, el bucle se para. */

const LARGO = 132 // lo que recorre la cámara en z de arriba a abajo
const Z_INICIO = 10

const hex = (h) => {
  const n = parseInt(h.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const C = {
  fondo: hex('#121413'),
  tinta: hex('#0b2421'),
  menta: hex('#4fd8c4'),
  barriga: hex('#bdf4e8'),
  mostaza: hex('#ffd166'),
}
const COLORES_PLUMA = ['#4fd8c4', '#4fd8c4', '#2aa795', '#2aa795', '#bdf4e8', '#bdf4e8', '#ffd166', '#f2ebdd'].map(hex)

const RUIDO = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

/* La pluma se dibuja una vez en un canvas, en blanco: el color lo pone cada
   instancia en el shader. */
function texturaPluma() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 256
  const g = c.getContext('2d')
  g.translate(64, 0)

  const vane = new Path2D()
  vane.moveTo(0, 16)
  vane.bezierCurveTo(50, 60, 52, 172, 0, 246)
  vane.bezierCurveTo(-52, 172, -50, 60, 0, 16)
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(1, '#c9c9c9')
  g.fillStyle = grad
  g.fill(vane)

  g.save()
  g.clip(vane)
  g.strokeStyle = 'rgba(0,0,0,0.22)'
  g.lineWidth = 2
  for (let y = 36; y < 236; y += 8) {
    for (const s of [1, -1]) {
      g.beginPath()
      g.moveTo(0, y)
      g.quadraticCurveTo(22 * s, y - 4, 52 * s, y - 18)
      g.stroke()
    }
  }
  g.restore()

  /* Muescas: una pluma de verdad nunca tiene el borde entero. */
  g.globalCompositeOperation = 'destination-out'
  for (const [x, y, s] of [[36, 108, 1], [-40, 150, -1], [32, 186, 1]]) {
    g.beginPath()
    g.moveTo(x + s * 18, y - 12)
    g.lineTo(x - s * 6, y + 2)
    g.lineTo(x + s * 18, y + 8)
    g.fill()
  }
  g.globalCompositeOperation = 'source-over'

  g.strokeStyle = 'rgba(14,46,42,0.8)'
  g.lineWidth = 4
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(0, 6)
  g.lineTo(0, 252)
  g.stroke()

  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  return t
}

function crearPlumas(n, textura) {
  const base = new THREE.PlaneGeometry(0.42, 0.9, 1, 6)
  const geo = new THREE.InstancedBufferGeometry()
  geo.index = base.index
  geo.setAttribute('position', base.attributes.position)
  geo.setAttribute('uv', base.attributes.uv)

  const offset = new Float32Array(n * 3)
  const semilla = new Float32Array(n * 4)
  const color = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    /* Más densidad al principio del túnel: el héroe es el momento fuerte. */
    const t = Math.pow(Math.random(), 1.6)
    offset[i * 3] = (Math.random() - 0.5) * 30
    offset[i * 3 + 1] = (Math.random() - 0.5) * 32
    offset[i * 3 + 2] = Z_INICIO - 4 - t * (LARGO + 12)
    semilla[i * 4] = Math.random()
    semilla[i * 4 + 1] = 0.5 + Math.random() * 0.9
    semilla[i * 4 + 2] = 0.3 + Math.random() * 1.1
    semilla[i * 4 + 3] = 0.6 + Math.random() * 1.1
    const col = COLORES_PLUMA[(Math.random() * COLORES_PLUMA.length) | 0]
    color.set([col.x, col.y, col.z], i * 3)
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offset, 3))
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(semilla, 4))
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(color, 3))
  geo.instanceCount = n

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTex: { value: textura },
      uMouse: { value: new THREE.Vector3(0, 0, -100) },
      uFog: { value: C.fondo },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uMouse;
      attribute vec3 aOffset;
      attribute vec4 aSeed;
      attribute vec3 aColor;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vFog;
      varying float vLuz;
      mat3 rx(float a){float s=sin(a),c=cos(a);return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c);}
      mat3 ry(float a){float s=sin(a),c=cos(a);return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c);}
      mat3 rz(float a){float s=sin(a),c=cos(a);return mat3(c,s,0.0, -s,c,0.0, 0.0,0.0,1.0);}
      void main(){
        vUv = uv;
        vColor = aColor;
        float t = uTime * aSeed.y + aSeed.x * 6.2831;
        vec3 p = position * aSeed.w;
        // la pluma se curva y aletea a lo largo
        p.z += sin(uv.y * 3.1416) * 0.12 * sin(t * 2.3);
        // vaivén de hoja que cae: péndulo + giro lento
        mat3 r = ry(t * 0.55 + aSeed.x * 9.0) * rx(1.1 + sin(t * 0.8) * 0.55) * rz(sin(t) * 0.9);
        p = r * p;
        vLuz = 0.65 + 0.35 * abs((r * vec3(0.0, 0.0, 1.0)).z);
        vec3 o = aOffset;
        float H = 16.0;
        o.y = mod(o.y - uTime * 0.32 * aSeed.y + H, 2.0 * H) - H;
        o.x += sin(t * 0.7) * aSeed.z;
        // el ratón aparta las plumas cercanas
        vec2 d = o.xy - uMouse.xy;
        float f = smoothstep(3.6, 0.0, length(d)) * smoothstep(9.0, 0.0, abs(o.z - uMouse.z));
        o.xy += normalize(d + 1e-4) * f * 2.4;
        vec4 mv = modelViewMatrix * vec4(o + p, 1.0);
        vFog = smoothstep(5.0, 40.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex;
      uniform vec3 uFog;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vFog;
      varying float vLuz;
      void main(){
        vec4 tx = texture2D(uTex, vUv);
        if (tx.a < 0.04) discard;
        vec3 c = vColor * tx.rgb * vLuz;
        c = mix(c, uFog, vFog);
        gl_FragColor = vec4(c, tx.a * (1.0 - vFog * 0.7));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const malla = new THREE.Mesh(geo, mat)
  malla.frustumCulled = false
  return { malla, geos: [base, geo], mat }
}

function crearPolvo(n, px) {
  const pos = new Float32Array(n * 3)
  const semilla = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30
    pos[i * 3 + 2] = Z_INICIO - Math.random() * (LARGO + 20)
    semilla[i] = Math.random()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(semilla, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: px }, uColor: { value: C.barriga } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPx;
      attribute float aSeed;
      varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.2 + aSeed * 20.0) * 0.35;
        p.y += cos(uTime * 0.16 + aSeed * 11.0) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(uPx * (0.5 + aSeed) * (16.0 / -mv.z), 28.0);
        vA = (1.0 - smoothstep(6.0, 42.0, -mv.z)) * (0.25 + aSeed * 0.45);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.05, d));
      }
    `,
    transparent: true,
    depthWrite: false,
  })
  const puntos = new THREE.Points(geo, mat)
  puntos.frustumCulled = false
  return { puntos, geo, mat }
}

const GOTA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform vec3 uMouseDir;
  uniform float uTiron;
  varying vec3 vPos;
  varying float vRuido;
  ${RUIDO}
  void main(){
    vec3 p = position;
    float n = snoise(p * 1.3 + vec3(0.0, 0.0, uTime * 0.22));
    float n2 = snoise(p * 3.0 - uTime * 0.17) * 0.32;
    float tiron = smoothstep(0.35, 1.0, dot(normalize(p), uMouseDir)) * uTiron;
    float d = (n + n2) * uAmp + tiron;
    vRuido = n;
    p += normal * d;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const GOTA_FRAG = /* glsl */ `
  uniform vec3 uTinta;
  uniform vec3 uRim;
  uniform vec3 uMostaza;
  uniform vec3 uFog;
  varying vec3 vPos;
  varying float vRuido;
  void main(){
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    vec3 v = normalize(-vPos);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.4);
    vec3 c = uTinta + uRim * fres * 1.15;
    vec3 l = normalize(vec3(0.35, 0.8, 0.5));
    float brillo = pow(max(dot(reflect(-l, n), v), 0.0), 48.0);
    c += vec3(0.95, 0.93, 0.86) * brillo * 0.55;
    c += uMostaza * smoothstep(0.45, 0.85, vRuido) * fres * 0.6;
    float niebla = smoothstep(8.0, 46.0, length(vPos));
    gl_FragColor = vec4(mix(c, uFog, niebla), 1.0);
  }
`

const GOTAS = [
  { p: [2.9, -0.4, -3], s: 2.9, heroe: true },
  { p: [-5.6, 3.1, -9], s: 1.1 },
  { p: [-4.5, -1.6, -36], s: 2.3 },
  { p: [5, 1.8, -64], s: 2.7 },
  { p: [-3.8, 2.2, -94], s: 2.1 },
  { p: [2.4, -2.1, -120], s: 2.5 },
]

function crearGotas(detalle) {
  const geo = new THREE.IcosahedronGeometry(1, detalle)
  const mats = []
  const mallas = GOTAS.map((g, i) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: i * 7.3 },
        uAmp: { value: g.heroe ? 0.26 : 0.32 },
        uMouseDir: { value: new THREE.Vector3() },
        uTiron: { value: g.heroe ? 0.38 : 0 },
        uTinta: { value: C.tinta },
        uRim: { value: C.menta },
        uMostaza: { value: C.mostaza },
        uFog: { value: C.fondo },
      },
      vertexShader: GOTA_VERT,
      fragmentShader: GOTA_FRAG,
    })
    mats.push(mat)
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...g.p)
    m.scale.setScalar(g.s)
    m.userData = { ...g, base: new THREE.Vector3(...g.p), fase: Math.random() * 10 }
    return m
  })
  return { mallas, geo, mats }
}

/* El hilo: una curva que serpentea por el túnel. Se pinta a puntadas y solo
   hasta donde va el progreso, como si se estuviera cosiendo. */
function crearHilo() {
  const puntos = []
  const n = 46
  for (let i = 0; i <= n; i++) {
    const z = Z_INICIO - 6 - (i / n) * (LARGO + 6)
    puntos.push(new THREE.Vector3(Math.sin(i * 0.85) * 3.4 + Math.cos(i * 0.31) * 1.6, Math.cos(i * 0.62) * 2 - 0.4, z))
  }
  const curva = new THREE.CatmullRomCurve3(puntos)
  const geo = new THREE.TubeGeometry(curva, 900, 0.045, 6, false)
  const mat = new THREE.ShaderMaterial({
    uniforms: { uProgreso: { value: 0 }, uColor: { value: C.mostaza }, uFog: { value: C.fondo } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vFog;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFog = smoothstep(4.0, 34.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uProgreso;
      uniform vec3 uColor;
      uniform vec3 uFog;
      varying vec2 vUv;
      varying float vFog;
      void main(){
        if (vUv.x > uProgreso) discard;
        if (fract(vUv.x * 260.0) > 0.6) discard;
        // la punta, donde está la aguja, brilla un poco más
        float punta = smoothstep(uProgreso - 0.012, uProgreso, vUv.x);
        vec3 c = mix(uColor, vec3(1.0, 0.97, 0.88), punta);
        gl_FragColor = vec4(mix(c, uFog, vFog), 1.0);
      }
    `,
  })
  return { malla: new THREE.Mesh(geo, mat), geo, mat }
}

function EscenaTinta3D() {
  const cajaRef = useRef(null)

  useEffect(() => {
    const caja = cajaRef.current
    if (!caja) return undefined

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const estrecho = window.innerWidth < 720

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      return undefined // sin WebGL la página sigue funcionando: el fondo es plano
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor('#121413', 1)
    caja.appendChild(renderer.domElement)

    const escena = new THREE.Scene()
    const camara = new THREE.PerspectiveCamera(52, 1, 0.1, 80)
    camara.position.set(0, 0, Z_INICIO)

    const textura = texturaPluma()
    const plumas = crearPlumas(estrecho ? 260 : 560, textura)
    const polvo = crearPolvo(estrecho ? 1400 : 2800, dpr * 2.2)
    const gotas = crearGotas(estrecho ? 18 : 28)
    const hilo = crearHilo()
    escena.add(plumas.malla, polvo.puntos, hilo.malla, ...gotas.mallas)

    const medir = () => {
      const w = caja.clientWidth
      const h = caja.clientHeight
      renderer.setSize(w, h, false)
      camara.aspect = w / h
      /* En vertical la escena se abre un poco para que quepan las gotas. */
      camara.fov = w / h < 0.8 ? 66 : 52
      camara.updateProjectionMatrix()
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(caja)

    /* Estado suavizado: el scroll y el ratón llegan a saltos, la cámara no. */
    const raton = { x: 0, y: 0, sx: 0, sy: 0 }
    let progreso = 0
    let progresoSuave = 0
    let opacidad = 1
    const alMover = (e) => {
      raton.x = (e.clientX / window.innerWidth) * 2 - 1
      raton.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    const leerScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progreso = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    leerScroll()
    window.addEventListener('pointermove', alMover, { passive: true })
    window.addEventListener('scroll', leerScroll, { passive: true })

    const tmp = new THREE.Vector3()
    const puntoRaton = new THREE.Vector3()
    const reloj = new THREE.Clock()
    let tiempo = 0

    const pintar = (dt) => {
      tiempo += dt
      const k = 1 - Math.pow(0.0015, dt) // suavizado independiente de los fps
      progresoSuave += (progreso - progresoSuave) * k
      raton.sx += (raton.x - raton.sx) * k
      raton.sy += (raton.y - raton.sy) * k

      const p = progresoSuave
      camara.position.set(
        Math.sin(p * Math.PI * 3) * 1.6 + raton.sx * 0.9,
        Math.cos(p * Math.PI * 2) * 0.8 - 0.8 + raton.sy * 0.55,
        Z_INICIO - p * LARGO,
      )
      camara.lookAt(camara.position.x * 0.4, camara.position.y * 0.4, camara.position.z - 14)
      camara.rotateZ(Math.sin(p * Math.PI * 4) * 0.06)

      /* Dónde está el ratón en el mundo, a 8 unidades de la cámara. */
      puntoRaton.set(raton.sx, raton.sy, 0.5).unproject(camara).sub(camara.position).normalize()
      puntoRaton.multiplyScalar(8).add(camara.position)

      plumas.mat.uniforms.uTime.value = tiempo
      plumas.mat.uniforms.uMouse.value.copy(puntoRaton)
      polvo.mat.uniforms.uTime.value = tiempo
      hilo.mat.uniforms.uProgreso.value = Math.min(1, p * 1.04 + 0.1)

      gotas.mallas.forEach((m, i) => {
        const u = m.material.uniforms
        u.uTime.value = tiempo + i * 7.3
        m.rotation.y = tiempo * 0.08 + m.userData.fase
        m.rotation.x = Math.sin(tiempo * 0.1 + m.userData.fase) * 0.3
        m.position.y = m.userData.base.y + Math.sin(tiempo * 0.5 + m.userData.fase) * 0.25
        if (m.userData.heroe) {
          /* La gota grande sigue al ratón con desgana y se estira hacia él. */
          m.position.x = m.userData.base.x + raton.sx * 0.7
          m.worldToLocal(tmp.copy(puntoRaton)).normalize()
          u.uMouseDir.value.copy(tmp)
        }
      })

      /* Pasado el héroe el lienzo se apaga un poco para que se lea el texto. */
      const heroe = Math.min(1, window.scrollY / (window.innerHeight * 1.4))
      const objetivo = 1 - heroe * 0.42
      if (Math.abs(objetivo - opacidad) > 0.002) {
        opacidad += (objetivo - opacidad) * k
        caja.style.opacity = opacidad.toFixed(3)
      }

      renderer.render(escena, camara)
    }

    let raf = 0
    const bucle = () => {
      raf = requestAnimationFrame(bucle)
      pintar(Math.min(reloj.getDelta(), 1 / 20))
    }
    const alVisibilidad = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf && !reducido) {
        reloj.getDelta()
        bucle()
      }
    }

    if (reducido) {
      pintar(0.016)
    } else {
      bucle()
      document.addEventListener('visibilitychange', alVisibilidad)
    }

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', alVisibilidad)
      window.removeEventListener('pointermove', alMover)
      window.removeEventListener('scroll', leerScroll)
      ro.disconnect()
      plumas.geos.forEach((g) => g.dispose())
      plumas.mat.dispose()
      polvo.geo.dispose()
      polvo.mat.dispose()
      gotas.geo.dispose()
      gotas.mats.forEach((m) => m.dispose())
      hilo.geo.dispose()
      hilo.mat.dispose()
      textura.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="escena-tinta" ref={cajaRef} aria-hidden="true" />
}

export default EscenaTinta3D
