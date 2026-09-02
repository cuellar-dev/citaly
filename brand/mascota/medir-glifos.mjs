#!/usr/bin/env node
/**
 * Mide el ancho de avance de los 32 Block Elements en la pila de fuentes que
 * usa Taly, y lo compara con el ancho de celda (el del carácter "0", que es
 * lo que vale la unidad ch en CSS).
 *
 * Importa porque si un glifo no está en la fuente monoespaciada, el navegador
 * recurre a otra fuente cuyo avance puede ser distinto. Ese glifo desplaza
 * todo lo que va detrás en su misma línea y descuadra la rejilla, aunque el
 * dibujo parezca correcto a primera vista.
 *
 *   node medir-glifos.mjs
 */

import { existsSync } from "node:fs";
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
await page.setContent("<body></body>");

const PILAS = [
  'Consolas, "Cascadia Mono", "Courier New", monospace',
  '"Cascadia Mono", monospace',
  '"Courier New", monospace',
  '"DejaVu Sans Mono", monospace',
  '"Lucida Console", monospace',
  'monospace',
];

const resultado = await page.evaluate((pilas) => {
  const glifos = [];
  for (let cp = 0x2580; cp <= 0x259f; cp++) glifos.push(String.fromCodePoint(cp));

  const medidor = document.createElement("span");
  medidor.style.position = "absolute";
  medidor.style.whiteSpace = "pre";
  medidor.style.fontSize = "100px";
  medidor.style.lineHeight = "1";
  document.body.appendChild(medidor);

  function ancho(texto, pila) {
    medidor.style.fontFamily = pila;
    medidor.textContent = texto;
    return medidor.getBoundingClientRect().width;
  }

  const salida = {};
  for (const pila of pilas) {
    // Se mide una tira de 10 repeticiones y se divide, para que un error de
    // subpíxel en un solo glifo no falsee la comparación.
    const celda = ancho("0".repeat(10), pila) / 10;
    const malos = [];
    for (const g of glifos) {
      const a = ancho(g.repeat(10), pila) / 10;
      if (Math.abs(a - celda) > 0.05) {
        malos.push({ g, cp: "U+" + g.codePointAt(0).toString(16).toUpperCase(), ancho: +a.toFixed(2) });
      }
    }
    salida[pila] = { celda: +celda.toFixed(2), malos };
  }
  return salida;
}, PILAS);

await browser.close();

console.log("\n=== ANCHO DE AVANCE DE LOS BLOCK ELEMENTS ===");
console.log("Se compara cada glifo con el ancho de celda (el del caracter \"0\").\n");

for (const [pila, d] of Object.entries(resultado)) {
  const etiqueta = pila.length > 46 ? pila.slice(0, 43) + "..." : pila;
  console.log(etiqueta);
  console.log("  celda: " + d.celda + "px a 100px de tamano");
  if (d.malos.length === 0) {
    console.log("  todos los 32 glifos miden igual que la celda. Rejilla segura.\n");
  } else {
    console.log("  " + d.malos.length + " glifo(s) con avance distinto:");
    d.malos.forEach(m => console.log(`     ${m.g}  ${m.cp}  ${m.ancho}px`));
    console.log("");
  }
}
