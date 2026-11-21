# Cuentas de usuario: cambios en el backend y en el front

Fecha: 21 de noviembre de 2026. Hecho desde el lado del frontend para dejar conectado y seguro todo lo de crear cuenta, entrar, recuperar la contraseña, entrar con Google, mantener la sesión y borrar la cuenta.

**Por qué existe este documento.** `backend-citaly-main` no está versionado en este repo (está en `.gitignore`) ni tiene `.git` propio. Este archivo es el único registro de lo que se tocó allí. Al final van los diffs completos contra el backend tal como estaba antes de empezar.

**Reglas que se siguieron** (las mismas de `backend-descubre-cambios.md`):

- **No se tocó `Database/`**: ni migraciones, ni seeds. Todo funciona con el esquema de las migraciones 001 a 011.
- **No se añadió ninguna dependencia** al `package.json` del backend. El correo sale por la API HTTP de Resend con el `fetch` de Node.
- Better Auth es el que ya estaba instalado (1.7.27). No se cambió de librería.

---

## Resumen

| # | Archivo | Tipo | Qué cambia |
| --- | --- | --- | --- |
| 1 | `Config/auth.js` | Modificado | Better Auth completo: contraseñas de 8 a 128 caracteres, verificar correo, recuperar contraseña, Google, sesión de 30 días, borrar cuenta, límite de intentos, cookies seguras y validación de nombre y foto. |
| 2 | `Config/entorno.js` | **Nuevo** | Lee en un solo sitio las variables que cambian entre desarrollo y producción (orígenes, URL pública, Google, correo, SSL). |
| 3 | `Utils/correo.js` | **Nuevo** | Correos de verificar, recuperar y "tu contraseña cambió", en español. Resend por HTTP, o la consola en desarrollo. |
| 4 | `Services/CuentaService.js` | **Nuevo** | Qué pasa al borrar una cuenta: bloqueo si es el único dueño de un local, cancela citas futuras, pasa el historial a "Cuenta eliminada", recalcula notas. |
| 5 | `App.js` | Modificado | CORS con los mismos orígenes que Better Auth (desde el entorno), `trust proxy` en producción y límite de 100 KB al JSON. |
| 6 | `Config/db.js` | Modificado | Con `DATABASE_SSL=false` usa `pg` (Postgres normal) en vez del driver de Neon. Hace falta para probar en local. |
| 7 | `Middlewares/authMiddleware.js` | Modificado | Errores con el formato de toda la API, `{ error: { code, message, details } }`. |
| 8 | `Controller/UsuariosController.js` | Modificado | Faltaba importar `crearError` (cualquier error ahí era un `ReferenceError`). El usuario solo puede cambiar su teléfono. |
| 9 | `Services/UsuariosServices.js` | Modificado | Valida el teléfono. Antes, sin datos, salía un 500. |
| 10 | `Routes/UsuariosRouter.js` | Modificado | Nueva ruta `PATCH /api/usuarios/me`. |
| 11 | `.env.example` | Modificado | Todas las variables nuevas, explicadas. |

La **segunda ronda** (cambio de correo, foto de perfil, dispositivos) está más abajo, con sus propios diffs en el Anexo B. **La guía de variables de entorno para el backend** tiene su propia sección.

---

## Huecos de seguridad e incongruencias que se cerraron

| Problema (antes) | Riesgo | Ahora |
| --- | --- | --- |
| Contraseña mínima de 6 en el front y la de Better Auth (8) sin declarar | El front dejaba intentar contraseñas que el servidor rechazaba | 8 a 128 en los dos lados, y el front avisa de las obvias (`12345678`, tu propio correo…). |
| Sin límite de intentos fuera de producción, y sin reglas propias | Probar contraseñas sin freno, llenar el buzón de alguien con correos de recuperar | 5 intentos por minuto al entrar, 3 correos de recuperar o verificar cada 15 min, 5 registros por hora por IP. **Probado: el 6.º intento da 429.** |
| `BETTER_AUTH_SECRET` sin longitud mínima | Un secreto corto se puede adivinar y con él firmar cookies | El servidor no arranca si tiene menos de 32 caracteres. |
| `trustedOrigins` y CORS escritos a mano en dos sitios | En producción había que editar código, y si no coincidían el login fallaba | Un solo sitio (`Config/entorno.js`): `FRONTEND_URL` y `FRONTEND_ORIGINS`. |
| Foto de perfil (`image`) aceptaba cualquier texto | Una URL `javascript:` o una imagen-espía de otro servidor que verían todos los que lean sus opiniones | Al crear, solo la de Google; después, solo por `/api/usuarios/me/foto` (segunda ronda). **Probado: `javascript:alert(1)` → 400 `INVALID_IMAGE`.** |
| Nombre sin límite | Nombres de 10.000 letras o con `<script>` | Al crear se limpia y se corta a 60. Al editar se exige de 2 a 60 sin `< > { }`. |
| `PATCH` del perfil dejaba mandar `rol_base` | El usuario se ponía "dueño" a sí mismo | Solo el teléfono, validado. **Probado: `rol_base: "dueno"` se ignora.** |
| Borrar la cuenta daba error si alguna vez reservó | `citas.usuario_id` es `ON DELETE RESTRICT` | `CuentaService.js` (abajo). **Probado de punta a punta.** |
| El dueño único de un local podía borrar su cuenta | El local se quedaba sin nadie que lo gestione | Se bloquea con un mensaje claro (`OWNS_LOCAL`). |
| La sesión vieja seguía viva hasta 5 minutos tras cambiar la contraseña | Si te roban la sesión, cambiarla no echa al ladrón al momento | Se dejó la caché de sesión en cookie **apagada** a propósito. **Probado antes y después.** |
| `requireAuth` respondía `{ error: 'No autorizado' }` | Dos formatos de error para el front | Mismo formato que el resto. |
| `UsuariosController` usaba `crearError` sin importarlo | Error 500 en vez de 401 | Importado. |

Lo que Better Auth ya hacía bien y **se comprobó**:

- **No dice si un correo existe** al pedir recuperar la contraseña: responde igual exista o no.
- **Rechaza un `redirectTo` a otro dominio**: no se puede usar el correo de recuperar para mandar a alguien a una web falsa (`INVALID_REDIRECT_URL`).
- **El enlace de recuperar sirve una sola vez** y dura 1 hora.
- **Contraseñas con scrypt**, nunca en claro.
- **Google con PKCE y `state`**, para que nadie pueda colar un inicio de sesión ajeno.
- **No une Google a una cuenta con el correo sin verificar** (`requireLocalEmailVerified`). Así nadie puede registrarse antes con el correo de otro y quedarse su cuenta cuando esa persona entre con Google.

---

## Cómo se mantiene la sesión (la pregunta del "JWT")

**No se usa JWT, a propósito.** Lo que hace Better Auth es mejor para una web:

- Al entrar, el servidor crea una sesión en la tabla `session` y manda una **cookie `httpOnly`** con su token firmado. JavaScript no puede leerla, así que un script malicioso tampoco puede robarla. Un JWT guardado en `localStorage` sí se puede robar.
- El navegador manda la cookie solo en cada petición (`credentials: 'include'` en el front).
- **Dura 30 días y se renueva sola** si el usuario entra al menos una vez al día. Quien usa la app no tiene que volver a iniciar sesión.
- Como la sesión vive en la base de datos, **se puede cerrar de verdad**: "cerrar en todos lados", cambiar la contraseña o borrar la cuenta la invalidan al momento. Un JWT no se puede anular hasta que caduca.

---

## Borrar la cuenta (`POST /api/auth/delete-user`)

1. **Hay que confirmar.** Con contraseña si la cuenta la tiene. Las cuentas de Google necesitan una sesión de menos de 1 día; si no, el front pide volver a entrar.
2. **Único dueño de un local** → no se borra y se dice por qué.
3. **Citas futuras** → se cancelan (`cancelada_por = 'cliente'`), así el local ve el hueco libre.
4. **Todas sus citas** → pasan a una cuenta fantasma `cuenta-eliminada`. Se crea sola la primera vez, no tiene contraseña y no se puede entrar con ella. Se borran también sus `notas_cliente`. El local conserva su historial y sus números sin datos de la persona.
5. **Lo demás lo hace el esquema**: sesiones, Google, favoritos, notificaciones y preferencias se borran en cascada. Las opiniones quedan sin autor (`SET NULL`).
6. **Después** se recalcula la nota y la frase destacada de los locales donde opinó, porque la frase guardaba su nombre.

**Probado:** una usuaria con una cita futura, una pasada y una opinión. La futura quedó cancelada, las dos pasaron a `cuenta-eliminada` sin notas, la opinión quedó sin autor y no quedaron sesiones.

**Riesgo pendiente:** los pasos 3 y 4 se hacen en el `beforeDelete`. Si después fallara el borrado de Better Auth, las citas ya estarían pasadas a la cuenta fantasma y el usuario seguiría existiendo. Es improbable, pero habría que revisarlo si se ve en los logs.

---

## Rutas

Todas bajo `/api/auth`, de Better Auth. El front las llama desde `src/services/auth.js`.

