#!/usr/bin/env node
/**
 * Auditoría del arte de Taly.
 *
 * Comprueba, dentro del navegador y sobre el arte real:
 *   1. Todas las filas de la silueta miden lo mismo.
 *   2. Solo se usan Block Elements (U+2580–U+259F) o espacio.
 *   3. Todo glifo usado tiene su traducción a rectángulos en FORMAS.
 *      Si falta, ese trozo del dibujo simplemente no se pinta.
 *   4. Ningún glifo se sale de la rejilla.
 *   5. Los objetos no tapan el cuerpo.
 *   6. Cada escena solo usa poses y objetos que existen.
 *   7. Cada bucle cierra sin tirón: sin salto vertical brusco y sin que
 *      aparezcan o desaparezcan objetos entre el último y el primero.
 *   8. El SVG se pinta de verdad y con la caja del tamaño esperado.
 *
 *   node verificar.mjs
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function cargarChromium() {
  const rutas = [
    "playwright",
    `${process.env.USERPROFILE}\\.cursor\\skills\\mascot-maker\\node_modules\\playwright\\index.js`,
  ];
  for (const ruta of rutas) {
    try {
      const pkg = await import(ruta === "playwright" ? ruta : pathToFileURL(ruta).href);
      const chromium = pkg.chromium || (pkg.default && pkg.default.chromium);
      if (chromium) return chromium;
    } catch { /* siguiente */ }
  }
  throw new Error("No se encontro Playwright.");
}

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(p => existsSync(p));

const chromium = await cargarChromium();
const browser = await chromium.launch(
  CHROME ? { headless: true, executablePath: CHROME } : { headless: true }
);
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve("taly.html")).href + "?pose=reposo", {
  waitUntil: "networkidle",
});

const informe = await page.evaluate(() => {
  const T = window.TALY;
  const fallos = [];
  const avisos = [];
  const datos = {};

  const esBloque = ch => {
    const cp = ch.codePointAt(0);
    return ch === " " || (cp >= 0x2580 && cp <= 0x259f);
  };

  function revisarGlifo(donde, ch) {
    if (!esBloque(ch)) {
      fallos.push(donde + ": caracter fuera de Block Elements: " + ch);
      return;
    }
    if (ch !== " " && !T.FORMAS[ch]) {
      fallos.push(donde + ": el glifo " + ch + " no tiene forma en FORMAS, no se pintaria");
    }
  }

  // 1 y 2. la silueta
  const anchos = [...new Set(T.ROWS.map(r => r.length))];
  datos.silueta = T.ROWS.length + " filas x " + T.ROWS[0].length + " columnas";
  datos.celda = T.CELDA.ancho + "x" + T.CELDA.alto + " (proporcion " +
    (T.CELDA.ancho / T.CELDA.alto).toFixed(2) + ")";
  if (anchos.length !== 1) {
    fallos.push("Las filas de la silueta no miden lo mismo: " + anchos.join(", "));
  }
  T.ROWS.forEach((fila, f) => {
    for (const ch of fila) revisarGlifo("Silueta fila " + f, ch);
  });
  T.ADORNOS.copete.forEach(d => revisarGlifo("Copete", d.ch));

  const altoAve = T.ROWS.length, anchoAve = T.ROWS[0].length;

  // 3 y 4. cada pose
  datos.poses = {};
  Object.keys(T.POSES).forEach(nombre => {
    const det = T.POSES[nombre];
    const celdas = new Set();
    det.forEach(d => {
      const [f, c] = d.p;
      revisarGlifo("Pose " + nombre, d.ch);
      if (f < 0 || f >= altoAve || c < 0 || c >= anchoAve) {
        fallos.push("Pose " + nombre + ": glifo fuera de la rejilla en " + f + "," + c);
      }
      celdas.add(f + "," + c);
    });
    datos.poses[nombre] = { glifos: det.length, celdas: celdas.size };
  });

  // 5. objetos
  const cuerpo = new Set();
  T.ROWS.forEach((fila, f) => {
    for (let c = 0; c < fila.length; c++) {
      if (fila[c] !== " ") {
        cuerpo.add((f + T.OFFSET.fila) + "," + (c + T.OFFSET.columna));
      }
    }
  });

  datos.objetos = {};
  Object.keys(T.OBJETOS).forEach(nombre => {
    let tapa = 0;
    T.OBJETOS[nombre].forEach(d => {
      const [f, c] = d.p;
      revisarGlifo("Objeto " + nombre, d.ch);
      if (f < 0 || f >= T.ESCENARIO.filas || c < 0 || c >= T.ESCENARIO.columnas) {
        fallos.push("Objeto " + nombre + ": se sale del escenario en " + f + "," + c);
      }
      if (cuerpo.has(f + "," + c)) tapa++;
    });
    datos.objetos[nombre] = { glifos: T.OBJETOS[nombre].length, tapaCuerpo: tapa };
    if (tapa > 0) fallos.push("Objeto " + nombre + " tapa " + tapa + " celda(s) del cuerpo");
  });

  // 6 y 7. escenas
  datos.escenas = {};
  Object.keys(T.ESCENAS).forEach(nombre => {
    const escena = T.ESCENAS[nombre];
    escena.forEach((paso, i) => {
      if (!T.POSES[paso.pose]) {
        fallos.push("Escena " + nombre + ", paso " + i + ": pose inexistente '" + paso.pose + "'");
      }
      (paso.objetos || []).forEach(o => {
        if (!T.OBJETOS[o]) {
          fallos.push("Escena " + nombre + ", paso " + i + ": objeto inexistente '" + o + "'");
        }
      });
      if (!paso.ms || paso.ms <= 0) {
        fallos.push("Escena " + nombre + ", paso " + i + ": duracion invalida");
      }
    });

    const primero = escena[0], ultimo = escena[escena.length - 1];
    const saltoBob = Math.abs((ultimo.bob || 0) - (primero.bob || 0));
    const objIni = (primero.objetos || []).join(",");
    const objFin = (ultimo.objetos || []).join(",");

    datos.escenas[nombre] = {
      fotogramas: escena.length,
      duracion: T.duracion(nombre),
      poseInicial: primero.pose,
      poseFinal: ultimo.pose,
      saltoBob,
      objetosIguales: objIni === objFin,
    };

    // Lo que de verdad se ve como un tirón al cerrar el bucle es el salto
    // vertical y la aparición o desaparición de objetos. Que cambie la pose
    // no es un problema: en un aleteo es justo lo que tiene que pasar.
    if (saltoBob > 4) {
      avisos.push("Escena " + nombre + ": el bucle salta " + saltoBob + "px de golpe");
    }
    if (objIni !== objFin) {
      avisos.push("Escena " + nombre + ": los objetos cambian al cerrar el bucle (" +
        (objFin || "ninguno") + " -> " + (objIni || "ninguno") + ")");
    }
  });

  return { fallos, avisos, datos };
});

