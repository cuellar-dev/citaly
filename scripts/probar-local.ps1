# Arranca todo para probar Citaly en local, con backend de verdad:
#
#   1. Una base Postgres local de pruebas (scripts/bd-local), con las
#      migraciones del backend. NO usa la base de Neon de tu socio.
#   2. El backend (backend-citaly-main) apuntando a esa base, en el puerto 1234.
#   3. El front (Vite) hablando con ese backend, en el puerto 5173.
#
# Uso, desde la carpeta del proyecto:
#   .\scripts\probar-local.ps1
#
# Abre tres ventanas. Para parar, cierra esas ventanas (o Ctrl+C en cada una).
# Las cuentas y locales que crees se guardan en scripts/bd-local/datos. Para
# empezar de cero, para todo y borra esa carpeta.
#
# Los correos (recuperar contraseña, confirmar correo) no se mandan: salen
# escritos en la ventana del backend, con el enlace para pulsar.
# «Continuar con Google» no funciona hasta que haya credenciales de Google.

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$bd = Join-Path $raiz 'scripts\bd-local'
$backend = Join-Path $raiz 'backend-citaly-main'

if (-not (Test-Path (Join-Path $bd 'node_modules'))) {
  Write-Host 'Primera vez: instalando la base local de pruebas…'
  Push-Location $bd; npm install --silent; Pop-Location
}
if (-not (Test-Path (Join-Path $backend 'node_modules'))) {
  Write-Host 'Instalando las dependencias del backend…'
  Push-Location $backend; npm install --silent; Pop-Location
}

# El front necesita saber dónde está el backend. Este archivo no se sube a Git.
Set-Content -Path (Join-Path $raiz '.env.development.local') -Value 'VITE_API_URL=http://localhost:1234' -Encoding ascii

# Estas variables mandan sobre el .env del backend (dotenv no pisa las que ya existen).
$entorno = @(
  "`$env:DATABASE_URL='postgres://postgres:postgres@127.0.0.1:5433/postgres'",
  "`$env:DATABASE_SSL='false'",
  "`$env:PORT='1234'",
  "`$env:BETTER_AUTH_URL='http://localhost:1234'",
  "`$env:FRONTEND_URL='http://localhost:5173'",
  "`$env:NODE_ENV='development'",
  "`$env:RESEND_API_KEY=''",
  "`$env:LOCALES_AUTOAPROBAR_SEG='20'"
) -join '; '

# Lo que ya esté corriendo no se vuelve a arrancar (así se puede lanzar el script otra vez sin duplicar ventanas).
function Escucha($puerto) { [bool](Test-NetConnection -ComputerName 127.0.0.1 -Port $puerto -InformationLevel Quiet -WarningAction SilentlyContinue) }

# 1. Base local
if (-not (Escucha 5433)) {
Start-Process powershell -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle='Citaly - base local'; Set-Location '$bd'; node servidor.mjs"
}
Write-Host 'Esperando a la base…'
$listo = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -InformationLevel Quiet -WarningAction SilentlyContinue) { $listo = $true; break }
}
if (-not $listo) { throw 'La base local no arrancó. Mira la ventana "Citaly - base local".' }

# Locales de ejemplo para Descubre (una sola vez por base).
$marca = Join-Path $bd 'datos\.sembrado'
if (-not (Test-Path $marca)) {
  Write-Host 'Cargando los locales de ejemplo en la base local…'
  Push-Location $backend
  Invoke-Expression "$entorno; node Database/Scripts/seed-descubre.js"
  Pop-Location
  Set-Content -Path $marca -Value (Get-Date -Format s)
}

# 2. Backend
if (-not (Escucha 1234)) {
Start-Process powershell -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle='Citaly - backend'; Set-Location '$backend'; $entorno; node --watch Server.js"
}

# 3. Front
if (-not (Escucha 5173)) {
Start-Process powershell -ArgumentList '-NoExit', '-Command', "`$Host.UI.RawUI.WindowTitle='Citaly - web'; Set-Location '$raiz'; npm run dev"
}

Write-Host ''
Write-Host 'Listo. Abre http://localhost:5173 (si el puerto está ocupado, Vite dirá cuál usa).'
Write-Host 'Backend: http://localhost:1234/health'