| Pantalla | Ruta |
| --- | --- |
| Registrarse | `POST /sign-up/email` (`callbackURL` del correo de verificar) |
| Entrar | `POST /sign-in/email` |
| Continuar con Google | `POST /sign-in/social` → devuelve la URL de Google → `GET /callback/google` |
| ¿Quién soy? | `GET /get-session` |
| Olvidé mi contraseña | `POST /request-password-reset` (con `redirectTo`) |
| Enlace del correo | `GET /reset-password/:token` → redirige a `/auth?modo=restablecer&token=…` |
| Guardar la nueva | `POST /reset-password` |
| Confirmar correo | `GET /verify-email` → `/auth?modo=verificado` |
| Reenviar confirmación | `POST /send-verification-email` |
| Cambiar contraseña | `POST /change-password` (cierra las otras sesiones) |
| Nombre | `POST /update-user` |
| Cambiar correo | `POST /change-email` → enlace al viejo → enlace al nuevo → `/auth?modo=correo` |
| Dispositivos | `GET /list-sessions`, `POST /revoke-session` |
| Foto de perfil | `POST /api/usuarios/me/foto/firma` → Cloudinary → `PUT /api/usuarios/me/foto` (`DELETE` para quitarla) |
| Teléfono | `PATCH /api/usuarios/me` (nueva, de Citaly) |
| Salir | `POST /sign-out` |
| Salir de todos lados | `POST /revoke-sessions` |
| ¿Tiene contraseña? | `GET /list-accounts` |
| Borrar cuenta | `POST /delete-user` |

---

## Guía para el backend: qué poner en el `.env` y por qué

Para el compañero del backend. Esto es lo único que hay que hacer en el servidor para que todo lo de arriba quede conectado y sin huecos. Todas las variables están en `.env.example` con un comentario. Aquí va **para qué es cada una y qué pasa si falta o se pone mal**.

> El `.env` **nunca** se sube al repositorio (ya está en `.gitignore`). En el hosting (Render, Railway, un VPS…) estas variables se ponen en su panel de "Environment", no en un archivo.

### Imprescindibles (sin ellas el servidor no arranca o la seguridad falla)

| Variable | Ejemplo | Para qué es | Si falta o se pone mal |
| --- | --- | --- | --- |
| `NODE_ENV` | `production` | Enciende lo que solo tiene sentido en producción: cookies `Secure` (solo por HTTPS), límite de intentos siempre activo, confianza en el proxy del hosting para saber la IP real, y correo obligatorio. También quita de CORS los `localhost` de desarrollo. | Sin `production`, en el servidor real las cookies viajarían sin `Secure` y cualquier `localhost` podría hablar con la API usando la sesión del usuario. |
| `DATABASE_URL` | la de Neon | Base de datos. | El servidor no arranca. |
| `BETTER_AUTH_SECRET` | 44 caracteres al azar | Firma las cookies de sesión y los enlaces de los correos (verificar, recuperar, cambiar correo). Quien lo sepa puede **fabricar sesiones de cualquier usuario**. | Si tiene menos de 32 caracteres, el servidor no arranca a propósito. Si se cambia, todo el mundo tiene que volver a entrar y los enlaces de correo enviados dejan de valer. Generar con `openssl rand -base64 32`. **Uno distinto en desarrollo y en producción.** |
| `BETTER_AUTH_URL` | `https://api.citaly.cu` | La dirección pública de **este backend**, sin `/api/auth`. Con ella se construyen los enlaces de los correos y la vuelta desde Google. | Los enlaces de los correos apuntan a `localhost` y no funcionan para nadie; Google rechaza la vuelta (`redirect_uri_mismatch`). |
| `FRONTEND_URL` | `https://usuario.github.io/citaly` | Dónde vive la web, **con su ruta base** si la tiene. Es el único origen al que se deja hablar con la API con cookies (CORS y `trustedOrigins` de Better Auth), y a donde vuelven los correos y Google. | Si no coincide exactamente con la web, el navegador bloquea las peticiones (CORS) y el login no funciona. Si se pone uno demasiado abierto, otra web podría usar la sesión del usuario. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | del panel de Cloudinary | Firmar las subidas de fotos (locales y perfil) y comprobarlas. El secreto **nunca** sale del servidor: el navegador solo recibe una firma de un solo uso. | El servidor no arranca (`Config/cloudinary.js`). |
| `APP_ENV` | `prod` | Carpeta de Cloudinary (`citaly/prod/…`). | Sin ella todo va a `citaly/dev/`: las fotos de prueba y las reales se mezclan. |

### Para que funcione el correo (recuperar contraseña, confirmar correo, cambiar correo)