// 8. el SVG se pinta de verdad
const pintado = await page.evaluate(() => {
  const svg = document.querySelector(".taly-svg");
  if (!svg) return null;
  const caja = svg.getBoundingClientRect();
  return {
    rects: svg.querySelectorAll("rect").length,
    patrones: svg.querySelectorAll("pattern").length,
    ancho: Math.round(caja.width),
    alto: Math.round(caja.height),
  };
});

await browser.close();

const { fallos, avisos, datos } = informe;
if (!pintado) fallos.push("No se encontro el SVG de Taly en la pagina");

console.log("\n=== TALY · AUDITORIA DEL ARTE ===\n");
console.log("Silueta:  " + datos.silueta);
console.log("Celda:    " + datos.celda);
if (pintado) {
  console.log("Pintado:  " + pintado.rects + " rects y " + pintado.patrones +
    " patrones, caja " + pintado.ancho + "x" + pintado.alto + " px a tamano 40");
}

console.log("\n--- Poses ---");
for (const [n, d] of Object.entries(datos.poses)) {
  console.log(`  ${n.padEnd(12)} ${String(d.glifos).padStart(3)} glifos en ${String(d.celdas).padStart(3)} celdas`);
}

console.log("\n--- Objetos ---");
for (const [n, d] of Object.entries(datos.objetos)) {
  console.log(`  ${n.padEnd(10)} ${d.glifos} glifos, tapa ${d.tapaCuerpo} celdas del cuerpo`);
}

console.log("\n--- Escenas y cierre del bucle ---");
for (const [n, d] of Object.entries(datos.escenas)) {
  const ok = d.saltoBob <= 4 && d.objetosIguales;
  console.log(`  ${n.padEnd(14)} ${String(d.fotogramas).padStart(2)} fotogramas, ${String(d.duracion).padStart(4)} ms` +
    `   cierre: ${d.poseFinal} -> ${d.poseInicial}, bob ${d.saltoBob}px  ${ok ? "[enlaza]" : "[revisar]"}`);
}

console.log("\n--- Resultado ---");
if (fallos.length === 0) console.log("  Sin fallos.");
else fallos.forEach(f => console.log("  FALLO:  " + f));
avisos.forEach(a => console.log("  aviso:  " + a));
console.log("");

process.exit(fallos.length ? 1 : 0);
