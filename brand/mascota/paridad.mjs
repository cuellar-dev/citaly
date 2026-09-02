/**
 * Compara el arte del laboratorio (brand/mascota/taly-arte.js, que se pinta en
 * el navegador) con la copia que usa la app (src/components/Taly/arte.js).
 * Son dos archivos porque uno es un script clasico y el otro un modulo ES, y
 * conviene tener una forma de comprobar que no se han separado: si alguien
 * retoca el dibujo en uno y se olvida del otro, esto lo canta.
 *
 *   node paridad.mjs
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { construirBase, construirDetalle, POSES } from "../../src/components/Taly/arte.js";

const pw = await import(
  pathToFileURL(`${process.env.USERPROFILE}\\.cursor\\skills\\mascot-maker\\node_modules\\playwright\\index.js`).href
);
const chromium = pw.chromium || pw.default.chromium;

const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find(p => existsSync(p));

const browser = await chromium.launch({ headless: true, executablePath: CHROME });
const page = await browser.newPage();

const firma = r => [r.x, r.y, r.width, r.height, r.fill].join("|");
let fallos = 0;

for (const pose of Object.keys(POSES)) {
  await page.goto(pathToFileURL(resolve("taly.html")).href + "?pose=" + pose, {
    waitUntil: "networkidle",
  });
  const navegador = await page.evaluate(() =>
    [...document.querySelectorAll(".taly-svg > g rect")].map(r => [
      r.getAttribute("x"), r.getAttribute("y"),
      r.getAttribute("width"), r.getAttribute("height"),
      r.getAttribute("fill"),
    ].join("|"))
  );
  const app = [...construirBase(), ...construirDetalle(pose)].map(firma);

  const igual = navegador.length === app.length &&
    navegador.every((f, i) => f === app[i]);
  console.log(`  ${pose.padEnd(12)} lab ${String(navegador.length).padStart(3)} rects, ` +
    `app ${String(app.length).padStart(3)} rects  ${igual ? "[identico]" : "[DIFIERE]"}`);
  if (!igual) {
    fallos++;
    const n = Math.max(navegador.length, app.length);
    for (let i = 0; i < n; i++) {
      if (navegador[i] !== app[i]) {
        console.log(`      rect ${i}\n        lab: ${navegador[i]}\n        app: ${app[i]}`);
        break;
      }
    }
  }
}

await browser.close();
console.log(fallos ? `\n  ${fallos} pose(s) distintas.\n` : "\n  Las dos copias dibujan exactamente lo mismo.\n");
process.exit(fallos ? 1 : 0);