| Variable | Para qué es | Si falta |
| --- | --- | --- |
| `RESEND_API_KEY` | Clave de [Resend](https://resend.com), el servicio que manda los correos. Se eligió porque tiene API HTTP: no hace falta instalar nada en el backend. Plan gratis: 3000 correos al mes. | En desarrollo los correos se escriben en la consola del backend (para probar). **En producción, recuperar la contraseña da error a propósito**: mejor un error visible que un usuario esperando un correo que nunca sale. |
| `MAIL_FROM` | Remitente, p. ej. `Citaly <no-responder@citaly.cu>`. El dominio tiene que estar **verificado en Resend** (registros DNS SPF y DKIM que da Resend). | Sin dominio verificado, Resend rechaza el envío o los correos caen en "Spam". |

### Para "Continuar con Google"

| Variable | Para qué es |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Credenciales de Google. Sin ellas el botón responde "Entrar con Google todavía no está disponible" y nada más se rompe. |

Cómo sacarlas (10 minutos):

1. [Google Cloud Console](https://console.cloud.google.com) → crear proyecto "Citaly".
2. "Pantalla de consentimiento de OAuth" → tipo **Externo**, nombre Citaly, correo de soporte y logo. Ámbitos: solo `email`, `profile` y `openid`, que es lo que pide Better Auth.
3. "Credenciales" → "Crear credenciales" → **ID de cliente de OAuth** → tipo **Aplicación web**:
   - **Orígenes de JavaScript autorizados**: el `FRONTEND_URL`, solo el origen y sin ruta (`https://usuario.github.io`).
   - **URI de redireccionamiento autorizados**: `BETTER_AUTH_URL/api/auth/callback/google` (p. ej. `https://api.citaly.cu/api/auth/callback/google`). Tiene que ser **exactamente** esa.
4. Publicar la app (pasar de "Prueba" a "Producción"). Mientras esté en prueba, solo pueden entrar los correos que se añadan como usuarios de prueba.

### Según cómo se despliegue

| Variable | Cuándo | Por qué |
| --- | --- | --- |
| `COOKIE_CROSS_SITE=true` | Solo si la web y la API están en **dominios distintos** (p. ej. `github.io` y `onrender.com`). | Para un navegador, la cookie de sesión es entonces "de terceros" y solo viaja si es `SameSite=None; Secure`. **Aviso:** Safari, y cada vez más navegadores, bloquean las cookies de terceros, así que la sesión puede no guardarse. **Lo recomendado es un mismo dominio** (`citaly.cu` para la web y `api.citaly.cu` para la API): la cookie es de primera parte, se deja en `SameSite=Lax` (más segura) y funciona en todos. |
| `FRONTEND_ORIGINS` | Si la web tiene más de una dirección (`citaly.cu` y `www.citaly.cu`). | Cada origen extra que pueda usar la sesión. Separados por coma. |
| `AUTH_REQUIRE_EMAIL_VERIFICATION=true` | **Cuando el correo esté probado en producción.** | Obliga a confirmar el correo antes de poder entrar. Evita cuentas con correos ajenos o inventados. Se dejó apagado al principio para no dejar fuera a nadie si el correo tarda. |
| `DATABASE_SSL=false` | **Solo** para un Postgres local de pruebas. | Neon exige SSL. **Nunca** en producción: la conexión a la base viajaría sin cifrar. |
| `PORT` | El que pida el hosting. | Muchos hostings lo ponen solos. |

### Lista para el día del despliegue

- [ ] `NODE_ENV=production`.
- [ ] `BETTER_AUTH_SECRET` nuevo, solo para producción, de 32 caracteres o más.
- [ ] `BETTER_AUTH_URL` y `FRONTEND_URL` con `https://` y sin barra al final.
- [ ] La API sirve **solo por HTTPS** (el hosting lo da; si es un VPS, un proxy con Let's Encrypt).
- [ ] Mismo dominio para web y API, o `COOKIE_CROSS_SITE=true` sabiendo lo de Safari.
- [ ] Resend con el dominio verificado, `RESEND_API_KEY` y `MAIL_FROM`.
- [ ] Google: credenciales nuevas, URI de redirección exacta y app publicada.
- [ ] Cloudinary y `APP_ENV=prod`.
- [ ] Probar en producción: registrarse, recibir el correo, recuperar la contraseña, entrar con Google, salir de todos lados y borrar una cuenta de prueba.
- [ ] Después de una semana sin problemas de correo: `AUTH_REQUIRE_EMAIL_VERIFICATION=true`.
- [ ] En el front: `VITE_API_URL` con la dirección del backend en el build de producción.

---

## Lo que se hizo en el frontend

| Archivo | Qué hace |
| --- | --- |
| `src/services/auth.js` | Todas las acciones de cuenta contra `/api/auth/*`, los mensajes en español de cada código de Better Auth y la validación de la contraseña. `rutaSegura()` evita que `?volver=https://otro.sitio` saque al usuario de Citaly. También el cambio de correo, los dispositivos y la subida de la foto a Cloudinary. |
| `src/services/sesion.js` | La sesión de quien usa la app (`get-session` + teléfono de `/api/usuarios/me`), compartida por toda la app. Sin backend, la demo con Laura (salir y entrar también funcionan). |
| `src/hooks/useSesion.js` | Hook para leer la sesión desde cualquier pantalla. |
| `src/pages/Auth.jsx` | Entrar, registrarse, Google, "¿Olvidaste tu contraseña?", elegir la nueva desde el enlace, correo confirmado, cambio de correo, "revisa tu correo" y los errores de enlace caducado o de Google. |
| `src/pages/Perfil.jsx` | Muestra la cuenta real, avisa si falta confirmar el correo (con "Mandar enlace"), y guarda en el servidor el nombre, el teléfono y la foto. |
| `src/components/Perfil/PanelSesion.jsx` | Menú de "Tu sesión": cambiar contraseña (solo si la cuenta tiene), cambiar correo, dispositivos, cerrar sesión, cerrar en todos lados y borrar la cuenta. |
| `src/components/Perfil/SeguridadCuenta.jsx` | Las pantallas de cambiar contraseña, cambiar correo y dispositivos (con "Cerrar" en cada uno). |
| `src/components/Perfil/EditarPerfil.jsx` | Con cuenta real el correo no se edita aquí; se cambia desde "Tu sesión" con confirmación. |

**El front nunca guarda tokens ni contraseñas**: ni en `localStorage` ni en ningún otro sitio. La sesión es la cookie `httpOnly`.

---

## Cómo se probó

No se usó la base de Neon del socio. Todo se probó contra **Postgres real en local** con [PGlite](https://pglite.dev) y `pglite-socket`, en una carpeta temporal fuera del repo. Se le aplicaron las **11 migraciones tal cual**; solo se quitó en memoria `CREATE EXTENSION pgcrypto`, que PGlite no trae y que Postgres 13+ no necesita. El backend corrió con su código real (`DATABASE_SSL=false`).

Con `curl`:

- Registro → sesión creada, correo de verificación en consola y fila en `usuarios`.
- Contraseña de 3 caracteres → `PASSWORD_TOO_SHORT`. Correo repetido → `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`.
- `GET` y `PATCH /api/usuarios/me`. `rol_base` ignorado y foto mala rechazada.
- Recuperar contraseña: existe y no existe dan la misma respuesta. `redirectTo` ajeno rechazado. El enlace redirige con el token. Contraseña nueva guardada. Token reusado → `INVALID_TOKEN`. Sesión vieja cerrada.
- Salir de todos lados → la otra sesión deja de valer al momento.
- Límite de intentos: `401 401 401 401 429 429 429`.
- Google con credenciales falsas → URL de `accounts.google.com` con `redirect_uri` correcto, PKCE y `select_account`.
- Borrar cuenta: bloqueado por ser dueña, contraseña mala → `INVALID_PASSWORD`, y borrado correcto con citas y opinión.

Desde la web (Vite con `VITE_API_URL`):

- Registrarse → entra a Perfil con el aviso "Confirma tu correo". Recargar → sigue dentro.
- Abrir el enlace del correo → "¡Correo confirmado!" y el aviso desaparece.
- Cerrar sesión → el servidor ya no ve sesión.
- Contraseña mala → "Ese correo y esa contraseña no coinciden."
- Olvidé la contraseña → enlace → elegir la nueva → entrar con ella.
- Eliminar la cuenta → pide la contraseña → "Hasta pronto", y el usuario ya no está en la base.
- "Tu sesión" → Dispositivos (este y otro, con "Cerrar") y la pantalla de cambiar la contraseña.
- **Sin** `VITE_API_URL`: la demo sigue igual (Laura, salir y "Continuar con Google" de mentira).

**No se probó**: el envío real por Resend, Google con credenciales de verdad (hace falta crearlas), la subida real de una foto a Cloudinary ni Neon.

---

## Segunda ronda (21 nov 2026, tarde): lo que quedaba pendiente

**Tampoco se tocó `Database/`** ni se añadieron dependencias.

| # | Archivo | Tipo | Qué cambia |
| --- | --- | --- | --- |
| 12 | `Config/auth.js` | Modificado | Cambiar el correo (`changeEmail`) con doble confirmación; límite de 3 intentos cada 15 min; la foto ya **no** se puede cambiar por `update-user`. |
| 13 | `Utils/correo.js` | Modificado | Nuevo correo "Confirma el cambio de correo", que va al correo viejo. |
| 14 | `Services/FotoPerfilService.js` | **Nuevo** | Foto de perfil a Cloudinary con firma del servidor, comprobación de que el archivo es del usuario y borrado de la foto vieja. |
| 15 | `Controller/UsuariosController.js`, `Routes/UsuariosRouter.js` | Modificado | `POST /api/usuarios/me/foto/firma`, `PUT /api/usuarios/me/foto` y `DELETE /api/usuarios/me/foto`. |
| 16 | `Services/CuentaService.js` | Modificado | Al borrar la cuenta se borran también sus fotos de Cloudinary. |
| 17 | `.env.example` | Modificado | Faltaban las de Cloudinary y `APP_ENV` (el backend ya las usaba). |

### Cambiar el correo

- **Si el correo actual está confirmado**: primero llega un enlace al **correo viejo** ("¿Fuiste tú?"). Solo al aprobarlo llega otro al **nuevo** para confirmarlo. Así, alguien que encuentre tu móvil con la sesión abierta no puede llevarse la cuenta a su correo.
- **Si no está confirmado**: solo se confirma el nuevo.
- **Nunca cambia sin abrir un enlace** (`updateEmailWithoutVerification: false`).
- **Probado** los dos caminos: el correo cambió solo después de abrir el o los enlaces.

### Foto de perfil

1. El navegador pide una firma (`POST /api/usuarios/me/foto/firma`). Vale para **una** subida a la carpeta `citaly/<APP_ENV>/usuarios/<id>/`.
2. Sube el archivo **directo a Cloudinary**. El backend no recibe la foto (no gasta ancho de banda) y el secreto de Cloudinary nunca sale del servidor.
3. Avisa con el `publicId` (`PUT /api/usuarios/me/foto`). El backend comprueba que es **de su carpeta** (ni de otro usuario ni de un local; también rechaza `..`), que existe y que pesa menos de 2 MB, y la pone recortada a 400×400 centrada en la cara. La foto anterior se borra de Cloudinary.
4. Al borrar la cuenta se borra toda su carpeta.

Además, ya **no** se puede poner una foto por `POST /api/auth/update-user`: antes se aceptaba cualquier URL de Cloudinary, incluida la foto de otra persona. Al crear la cuenta solo se acepta la de Google.

**Probado:** firma generada; `publicId` de otro usuario → 403; con `..` → 403; quitar foto → `null`; `update-user` con imagen → 400. **No se probó la subida real** para no escribir en el Cloudinary del socio.

### Dispositivos

`GET /api/auth/list-sessions` y `POST /api/auth/revoke-session`, ya de Better Auth. En la web: "Tu sesión" → "Dispositivos", con el navegador y el sistema de cada uno, y "Cerrar" en los que no son este. **Probado:** con dos sesiones (Windows y iPhone), cerrar la del iPhone la deja sin valor al momento.

> Nota: `list-sessions` devuelve el token de cada sesión al navegador del propio usuario, porque `revoke-session` lo necesita. Es el diseño de Better Auth. Solo lo ve el dueño de la cuenta, pero por eso **es tan importante no tener XSS** en la web: React ya escapa todo, y no se usa `dangerouslySetInnerHTML` con datos de usuarios.

### Cambiar la contraseña

`POST /api/auth/change-password` con `revokeOtherSessions: true`: al cambiarla se cierra la sesión en los demás dispositivos. La opción solo aparece si la cuenta tiene contraseña; las de Google no la tienen. **Probado:** contraseña actual mala → `INVALID_PASSWORD`; buena → cambiada.

---

## Lo que queda pendiente (y por qué no se hizo)

- **Verificación en dos pasos**: Better Auth tiene el plugin `twoFactor`, pero necesita una tabla nueva (`twoFactor`) y una columna en `"user"`. Eso es una migración en `Database/`, y esa decisión es del socio. Cuando se quiera, `npx @better-auth/cli generate` sobre `Config/auth.js` con el plugin genera el SQL.
- **Límite de intentos en memoria**: vale con un solo servidor. Con varios, o si el hosting reinicia a menudo, pasar a `rateLimit.storage: 'database'` (también necesita una tabla) o a Redis.
- **Fotos que se suben y no se confirman** (firma pedida y archivo subido, pero sin `PUT`): se quedan en la carpeta del usuario hasta que borre la cuenta. Se pueden limpiar con un job que borre lo que no sea la foto actual.
- **Borrar la cuenta en dos pasos**: los pasos de `beforeDelete` no van en la misma transacción que el borrado de Better Auth. Ver "Riesgo pendiente" arriba.
- **Cuentas de Google sin contraseña** no pueden ponerse una desde Perfil: el `setPassword` de Better Auth solo se llama desde el servidor. Pueden usar "¿Olvidaste tu contraseña?" para crear una.
- Las pantallas de la demo (Mi negocio, opiniones, socios) siguen usando la cuenta fija `USUARIO_ACTUAL_ID`. Se conectan cuando esas partes pidan sus datos al backend.

---

## Anexo A: diffs de la primera ronda

Generados con `diff -u` contra la copia del backend hecha justo antes de empezar. Los archivos nuevos van enteros. En la segunda ronda algunos de estos archivos cambiaron otra vez: ver el Anexo B.

### `Config/auth.js`

```diff
--- antes/Config/auth.js
+++ despues/Config/auth.js
@@ -1,6 +1,43 @@
 import 'dotenv/config';
 import { betterAuth } from 'better-auth';
+import { APIError } from 'better-auth/api';
 import { Pool } from 'pg';
+import {
+    cookiesEntreSitios,
+    esProduccion,
+    exigirCorreoVerificado,
+    google,
+    hayGoogle,
+    origenesPermitidos,
+    sslBaseDeDatos,
+    urlBackend,
+} from './entorno.js';
+import { correoAvisoContrasenaCambiada, correoRecuperar, correoVerificacion } from '../Utils/correo.js';
+import { antesDeBorrarCuenta, despuesDeBorrarCuenta } from '../Services/CuentaService.js';
+
+/* Cuentas de Citaly con Better Auth.
+
+   Cómo se mantiene la sesión (lo que en otras apps hace un JWT): una cookie
+   httpOnly con un token de sesión firmado. El navegador la manda sola en cada
+   petición y JavaScript no puede leerla, así que un script inyectado no puede
+   robarla (un JWT guardado en localStorage sí). La sesión dura 30 días y se
+   renueva sola si el usuario entra al menos una vez cada 30 días: no hay que
+   iniciar sesión cada vez.
+
+   Rutas que expone (todas bajo /api/auth):
+     POST sign-up/email            registro con correo
+     POST sign-in/email            entrar con correo
+     POST sign-in/social           entrar o registrarse con Google
+     GET  get-session              ¿quién soy?
+     POST sign-out                 salir de este dispositivo
+     POST revoke-sessions          salir de todos los dispositivos
+     POST request-password-reset   manda el correo de "olvidé mi contraseña"
+     POST reset-password           guarda la contraseña nueva con el token
+     POST send-verification-email  reenvía el correo de verificación
+     GET  verify-email             el enlace del correo de verificación
+     POST change-password          cambiar la contraseña sabiendo la actual
+     POST update-user              nombre y foto
+     POST delete-user              borrar la cuenta (ver CuentaService.js) */
 
 const databaseUrl = process.env.DATABASE_URL;
 const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
@@ -9,12 +46,14 @@
     throw new Error('DATABASE_URL es obligatoria para Better Auth');
 }
 
-if (!betterAuthSecret) {
-    throw new Error('BETTER_AUTH_SECRET es obligatoria para Better Auth');
+/* El secreto firma las cookies y los tokens de los correos. Uno corto se
+   puede adivinar. Generar con: openssl rand -base64 32 */
+if (!betterAuthSecret || betterAuthSecret.length < 32) {
+    throw new Error('BETTER_AUTH_SECRET es obligatoria y debe tener al menos 32 caracteres');
 }
 
 const authDatabaseUrl = new URL(databaseUrl);
-authDatabaseUrl.searchParams.set('sslmode', 'verify-full');
+if (sslBaseDeDatos) authDatabaseUrl.searchParams.set('sslmode', 'verify-full');
 
 const pool = new Pool({
     connectionString: authDatabaseUrl.toString(),
@@ -23,20 +62,162 @@
     connectionTimeoutMillis: 10000,
 });
 
+const DIA = 60 * 60 * 24;
+
+/* La foto de perfil se guarda como URL. Solo se aceptan https de Cloudinary
+   (donde el backend sube las fotos) o de Google (la foto de la cuenta de
+   Google). Así nadie pone un `javascript:` o una imagen-espía de otro sitio
+   que verían todos los que lean sus opiniones. */
+const HOSTS_FOTO = ['res.cloudinary.com', 'lh3.googleusercontent.com'];
+
+function validarFoto(image) {
+    if (image === undefined || image === null || image === '') return;
+    let url;
+    try {
+        url = new URL(image);
+    } catch {
+        throw new APIError('BAD_REQUEST', { message: 'La foto no es una dirección válida.', code: 'INVALID_IMAGE' });
+    }
+    if (url.protocol !== 'https:' || !HOSTS_FOTO.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
+        throw new APIError('BAD_REQUEST', { message: 'La foto tiene que estar subida a Citaly.', code: 'INVALID_IMAGE' });
+    }
+}
+
+function validarNombre(name) {
+    if (name === undefined) return;
+    const limpio = String(name).trim();
+    if (limpio.length < 2 || limpio.length > 60 || /[<>{}]/.test(limpio)) {
+        throw new APIError('BAD_REQUEST', { message: 'El nombre debe tener entre 2 y 60 letras.', code: 'INVALID_NAME' });
+    }
+}
+
 export const auth = betterAuth({
+    appName: 'Citaly',
+    baseURL: urlBackend,
+    basePath: '/api/auth',
     database: pool,
     secret: betterAuthSecret,
+    trustedOrigins: origenesPermitidos,
+
     emailAndPassword: {
         enabled: true,
+        minPasswordLength: 8,
+        maxPasswordLength: 128,
+        requireEmailVerification: exigirCorreoVerificado,
+        autoSignIn: true,
+        resetPasswordTokenExpiresIn: 60 * 60,
+        /* Quien cambia la contraseña porque la olvidó (o porque se la robaron)
+           queda solo: se cierran todas las sesiones abiertas. */
+        revokeSessionsOnPasswordReset: true,
+        sendResetPassword: async ({ user, url }) => {
+            await correoRecuperar(user, url);
+        },
+        onPasswordReset: async ({ user }) => {
+            await correoAvisoContrasenaCambiada(user).catch((error) => {
+                console.error('No se pudo avisar del cambio de contraseña', error);
+            });
+        },
     },
-    trustedOrigins: [
-        'http://localhost:5173',
-        'http://localhost:5500',
-        'http://127.0.0.1:5500',
-    ],
+
+    emailVerification: {
+        sendOnSignUp: true,
+        sendOnSignIn: exigirCorreoVerificado,
+        autoSignInAfterVerification: true,
+        expiresIn: 60 * 60,
+        sendVerificationEmail: async ({ user, url }) => {
+            await correoVerificacion(user, url);
+        },
+    },
+
+    /* Google solo si hay credenciales. La URL de regreso que hay que dar de
+       alta en Google Cloud es  BETTER_AUTH_URL/api/auth/callback/google */
+    socialProviders: hayGoogle
+        ? {
+            google: {
+                clientId: google.clientId,
+                clientSecret: google.clientSecret,
+                prompt: 'select_account',
+            },
+        }
+        : {},
+
+    account: {
+        /* Entrar con Google con el mismo correo de una cuenta que ya existe la
+           une a esa cuenta, pero solo si ese correo ya estaba verificado
+           (requireLocalEmailVerified, por defecto en Better Auth). Si no,
+           alguien podría registrarse antes con el correo de otro y quedarse
+           con su cuenta cuando esa persona entre con Google. */
+        accountLinking: {
+            enabled: true,
+            trustedProviders: ['google'],
+        },
+    },
+
+    session: {
+        expiresIn: 30 * DIA,
+        updateAge: DIA,
+        /* Para borrar la cuenta, la sesión tiene que ser reciente (o dar la
+           contraseña): alguien con el móvil desbloqueado de otro no puede. */
+        freshAge: DIA,
+        /* Sin caché de sesión en cookie, a propósito: con ella, una sesión
+           cerrada (salir de todos lados, cambio de contraseña, cuenta
+           borrada) seguía valiendo hasta 5 minutos en el otro dispositivo.
+           Se probó. Cuesta una consulta por petición con sesión. */
+        cookieCache: {
+            enabled: false,
+        },
+    },
+
+    user: {
+        deleteUser: {
+            enabled: true,
+            beforeDelete: antesDeBorrarCuenta,
+            afterDelete: despuesDeBorrarCuenta,
+        },
+    },
+
+    /* Límite de intentos. Better Auth ya trae uno general en producción;
+       estas rutas son las que se atacan para adivinar contraseñas o para
+       llenar el buzón de alguien. Se guarda en memoria (un solo servidor). */
+    rateLimit: {
+        enabled: esProduccion || process.env.AUTH_RATE_LIMIT === 'true',
+        window: 60,
+        max: 100,
+        customRules: {
+            '/sign-in/email': { window: 60, max: 5 },
+            '/sign-up/email': { window: 60 * 60, max: 5 },
+            '/request-password-reset': { window: 60 * 15, max: 3 },
+            '/send-verification-email': { window: 60 * 15, max: 3 },
+            '/reset-password': { window: 60 * 15, max: 5 },
+            '/change-password': { window: 60 * 15, max: 5 },
+            '/delete-user': { window: 60 * 15, max: 5 },
+        },
+    },
+
+    advanced: {
+        useSecureCookies: esProduccion,
+        cookiePrefix: 'citaly',
+        defaultCookieAttributes: cookiesEntreSitios
+            ? { sameSite: 'none', secure: true, httpOnly: true }
+            : { sameSite: 'lax', httpOnly: true },
+        ipAddress: {
+            /* Detrás de un proxy (Render, Railway…) la IP real llega aquí. */
+            ipAddressHeaders: ['x-forwarded-for'],
+        },
+    },
+
     databaseHooks: {
         user: {
             create: {
+                before: async (user) => {
+                    validarFoto(user.image);
+                    /* Al crear no se rechaza (el nombre de Google puede venir
+                       raro): se limpia. Al editar sí se valida. */
+                    const email = String(user.email).toLowerCase();
+                    let name = String(user.name ?? '').replace(/[<>{}]/g, '').trim().slice(0, 60);
+                    if (name.length < 2) name = email.split('@')[0].slice(0, 60);
+                    return { data: { ...user, name, email } };
+                },
                 after: async (user) => {
                     await pool.query(`
                         INSERT INTO usuarios (id)
@@ -45,6 +226,13 @@
                     `, [user.id]);
                 },
             },
+            update: {
+                before: async (user) => {
+                    validarNombre(user.name);
+                    validarFoto(user.image);
+                    return { data: user.name === undefined ? user : { ...user, name: String(user.name).trim() } };
+                },
+            },
         },
     },
-});
\ No newline at end of file
+});
```

### `App.js`

```diff
--- antes/App.js
+++ despues/App.js
@@ -4,6 +4,7 @@
 import helmet from 'helmet';
 import { toNodeHandler } from 'better-auth/node';
 import { auth } from './Config/auth.js';
+import { esProduccion, origenesPermitidos } from './Config/entorno.js';
 import { requestId } from './Middlewares/requestId.middleware.js';
 import { errorHandler, notFoundHandler } from './Middlewares/error.middleware.js';
 import healthRouter from './Routes/health.routes.js';
@@ -24,19 +25,16 @@
 const app = express();
 
 app.disable('x-powered-by');
+/* Detrás del proxy del hosting, req.ip y la IP que ve Better Auth para el
+   límite de intentos son las del cliente y no las del proxy. */
+if (esProduccion) app.set('trust proxy', 1);
 app.use(helmet());
 
 
+/* Orígenes desde Config/entorno.js (FRONTEND_URL y FRONTEND_ORIGINS): los
+   mismos que acepta Better Auth. En desarrollo se añaden los de Vite. */
 app.use(cors({
-	origin: [
-		'http://localhost:5173',
-		/* Vite usa el siguiente puerto libre si el 5173 está ocupado, y 4173
-		   es "vite preview". Solo desarrollo. */
-		'http://localhost:5174',
-		'http://localhost:4173',
-		'http://localhost:5500',
-		'http://127.0.0.1:5500',
-	],
+	origin: origenesPermitidos,
 	credentials: true,
 }));
 app.use(compression());
@@ -45,7 +43,7 @@
 //RUTAS DE AUTENTICACION Y AUTORIZACION DE USUARIOS
 app.all('/api/auth/*splat', toNodeHandler(auth));
 
-app.use(express.json());
+app.use(express.json({ limit: '100kb' }));
 
 //RUTAS PARA EL FUNCIONAMIENTO DE LA LOGICA DE NEGOCIO DE CITALY
 app.use('/health', healthRouter);
```

### `Config/db.js`

```diff
--- antes/Config/db.js
+++ despues/Config/db.js
@@ -1,5 +1,7 @@
 import 'dotenv/config';
-import { Pool } from '@neondatabase/serverless';
+import { Pool as PoolNeon } from '@neondatabase/serverless';
+import pg from 'pg';
+import { sslBaseDeDatos } from './entorno.js';
 
 const databaseUrl = process.env.DATABASE_URL;
 
@@ -7,6 +9,10 @@
     throw new Error('DATABASE_URL es obligatoria para usar la base de datos');
 }
 
+/* Neon (por WebSocket) en la nube; con DATABASE_SSL=false, un Postgres
+   normal (local o de pruebas) con el driver pg, que ya estaba instalado. */
+const Pool = sslBaseDeDatos ? PoolNeon : pg.Pool;
+
 const pool = new Pool({connectionString: process.env.DATABASE_URL,
     // 💡 Añade estas configuraciones para evitar que la conexión muera:
     max: 5,                   // Número máximo de conexiones en el pool (ideal para desarrollo)
```

### `Middlewares/authMiddleware.js`

```diff
--- antes/Middlewares/authMiddleware.js
+++ despues/Middlewares/authMiddleware.js
@@ -3,6 +3,12 @@
 import LocalMiembrosModel from '../Models/LocalMiembrosModel.js';
 import UsuarioModel from '../Models/UsuarioModel.js';
 
+/* Mismo formato de error que el resto de la API ({ error: { code, message,
+   details } }). Antes estas respuestas eran { error: 'texto' } y el front
+   tenía que leer dos formatos (REVISION_BACKEND.md, punto 18). */
+const fallo = (res, status, code, message) =>
+    res.status(status).json({ error: { code, message, details: {} } });
+
 const NIVELES_ADMIN = {
     cliente: 0,
     encargado: 1,
@@ -17,7 +23,7 @@
         });
 
         if(!session){
-            return res.status(401).json({ error: 'No autorizado' });
+            return fallo(res, 401, 'UNAUTHORIZED', 'Inicia sesión para continuar.');
         }
 
 
@@ -28,7 +34,7 @@
     }
     catch (error) {
         console.error('Error en la autenticación:', error);
-        return res.status(500).json({ error: 'Error en la autenticación' });
+        return fallo(res, 500, 'INTERNAL_ERROR', 'Error en la autenticación.');
     }
 }
 
@@ -37,12 +43,12 @@
     return async (req, res, next) => {
         try {
             if (!req.userId) {
-                return res.status(401).json({ error: 'No autorizado' });
+                return fallo(res, 401, 'UNAUTHORIZED', 'Inicia sesión para continuar.');
             }
 
             const localId = req.params.localId || req.params.id;
             if (!localId) {
-                return res.status(400).json({ error: 'Se requiere el localId para verificar el rol' });
+                return fallo(res, 400, 'MISSING_LOCAL_ID', 'Se requiere el localId para verificar el rol.');
             }
 
             const userRequestingId = req.userId;
@@ -51,7 +57,7 @@
             const membresia=  await LocalMiembrosModel.validarMembresia(localId, userRequestingId) ;
 
             if(!membresia || !requiredRoles.includes(membresia.rol)) {
-                return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
+                return fallo(res, 403, 'FORBIDDEN', 'No tienes permisos para realizar esta acción.');
             }
 
             next();
@@ -59,7 +65,7 @@
 
         } catch (error) {
             console.error('Error en la verificación de rol:', error);
-            return res.status(500).json({ error: 'Error en la verificación de rol' });
+            return fallo(res, 500, 'INTERNAL_ERROR', 'Error en la verificación de rol.');
         }
     }
 }
@@ -68,24 +74,24 @@
     return async (req, res, next) => {
         try {
             if (!req.userId) {
-                return res.status(401).json({ error: 'No autorizado' });
+                return fallo(res, 401, 'UNAUTHORIZED', 'Inicia sesión para continuar.');
             }
 
             if (NIVELES_ADMIN[minimumRole] === undefined) {
-                return res.status(500).json({ error: 'Configuración de rol administrativo inválida' });
+                return fallo(res, 500, 'INTERNAL_ERROR', 'Configuración de rol administrativo inválida.');
             }
 
             const usuario = await UsuarioModel.getUsuarioById(req.userId);
             const nivelActual = NIVELES_ADMIN[usuario?.admin_role];
             if (nivelActual === undefined || nivelActual < NIVELES_ADMIN[minimumRole]) {
-                return res.status(403).json({ error: 'No tiene permisos administrativos para realizar esta acción' });
+                return fallo(res, 403, 'FORBIDDEN', 'No tienes permisos administrativos para realizar esta acción.');
             }
 
             req.adminRole = usuario.admin_role;
             next();
         } catch (error) {
             console.error('Error en la verificación del rol administrativo:', error);
-            return res.status(500).json({ error: 'Error en la verificación del rol administrativo' });
+            return fallo(res, 500, 'INTERNAL_ERROR', 'Error en la verificación del rol administrativo.');
         }
     };
 };
```

### `Controller/UsuariosController.js`

```diff
--- antes/Controller/UsuariosController.js
+++ despues/Controller/UsuariosController.js
@@ -1,5 +1,6 @@
 import UsuariosServices from '../Services/UsuariosServices.js';
 import { responderError, responderExito } from '../Utils/respuestas.js';
+import { crearError } from '../Utils/validaciones.js';
 
 
 export default class UsuariosController {
@@ -23,7 +24,13 @@
         try {
             const usuarioId = req.params.usuarioId ?? req.userId;
             const userRequestId = req.userId;
-            const { usuarioData = {} } = req.body ?? {};
+            /* El propio usuario solo cambia su teléfono. rol_base y
+               admin_role no se tocan desde aquí (admin_role tiene su ruta
+               de superadmin). Nombre y foto van por Better Auth
+               (POST /api/auth/update-user). Se acepta { telefono } o el
+               formato viejo { usuarioData: { telefono } }. */
+            const cuerpo = req.body?.usuarioData ?? req.body ?? {};
+            const usuarioData = { telefono: cuerpo.telefono };
 
             if (!usuarioId) {
                 throw crearError('El usuario autenticado es obligatorio.', 401, 'UNAUTHORIZED');
```

### `Services/UsuariosServices.js`

```diff
--- antes/Services/UsuariosServices.js
+++ despues/Services/UsuariosServices.js
@@ -36,7 +36,18 @@
                 throw crearError('El usuario especificado no existe.', 404, 'RESOURCE_NOT_FOUND');
             }
 
-            const updatedUsuario = await UsuarioModel.updateUsuario(usuarioId, usuarioData);
+            /* Solo el teléfono, y con forma de teléfono (o null para quitarlo). */
+            const { telefono } = usuarioData ?? {};
+            if (telefono === undefined) {
+                throw crearError('No hay datos para actualizar.', 400, 'NOTHING_TO_UPDATE');
+            }
+            if (telefono !== null && (typeof telefono !== 'string' || !/^\+?[\d\s-]{6,20}$/.test(telefono.trim()))) {
+                throw crearError('El teléfono no es válido.', 400, 'INVALID_PHONE');
+            }
+
+            const updatedUsuario = await UsuarioModel.updateUsuario(usuarioId, {
+                telefono: telefono === null ? null : telefono.trim(),
+            });
             if (!updatedUsuario) {
                 throw crearError('El usuario especificado no existe.', 404, 'RESOURCE_NOT_FOUND');
             }
```

### `Routes/UsuariosRouter.js`

```diff
--- antes/Routes/UsuariosRouter.js
+++ despues/Routes/UsuariosRouter.js
@@ -5,6 +5,7 @@
 const usuariosRouter = Router();
 
 usuariosRouter.get('/me', requireAuth, UsuariosController.getUsuarioById);
+usuariosRouter.patch('/me', requireAuth, UsuariosController.updateUsuario);
 
 usuariosRouter.patch(
     '/:usuarioId/admin-role',
```

### `.env.example`

```diff
--- antes/.env.example
+++ despues/.env.example
@@ -1,4 +1,35 @@
 NODE_ENV=development
 PORT=1234
+
+# Postgres (Neon). Con un Postgres local sin SSL: DATABASE_SSL=false
 DATABASE_URL=
-BETTER_AUTH_SECRET=
\ No newline at end of file
+# DATABASE_SSL=false
+
+# Better Auth. Secreto de al menos 32 caracteres: openssl rand -base64 32
+BETTER_AUTH_SECRET=
+# Dirección pública de ESTE backend (sin /api/auth). En local:
+BETTER_AUTH_URL=http://localhost:1234
+
+# Dónde vive la web, con su ruta base si la tiene (enlaces de correos, regreso de Google)
+FRONTEND_URL=http://localhost:5173
+# Orígenes extra permitidos, separados por coma (opcional)
+# FRONTEND_ORIGINS=https://citaly.cu,https://www.citaly.cu
+
+# Front y backend en dominios distintos (github.io + onrender.com): true.
+# Mismo dominio (citaly.cu + api.citaly.cu): déjalo sin poner.
+# COOKIE_CROSS_SITE=true
+
+# Google (opcional). En Google Cloud > Credenciales > ID de cliente OAuth (web):
+#   Orígenes autorizados: FRONTEND_URL
+#   URI de redirección:  BETTER_AUTH_URL/api/auth/callback/google
+GOOGLE_CLIENT_ID=
+GOOGLE_CLIENT_SECRET=
+
+# Correo (Resend, https://resend.com). Sin clave, en desarrollo los correos salen por consola.
+RESEND_API_KEY=
+MAIL_FROM=Citaly <no-responder@tu-dominio>
+
+# Exigir el correo verificado para entrar (recomendado cuando el correo funcione)
+# AUTH_REQUIRE_EMAIL_VERIFICATION=true
+# Probar el límite de intentos fuera de producción
+# AUTH_RATE_LIMIT=true
```

### `Config/entorno.js` (nuevo)

```js
import 'dotenv/config';

/* Todo lo que cambia entre desarrollo y producción, leído en un solo sitio.
   Antes los orígenes de CORS y de Better Auth estaban escritos a mano en
   App.js y en Config/auth.js (REVISION_BACKEND.md, punto 19). */

const lista = (valor) => String(valor ?? '')
    .split(',')
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export const esProduccion = process.env.NODE_ENV === 'production';

/* Orígenes de desarrollo: Vite (5173, y los siguientes si está ocupado),
   `vite preview` (4173) y Live Server (5500). */
const ORIGENES_DESARROLLO = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:4173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

/* FRONTEND_URL: dónde vive la web, con su ruta base si la tiene
   (p. ej. https://usuario.github.io/citaly). Se usa para construir los
   enlaces de los correos y los regresos de Google.
   FRONTEND_ORIGINS: orígenes extra permitidos (coma). */
export const urlFrontend = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');

export const origenesPermitidos = [...new Set([
    new URL(urlFrontend).origin,
    ...lista(process.env.FRONTEND_ORIGINS),
    ...(esProduccion ? [] : ORIGENES_DESARROLLO),
])];

/* Dirección pública del backend, sin /api/auth. Better Auth la necesita para
   firmar los enlaces de los correos y el regreso de Google. */
export const urlBackend = (process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 1234}`).replace(/\/+$/, '');

/* Front y backend en dominios distintos (p. ej. github.io y onrender.com):
   la cookie de sesión tiene que ser SameSite=None; Secure para viajar. Si
   comparten dominio (citaly.cu y api.citaly.cu) mejor dejarlo en false. */
export const cookiesEntreSitios = process.env.COOKIE_CROSS_SITE === 'true';

/* Postgres con SSL. Neon lo exige; un Postgres local no lo tiene. */
export const sslBaseDeDatos = process.env.DATABASE_SSL !== 'false';

export const google = {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
};
export const hayGoogle = Boolean(google.clientId && google.clientSecret);

/* Correo saliente. Con RESEND_API_KEY se manda por Resend (API HTTP, sin
   dependencias). Sin ella, en desarrollo el enlace se escribe en la consola;
   en producción es un error de configuración. */
export const correo = {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    remitente: process.env.MAIL_FROM ?? 'Citaly <no-responder@citaly.app>',
};

/* Exigir el correo verificado antes de poder entrar. Por defecto no: en Cuba
   el correo a veces tarda y no queremos dejar a nadie fuera. Se recomienda
   activarlo cuando el envío de correo esté probado. */
export const exigirCorreoVerificado = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';
```

### `Utils/correo.js` (nuevo)

```js
import { correo, esProduccion } from '../Config/entorno.js';

/* Envío de correos de la cuenta (verificar correo, recuperar contraseña,
   confirmar borrado). Sin dependencias nuevas: Resend tiene API HTTP y Node
   ya trae fetch.

   Sin RESEND_API_KEY:
     - desarrollo: el correo se escribe en la consola (con el enlace) para
       poder probar el flujo sin servidor de correo.
     - producción: se lanza un error. Mejor un fallo visible que un usuario
       esperando un correo que nunca sale. */

const escapar = (texto) => String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function plantilla({ titulo, saludo, texto, boton, url, pie }) {
    return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f6f2ea;font-family:Arial,Helvetica,sans-serif;color:#1d2422">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;font-weight:bold;font-size:20px;color:#077a6f">Citaly</p>
    <h1 style="font-size:20px;margin:16px 0 8px">${escapar(titulo)}</h1>
    <p style="margin:0 0 8px">${escapar(saludo)}</p>
    <p style="margin:0 0 20px;line-height:1.5">${escapar(texto)}</p>
    <p style="margin:0 0 20px"><a href="${escapar(url)}" style="display:inline-block;background:#00c2ad;color:#0b1e1a;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">${escapar(boton)}</a></p>
    <p style="margin:0;font-size:12px;color:#5b6663;line-height:1.5">${escapar(pie)}</p>
    <p style="margin:12px 0 0;font-size:11px;color:#8a9491;word-break:break-all">${escapar(url)}</p>
  </div>
</body></html>`;
}

async function enviar({ para, asunto, html, texto }) {
    if (!correo.resendApiKey) {
        if (esProduccion) {
            throw new Error('Falta RESEND_API_KEY: no se pueden mandar correos en producción.');
        }
        console.info(`\n[correo de prueba] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`);
        return;
    }

    const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${correo.resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: correo.remitente, to: [para], subject: asunto, html, text: texto }),
        signal: AbortSignal.timeout(10000),
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        /* El detalle va al log, nunca al cliente. */
        console.error('No se pudo enviar el correo', { status: respuesta.status, detalle: detalle.slice(0, 300) });
        throw new Error('No se pudo enviar el correo.');
    }
}

const nombreDe = (user) => (user?.name ? String(user.name).split(' ')[0] : '');

export function correoVerificacion(user, url) {
    const saludo = nombreDe(user) ? `Hola, ${nombreDe(user)}:` : 'Hola:';
    const texto = 'Toca el botón para confirmar que este correo es tuyo. Así podrás recuperar tu cuenta si algún día olvidas la contraseña.';
    return enviar({
        para: user.email,
        asunto: 'Confirma tu correo en Citaly',
        texto: `${saludo}\n${texto}\n${url}\nEl enlace vale 1 hora.`,
        html: plantilla({
            titulo: 'Confirma tu correo',
            saludo,
            texto,
            boton: 'Confirmar mi correo',
            url,
            pie: 'El enlace vale 1 hora. Si no creaste una cuenta en Citaly, ignora este mensaje.',
        }),
    });
}

export function correoRecuperar(user, url) {
    const saludo = nombreDe(user) ? `Hola, ${nombreDe(user)}:` : 'Hola:';
    const texto = 'Alguien pidió cambiar la contraseña de tu cuenta de Citaly. Si fuiste tú, toca el botón y elige una nueva.';
    return enviar({
        para: user.email,
        asunto: 'Cambia tu contraseña de Citaly',
        texto: `${saludo}\n${texto}\n${url}\nEl enlace vale 1 hora.`,
        html: plantilla({
            titulo: 'Elige una contraseña nueva',
            saludo,
            texto,
            boton: 'Cambiar contraseña',
            url,
            pie: 'El enlace vale 1 hora y solo sirve una vez. Si no lo pediste tú, ignora este correo: tu contraseña sigue igual.',
        }),
    });
}

export function correoAvisoContrasenaCambiada(user) {
    const saludo = nombreDe(user) ? `Hola, ${nombreDe(user)}:` : 'Hola:';
    const texto = 'La contraseña de tu cuenta de Citaly acaba de cambiar y cerramos tus sesiones abiertas. Si no fuiste tú, escríbenos cuanto antes.';
    return enviar({
        para: user.email,
        asunto: 'Tu contraseña de Citaly cambió',
        texto: `${saludo}\n${texto}`,
        html: `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;padding:24px"><p>${escapar(saludo)}</p><p>${escapar(texto)}</p></body></html>`,
    });
}
```

### `Services/CuentaService.js` (nuevo)

```js
import { APIError } from 'better-auth/api';
import { query, withTransaction } from '../Config/db.js';
import ResumenLocalModel from '../Models/ResumenLocalModel.js';

/* Borrar una cuenta (POST /api/auth/delete-user) sin romper a nadie.

   El problema: `citas.usuario_id` apunta a `usuarios` con ON DELETE RESTRICT.
   Borrar el "user" de Better Auth borra en cascada `usuarios`, y eso choca
   con sus citas: sin esto, borrar la cuenta de alguien que reservó alguna vez
   daba error.

   Lo que se hace (sin tocar el esquema):
     1. Si es el único dueño de un local, NO se borra: el local se quedaría sin
        nadie que lo gestione. Primero tiene que cerrarlo o pasárselo a otro.
     2. Sus citas futuras se cancelan (el local ve el hueco libre).
     3. Todas sus citas pasan a una cuenta fantasma "Cuenta eliminada". El
        local conserva su historial y sus números, sin datos de la persona.
     4. Lo demás cae solo por las claves del esquema: sesiones, cuentas de
        Google, favoritos, notificaciones y preferencias se borran
        (CASCADE); sus opiniones se quedan sin autor (SET NULL).
     5. Después se recalcula la nota y la frase destacada de los locales donde
        opinó (la frase guardaba su nombre). */

export const ID_CUENTA_ELIMINADA = 'cuenta-eliminada';

/* Locales donde opinó, para recalcularlos después del borrado. */
const pendientesDeRecalcular = new Map();

async function asegurarCuentaFantasma(client) {
    await client.query(`
        INSERT INTO "user" (id, name, email, "emailVerified")
        VALUES ($1, 'Cuenta eliminada', 'cuenta-eliminada@citaly.invalid', FALSE)
        ON CONFLICT (id) DO NOTHING
    `, [ID_CUENTA_ELIMINADA]);
    await client.query(`
        INSERT INTO usuarios (id) VALUES ($1) ON CONFLICT (id) DO NOTHING
    `, [ID_CUENTA_ELIMINADA]);
}

export async function antesDeBorrarCuenta(user) {
    if (user.id === ID_CUENTA_ELIMINADA) {
        throw new APIError('FORBIDDEN', { message: 'Esta cuenta no se puede borrar.', code: 'CANNOT_DELETE' });
    }

    const { rows: localesSolo } = await query(`
        SELECT l.id, l.nombre
        FROM local_miembros m
        INNER JOIN locales l ON l.id = m.local_id
        WHERE m.usuario_id = $1
            AND m.rol = 'dueno'
            AND NOT EXISTS (
                SELECT 1 FROM local_miembros otro
                WHERE otro.local_id = m.local_id
                    AND otro.rol = 'dueno'
                    AND otro.usuario_id <> m.usuario_id
            )
    `, [user.id]);

    if (localesSolo.length > 0) {
        const nombres = localesSolo.map((l) => l.nombre).join(', ');
        throw new APIError('BAD_REQUEST', {
            message: `Eres el único dueño de ${nombres}. Cierra el local o pásaselo a otra persona antes de borrar tu cuenta.`,
            code: 'OWNS_LOCAL',
        });
    }

    const { rows: opino } = await query(
        'SELECT DISTINCT local_id FROM opiniones WHERE usuario_id = $1',
        [user.id],
    );
    pendientesDeRecalcular.set(user.id, opino.map((r) => r.local_id));

    await withTransaction(async (client) => {
        await asegurarCuentaFantasma(client);
        await client.query(`
            UPDATE citas
            SET estado_reserva = 3, cancelada_por = 'cliente', cancelada_en = now()
            WHERE usuario_id = $1
                AND estado_reserva <> 3
                AND (fecha + horario) >= (now() AT TIME ZONE 'America/Havana')
        `, [user.id]);
        await client.query(`
            UPDATE citas SET usuario_id = $2, notas_cliente = NULL WHERE usuario_id = $1
        `, [user.id, ID_CUENTA_ELIMINADA]);
    });
}

export async function despuesDeBorrarCuenta(user) {
    const locales = pendientesDeRecalcular.get(user.id) ?? [];
    pendientesDeRecalcular.delete(user.id);
    for (const localId of locales) {
        try {
            await ResumenLocalModel.recalcular(localId);
        } catch (error) {
            /* No es grave: el job nocturno lo recalcula. */
            console.error('No se pudo recalcular el local tras borrar una cuenta', { localId, error });
        }
    }
}
```


---

## Anexo B: diffs de la segunda ronda

Contra el estado tras la primera ronda.

### `Config/auth.js`

```diff
--- ronda1/Config/auth.js
+++ ronda2/Config/auth.js
@@ -12,7 +12,7 @@
     sslBaseDeDatos,
     urlBackend,
 } from './entorno.js';
