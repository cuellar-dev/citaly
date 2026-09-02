/* =====================================================================
   Taly · la mascota de Citaly
   ---------------------------------------------------------------------
   Nombre:     Taly (de ciTALY)
   Alma:       un pajarito regordete y casero que te trae las citas,
               te avisa cuando toca y se pone contentísimo al confirmar
   Silueta:    huevo de perfil, cabeza estrecha y cuerpo ancho, con
               copete, ala plegada, barriga clara y dos patitas

   Vocabulario de dibujo: Unicode Block Elements (U+2580–U+259F)
   Motor de pintado:      SVG

   Por qué el dibujo se autoriza en caracteres pero no se pinta con ellos
   ---------------------------------------------------------------------
   Escribir la mascota como rejilla de caracteres de bloque es cómodo de
   leer y de editar, así que los datos siguen siendo eso. Pero pintarla
   como texto no funciona: al medir los 32 glifos en todas las fuentes
   monoespaciadas de la máquina, solo 8 tienen el ancho de avance de la
   celda (▀ ▄ █ ▌ ▐ ░ ▒ ▓). Los cuartos (▖▗▘▝) y los tres cuartos
   (▙▟▛▜▚▞) miden un 70% más, porque no están en la fuente monoespaciada
   y el navegador recurre a otra. Un solo glifo de esos desplaza hacia la
   derecha TODO lo que va detrás en su misma fila, y la rejilla se
   descuadra sin que se note a simple vista. En una web, además, cada
   visitante tiene fuentes distintas, así que el resultado sería impredecible.

   Por eso cada glifo se traduce a sus rectángulos (FORMAS) y se pinta en
   SVG: sale exacto, nítido a cualquier tamaño, igual en todos los
   navegadores, y las tramas quedan recortadas a la forma del glifo en vez
   de desbordarse. Comprobar con: node medir-glifos.mjs
====================================================================== */

