#!/usr/bin/env node
/**
 * Render de un solo PNG desde un HTML, con soporte de fondo transparente.
 *
 * El render.mjs de la skill mascot-maker no expone `omitBackground`, y esta
 * mascota se necesita con fondo transparente. Este script tambien usa el Chrome
 * del sistema, porque el Chromium de Playwright no esta descargado.
 *
 *   node render-png.mjs --input lab-siluetas.html --out taly-lab.png \
 *     --selector ".sheet" --width 1200 --height 880 --scale 2 [--transparent]
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.out) {
  console.error("ERROR: se requieren --input y --out");
  process.exit(1);
}

const WIDTH = parseInt(args.width || "600", 10);
const HEIGHT = parseInt(args.height || "600", 10);
const SCALE = parseFloat(args.scale || "2");
const WAIT = parseInt(args.wait || "400", 10);
const TRANSPARENT = Boolean(args.transparent);

const CHROME_CANDIDATOS = [
  process.env.CHROMIUM_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

// Playwright vive en la carpeta de la skill mascot-maker, no en este proyecto,
// asi que hay que resolverlo por ruta absoluta.
async function cargarChromium() {
  const rutas = [
    "playwright",
    process.env.PLAYWRIGHT_MODULE,
    `${process.env.USERPROFILE}\\.cursor\\skills\\mascot-maker\\node_modules\\playwright\\index.js`,
  ].filter(Boolean);
  for (const ruta of rutas) {
    try {
      const target = ruta === "playwright" ? ruta : pathToFileURL(ruta).href;
      const pkg = await import(target);
      const chromium = pkg.chromium || (pkg.default && pkg.default.chromium);
      if (chromium) return chromium;
    } catch { /* siguiente */ }
  }
  throw new Error("No se encontro Playwright. Instalalo con: npm i -D playwright");
}

const chromium = await cargarChromium();

const exe = CHROME_CANDIDATOS.find(p => existsSync(p));
const launchOpts = { headless: true, args: ["--force-color-profile=srgb", "--hide-scrollbars"] };
if (exe) launchOpts.executablePath = exe;
console.log(`> navegador: ${exe || "(bundled)"}`);

const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
});

// Se acepta tanto una ruta de fichero como una URL ya formada. Hace falta
// admitir file:// para poder pasar parametros de consulta (?pose=...), que
// se perderian al tratar la entrada como ruta.
const esUrl = /^(https?|file):\/\//.test(args.input);
const url = esUrl ? args.input : pathToFileURL(resolve(args.input)).href;
console.log(`> cargando ${url}`);
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(WAIT);

const target = args.selector ? await page.$(args.selector) : page;
if (!target) { throw new Error(`selector no encontrado: ${args.selector}`); }

await target.screenshot({ path: resolve(args.out), omitBackground: TRANSPARENT });
console.log(`> escrito ${resolve(args.out)}`);

await browser.close();