-import { correoAvisoContrasenaCambiada, correoRecuperar, correoVerificacion } from '../Utils/correo.js';
+import { correoAvisoContrasenaCambiada, correoCambioCorreo, correoRecuperar, correoVerificacion } from '../Utils/correo.js';
 import { antesDeBorrarCuenta, despuesDeBorrarCuenta } from '../Services/CuentaService.js';
 
 /* Cuentas de Citaly con Better Auth.
@@ -36,7 +36,10 @@
      POST send-verification-email  reenvía el correo de verificación
      GET  verify-email             el enlace del correo de verificación
      POST change-password          cambiar la contraseña sabiendo la actual
-     POST update-user              nombre y foto
+     POST update-user              nombre (la foto va por /api/usuarios/me/foto)
+     POST change-email             cambiar el correo (confirma el viejo y el nuevo)
+     GET  list-sessions            dispositivos con la sesión abierta
+     POST revoke-session           cerrar uno de ellos
      POST delete-user              borrar la cuenta (ver CuentaService.js) */
 
 const databaseUrl = process.env.DATABASE_URL;
@@ -64,13 +67,13 @@
 
 const DIA = 60 * 60 * 24;
 
-/* La foto de perfil se guarda como URL. Solo se aceptan https de Cloudinary
-   (donde el backend sube las fotos) o de Google (la foto de la cuenta de
-   Google). Así nadie pone un `javascript:` o una imagen-espía de otro sitio
+/* La foto de perfil se guarda como URL. Al crear la cuenta solo se acepta
+   la de Google (https de googleusercontent.com). Después solo se cambia por
+   /api/usuarios/me/foto (Services/FotoPerfilService.js), que comprueba en
+   Cloudinary que el archivo está en la carpeta del propio usuario. Así nadie
+   pone un `javascript:`, una imagen-espía de otro sitio o la foto de otro,
    que verían todos los que lean sus opiniones. */