(function () {
  "use strict";

  // ---- paleta ------------------------------------------------------------
  // Armónica con Citaly (teal #00C2AD sobre #121413) pero desplazada hacia
  // el menta, más cálida y más de manualidad que el teal de la interfaz.
  const PALETA = {
    b:  "#4FD8C4",   // cuerpo
    d:  "#2AA795",   // ala y sombra
    l:  "#BDF4E8",   // barriga
    tc: "#2FBDA8",   // puntadas sobre el cuerpo
    tb: "#8FE0D0",   // puntadas sobre la barriga
    m:  "#FFD166",   // pico, copete y patas
    o:  "#0E2E2A",   // ojo
    cr: "#F2EBDD",   // crema, para la tarjeta de cita
  };

  // ---- rejilla -----------------------------------------------------------
  // La celda no es cuadrada. Se dibujó con la proporción de una celda de
  // texto monoespaciado (0.55), pero con esa el pájaro salía más alto que
  // ancho. Al no depender ya de ninguna fuente, la proporción es libre: a
  // 0.72 la silueta queda redonda y regordeta sin tocar el dibujo. Las
  // puntadas no se deforman, porque su tamaño es fijo y no fracción de celda.
  const CELDA = { ancho: 72, alto: 100 };
  const ESCENARIO = { filas: 9, columnas: 17 };
  const OFFSET = { fila: 1, columna: 3 };

  // Silueta base. El pico NO está aquí: va en la capa de detalle, para
  // que las poses puedan abrirlo y cerrarlo.
  const ROWS = [
    "           ",   // 0 el copete va en ADORNOS, para poder probar formas
    "  ▟████▙   ",   // 1 alto de la cabeza
    "  ▐█████   ",   // 2 cabeza (el pico se añade como detalle)
    " ▐███████▌ ",   // 3 pecho
    " ▐███████▌ ",   // 4 barriga
    "  ▜█████▛  ",   // 5 base redondeada
    "    ▀ ▀    ",   // 6 patas
  ];

  // El copete se dibuja aparte porque necesita alturas distintas en una
  // misma fila para leerse como plumón. Con dos glifos de media altura
  // (▗ y ▄) sale una barra plana, que parece la visera de una gorra.
  const ADORNOS = {
    copete: [
      { p: [0, 2], ch: "▄" },
      { p: [0, 3], ch: "█" },
    ],
  };

  // ---- traducción de glifo a rectángulos ---------------------------------
  // Cada rectángulo es [x, y, ancho, alto] en fracción de celda.
  const FORMAS = {
    "█": [[0, 0, 1, 1]],
    "▀": [[0, 0, 1, 0.5]],
    "▄": [[0, 0.5, 1, 0.5]],
    "▌": [[0, 0, 0.5, 1]],
    "▐": [[0.5, 0, 0.5, 1]],
    "▘": [[0, 0, 0.5, 0.5]],
    "▝": [[0.5, 0, 0.5, 0.5]],
    "▖": [[0, 0.5, 0.5, 0.5]],
    "▗": [[0.5, 0.5, 0.5, 0.5]],
    "▙": [[0, 0, 0.5, 1], [0.5, 0.5, 0.5, 0.5]],
    "▟": [[0.5, 0, 0.5, 1], [0, 0.5, 0.5, 0.5]],
    "▛": [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5]],
    "▜": [[0, 0, 1, 0.5], [0.5, 0.5, 0.5, 0.5]],
    "▚": [[0, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    "▞": [[0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5]],
    "▔": [[0, 0, 1, 0.18]],
    "▁": [[0, 0.82, 1, 0.18]],
    // Las tramas ocupan la celda entera; el relleno lo pone el patrón de
    // puntadas, y al ir en SVG queda recortado a la forma, sin desbordarse.
    "░": [[0, 0, 1, 1]],
    "▒": [[0, 0, 1, 1]],
    "▓": [[0, 0, 1, 1]],
  };

  const TRAMAS = { "░": 1, "▒": 2, "▓": 3 };
  const esTrama = ch => Object.prototype.hasOwnProperty.call(TRAMAS, ch);

  const PATAS = [[6, 4], [6, 6]];
  // [5,8] entra en la barriga: si se queda del color del cuerpo, la esquina
  // inferior derecha se lee como un bloque suelto pegado al costado.
  const BARRIGA = [[4, 5], [4, 6], [4, 7], [4, 8], [5, 5], [5, 6], [5, 7], [5, 8]];
  const BORDE_BARRIGA = [[3, 6], [3, 7], [3, 8]];

  const COLOR_BASE = {
    m: PATAS,
    l: BARRIGA,
  };

  // ---- rasgos ------------------------------------------------------------
  const OJO = {
    abierto: { p: [2, 6], ch: "▀", c: "o" },
    cerrado: { p: [2, 6], ch: "▔", c: "o" },
    bajo:    { p: [2, 6], ch: "▄", c: "o" },
    atras:   { p: [2, 5], ch: "▀", c: "o" },
    // Para la alegría no sirve el ojo muy abierto: en un pájaro se lee como
    // susto. Un ojo entornado abajo funciona mejor.
    feliz:   { p: [2, 6], ch: "▄", c: "o" },
  };

  const PICO = {
    // Cerrado apunta hacia abajo; abierto se levanta. El cambio de dirección
    // es lo que hace legible que el pájaro está cantando.
    cerrado: [{ p: [2, 8], ch: "▙", c: "m" }, { p: [2, 9], ch: "▖", c: "m" }],
    abierto: [{ p: [2, 8], ch: "▀", c: "m" }, { p: [2, 9], ch: "▘", c: "m" }],
  };

  // El ala se mueve para aletear. La silueta exterior nunca cambia: lo que
  // se mueve es la mancha de puntadas dentro del cuerpo.
  // Cada celda lleva su propia forma para que el ala salga redondeada en vez
  // de un rectángulo. Al ir todas con la misma trama, y como el patrón se
  // tira en coordenadas del lienzo, las puntadas siguen encajando entre
  // celdas y el ala se lee como una sola pieza.
  const ALA = {
    media: [
      { p: [3, 2], ch: "█" }, { p: [3, 3], ch: "█" }, { p: [3, 4], ch: "▄" },
      { p: [4, 2], ch: "█" }, { p: [4, 3], ch: "▀" },
    ],
    arriba: [
      { p: [2, 3], ch: "▄" }, { p: [2, 4], ch: "▄" },
      { p: [3, 2], ch: "█" }, { p: [3, 3], ch: "█" }, { p: [3, 4], ch: "▀" },
    ],
    abajo: [
      { p: [4, 2], ch: "█" }, { p: [4, 3], ch: "█" }, { p: [4, 4], ch: "▄" },
      { p: [5, 3], ch: "▀" }, { p: [5, 4], ch: "▀" },
    ],
  };

  const mismaCelda = (a, b) => a[0] === b[0] && a[1] === b[1];
  const dentro = (lista, p) => lista.some(x => mismaCelda(x, p));

  // El tejido cubre TODA la silueta, respetando la forma de cada celda.
  // Antes solo podía ir sobre celdas de bloque lleno, porque como texto la
  // trama rellenaba la celda entera y se salía del contorno. En SVG la
  // puntada se recorta al glifo, así que el borde también se puede tejer y
  // desaparece el aro macizo que rodeaba al pájaro.
  // La celda del ojo se pasa como parámetro: hay poses que lo mueven, y si
  // aquí se diera por fija la de reposo, el tejido pintaría puntadas justo
  // debajo del ojo desplazado y dejaría sin tejer la celda que abandona.
  function tejido(ala, celdaOjo) {
    const out = [];
    ROWS.forEach((fila, f) => {
      for (let c = 0; c < fila.length; c++) {
        if (fila[c] === " ") continue;
        const p = [f, c];
        if (mismaCelda(p, celdaOjo)) continue;
        if (dentro(ala.map(a => a.p), p)) continue;
        if (dentro(BORDE_BARRIGA, p)) continue;
        if (dentro(PATAS, p)) continue;          // las patas van lisas
        out.push({ p, ch: fila[c], trama: 1, c: dentro(BARRIGA, p) ? "tb" : "tc" });
      }
    });
    return out;
  }

  // ---- poses -------------------------------------------------------------
  // Cada pose cambia un solo rasgo respecto a la de reposo. El orden de la
  // lista es el orden de pintado: lo último queda encima.
  function pose(ojo, pico, ala) {
    const det = [];
    det.push.apply(det, tejido(ala, ojo.p));
    det.push.apply(det, BORDE_BARRIGA.map(p => ({ p, ch: "▄", c: "l" })));
    // El ala va en dos pasadas: primero maciza en el menta oscuro y luego
    // las puntadas claras encima. Solo con trama sobre el cuerpo no se
    // distinguía del tejido general y el ala desaparecía.
    det.push.apply(det, ala.map(a => ({ p: a.p, ch: a.ch, c: "d" })));
    det.push.apply(det, ala.map(a => ({ p: a.p, ch: a.ch, trama: 1, c: "b" })));
    det.push.apply(det, pico);
    det.push(ojo);
    return det;
  }

  const POSES = {
    reposo:       pose(OJO.abierto, PICO.cerrado, ALA.media),
    parpadeo:     pose(OJO.cerrado, PICO.cerrado, ALA.media),
    "mira-atras": pose(OJO.atras,   PICO.cerrado, ALA.media),
    "mira-abajo": pose(OJO.bajo,    PICO.cerrado, ALA.media),
    canto:        pose(OJO.cerrado, PICO.abierto, ALA.media),
    contento:     pose(OJO.feliz,   PICO.abierto, ALA.arriba),
    "ala-arriba": pose(OJO.abierto, PICO.cerrado, ALA.arriba),
    "ala-abajo":  pose(OJO.abierto, PICO.cerrado, ALA.abajo),
    dormido:      pose(OJO.cerrado, PICO.cerrado, ALA.abajo),
    busca:        pose(OJO.atras,   PICO.abierto, ALA.arriba),
  };

  // ---- objetos -----------------------------------------------------------
  // En coordenadas del ESCENARIO, no del pájaro.
  const OBJETOS = {
    // La cita que Taly lleva en el pico: una tarjetita con el talón en mostaza.
    tarjeta: [
      { p: [3, 13], ch: "▄", c: "m" }, { p: [3, 14], ch: "▄", c: "cr" },
      { p: [4, 13], ch: "▀", c: "m" }, { p: [4, 14], ch: "▀", c: "cr" },
    ],
    // El canto, subiendo en diagonal desde el pico.
    notas: [
      { p: [2, 13], ch: "▘", c: "m" },
      { p: [1, 14], ch: "▘", c: "m" },
      { p: [0, 15], ch: "▘", c: "m" },
    ],
    // La celebración al confirmar una cita. Pegadas al cuerpo: dispersas
    // por el escenario se leían como suciedad, no como chispas.
    chispas: [
      { p: [1, 2],  ch: "▝", c: "m" },
      { p: [1, 12], ch: "▗", c: "m" },
      { p: [2, 14], ch: "▘", c: "m" },
      { p: [7, 3],  ch: "▖", c: "m" },
      { p: [7, 12], ch: "▗", c: "m" },
    ],
    // Dormido: burbujitas de sueño.
    sueno: [
      { p: [2, 13], ch: "▖", c: "l" },
      { p: [1, 14], ch: "▖", c: "l" },
      { p: [0, 15], ch: "▖", c: "l" },
    ],
  };

  // ---- escenas -----------------------------------------------------------
  // La suma de los ms de cada escena es su duración exacta de bucle.
  const ESCENAS = {
    // Presentación y onboarding: se despierta, mira, y se alegra.
    hero: [
      { pose: "reposo",     bob: 0,   ms: 900 },
      { pose: "parpadeo",   bob: 0,   ms: 130 },
      { pose: "reposo",     bob: 0,   ms: 620 },
      { pose: "mira-atras", bob: -2,  ms: 640 },
      { pose: "reposo",     bob: 0,   ms: 420 },
      { pose: "parpadeo",   bob: 0,   ms: 130 },
      { pose: "contento",   bob: -10, ms: 380, objetos: ["chispas"] },
      { pose: "contento",   bob: -14, ms: 360, objetos: ["chispas"] },
      { pose: "reposo",     bob: 0,   ms: 500 },
      { pose: "reposo",     bob: -2,  ms: 720 },
    ],
    // Cargando: aletea rápido y va mirando alrededor.
    // Cierra en ala-abajo y arranca en ala-arriba a propósito: es el propio
    // batir del ala. Aquí un cierre con la misma pose cortaría el aleteo.
    loader: [
      { pose: "ala-arriba", bob: -4, ms: 180 },
      { pose: "ala-abajo",  bob: 0,  ms: 180 },
      { pose: "ala-arriba", bob: -4, ms: 180 },
      { pose: "ala-abajo",  bob: 0,  ms: 180 },
      { pose: "busca",      bob: -2, ms: 240 },
      { pose: "ala-arriba", bob: -4, ms: 180 },
      { pose: "ala-abajo",  bob: 0,  ms: 300 },
    ],
    // Sin citas: dormidito, respirando despacio.
    vacio: [
      { pose: "dormido",  bob: 0, ms: 1200, objetos: ["sueno"] },
      { pose: "dormido",  bob: 2, ms: 900,  objetos: ["sueno"] },
      { pose: "dormido",  bob: 0, ms: 900,  objetos: ["sueno"] },
      { pose: "parpadeo", bob: 0, ms: 200 },
      { pose: "dormido",  bob: 0, ms: 400,  objetos: ["sueno"] },
    ],
    // Cita confirmada: el momento de máxima alegría.
    confirmacion: [
      { pose: "reposo",   bob: 0,   ms: 400 },
      { pose: "contento", bob: -8,  ms: 300, objetos: ["chispas"] },
      { pose: "contento", bob: -14, ms: 300, objetos: ["chispas"] },
      { pose: "contento", bob: -8,  ms: 260, objetos: ["chispas"] },
      { pose: "reposo",   bob: 0,   ms: 340 },
      { pose: "contento", bob: -6,  ms: 300, objetos: ["chispas"] },
      { pose: "reposo",   bob: 0,   ms: 500 },
    ],
    // Recordatorio: canta para avisarte de que tienes una cita cerca.
    recordatorio: [
      { pose: "reposo", bob: 0,  ms: 600 },
      { pose: "canto",  bob: -4, ms: 320, objetos: ["notas"] },
      { pose: "reposo", bob: 0,  ms: 200 },
      { pose: "canto",  bob: -4, ms: 320, objetos: ["notas"] },
      { pose: "reposo", bob: 0,  ms: 240 },
      { pose: "canto",  bob: -4, ms: 320, objetos: ["notas"] },
      { pose: "reposo", bob: 0,  ms: 800 },
    ],
    // Mensajero: te trae la cita en el pico.
    mensajero: [
      { pose: "reposo",     bob: 0,   ms: 700, objetos: ["tarjeta"] },
      { pose: "ala-arriba", bob: -6,  ms: 200, objetos: ["tarjeta"] },
      { pose: "ala-abajo",  bob: -2,  ms: 200, objetos: ["tarjeta"] },
      { pose: "ala-arriba", bob: -8,  ms: 200, objetos: ["tarjeta"] },
      { pose: "ala-abajo",  bob: -2,  ms: 200, objetos: ["tarjeta"] },
      { pose: "reposo",     bob: 0,   ms: 500, objetos: ["tarjeta"] },
      { pose: "contento",   bob: -10, ms: 400, objetos: ["tarjeta", "chispas"] },
      { pose: "reposo",     bob: 0,   ms: 800, objetos: ["tarjeta"] },
    ],
  };

  const duracion = nombre => ESCENAS[nombre].reduce((t, p) => t + p.ms, 0);

  // ---- pintado en SVG ----------------------------------------------------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ANCHO_TOTAL = ESCENARIO.columnas * CELDA.ancho;
  const ALTO_TOTAL = ESCENARIO.filas * CELDA.alto;

  // La puntada: una retícula de cuadraditos con hueco entre ellos, que es lo
  // que da el aire de punto de cruz. Densidad 1 = suelta, 3 = casi maciza.
  const PUNTADA = { lado: 13.75, hueco: 0.42 };

  function idPatron(densidad, clave) { return "taly-p" + densidad + "-" + clave; }

  function crearPatrones(defs) {
    Object.keys(TRAMAS).forEach(ch => {
      const densidad = TRAMAS[ch];
      Object.keys(PALETA).forEach(clave => {
        const lado = PUNTADA.lado;
        const patron = document.createElementNS(SVG_NS, "pattern");
        patron.setAttribute("id", idPatron(densidad, clave));
        patron.setAttribute("patternUnits", "userSpaceOnUse");
        patron.setAttribute("width", lado * 2);
        patron.setAttribute("height", lado * 2);

        // Con densidad 1 va una puntada de cada cuatro; con 2, en tresbolillo;
        // con 3, todas menos una.
        const puestos = densidad === 1 ? [[0, 0]]
          : densidad === 2 ? [[0, 0], [1, 1]]
          : [[0, 0], [1, 1], [1, 0]];
        const margen = lado * (1 - PUNTADA.hueco) * 0.5;
        puestos.forEach(([i, j]) => {
          const r = document.createElementNS(SVG_NS, "rect");
          r.setAttribute("x", i * lado + margen);
          r.setAttribute("y", j * lado + margen);
          r.setAttribute("width", lado * PUNTADA.hueco);
          r.setAttribute("height", lado * PUNTADA.hueco);
          r.setAttribute("fill", PALETA[clave]);
          patron.appendChild(r);
        });
        defs.appendChild(patron);
      });
    });
  }

  /**
   * Devuelve los <rect> de un glifo en una celda del escenario.
   * La forma la da el glifo y el relleno la trama, y van por separado: así
   * una zona texturada puede tener forma redondeada (media celda, esquina)
   * en vez de ser siempre un rectángulo completo.
   */
  function rectangulos(fila, col, ch, clave, trama) {
    const formas = FORMAS[ch];
    if (!formas) {
      console.warn("Taly: glifo sin forma definida: " + ch);
      return [];
    }
    const densidad = trama || (esTrama(ch) ? TRAMAS[ch] : 0);
    const relleno = densidad
      ? "url(#" + idPatron(densidad, clave) + ")"
      : PALETA[clave];

    return formas.map(([fx, fy, fw, fh]) => {
      const r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", (col + fx) * CELDA.ancho);
      r.setAttribute("y", (fila + fy) * CELDA.alto);
      r.setAttribute("width", fw * CELDA.ancho);
      r.setAttribute("height", fh * CELDA.alto);
      r.setAttribute("fill", relleno);
      return r;
    });
  }

  function pintarBase(grupo) {
    const mapa = {};
    Object.keys(COLOR_BASE).forEach(clave => {
      COLOR_BASE[clave].forEach(([f, c]) => { mapa[f + "," + c] = clave; });
    });
    ROWS.forEach((fila, f) => {
      for (let c = 0; c < fila.length; c++) {
        if (fila[c] === " ") continue;
        rectangulos(f + OFFSET.fila, c + OFFSET.columna, fila[c],
          mapa[f + "," + c] || "b").forEach(r => grupo.appendChild(r));
      }
    });
    ADORNOS.copete.forEach(d => {
      rectangulos(d.p[0] + OFFSET.fila, d.p[1] + OFFSET.columna, d.ch, "m")
        .forEach(r => grupo.appendChild(r));
    });
  }

  function pintarDetalle(grupo, nombrePose, objetos) {
    POSES[nombrePose].forEach(d => {
      rectangulos(d.p[0] + OFFSET.fila, d.p[1] + OFFSET.columna, d.ch, d.c, d.trama)
        .forEach(r => grupo.appendChild(r));
    });
    (objetos || []).forEach(nombre => {
      OBJETOS[nombre].forEach(d => {
        rectangulos(d.p[0], d.p[1], d.ch, d.c, d.trama).forEach(r => grupo.appendChild(r));
      });
    });
  }

  /**
   * Monta a Taly dentro de un contenedor y devuelve el control para
   * cambiar de pose o reproducir una escena en bucle.
   *   tamano: alto de celda en px (el ancho sale de la proporción)
   */
  function crear(contenedor, opciones) {
    // El brillo va apagado por defecto: en el PNG transparente queda
    // horneado en el archivo y sobre fondo claro se ve como un cerco sucio.
    const cfg = Object.assign({ tamano: 40, brillo: false }, opciones || {});

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "taly-svg");
    svg.setAttribute("viewBox", "0 0 " + ANCHO_TOTAL + " " + ALTO_TOTAL);
    svg.setAttribute("width", (ANCHO_TOTAL / CELDA.alto) * cfg.tamano);
    svg.setAttribute("height", ESCENARIO.filas * cfg.tamano);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Taly, la mascota de Citaly");
    if (cfg.brillo) svg.style.filter = "drop-shadow(0 0 " + (cfg.tamano * 0.35) +
      "px rgba(79,216,196,0.45))";

    const defs = document.createElementNS(SVG_NS, "defs");
    crearPatrones(defs);
    svg.appendChild(defs);

    const gBase = document.createElementNS(SVG_NS, "g");
    pintarBase(gBase);
    svg.appendChild(gBase);

    const gDetalle = document.createElementNS(SVG_NS, "g");
    svg.appendChild(gDetalle);

    contenedor.appendChild(svg);

    function dibujar(nombrePose, bob, objetos) {
      while (gDetalle.firstChild) gDetalle.removeChild(gDetalle.firstChild);
      pintarDetalle(gDetalle, nombrePose, objetos);
      // El salto se aplica en unidades de celda, para que no dependa del tamaño.
      const salto = (bob || 0) * (CELDA.alto / 40);
      gBase.setAttribute("transform", "translate(0," + salto + ")");
      gDetalle.setAttribute("transform", "translate(0," + salto + ")");
    }

    let temporizador = null;
    function reproducir(nombreEscena) {
      if (temporizador) clearTimeout(temporizador);
      const escena = ESCENAS[nombreEscena];
      let i = 0;
      (function paso() {
        const s = escena[i % escena.length];
        dibujar(s.pose, s.bob, s.objetos);
        i++;
        temporizador = setTimeout(paso, s.ms);
      })();
    }

    /** Congela una escena en un fotograma concreto, para exportar el PNG. */
    function fotograma(nombreEscena, indice) {
      if (temporizador) clearTimeout(temporizador);
      const escena = ESCENAS[nombreEscena];
      const s = escena[Math.max(0, Math.min(indice, escena.length - 1))];
      dibujar(s.pose, s.bob, s.objetos);
    }

    function parar() { if (temporizador) clearTimeout(temporizador); }

    dibujar("reposo", 0);
    return { dibujar, reproducir, fotograma, parar, elemento: svg };
  }

  window.TALY = {
    PALETA, CELDA, ESCENARIO, OFFSET, ROWS, ADORNOS, FORMAS, TRAMAS,
    BARRIGA, BORDE_BARRIGA, PATAS, ALA, OJO, PICO,
    POSES, OBJETOS, ESCENAS, duracion, crear,
  };
})();
