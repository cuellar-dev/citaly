# Probar Citaly en local con el backend de verdad

Por defecto la web corre en **modo demo**: sin backend, con Laura como cuenta fija y los datos guardados en el navegador. Para probar cuentas, sesión, Descubre desde el servidor y todo lo que se vaya conectando, hay que arrancar el backend y decirle al front dónde está.

## Arrancar todo con un comando

Desde la carpeta del proyecto, en PowerShell:

```powershell
.\scripts\probar-local.ps1
```

Abre tres ventanas:

| Ventana | Qué es | Dirección |
| --- | --- | --- |
| Citaly - base local | Un Postgres de pruebas con las migraciones del backend | `127.0.0.1:5433` |
| Citaly - backend | El backend de `backend-citaly-main` apuntando a esa base | `http://localhost:1234` |
| Citaly - web | El front (Vite) hablando con ese backend | `http://localhost:5173` (o el que diga Vite) |

La primera vez instala lo que falte y carga los 33 locales de ejemplo en la base. **Para parar, cierra las tres ventanas.**

Para volver al modo demo, borra `.env.development.local` (en la raíz) y reinicia la web.

## Por qué una base local y no la de Neon

El `.env` del backend apunta a la base de Neon de tu socio. Si arrancas el backend tal cual, **cada cuenta, local o cita de prueba queda en su base**, y probar "borrar mi cuenta" actúa sobre ella. El script usa variables de entorno que mandan sobre el `.env` (`DATABASE_URL`, `DATABASE_SSL=false`…), así que **no toca ni cambia el `.env` del backend**.

Si alguna vez quieres probar contra Neon a propósito, arranca el backend a mano con `pnpm dev` dentro de `backend-citaly-main` y pon en `.env.development.local` la dirección que corresponda. Hazlo avisando a tu socio.

## Qué hay y qué no en este modo

- **Cuentas:** registrarse, entrar, salir, recuperar contraseña, cambiar correo y contraseña, dispositivos y borrar la cuenta. Todo es de verdad, solo que en tu base local.
- **Correos:** no se mandan. El enlace sale escrito en la ventana **Citaly - backend** (busca `[correo de prueba]`); cópialo en el navegador.
- **Continuar con Google:** no funciona sin credenciales de Google. Ver `docs/backend-auth-cambios.md`.
- **Fotos de perfil:** suben a la Cloudinary del `.env` del backend (carpeta `citaly/dev/usuarios/…`). Es la de tu socio; usa fotos de prueba.
- **Datos que todavía no vienen del backend:** crear locales, reservar citas, favoritos y notificaciones se guardan en el navegador (ver "Sigue siendo local" en `docs/backend-auth-cambios.md`).

## Empezar de cero

Para todo (cierra las ventanas), borra `scripts/bd-local/datos` y vuelve a lanzar el script: se crea una base nueva con migraciones y locales de ejemplo. Para limpiar también lo que el navegador guardó, borra los datos del sitio `localhost` en las herramientas del navegador.

## Si algo falla

- **"Sigue saliendo Laura":** el front no está leyendo `VITE_API_URL`. Comprueba que existe `.env.development.local` con `VITE_API_URL=http://localhost:1234`, reinicia la web y recarga con Ctrl+F5.
- **No puedo registrarme / error de conexión:** abre `http://localhost:1234/health`. Si no responde, mira la ventana **Citaly - backend**.
- **Error de CORS en la consola:** la web tiene que estar en el puerto 5173 o 5174 a 5176 (los que acepta el backend en desarrollo).
- **Se queda "Cargando…" y no responde:** reinicia la ventana de la base local y la del backend. La base local es un Postgres de pruebas (PGlite) que gestiona mal muchas peticiones a la vez.
- **Quiero ver los usuarios creados:** no hay panel. Con la base arrancada se puede consultar en `postgres://postgres:postgres@127.0.0.1:5433/postgres` con cualquier cliente de Postgres.