-const HOSTS_FOTO = ['res.cloudinary.com', 'lh3.googleusercontent.com'];
-
-function validarFoto(image) {
+function validarFotoAlCrear(image) {
     if (image === undefined || image === null || image === '') return;
     let url;
     try {
@@ -78,11 +81,16 @@
     } catch {
         throw new APIError('BAD_REQUEST', { message: 'La foto no es una dirección válida.', code: 'INVALID_IMAGE' });
     }
-    if (url.protocol !== 'https:' || !HOSTS_FOTO.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
+    if (url.protocol !== 'https:' || !(url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) {
         throw new APIError('BAD_REQUEST', { message: 'La foto tiene que estar subida a Citaly.', code: 'INVALID_IMAGE' });
     }
 }
 
+function validarFotoAlEditar(image) {
+    if (image === undefined || image === null) return;
+    throw new APIError('BAD_REQUEST', { message: 'La foto se cambia desde Mi perfil.', code: 'INVALID_IMAGE' });
+}
+
 function validarNombre(name) {
     if (name === undefined) return;
     const limpio = String(name).trim();
@@ -169,6 +177,18 @@
     },
 
     user: {
+        /* Cambiar el correo. Si el actual está verificado, primero lo aprueba
+           el correo VIEJO (por si alguien tiene la sesión abierta y quiere
+           llevarse la cuenta) y luego se confirma el NUEVO. Si el actual no
+           está verificado, solo se confirma el nuevo. Nunca se cambia sin
+           confirmar. */
+        changeEmail: {
+            enabled: true,
+            updateEmailWithoutVerification: false,
+            sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
+                await correoCambioCorreo(user, newEmail, url);
+            },
+        },
         deleteUser: {
             enabled: true,
             beforeDelete: antesDeBorrarCuenta,
@@ -191,6 +211,7 @@
             '/reset-password': { window: 60 * 15, max: 5 },
             '/change-password': { window: 60 * 15, max: 5 },
             '/delete-user': { window: 60 * 15, max: 5 },
+            '/change-email': { window: 60 * 15, max: 3 },
         },
     },
 
@@ -210,7 +231,7 @@
         user: {
             create: {
                 before: async (user) => {
-                    validarFoto(user.image);
+                    validarFotoAlCrear(user.image);
                     /* Al crear no se rechaza (el nombre de Google puede venir
                        raro): se limpia. Al editar sí se valida. */
                     const email = String(user.email).toLowerCase();
@@ -229,7 +250,7 @@
             update: {
                 before: async (user) => {
                     validarNombre(user.name);
-                    validarFoto(user.image);
+                    validarFotoAlEditar(user.image);
                     return { data: user.name === undefined ? user : { ...user, name: String(user.name).trim() } };
                 },
             },
```

### `Utils/correo.js`

```diff
--- ronda1/Utils/correo.js
+++ ronda2/Utils/correo.js
@@ -96,6 +96,26 @@
     });
 }
 
+/* Va al correo VIEJO: si alguien con la sesión abierta intenta llevarse la
+   cuenta a su correo, el dueño de verdad es quien tiene que aprobarlo. */
+export function correoCambioCorreo(user, nuevoCorreo, url) {
+    const saludo = nombreDe(user) ? `Hola, ${nombreDe(user)}:` : 'Hola:';
+    const texto = `Alguien pidió cambiar el correo de tu cuenta de Citaly a ${nuevoCorreo}. Si fuiste tú, toca el botón; después te mandaremos otro enlace al correo nuevo para confirmarlo.`;
+    return enviar({
+        para: user.email,
+        asunto: 'Confirma el cambio de correo en Citaly',
+        texto: `${saludo}\n${texto}\n${url}\nEl enlace vale 1 hora.`,
+        html: plantilla({
+            titulo: 'Cambio de correo',
+            saludo,
+            texto,
+            boton: 'Sí, cambiar mi correo',
+            url,
+            pie: 'Si no lo pediste tú, no toques nada y cambia tu contraseña: alguien puede tener tu sesión abierta.',
+        }),
+    });
+}
+
 export function correoAvisoContrasenaCambiada(user) {
     const saludo = nombreDe(user) ? `Hola, ${nombreDe(user)}:` : 'Hola:';
     const texto = 'La contraseña de tu cuenta de Citaly acaba de cambiar y cerramos tus sesiones abiertas. Si no fuiste tú, escríbenos cuanto antes.';
```

### `Services/CuentaService.js`

```diff
--- ronda1/Services/CuentaService.js
+++ ronda2/Services/CuentaService.js
@@ -1,6 +1,7 @@
 import { APIError } from 'better-auth/api';
 import { query, withTransaction } from '../Config/db.js';
 import ResumenLocalModel from '../Models/ResumenLocalModel.js';
+import FotoPerfilService from './FotoPerfilService.js';
 
 /* Borrar una cuenta (POST /api/auth/delete-user) sin romper a nadie.
 
@@ -18,7 +19,7 @@
      4. Lo demás cae solo por las claves del esquema: sesiones, cuentas de
         Google, favoritos, notificaciones y preferencias se borran
         (CASCADE); sus opiniones se quedan sin autor (SET NULL).
-     5. Después se recalcula la nota y la frase destacada de los locales donde
+     5. Después se borran sus fotos de perfil de Cloudinary y se recalcula la nota y la frase destacada de los locales donde
         opinó (la frase guardaba su nombre). */
 
 export const ID_CUENTA_ELIMINADA = 'cuenta-eliminada';
@@ -86,6 +87,7 @@
 }
 
 export async function despuesDeBorrarCuenta(user) {
+    await FotoPerfilService.borrarTodas(user.id);
     const locales = pendientesDeRecalcular.get(user.id) ?? [];
     pendientesDeRecalcular.delete(user.id);
     for (const localId of locales) {
```

### `Controller/UsuariosController.js`

```diff
--- ronda1/Controller/UsuariosController.js
+++ ronda2/Controller/UsuariosController.js
@@ -1,6 +1,7 @@
 import UsuariosServices from '../Services/UsuariosServices.js';
 import { responderError, responderExito } from '../Utils/respuestas.js';
 import { crearError } from '../Utils/validaciones.js';
+import FotoPerfilService from '../Services/FotoPerfilService.js';
 
 
 export default class UsuariosController {
@@ -26,7 +27,7 @@
             const userRequestId = req.userId;
             /* El propio usuario solo cambia su teléfono. rol_base y
                admin_role no se tocan desde aquí (admin_role tiene su ruta
-               de superadmin). Nombre y foto van por Better Auth
+               de superadmin). El nombre va por Better Auth
                (POST /api/auth/update-user). Se acepta { telefono } o el
                formato viejo { usuarioData: { telefono } }. */
             const cuerpo = req.body?.usuarioData ?? req.body ?? {};
@@ -43,6 +44,33 @@
         }
     }
 
+    /* Foto de perfil (Services/FotoPerfilService.js). Siempre la del usuario
+       de la sesión: no hay :usuarioId en estas rutas. */
+    static async firmarFoto(req, res) {
+        try {
+            return responderExito(res, FotoPerfilService.firmarSubida(req.userId));
+        } catch (error) {
+            return responderError(res, error, 'Error al preparar la subida de la foto');
+        }
+    }
+
+    static async ponerFoto(req, res) {
+        try {
+            const resultado = await FotoPerfilService.ponerFoto(req.userId, req.body?.publicId);
+            return responderExito(res, resultado);
+        } catch (error) {
+            return responderError(res, error, 'Error al guardar la foto');
+        }
+    }
+
+    static async quitarFoto(req, res) {
+        try {
+            return responderExito(res, await FotoPerfilService.quitarFoto(req.userId));
+        } catch (error) {
+            return responderError(res, error, 'Error al quitar la foto');
+        }
+    }
+
     static async updateAdminRole(req, res) {
         try {
             const { usuarioId } = req.params;
```

### `Routes/UsuariosRouter.js`

```diff
--- ronda1/Routes/UsuariosRouter.js
+++ ronda2/Routes/UsuariosRouter.js
@@ -6,6 +6,9 @@
 
 usuariosRouter.get('/me', requireAuth, UsuariosController.getUsuarioById);
 usuariosRouter.patch('/me', requireAuth, UsuariosController.updateUsuario);
+usuariosRouter.post('/me/foto/firma', requireAuth, UsuariosController.firmarFoto);
+usuariosRouter.put('/me/foto', requireAuth, UsuariosController.ponerFoto);
+usuariosRouter.delete('/me/foto', requireAuth, UsuariosController.quitarFoto);
 
 usuariosRouter.patch(
     '/:usuarioId/admin-role',
```

### `Services/FotoPerfilService.js` (nuevo)

```js
import { randomUUID } from 'node:crypto';
import cloudinary from '../Config/cloudinary.js';
import { query } from '../Config/db.js';
import { crearError } from '../Utils/validaciones.js';

/* Foto de perfil del usuario, subida directa del navegador a Cloudinary con
   firma del servidor (como ya se hace con las fotos de los locales en
   MediaService.js). El secreto de Cloudinary nunca llega al navegador.

     1. POST /api/usuarios/me/foto/firma   el servidor firma UNA subida a la
                                           carpeta del propio usuario.
     2. El navegador sube el archivo a Cloudinary con esa firma.
     3. PUT  /api/usuarios/me/foto         { publicId } el servidor comprueba
                                           que es de su carpeta, que existe y
                                           que pesa menos de 2 MB, y la pone.
     4. DELETE /api/usuarios/me/foto       la quita.

   La foto vieja se borra de Cloudinary al cambiarla o quitarla, y todas las
   del usuario al borrar la cuenta (CuentaService.js). */

const BASE = `citaly/${process.env.APP_ENV ?? 'dev'}`;
const MAX_BYTES = 2 * 1024 * 1024;
const FORMATOS = 'jpg,jpeg,png,webp';

export const carpetaUsuario = (usuarioId) => `${BASE}/usuarios/${usuarioId}`;

/* El public_id dentro de una URL de Cloudinary nuestra, o null. */
function publicIdDeUrl(url) {
    if (!url) return null;
    try {
        const { hostname, pathname } = new URL(url);
        if (hostname !== 'res.cloudinary.com') return null;
        const trozo = pathname.split('/image/upload/')[1];
        if (!trozo) return null;
        /* Quita transformaciones (w_400,…) y la versión (v123) y la extensión. */
        const partes = trozo.split('/').filter((p) => !/^v\d+$/.test(p) && !p.includes(','));
        return partes.join('/').replace(/\.[a-z0-9]+$/i, '');
    } catch {
        return null;
    }
}

export default class FotoPerfilService {
    static firmarSubida(usuarioId) {
        const timestamp = Math.round(Date.now() / 1000);
        const publicId = `${carpetaUsuario(usuarioId)}/${randomUUID()}`;
        const assetFolder = carpetaUsuario(usuarioId);
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, public_id: publicId, asset_folder: assetFolder, allowed_formats: FORMATOS },
            process.env.CLOUDINARY_API_SECRET,
        );
        return {
            signature,
            timestamp,
            publicId,
            assetFolder,
            allowedFormats: FORMATOS,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        };
    }

    static async ponerFoto(usuarioId, publicId) {
        if (typeof publicId !== 'string' || !publicId.startsWith(`${carpetaUsuario(usuarioId)}/`) || publicId.includes('..')) {
            /* Una foto de otra carpeta (de otro usuario o de un local) no vale. */
            throw crearError('Esa foto no es tuya.', 403, 'FORBIDDEN');
        }

        let asset;
        try {
            asset = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        } catch (error) {
            const codigo = error?.http_code ?? error?.error?.http_code;
            if (codigo === 404) throw crearError('La foto no se encuentra.', 404, 'IMAGEN_NO_ENCONTRADA');
            throw crearError('No se pudo comprobar la foto.', 502, 'CLOUDINARY_ERROR');
        }
        if (asset.bytes > MAX_BYTES) {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
            throw crearError('La foto supera 2 MB.', 400, 'IMAGEN_MUY_GRANDE');
        }

        /* Cuadrada, centrada en la cara y en el formato que mejor lea cada navegador. */
        const url = cloudinary.url(publicId, {
            secure: true,
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face',
            fetch_format: 'auto',
            quality: 'auto',
            version: asset.version,
        });

        const { rows } = await query('SELECT image FROM "user" WHERE id = $1', [usuarioId]);
        await query('UPDATE "user" SET image = $1, "updatedAt" = now() WHERE id = $2', [url, usuarioId]);
        await FotoPerfilService.borrarSiEsMia(usuarioId, rows[0]?.image, publicId);
        return { foto: url };
    }

    static async quitarFoto(usuarioId) {
        const { rows } = await query('SELECT image FROM "user" WHERE id = $1', [usuarioId]);
        await query('UPDATE "user" SET image = NULL, "updatedAt" = now() WHERE id = $1', [usuarioId]);
        await FotoPerfilService.borrarSiEsMia(usuarioId, rows[0]?.image);
        return { foto: null };
    }

    /* Borra de Cloudinary la foto anterior, solo si está en la carpeta del usuario. */
    static async borrarSiEsMia(usuarioId, urlVieja, salvo = null) {
        const vieja = publicIdDeUrl(urlVieja);
        if (!vieja || vieja === salvo || !vieja.startsWith(`${carpetaUsuario(usuarioId)}/`)) return;
        await cloudinary.uploader.destroy(vieja, { resource_type: 'image' }).catch(() => {});
    }

    /* Al borrar la cuenta: todas sus fotos fuera de Cloudinary. */
    static async borrarTodas(usuarioId) {
        await cloudinary.api
            .delete_resources_by_prefix(`${carpetaUsuario(usuarioId)}/`, { resource_type: 'image' })
            .catch((error) => console.error('No se pudieron borrar las fotos del usuario', { usuarioId, error }));
    }
}
```

### `.env.example`

```diff
--- ronda1/.env.example
+++ ronda2/.env.example
@@ -19,6 +19,13 @@
 # Mismo dominio (citaly.cu + api.citaly.cu): déjalo sin poner.
 # COOKIE_CROSS_SITE=true
 
+# Cloudinary (fotos de locales y de perfil). Panel de Cloudinary > Settings > API Keys.
+CLOUDINARY_CLOUD_NAME=
+CLOUDINARY_API_KEY=
+CLOUDINARY_API_SECRET=
+# Carpeta dentro de Cloudinary: dev, staging o prod (no mezclar fotos de prueba con las reales)
+APP_ENV=dev
+
 # Google (opcional). En Google Cloud > Credenciales > ID de cliente OAuth (web):
 #   Orígenes autorizados: FRONTEND_URL
 #   URI de redirección:  BETTER_AUTH_URL/api/auth/callback/google
```
