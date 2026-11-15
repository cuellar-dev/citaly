# Citaly — Manual de marca

La referencia para **cualquier persona o IA que vaya a tocar algo visual** en Citaly: colores, tipografía, Taly, ilustración, iconos, formas, movimiento, temas, componentes, textos y accesibilidad.

Todo lo que dice este manual sale del código real. Cuando hay un token, un componente o un archivo que lo implementa, se cita. Si el código y el manual no coinciden, **manda el código**, y hay que actualizar este documento.

---

## Índice

0. [Antes de tocar nada: las reglas que no se rompen](#0-antes-de-tocar-nada-las-reglas-que-no-se-rompen)
1. [Qué es Citaly](#1-qué-es-citaly)
2. [Nombre y logotipo](#2-nombre-y-logotipo)
3. [Color](#3-color)
4. [Tipografía](#4-tipografía)
5. [Taly, la mascota](#5-taly-la-mascota)
6. [El mundo de Taly: ilustración a tinta](#6-el-mundo-de-taly-ilustración-a-tinta)
7. [Iconografía](#7-iconografía)
8. [Formas, superficies y sombras](#8-formas-superficies-y-sombras)
9. [Movimiento](#9-movimiento)
10. [Temas: oscuro y claro](#10-temas-oscuro-y-claro)
11. [Componentes característicos](#11-componentes-característicos)
12. [Voz y tono](#12-voz-y-tono)
13. [Accesibilidad](#13-accesibilidad)
14. [Mapa de archivos](#14-mapa-de-archivos)
15. [Deudas de marca conocidas](#15-deudas-de-marca-conocidas)
16. [Checklist antes de dar por bueno un cambio visual](#16-checklist-antes-de-dar-por-bueno-un-cambio-visual)

---

## 0. Antes de tocar nada: las reglas que no se rompen

Si solo lees una sección, que sea esta.

1. **Nada de chispitas ni destellos.** Ni estrellas de cuatro puntas, ni brillos, ni *sparkles*. No son de la marca. (Las valoraciones con estrellas de cinco puntas son otra cosa y sí se usan.)
2. **Ningún color en hex suelto.** Siempre los tokens de `src/index.css` (`var(--primary-color)`, `var(--fonts-color-primary)`…). Si el color que necesitas no existe, se crea como token en los dos temas, no en el archivo del componente.
3. **El texto en teal o mostaza usa `--primary-texto` / `--yellow-texto`,** nunca `--primary-color` / `--yellow-color`. En el tema claro, el teal y la mostaza de relleno no se leen como letra.
4. **Texto sobre foto = zona `.tema-oscuro-fijo`.** El texto encima de una foto es blanco en los dos temas.
5. **Taly no se deforma, no se recolorea y no se redibuja "parecido".** Se usan sus componentes (sección 5).
6. **Toda animación respeta `prefers-reduced-motion`** y todo efecto de *hover* va dentro de `@media (hover: hover) and (pointer: fine)`.
7. **Se anima `transform` y `opacity`.** Nunca `transition: all`.
8. **Lo decorativo va oculto a lectores de pantalla** (`aria-hidden="true"`). Taly, los dibujos a tinta y los iconos de adorno son decoración.
9. **Se revisa en móvil.** Citaly es una app para el teléfono: el diseño se valida a ~390 px de ancho, y después en escritorio.
10. **Se habla de tú, en español, cercano y corto** (sección 12).

---

## 1. Qué es Citaly

**Citaly es una app para descubrir locales y reservar cita o mesa en ellos**: restaurantes, cafeterías, bares, peluquerías, barberías, uñas, spas, tatuajes, gimnasios, dentistas… Tiene dos caras:

- **Cliente:** descubre sitios, los guarda, reserva y gestiona sus citas.
- **Dueño de un local:** gestiona su agenda del día, confirma o rechaza citas, edita su ficha y comparte su local.

**Contexto:** Cuba (empezando por Sancti Spíritus; los datos de ejemplo hablan de Cabaiguán). Los precios van en **CUP**, se contacta mucho por **WhatsApp** y por teléfono, y la conexión no siempre es buena: la app tiene que ser ligera.

### Personalidad

| Es | No es |
| --- | --- |
| Cercana, de barrio, de confianza | Corporativa o fría |
| Hecha a mano: tinta, papel, puntadas, madera | Plástica, de plantilla, "otra app más" |
| Tranquila: te da contexto para decidir | Agresiva: no mete prisa ni urgencia de venta |
| Con humor suave (Taly) | Infantil o recargada |
| Útil primero, bonita después | Decoración que estorba |

### La idea que guía todo

> **El éxito de Citaly es una reserva, no el tiempo en pantalla.**

Cualquier decisión visual que haga que la gente mire más pero reserve menos es una mala decisión. El diseño tiene que ayudar a **decidir**: ¿está abierto?, ¿cuánto cuesta?, ¿qué dice la gente?, ¿cómo llego?

---

## 2. Nombre y logotipo

### El nombre

- Se escribe **Citaly**: mayúscula inicial, el resto en minúscula. Nunca "CitaLy", "CITALY" en texto corrido, ni "Citaly app".
- En versalitas, solo como **firma pequeña** sobre el título de la pantalla (ver abajo) y en el héroe de *Sobre nosotros*.
- El nombre de la mascota, **Taly**, sale de ci**TALY**.

### El logotipo (estado actual)

**No hay un logotipo gráfico cerrado.** La marca se firma con **texto**:

- **Firma del header** (`.app-header-brand` en `src/components/AppHeader/AppHeader.css`): "CITALY" en Outfit 600, 0,75 rem, mayúsculas, espaciado `0.12em`, color `--fonts-color-primary-alternative` (teal). Va encima del título de cada pantalla ("CITALY / Descubre").
- **Palabra grande** (héroe de *Sobre nosotros*): "CITALY" en Outfit 800, con la **C** y la **Y** en teal y el resto en el color de texto, más un subrayado a mano en mostaza y menta.

Taly acompaña a la marca, pero **no es el logotipo**: no se pone junto al nombre como si fueran un isotipo.

> ⚠️ El favicon actual (`public/favicon.svg`) es el **rayo morado por defecto de Vite**. No es de la marca: está pendiente (sección 15).

---

## 3. Color

Todos los colores viven en `src/index.css`. Hay **dos paletas de interfaz** (oscura y clara) y **una paleta de Taly**, que es fija.

### 3.1 Paleta de interfaz — tema oscuro (por defecto)

| Token | Valor | Uso |
| --- | --- | --- |
| `--background-color` | `#121413` | Fondo de la página. Casi negro verdoso, **nunca negro puro** |
| `--background-color-secondary` | `#1E2221` | Barra de navegación, superficies elevadas |
| `--background-color-another` | `#252926` | Tercera superficie |
| `--superficie-alta` | `#1b201f` | Superficie intermedia (degradados de tarjeta) |
| `--superficie-honda` | `#151918` | Superficie intermedia más honda |
| `--tarjeta-fondo` | degradado `#1d2221 → #181c1b` | Fondo estándar de tarjeta |
| `--primary-color` | `#00C2AD` | **El teal de Citaly.** Botón principal, activo, foco |
| `--primary-color-strong` | `#06dfc9` | Teal más vivo (final de barras de progreso) |
| `--primary-color-weak` | `#077a6f` | Teal apagado |
| `--primary-color-weak-full` | `#06463d` | Fondo teal muy oscuro |
| `--primary-texto` | `#00C2AD` | **Texto** en teal |
| `--fonts-color-primary` | `#f0f0f0` | Texto principal |
| `--fonts-color-primary-weak` | `#bdbaba` | Texto secundario |
| `--fonts-color-primary-alternative` | `#00C2AD` | Texto de acento (firma del header) |
| `--yellow-color` | `#FFD166` | **La mostaza.** Relleno: estrellas, copete de Taly, avisos |
| `--yellow-texto` | `#FFD166` | **Texto** en mostaza |
| `--yellow-color-black` | `#90856b` | Mostaza apagada (estrellas vacías) |
| `--rosa` / `--rosa-texto` | `#ef476f` / `#ff8fa8` | Color de la sección Mi Negocio |
| `--close-color` | `rgb(197, 63, 63)` | Acción de cerrar/cancelar |
| `--peligro-texto` | `#ff8d8d` | Texto de error o de acción destructiva |
| `--ink-pale` | `#bdf4e8` | Tinta clara del mundo de Taly |
| `--ink-dark` | `#090f0e` | Tinta oscura (siluetas) |
| `--ink-light` | `#2aa795` | Tinta teal media |
| `--luna` | `#ece9df` | La luna de los estados vacíos |
| `--neutro-apagado` | `#3a403e` | Lo que se pinta "apagado" (huecos libres de agenda) |

### 3.2 Paleta de interfaz — tema claro (papel)

Se activa con `<html data-tema="claro">`. Solo cambia lo que cambia; el resto hereda.

| Token | Valor claro | Comentario |
| --- | --- | --- |
| `--background-color` | `#f6f2ea` | Papel crema, nunca blanco puro |
| `--background-color-secondary` | `#fffdf8` | Papel blanco cálido |
| `--background-color-another` | `#ede7db` | |
| `--superficie-alta` / `--superficie-honda` | `#fbf8f2` / `#efe9de` | |
| `--tarjeta-fondo` | degradado `#fffdf8 → #faf6ee` | |
| `--fonts-color-primary` | `#1b2220` | Tinta casi negra verdosa |
| `--fonts-color-primary-weak` | `#5c6662` | |
| `--primary-texto` | `#00756a` | **Teal oscurecido para que se lea** |
| `--yellow-texto` | `#8a5d00` | **Mostaza tostada para que se lea** |
| `--primary-color-strong` | `#00b3a0` | |
| `--primary-color-weak-full` | `#bfede6` | |
| `--rosa` / `--rosa-texto` | `#e0446a` / `#b8264b` | |
| `--close-color` | `#c0392b` | |
| `--peligro-texto` | `#c2304f` | |
| `--ink-pale` | `#1f8a7c` | En claro la "tinta clara" se oscurece |
| `--luna` | `#d4a73c` | En claro la luna es un sol mostaza |
| `--neutro-apagado` | `#d9d2c4` | |
| `--rincon-piedra` / `-2` | `#cfc5b2` / `#ddd4c2` | Piedras del rincón de Taly en el header |

`--primary-color` (`#00C2AD`) y `--yellow-color` (`#FFD166`) **no cambian** entre temas: son los colores de relleno de la marca.

### 3.3 Colores con transparencia: canales sueltos

Para poner transparencia a un color sin escribir un hex, hay tokens en **canales** (`r g b`):

| Para | Cómo se escribe |
| --- | --- |
| Velos y bordes finos | `rgb(var(--tinte) / calc(0.12 * var(--tinte-fuerza)))` |
| Sombras | `rgb(var(--sombra) / calc(0.3 * var(--sombra-alfa)))` |
| Fondo detrás de un modal | `rgb(var(--velo-modal) / calc(0.6 * var(--velo-alfa)))` |
| Fundir una foto con la página | `rgb(var(--fondo-rgb) / 0.8)` |

¿Por qué así? Porque **el mismo código funciona en los dos temas**. En oscuro, `--tinte` es blanco (bordes claros sobre negro); en claro, es tinta (bordes oscuros sobre papel), y `--tinte-fuerza` (1,15 en claro) compensa que la tinta sobre crema se ve más. Las sombras en claro son **marrones y cortas, de papel** (`--sombra: 74 58 36`), no negras.

`--fondo-pagina` es el fondo **real** de la página, aunque estés dentro de una zona oscura fija. Lo usan los bordes que funden una cabecera oscura con la página (la nube de plumón, sección 6.4).

### 3.4 Paleta de Taly (fija, en los dos temas)

Definida en `src/components/Taly/arte.js` (`PALETA`) y en `src/components/Taly/talyPluma.js` (`TALY_COLORES`):

| Nombre | Hex | Parte |
| --- | --- | --- |
| Menta | `#4FD8C4` | Cuerpo |
| Ala | `#2AA795` | Ala y sombra |
| Barriga | `#BDF4E8` | Barriga |
| Puntada cuerpo | `#2FBDA8` | Puntadas sobre el cuerpo |
| Puntada barriga | `#8FE0D0` | Puntadas sobre la barriga |
| Mostaza | `#FFD166` | Pico, copete y patas |
| Tinta | `#0E2E2A` | Ojo y contornos |
| Crema | `#F2EBDD` | Brillo del ojo, papel de los sobres |

**Por qué no es el teal de la interfaz:** la paleta de Taly está desplazada hacia el **menta**, más cálida y más de manualidad que el teal `#00C2AD`. Armoniza con la interfaz sin confundirse con ella: Taly es un personaje, no un botón.

### 3.5 Colores por sección (barra de navegación)

Cada pestaña de la barra inferior tiene su color (`src/components/NavBar/navbar.css`):

| Sección | Oscuro | Claro |
| --- | --- | --- |
| Descubre | `--primary-color` (teal) | `--primary-texto` |
| Mis Citas | `--yellow-color` (mostaza) | `--yellow-texto` |
| Mi Negocio | `--rosa` | `--rosa-texto` |
| Mi Perfil | `--fonts-color-primary` (el color de texto) | igual |

Ese color pinta la píldora del icono activo y la línea de luz superior. GSAP interpola `--nav-color-activo` entre ellos al cambiar de pestaña.

### 3.6 Significado de los colores

| Color | Significa |
| --- | --- |
| **Teal** | Marca, acción principal, "abierto", "confirmada", foco del teclado |
| **Mostaza** | Calidez, valoración (estrellas), Taly, "pendiente", "por cliente", acentos de ilustración |
| **Rosa** | El mundo del dueño (Mi Negocio) |
| **Rojo** (`--close-color`, `--peligro-texto`) | Cancelar, cerrado, error, borrar |
| **Crema** | Papel: sobres, tickets, el tema claro |

Teal y mostaza son **la pareja de la marca**. El rosa no se usa fuera de Mi Negocio y el rojo solo para lo que de verdad es negativo.

---

## 4. Tipografía

Tres familias, declaradas en `src/index.css` y servidas desde `src/fonts/`:

| Token | Familia real | Pesos | Para qué |
| --- | --- | --- | --- |
| `--font-familyDrink` | **Outfit** (variable 100-900; el nombre interno `'drink'` es histórico) | 600, 700, **800** | Títulos, nombres de local, cifras grandes, la firma CITALY |
| `--font-familyPrincipal` | **Quicksand** (variable 300-700) | 500, 600, **700** | Cuerpo, botones, etiquetas, formularios |
| `--font-familyMerchant` | **Merchant Copy** (400) | 400 | Detalles "de ticket": etiquetas de capítulo, notas al margen, recibos, sellos |

### Cómo combinarlas

- **Outfit para lo que se mira, Quicksand para lo que se lee.** Un título en Quicksand pierde carácter; un párrafo en Outfit cansa.
- **Merchant es un condimento.** Es una letra de máquina de recibos: dice "esto es un ticket, una nota". Se usa poco, en mayúsculas o en frases cortas, nunca para párrafos.
- **Pesos:** el 700 es el estándar de la app (el más usado con diferencia). El 800 se reserva para los títulos grandes y las cifras. Por debajo de 500 no se baja: Quicksand fina se pierde en móvil.

### Escala de referencia

| Rol | Familia | Tamaño | Peso |
| --- | --- | --- | --- |
| Firma de pantalla (CITALY) | Outfit | 0,75 rem, mayúsculas, espaciado 0,12em | 600 |
| Título de pantalla | Outfit | ~1,5 rem | 700 |
| Título de sección | Outfit | 1,25-1,5 rem | 700 |
| Nombre de local en tarjeta grande | Outfit | ~1,75 rem | 800 |
| Cifra destacada (hora, precio, métricas) | Outfit | 1,75-2,5 rem | 800 |
| Cuerpo | Quicksand | 0,9-1 rem | 500-600 |
| Botón | Quicksand | 0,9-1 rem | 700 |
| Etiqueta pequeña / eyebrow | Quicksand u Outfit | 0,7-0,75 rem, mayúsculas, espaciado 0,1-0,14em | 700 |

### Detalles técnicos obligatorios

- **Cifras que cambian** (contadores, horas, precios que se actualizan): `font-variant-numeric: tabular-nums`, para que no bailen.
- **`font-synthesis: none`** está puesto en `body`: el navegador no inventa negritas ni cursivas. Si un peso no existe, se nota; no lo pidas.
- **⚠️ Merchant Copy no tiene tildes** (á, é, í, ó, ú, ñ, ¿, ¡ salen de otra fuente). Evita textos con tildes en Merchant o asume el cambio de letra. En *Sobre nosotros* se definió el respaldo `'Merchant', 'Courier New', monospace` para que al menos sea otra letra de máquina.
- `font-display: swap` en todas: el texto aparece enseguida con la fuente del sistema y cambia cuando carga la buena.

---

## 5. Taly, la mascota

### 5.1 Quién es

> **Taly es un pajarito regordete y casero que te trae las citas, te avisa cuando toca y se pone contentísimo al confirmar.**

- **Silueta:** huevo de perfil, cabeza estrecha y cuerpo ancho, con **copete** mostaza, **ala plegada**, **barriga** clara y **dos patitas**. Mira hacia la derecha.
- **Carácter:** curioso, servicial y un poco torpe. Camina, picotea el suelo, se gira, salta y aletea. Duerme cuando no hay nada que hacer.
- **Su trabajo en la app:** es el mensajero de las citas. Aparece cuando algo está cargando, cuando no hay nada que enseñar, cuando algo sale bien, cuando hay que avisar de algo y en los errores (404).
- **Lo que no es:** no es el logotipo, no habla en bocadillos de cómic y no es un botón.

### 5.2 Los tres estilos de Taly

Taly existe en **cuatro técnicas de dibujo**. Las cuatro son el mismo personaje, con la misma silueta y la misma paleta.

| Estilo | Qué es | Dónde se usa | Archivos |
| --- | --- | --- | --- |
| **Punto de cruz (píxel)** | Taly dibujado sobre una rejilla de bloques, como bordado. Anima por fotogramas | Estados de la app: cargando, vacío, confirmación, recordatorio | `src/components/Taly/Taly.jsx`, `arte.js`, `TalyMomento.jsx` |
| **Pluma (pequeño)** | Taly dibujado con curvas y un temblor de pluma. Piezas sueltas para animar patas, torso y ala | El que vive en el header (camina por su rincón y salta al menú) y el que se posa en bordes de tarjetas | `TalyPosado.jsx`, `TalyPluma.jsx`, `talyPluma.js` |
| **A tinta (grande)** | Taly ilustrado a tinta con contorno repasado y relleno corrido, como pintado a mano | Ilustraciones grandes: 404, búsqueda vacía, *Sobre nosotros* | `taly-a-mano.svg` y sus variantes animadas; `src/components/Nosotros/TalyTinta.jsx` |
| **Pixel art de escena** | Taly sentado (26 × 29 px), pintado píxel a píxel en canvas dentro de una escena pixel art. Respira, parpadea y da cabezadas con zetas | El pie de página de Descubre (Taly en la hoguera) | `src/components/Pie/spritesFogata.js` |

> El pixel art de escena **no es** el punto de cruz: no sale de la rejilla Unicode de `arte.js`, es un sprite dibujado a mano para la resolución de la escena. Solo vive dentro de escenas pixel art; fuera de ellas, Taly va en uno de los otros tres estilos.

**Cuándo usar cuál:**

- **Momento de estado** (la app te cuenta algo): **punto de cruz**, con `TalyMomento`.
- **Adorno vivo y pequeño** en un borde: **pluma**.
- **Ilustración grande o narrativa**: **a tinta**.
- **Nunca dos estilos distintos en la misma vista** a tamaños parecidos: parecen dos personajes. (El Taly del header en pluma convive con un Taly de estado porque tienen escalas y funciones muy distintas.)

### 5.3 Taly en punto de cruz

Se dibuja como **rejilla de caracteres de bloque Unicode** (`█ ▀ ▄ ▌ ▐ ▖ ▗ ▘ ▝ ▙ ▟ ▛ ▜`), cómoda de leer y retocar, pero **se pinta en SVG**: cada glifo se traduce a sus rectángulos exactos. No se pinta como texto porque la mayoría de esos glifos no miden lo mismo en todas las fuentes y la rejilla se descuadraría.

- **Celda:** 72 × 100 (no cuadrada, para que salga regordete).
- **Poses** (10): `reposo`, `parpadeo`, `mira-atras`, `mira-abajo`, `canto`, `contento`, `ala-arriba`, `ala-abajo`, `dormido`, `busca`.
- **Escenas** (6 bucles): `hero`, `loader`, `vacio`, `confirmacion`, `recordatorio`, `mensajero`. Cada una cierra donde empieza: se repite sin tirones.
- **Objetos** fuera del cuerpo: `tarjeta`, `notas`, `sueno`, `interrogacion`… (hay un objeto `chispas` en el arte heredado: **no usarlo**, regla 0.1).

```jsx
<Taly escena="loader" tamano={28} />
<Taly escena="vacio" tamano={56} />
<Taly escena="confirmacion" tamano={72} brillo />
<Taly pose="dormido" objetos={['sueno']} />   {/* fijo, sin animar */}
```

- `brillo` añade un halo menta: **solo sobre fondo oscuro**. Sobre papel se ve como un cerco sucio.
- Respeta `prefers-reduced-motion` solo: con movimiento reducido se queda en el primer fotograma.
- El laboratorio de diseño (hojas de poses, visor, scripts de auditoría y exportación a PNG) está en `brand/mascota/`. **Si se retoca el dibujo, hay que tocar las dos copias** (`brand/mascota/taly-arte.js` y `src/components/Taly/arte.js`) y comprobar con `node paridad.mjs`. Todo está explicado en `brand/mascota/README.md`.

### 5.4 Taly a pluma

Piezas en `src/components/Taly/talyPluma.js` (viewBox `-2 -6 52 58`): `CUERPO`, `BARRIGA`, `ALA`, `COPETE`, `PICO`, `PATA_IZQ`, `PATA_DER`. Lleva un filtro de temblor suave (`baseFrequency 0.04`, `scale 1.6`).

**Su comportamiento en el header** (`TalyPosado.jsx`) es parte de la marca:

- **Pasea** por su rincón: las patas se cruzan de verdad al andar y el cuerpo sube un pelo en cada paso.
- **Picotea** el suelo inclinando el torso desde la cadera (rápido al bajar, lento al subir).
- Se **da la vuelta** y vuelve.
- Cuando se abre el menú, **salta** a la primera tabla del cartel aleteando, y vuelve al cerrarlo.
- Si la pestaña se oculta, **se para** (no se gasta batería).

### 5.5 Taly a tinta

Dibujo de `taly-a-mano.svg` (viewBox 400 × 400): contorno de tinta `#0E2E2A` en **dos pasadas** (una de 5 px y otra fina desplazada, como repasado), rellenos **corridos 3-4 px** respecto al contorno, puntadas de hilván en el cuerpo y la barriga, y el filtro de pulso (sección 6.1).

En *Sobre nosotros* (`TalyTinta.jsx`) está **por piezas animables** y con poses nuevas: `posado`, `volando` (dos alas y patas recogidas), `dormido`, `feliz`, y extras `sobre` (una cita en el pico), `lupa`, `zz` y `nido`. Los gestos (aletear, picotear, parpadear, alzar el vuelo) están en `talyMovimientos.js`.

### 5.6 Qué se puede y qué no se puede hacer con Taly

| ✅ Sí | ❌ No |
| --- | --- |
| Usar sus componentes y sus poses | Redibujarlo "parecido" con otra forma |
| Escalarlo proporcionalmente | Estirarlo, aplastarlo o girarlo para que quepa |
| Darle objetos de su mundo (sobre, lupa, nido, taza…) | Ponerle ropa, gafas de sol, accesorios ajenos |
| Animarlo con gestos de pájaro (andar, picotear, aletear, saltar) | Hacerle hacer cosas humanas (hablar con bocadillo, chocar los cinco) |
| Mantener su paleta exacta | Cambiarle el color para "que combine" |
| Ponerlo mirando a la derecha, o voltearlo cuando se gira | Ponerlo de frente (no está diseñado así) |
| Halo menta sobre fondo oscuro | Halo sobre fondo claro |
| Ocultarlo a lectores de pantalla si es adorno | Usarlo como único contenido de un botón sin texto |

---

## 6. El mundo de Taly: ilustración a tinta

Todo lo ilustrado en Citaly pertenece al **mundo de Taly**: un mundo **dibujado a mano**, de tinta, papel, puntadas y madera. Estas son sus reglas.

### 6.1 El filtro de pulso (el temblor de mano)

Es la firma visual de toda la ilustración. Hace que un trazo de ordenador parezca hecho con pluma:

```xml
<filter id="pulso" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="r" />
  <feDisplacementMap in="SourceGraphic" in2="r" scale="5" xChannelSelector="R" yChannelSelector="G" />
</filter>
```

| Uso | `baseFrequency` | `scale` |
| --- | --- | --- |
| Taly grande a tinta | 0,035 | 5 |
| Taly pequeño a pluma | 0,04 | 1,6 |
| Objetos pequeños (iconos a tinta) | 0,06 | 3-3,5 |
| Paisajes (fondo de Descubre) | 0,025 | 4 |
| Bordes finos (nube, separadores) | 0,035 | 1,4-2 |

**Regla:** cuanto más pequeño el dibujo, menos `scale`; si no, se deshace.

**Hervor de línea** (solo en *Sobre nosotros*, modo completo): cambiar la `seed` entre tres valores ~8 veces por segundo hace que la línea "tiemble viva", como en los dibujos animados a mano. Es caro: solo mientras el dibujo está en pantalla y nunca con movimiento reducido (`useHervor` en `src/components/Nosotros/tinta.js`).

### 6.2 La receta de un dibujo a tinta

1. **Contorno** en tinta (`#0E2E2A`), extremos y uniones redondeados (`stroke-linecap/linejoin: round`).
2. **Relleno** de la paleta de Taly, **desplazado 2-4 px** del contorno, como pintado después de entintar (`<Pieza>` en `src/components/Nosotros/PiezasTinta.jsx` hace exactamente esto).
3. Opcional: una **segunda pasada** de contorno más fina y desplazada (repasado).
4. Opcional: **puntadas** (trazos cortos) en un tono más claro u oscuro que el relleno.
5. Todo dentro del **filtro de pulso**.

### 6.3 Repertorio del mundo

| Elemento | Cómo es | Dónde vive |
| --- | --- | --- |
| **Nubes de plumón** | Bultos redondos arriba y base casi plana, relleno muy transparente y contorno de tinta clara | Fondo de Descubre |
| **Colinas y separadores cosidos** | Línea ondulada **discontinua** (puntadas), con un nudo en cada punta y a veces una pluma suelta | `TrazoCosido` en `src/components/DetalleLocal/Tinta.jsx` |
| **Árbol en silueta** | Ramas peladas casi negras con un filo de luz teal | `FondoDescubre.jsx` |
| **Plumas sueltas** | Pluma menta con raquis | Separadores, 3D de *Sobre nosotros* |
| **Madera** | Tablas recortadas a mano con vetas, clavos mostaza y cuerda de bramante | Menú de tablas del header |
| **Papel** | Crema `#F2EBDD` con grano de puntos de 14 px | Sobres, tickets, tema claro, cierre de *Sobre nosotros* |
| **Sobres y sellos** | Sobre crema con sello mostaza | La cita como objeto |
| **Mapa a tinta** | Calles dibujadas, un parque, ruta a puntadas y pin mostaza. **No finge ser un mapa real** | `MapaTinta` (Cómo llegar) |
| **Rincón de Taly** | Piedras, yerba y un suelo donde vive el Taly del header | `RinconTaly.jsx` |
| **Objetos de la app** | Calendario, reloj, sobre, pin, tijeras, taza, campana, plato, pluma, ticket | `src/components/Nosotros/IconosTinta.jsx` |

### 6.4 Cómo se funde una foto con la página

Una cabecera con foto (ficha de local, perfil, negocio) **no termina en un corte recto ni en un degradado**: termina en una **nube de plumón** (`NubeBorde` en `src/components/DetalleLocal/Tinta.jsx`). La nube se rellena con `--fondo-pagina`, así que se funde con lo que viene debajo en los dos temas.

### 6.5 Prohibido en la ilustración

- **Chispitas, destellos, brillos de estrella.** Ver regla 0.1. (Hay restos en el fondo de Descubre y en la cabecera de Perfil: deuda pendiente, sección 15.)
- Degradados brillantes de "app moderna", glassmorphism, neón.
- Ilustración vectorial limpia sin temblor: rompe el mundo hecho a mano.
- Fotos de stock o ilustraciones de bancos de imágenes mezcladas con el mundo de Taly.

---

## 7. Iconografía

### Iconos de interfaz: Lucide

- Librería: **`lucide-react`**. No se mezclan otras librerías de iconos.
- **Grosor de trazo:** `strokeWidth={2.25}` es el estándar de la app (2 a 2,4 según tamaño: los pequeños un poco más gruesos para que no desaparezcan).
- **Tamaños habituales:** 13-16 px en filas y etiquetas, 17-20 px en botones, 22-25 px en el header y la barra de navegación.
- **Color:** `currentColor`, para que herede del texto.
- Siempre `aria-hidden="true"` cuando acompañan a un texto. Si el botón es solo un icono, lleva `aria-label`.
- **Estrellas de valoración:** `Star` de Lucide con `fill="currentColor"`. En el tema claro se rellenan solas de mostaza de verdad (regla global en `index.css`).

### Iconos a tinta

Los objetos dibujados a mano (`IconoTinta`) son **ilustración, no interfaz**: decoran, acompañan, pueblan fondos. **No sustituyen a un icono de Lucide en un botón**: en tamaño pequeño el temblor los hace ilegibles como señal.

### Iconos propios ya existentes

- **Corazón de favorito** (`BotonFavorito`), **WhatsApp** (`IconoWhatsApp`), **brújula** (`src/svgs/Brujula.jsx`).
- **Comodidades** (wifi, climatizado, parqueo, libre de humo, transferencia…): catálogo `COMODIDADES` en `src/utils/fichaLocal.js`.

---

## 8. Formas, superficies y sombras

### Radios de esquina

| Radio | Uso |
| --- | --- |
| `999px` | **Píldoras**: botones, chips, etiquetas, interruptores. Es la forma más usada de la app |
| `12-18px` | **Tarjetas** y filas agrupadas. 14 px es el más común |
| `20-22px` | Tarjetas grandes, tarjetas con foto, paneles |
| `30px` arriba | La barra de navegación (`30px 30px 0 0`) |
| `8-10px` | Elementos pequeños dentro de tarjetas |

Las formas **dibujadas** (sellos, marcos de foto, el aro del perfil) no son círculos perfectos: llevan temblor o radios desiguales (`border-radius: 48% 52% 50% 50%`).

### Superficies

- **Tarjeta estándar:** `background: var(--tarjeta-fondo)` + borde de 1 px con `rgb(var(--tinte) / calc(0.06 * var(--tinte-fuerza)))`.
- **Filas agrupadas** (Perfil, Tu local): un contenedor redondeado con filas separadas por una línea fina, estilo ajustes.
- **Sobre foto:** la foto manda; el texto va sobre un velo oscuro solo donde hay que leer (abajo), no tapando toda la foto.

### Sombras

- En oscuro casi no hacen falta: la profundidad la dan las superficies que se aclaran hacia arriba.
- En claro, sombras **de papel**: marrones, cortas y suaves, siempre con `--sombra` y `--sombra-alfa`. Nunca `rgba(0,0,0,…)` a pelo.
- Los elementos con color (el botón teal, la tarjeta "Siguiente") pueden llevar una sombra **teñida de su propio color** muy difusa.

### Espaciado

No hay una escala de espaciado tokenizada. Los valores habituales son **múltiplos de 2 y 4**: 4, 6, 8, 10, 12, 14, 16, 18, 20, 24 px. Márgenes laterales de pantalla en móvil: **16-20 px**. Áreas táctiles de **44 px o más**.

---

## 9. Movimiento

### Principios

- **El movimiento explica, no adorna.** Cada animación responde a algo: de dónde viene un panel, que algo se confirmó, que hay que mirar aquí.
- **Lo que se usa mucho, se anima poco.** Pulsar un botón o cambiar de pestaña: respuesta inmediata y corta. Lo raro (confirmar una cita, abrir *Sobre nosotros*): ahí cabe el encanto.
- **Taly anima como un pájaro de verdad:** anticipación antes de saltar, amortiguación al caer, patas que se cruzan al andar.

### Tokens y valores

| Token | Curva | Para |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas, respuestas, casi todo |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Algo que se mueve de un sitio a otro en pantalla |

| Tipo | Duración |
| --- | --- |
| Pulsar un botón | 100-160 ms |
| Hover, color | 150-200 ms |
| Menús, desplegables | 180-300 ms |
| Paneles, modales | 250-460 ms |
| Cambio de tema | 700 ms (fundido con View Transitions) |
| Ilustración, escenas de Taly | lo que pida la escena |

**Cerrar es más rápido que abrir:** la respuesta va antes que el adorno (el menú de tablas abre en 0,46 s y cierra en 0,3 s).

### Herramientas

- **GSAP** (con `@gsap/react` y `useGSAP`) para lo coreografiado y lo ligado al scroll. Plugins en uso: ScrollTrigger, DrawSVG, MotionPath, SplitText.
- **anime.js** en *Sobre nosotros* (contadores y trazos).
- **Three.js** solo en *Sobre nosotros*, modo completo, cargado aparte.
- **CSS** (transiciones y `@keyframes`) para lo simple: hover, flotar, pulso.

### Reglas técnicas

- Animar **`transform` y `opacity`**. `clip-path` está permitido para revelados (el velo del menú). Nunca `width`, `height`, `top`, `left` ni `transition: all`.
- **Movimiento reducido obligatorio:** con `prefers-reduced-motion: reduce` se queda el fundido y se quita el desplazamiento. Taly se congela en su primer fotograma.
- **Hover solo con ratón:** `@media (hover: hover) and (pointer: fine)`. En el móvil un toque dispara hovers falsos.
- **Pausar lo que no se ve:** animaciones infinitas paradas con la pestaña oculta o fuera de pantalla.
- **El hover cambia el relleno, no enciende bordes.** Encender un borde al pasar por encima es el tic de las interfaces en piloto automático.

---

## 10. Temas: oscuro y claro

- **Oscuro** es el de siempre y **va por defecto**. Es la identidad principal: noche verdosa, tinta clara, teal y mostaza.
- **Claro** es **papel crema con tinta de Taly**. Se elige en el menú de tablas ("Modo claro") y se guarda en `localStorage` (`citaly_tema`). `index.html` lo aplica antes de pintar para que no haya fogonazo.
- El cambio se anima con **View Transitions** (fundido de 0,7 s) y, en Firefox, con una transición de color corta (`.tema-cambiando`).

### Zonas que no cambian de tema

- **`.tema-oscuro-fijo`**: todo lo que va **sobre una foto** (cabecera de la ficha de local, visor de fotos, recorte de foto…). El texto sobre foto es blanco siempre.
- **`.nosotros`**: *Sobre nosotros* es su propio mundo (noche arriba, papel abajo) y tiene su propio modo ligero.

### Al diseñar algo nuevo

1. Escribe los colores **solo con tokens**.
2. **Míralo en los dos temas** antes de darlo por bueno.
3. Si en claro queda plano: profundidad de papel (filo de luz arriba, sombra marrón corta abajo), no bordes más oscuros.

> El tema claro está en **beta**: hay zonas donde todavía se ve pobre (sección 15).

---

## 11. Componentes característicos

Son la cara de la marca. Si haces algo parecido, **reutiliza estos** en vez de crear otro.

| Componente | Qué lo hace de Citaly | Archivo |
| --- | --- | --- |
| **Header** | Firma "CITALY" + título; el rincón de Taly con su pájaro paseando; iconos a la derecha | `src/components/AppHeader/` |
| **Menú de tablas** | Cartel de tablas de madera colgado del botón ⋯, con cuerdas de bramante y clavos mostaza. Un velo crece en círculo desde el botón. Taly salta a la primera tabla | `MenuTablas.jsx` |
| **Barra de navegación** | Color por sección, píldora que se desliza con GSAP y línea de luz arriba | `src/components/NavBar/` |
| **Tarjeta de local** | Foto grande, estado de puertas ("Abierto · cierra en 2 h"), nombre en Outfit 800, estrellas, precio "desde", la frase de un cliente y comodidades | `TarjetaLocal.jsx`, `HeroeLocal.jsx` |
| **Héroe de ficha** | Carrusel de fotos a pantalla completa terminado en nube de plumón | `HeroLocal.jsx` |
| **Tarjeta de cita** | Tipo de cita, hora grande, estado en chip, profesional, total, y acciones (llegar, cancelar, WhatsApp, llamar, mapa) | `src/components/CitaCard/` |
| **Sello de cita** | Sello circular dibujado | `SelloCita.jsx` |
| **Estado vacío / momento de Taly** | Taly + título + texto + una acción. Una sola composición para todos | `TalyMomento.jsx` |
| **Línea de turno** | El día del negocio como un paisaje con sol que recorre una curva de apertura a cierre | `TimelineTurno.jsx` |
| **Cara de valoración** | Valoración con caras | `CaraRating.jsx` |
| **Pie de página (la hoguera)** | Al final de Descubre: Taly descansa junto a una hoguera con una espada de mango teal clavada (guiño a los juegos de almas), en un bosque pixel art vivo (hojas, pavesas, humo, niebla, laptop con la agenda). Al prender el fuego aparece "Descansa aquí, viajero". Siempre de noche (`.tema-oscuro-fijo`); se funde con la página desde `--fondo-pagina` y con el texto mediante `--pie-suelo`. Encuadre vertical en móvil y panorámico en PC (≥ 900 px) | `src/components/Pie/` |

### Botones

| Tipo | Aspecto |
| --- | --- |
| **Principal** | Píldora rellena teal (`--primary-color`), texto oscuro, Quicksand 700 |
| **Secundario** | Píldora con borde teal translúcido y texto `--primary-texto` |
| **Destructivo** | Píldora con borde/relleno rojo suave y texto `--peligro-texto` |
| **Fantasma** | Solo texto o icono, para acciones menores |

Todos: alto mínimo de 40-44 px, `:active` con una pequeña escala o hundimiento, y foco visible con contorno teal.

### Estados de reserva (convención de color)

| Estado | Color |
| --- | --- |
| Confirmada | Teal |
| Pendiente / por cliente | Mostaza |
| Cancelada | Rojo, texto tachado o apagado |
| Pasada | Apagado (`--fonts-color-primary-weak`) |

---

## 12. Voz y tono

### Cómo habla Citaly

- **De tú**, siempre.
- **Español cercano, con sabor cubano** donde encaja (el botón "Voy pa' allá" en Mis Citas), pero entendible en cualquier sitio. Sin jerga que excluya.
- **Frases cortas.** Una idea por frase.
- **Da contexto, no mete prisa.** "Abierto · cierra en 2 h", no "¡Corre, que cierra!". "Cerrado · abre mañana 9:00 AM", no "No disponible".
- **Explica qué pasa y qué puedes hacer.** Un mensaje vacío o de error siempre dice el siguiente paso.

### Ejemplos reales de la app

| Situación | Texto |
| --- | --- |
| No hay favoritos | "Todavía no guardas ningún sitio" + "Toca el corazón de un local que te guste y lo tendrás aquí, a mano para la próxima vez." |
| Página que no existe | "Esta página se perdió" + "El enlace que buscas no existe o ya cambió de lugar." |
| Agenda llena | "Hoy está completo" |
| Agenda libre | "No quedan citas por hoy. El resto del turno está libre." |
| Nada abierto | "Ahora mismo no hay ninguno abierto. Prueba un poco más tarde." |
| Quitar de favoritos | "Lo quitaste. Toca el corazón si quieres guardarlo otra vez." |
| Validación | "Cuéntanos un poco más (al menos 10 letras)." |

### Convenciones de escritura

- **Moneda:** `300 CUP` (número, espacio, CUP). "desde 250 CUP" en minúscula dentro de la tarjeta.
- **Hora:** formato de 12 horas con `AM` / `PM` en mayúsculas: `9:00 AM`, `4:30 PM`.
- **Días:** abreviados como `Dom-15`, `Lun-16` en tarjetas; completos en frases ("abre mañana", "abre el martes").
- **Distancia:** `A 300 m`, `A 1,7 km`.
- **Valoración:** `4.3 (4)`: nota y número de opiniones entre paréntesis.
- **Tildes y signos de apertura siempre:** "Próximas", "¿Nos vemos?". (Hoy hay alguna falta: "PROXIMAS", "Voy pa alla"; sección 15.)
- **Mayúsculas solo** en etiquetas pequeñas con espaciado (eyebrows, chips de estado), nunca en frases largas.
- **Sin emojis** en la interfaz. La expresividad la pone Taly.

### Palabras de la casa

| Usamos | Evitamos |
| --- | --- |
| Local, sitio, lugar | Establecimiento, comercio |
| Cita, reserva, mesa, turno | Booking, slot |
| Guardar, favoritos | Like, seguir |
| Opinión | Review, reseña |
| Dueño, tu local, tu negocio | Partner, merchant |

---

## 13. Accesibilidad

- **Contraste:** texto normal 4,5:1 como mínimo. Es la razón de existir de `--primary-texto` y `--yellow-texto`.
- **Foco visible:** contorno teal de 2-3 px con separación (`outline-offset`) en todo lo que se puede pulsar. Nunca `outline: none` sin un sustituto.
- **Decoración oculta:** Taly, dibujos a tinta, fondos e iconos que acompañan texto llevan `aria-hidden="true"`.
- **Texto solo para lectores de pantalla:** clase `.sr-only` (en `index.css`).
- **Botones de solo icono:** siempre `aria-label`.
- **Áreas táctiles:** 44 × 44 px como mínimo.
- **Movimiento reducido:** ver sección 9.
- **Idioma:** la app es en español. ⚠️ Hoy `index.html` dice `lang="en"` (sección 15).

---

## 14. Mapa de archivos

| Qué | Dónde |
| --- | --- |
| Tokens de color, temas, fuentes, curvas | `src/index.css` |
| Fuentes | `src/fonts/` (Outfit, Quicksand, Merchant Copy) |
| Lógica del tema | `src/services/tema.js`, `src/hooks/useTema.js`, `src/components/AppHeader/SwitchTema.jsx` |
| Taly en punto de cruz | `src/components/Taly/Taly.jsx`, `arte.js`, `TalyMomento.jsx` |
| Taly a pluma | `src/components/Taly/TalyPosado.jsx`, `TalyPluma.jsx`, `talyPluma.js`, `RinconTaly.jsx` |
| Taly a tinta (SVG) | `src/components/Taly/taly-a-mano.svg` y variantes `*-animado.svg` |
| Taly a tinta por piezas | `src/components/Nosotros/TalyTinta.jsx`, `talyMovimientos.js` |
| Laboratorio de la mascota | `brand/mascota/` (léase su `README.md`) |
| Dibujos a tinta de la ficha (nube, separador, mapa) | `src/components/DetalleLocal/Tinta.jsx` |
| Fondo dibujado de Descubre | `src/components/Descubre/FondoDescubre.jsx` |
| Objetos a tinta, filtro y piezas | `src/components/Nosotros/IconosTinta.jsx`, `PiezasTinta.jsx`, `tinta.js` |
| Menú de tablas | `src/components/AppHeader/MenuTablas.jsx` |
| Comodidades (iconos y nombres) | `src/utils/fichaLocal.js` (`COMODIDADES`) |
| Textos de estado de apertura | `src/utils/descubre.js` (`estadoApertura`) |
| Pie de página: escena pixel art, sprites, enlaces | `src/components/Pie/` (`escenaFogata.js`, `spritesFogata.js`, `pieDatos.js`) |
| Muestras en vídeo de la escena del pie | `brand/pie-fogata/` |

---

## 15. Deudas de marca conocidas

Cosas que **hoy no cumplen** este manual. Si tocas algo cerca, arréglalo.

| Deuda | Dónde | Qué hacer |
| --- | --- | --- |
| Favicon de Vite (rayo morado) | `public/favicon.svg` | Diseñar uno con Taly o la C de Citaly |
| `lang="en"` | `index.html` | Cambiar a `lang="es"` |
| No hay logotipo gráfico | — | Cerrar un logotipo (palabra + tratamiento) |
| Chispitas/destellos | `FondoDescubre.jsx` (`CHISPAS`), cabecera de Perfil | Quitarlas (regla 0.1) |
| Objeto `chispas` en el arte de Taly | `src/components/Taly/arte.js` | No usarlo; valorar eliminarlo |
| Merchant Copy sin tildes | Fuente | Buscar una versión con tildes o restringir su uso a textos sin acentos |
| Faltas de tildes en la interfaz | "PROXIMAS" (Mis Citas), "Voy pa alla" | "PRÓXIMAS", "Voy pa' allá" |
| El tema claro se ve pobre en zonas | Cabeceras con foto, tarjetas de Mi Negocio, madera del menú | Rediseño pendiente; ver sección 10 |
| Contradicción de copy en Descubre | De madrugada titula "Lo que sigue abierto" aunque el primero esté cerrado (`src/pages/Descubre.jsx`) | Que el título dependa de si hay algo abierto |
| Nombre interno `'drink'` para Outfit | `src/index.css` | Renombrar a `'Outfit'` cuando se pueda (afecta a todos los CSS) |
| Sin escala de espaciado | Todo el CSS | Tokenizar (`--espacio-1`…) si el proyecto crece |
| Contacto y redes de prueba en el pie | `src/components/Pie/pieDatos.js` (WhatsApp sin número, correo `citaly.example`, redes a la portada) | Poner los datos reales cuando existan |
| No hay páginas de Privacidad ni Términos | El pie enlaza a `/privacidad` y `/terminos`, que hoy dan el 404 de Taly | Crear las dos páginas |

---

## 16. Checklist antes de dar por bueno un cambio visual

- [ ] ¿Todos los colores son tokens? ¿Ningún hex suelto?
- [ ] ¿El texto en teal/mostaza usa `--primary-texto` / `--yellow-texto`?
- [ ] ¿Se ve bien en **oscuro** y en **claro**?
- [ ] ¿Se ve bien a **~390 px** de ancho? ¿Y en escritorio?
- [ ] ¿Las tipografías son las tres de la casa, con los pesos correctos?
- [ ] ¿Ni una chispita?
- [ ] Si sale Taly: ¿es uno de sus componentes, sin deformar, en el estilo adecuado al uso?
- [ ] Si hay ilustración: ¿lleva el filtro de pulso y la receta a tinta?
- [ ] ¿Las animaciones usan `transform`/`opacity`, las curvas de la casa y respetan `prefers-reduced-motion`?
- [ ] ¿Los hover van en `@media (hover: hover) and (pointer: fine)`?
- [ ] ¿Lo decorativo tiene `aria-hidden`? ¿Los botones de icono tienen `aria-label`? ¿Se ve el foco?
- [ ] ¿Las áreas táctiles miden 44 px o más?
- [ ] ¿Los textos hablan de tú, son cortos, con tildes, y dicen qué hacer después?
- [ ] ¿Precios en `CUP` y horas en `AM/PM`?
- [ ] ¿Ha quedado alguna deuda nueva? Apúntala en la sección 15.
