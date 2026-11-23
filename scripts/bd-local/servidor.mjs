/* Postgres local de pruebas para el backend de Citaly.

   Por qué existe: el .env del backend apunta a la base de Neon del socio. Si se
   arranca el backend así, cada cuenta o local de prueba que se cree queda en
   SU base. Esto levanta un Postgres de verdad (PGlite, sin instalar nada) con
   las migraciones del backend aplicadas tal cual, solo en tu máquina.

   - Los datos se guardan en scripts/bd-local/datos (se conservan entre usos).
     Para empezar de cero, borra esa carpeta.
   - Escucha en 127.0.0.1:5433. Usuario y clave: postgres / postgres.
   - Lo arranca scripts/probar-local.ps1. A mano: node servidor.mjs */

import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const MIGRACIONES = path.resolve(aqui, '../../backend-citaly-main/Database/Migrations')
const DATOS = process.env.BD_LOCAL_DATOS ?? path.join(aqui, 'datos')
const PUERTO = Number(process.env.BD_LOCAL_PUERTO ?? 5433)

const db = await PGlite.create(DATOS)

/* Qué migraciones tiene ya esta base, para aplicar solo las nuevas cuando el
   backend añade una (antes solo se aplicaban al crear la base). */
const { rows } = await db.query(`SELECT to_regclass('public."user"') AS tabla, to_regclass('public._migraciones_locales') AS registro`)
const baseNueva = !rows[0].tabla
await db.exec('CREATE TABLE IF NOT EXISTS _migraciones_locales (archivo TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now())')
const archivos = fs.readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort()
if (!baseNueva && !rows[0].registro) {
  /* Base de antes del registro: tenía todas las migraciones hasta la 011. */
  for (const archivo of archivos.filter((f) => f < '012')) {
    await db.query('INSERT INTO _migraciones_locales (archivo) VALUES ($1) ON CONFLICT DO NOTHING', [archivo])
  }
}
const hechas = new Set((await db.query('SELECT archivo FROM _migraciones_locales')).rows.map((r) => r.archivo))
const pendientes = archivos.filter((f) => !hechas.has(f))
console.log(baseNueva ? 'Base nueva: aplicando migraciones…' : `Base existente en ${DATOS}`)
for (const archivo of pendientes) {
  /* PGlite no trae pgcrypto, y Postgres 13+ ya incluye gen_random_uuid(). */
  const sql = fs.readFileSync(path.join(MIGRACIONES, archivo), 'utf8').replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/g, '')
  await db.exec(sql)
  await db.query('INSERT INTO _migraciones_locales (archivo) VALUES ($1)', [archivo])
  console.log('  ✓', archivo)
}

/* El backend abre dos pools de 5 (el suyo y el de Better Auth). Con un tope
   de 10 justos, cualquier reconexión pasaba del límite y PGlite cortaba la
   conexión («Connection terminated unexpectedly»). */
const servidor = new PGLiteSocketServer({ db, port: PUERTO, host: '127.0.0.1', maxConnections: 40 })
await servidor.start()
console.log(`PG listo en 127.0.0.1:${PUERTO}  (postgres://postgres:postgres@127.0.0.1:${PUERTO}/postgres)`)

const cerrar = async () => {
  await servidor.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', cerrar)
process.on('SIGTERM', cerrar)
