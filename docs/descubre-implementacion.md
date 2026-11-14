# Citaly — Cómo construir Descubre, paso a paso

Guía de implementación del sistema que decide **qué locales ve cada usuario en la pantalla Descubre, en qué orden y por qué**.

Está escrita para alguien que **no ha participado en ninguna conversación previa** sobre el tema. Si es tu caso, empieza por arriba y lee en orden: cada sección se apoya en la anterior. Cada vez que aparece una palabra técnica poco común, se explica en el momento (en un recuadro **📖**) y además todas están juntas en el [glosario del final](#glosario).

Documentos relacionados:

- `docs/descubre-ranking.md` — el documento de **diseño**: el razonamiento, la investigación y las decisiones. Este documento de aquí es su **plan de construcción**: el *cómo*.
- `docs/tablas-backend.md` — el modelo de base de datos. Aquí se dice qué hay que añadirle.

---

## Índice

0. [Para quién es esto y cómo leerlo](#0-para-quién-es-esto-y-cómo-leerlo)
1. [El problema en una página](#1-el-problema-en-una-página)
2. [Qué hay hoy en el código y por qué no basta](#2-qué-hay-hoy-en-el-código-y-por-qué-no-basta)
3. [La forma general de la solución: una cadena de pasos](#3-la-forma-general-de-la-solución-una-cadena-de-pasos)
4. [Quién hace qué: frontend vs backend](#4-quién-hace-qué-frontend-vs-backend)
5. [Paso 1 — La nota bayesiana](#5-paso-1--la-nota-bayesiana)
6. [Paso 2 — Semilla y jitter: que el feed cambie sin volverse loco](#6-paso-2--semilla-y-jitter-que-el-feed-cambie-sin-volverse-loco)
7. [Paso 3 — Registrar lo que se muestra (impresiones)](#7-paso-3--registrar-lo-que-se-muestra-impresiones)
8. [Paso 4 — Los 4 modos de consumo](#8-paso-4--los-4-modos-de-consumo)
9. [Paso 5 — El perfil del usuario](#9-paso-5--el-perfil-del-usuario)
10. [Paso 6 — Nivel 1: el reparto de huecos](#10-paso-6--nivel-1-el-reparto-de-huecos)
11. [Paso 7 — Nivel 2: puntuar dentro de cada hueco](#11-paso-7--nivel-2-puntuar-dentro-de-cada-hueco)
12. [Paso 8 — Re-ranking: diversidad, exploración y locales nuevos](#12-paso-8--re-ranking-diversidad-exploración-y-locales-nuevos)
13. [Paso 9 — Promoción pagada](#13-paso-9--promoción-pagada)
14. [Paso 10 — Lo que va fuera de Descubre](#14-paso-10--lo-que-va-fuera-de-descubre)
15. [Cambios en la base de datos](#15-cambios-en-la-base-de-datos)
16. [Endpoints de la API](#16-endpoints-de-la-api)
17. [Cómo probarlo y depurarlo](#17-cómo-probarlo-y-depurarlo)
18. [Orden de trabajo y fases](#18-orden-de-trabajo-y-fases)
19. [Decisiones que siguen abiertas](#19-decisiones-que-siguen-abiertas)
20. [Glosario](#glosario)

---

## 0. Para quién es esto y cómo leerlo

Hay dos lectores:

- **Quien hace el frontend** (React, la app que ve el usuario). Le interesan sobre todo las secciones 5 a 14, donde se explica cada pieza y cómo programarla.
- **Quien hace el backend** (el servidor y la base de datos). Le interesan sobre todo las secciones **4, 15, 16 y 18**, y dentro de cada paso los apartados marcados como **🖥️ Backend**.

En cada paso encontrarás siempre la misma estructura:

| Apartado | Qué responde |
| --- | --- |
| **Qué es** | La idea en lenguaje normal |
| **Por qué** | Qué problema real resuelve; qué pasaría si no se hiciera |
| **Cómo se programa** | La forma concreta, con código de ejemplo |
| **Por qué así y no de otra forma** | Las alternativas que se descartaron y el motivo |
| **🖥️ Backend / 📱 Frontend** | Qué parte toca a cada uno |

> El código que aparece aquí es **orientativo**: sirve para entender la lógica, no es para copiar y pegar. Los nombres de funciones y archivos son propuestas.

---

## 1. El problema en una página

Descubre es la pantalla principal de Citaly: la que ves al abrir la app, llena de tarjetas de locales (restaurantes, peluquerías, bares, spas…). La pregunta es:

> **De todos los locales que existen, ¿cuáles le enseño a esta persona, en qué orden, y cuáles no le enseño?**

Parece una tontería ("ordena por nota y ya"), pero no lo es, por cuatro razones:

1. **Citaly vende cosas que no compiten entre sí.** Un dentista y una pizzería no son alternativas. Si los ordenas todos juntos por nota, estás comparando peras con tornillos.
2. **Son servicios físicos.** Un local cerrado ahora mismo no le sirve a nadie *ahora mismo*, por buena nota que tenga. Y hay que desplazarse hasta él.
3. **Se usan con poca frecuencia.** Te cortas el pelo una vez al mes. No es Instagram, donde ves 50 vídeos por hora.
4. **El éxito es una reserva**, no que el usuario pase mucho rato mirando la pantalla. Un feed entretenido que no lleva a reservar está fallando.

> 📖 **Feed**: la lista de contenido por la que se hace scroll. En Citaly, el feed es Descubre.

> 📖 **Ranking**: ordenar una lista según una puntuación. "El ranking de Descubre" es el orden en que salen los locales.

---

## 2. Qué hay hoy en el código y por qué no basta

Todo vive hoy en `src/utils/descubre.js`, en la función `construirDescubre(locales, favoritos)`. Hace esto:

1. Calcula la nota de cada local con `notaLocal()`, que es **la media de sus comentarios**.
2. Ordena todos los locales por esa nota, de mayor a menor.
3. Los 5 primeros (los abiertos primero) van al **héroe**, el carrusel grande de arriba.
4. El resto se reparte en estanterías: "Para comer", "Mejor valorados", "Cerca de ti"…

Tiene **tres fallos** reales:

### Fallo 1 — La nota ignora cuántas opiniones hay

Un local con **una sola** opinión de 5★ queda por encima de uno con **40 opiniones** y una media de 4,7. El primero puede ser el primo del dueño; el segundo está demostrado. Y como el héroe son los 5 primeros por nota, este error va directo a lo primero que ve el usuario.

→ Se arregla en el **Paso 1** (nota bayesiana).

### Fallo 2 — "Cerca de ti" no sabe dónde estás

No hay geolocalización en el proyecto. El campo `metros` de cada local es un número fijo escrito en el JSON, igual para todos los usuarios. El bloque "Cerca de ti · del más cercano al más lejos" ordena siempre igual, estés donde estés.

→ Se trata en el **Paso 10**.

### Fallo 3 — El feed es idéntico para todos y no cambia nunca

Mismos 5 locales en el héroe hoy, mañana y dentro de un mes. Para todo el mundo. Un usuario que entra tres veces ve exactamente lo mismo, y los locales que no están arriba no tienen ninguna oportunidad de que alguien los vea.

→ Se arregla en el **Paso 2** (semilla y jitter) y en los **Pasos 4 a 8** (personalización).

---

## 3. La forma general de la solución: una cadena de pasos

### Qué es

En vez de una función grande que lo hace todo, se divide el trabajo en **etapas encadenadas**, donde cada una recibe el resultado de la anterior:

```
 todos los locales
        │
        ▼
 ① CANDIDATOS ........ quitar lo que no puede salir (otra provincia, dentistas…)
        │
        ▼
 ② PERFIL ............ qué sabemos de este usuario (gustos, locales fijos…)
        │
        ▼
 ③ REPARTO (nivel 1) . qué bloques salen en la pantalla y cuántos huecos tiene cada uno
        │
        ▼
 ④ PUNTUAR (nivel 2) . dentro de cada bloque, ordenar a los candidatos
        │
        ▼
 ⑤ RE-RANKING ........ retocar: no repetir categoría, meter algo nuevo, locales recién llegados
        │
        ▼
 bloques listos para pintar
```

Esto no es un invento nuestro: es como funcionan Netflix, Instagram o X. Las tres hacen **generación de candidatos → puntuación → re-ranking**. Lo que sí es propio de Citaly es *cómo* se hace el reparto (con los "modos de consumo" del Paso 4).

> 📖 **Pipeline** (cadena, tubería): una secuencia de etapas donde la salida de una es la entrada de la siguiente. Lo de arriba es el pipeline de Descubre.

> 📖 **Candidato**: un local que *podría* salir en la pantalla. La etapa ① decide quién es candidato; las siguientes deciden quién sale de verdad y dónde.

> 📖 **Re-ranking**: volver a ordenar una lista ya ordenada para aplicar reglas que una simple puntuación no captura ("no pongas tres peluquerías seguidas"). Es la etapa que casi todo el mundo olvida y la que hace que un feed se sienta vivo o repetitivo.

### Por qué así

- **Cada pieza se entiende sola.** Si el orden sale raro, puedes mirar etapa por etapa dónde se torció.
- **Cada pieza se puede cambiar sin tocar las demás.** El día que se quiera meter un modelo de aprendizaje automático, solo se cambia la etapa ③, y el resto sigue igual.
- **Cada pieza se puede probar sola**, con datos inventados, sin abrir la app.

### Cómo se programa

Una carpeta nueva, `src/utils/ranking/`, con un archivo por pieza:

```
src/utils/ranking/
  modos.js        tabla de modos de consumo y su configuración      (Paso 4)
  calidad.js      nota bayesiana y otros indicadores de calidad     (Paso 1)
  semilla.js      generador aleatorio con semilla y jitter          (Paso 2)
  impresiones.js  registro de lo que se muestra y se toca           (Paso 3)
  perfil.js       qué sabemos del usuario                           (Paso 5)
  reparto.js      plantilla de bloques y huecos (nivel 1)           (Paso 6)
  puntuar.js      score de cada candidato (nivel 2)                 (Paso 7)
  rerank.js       diversidad, exploración, locales nuevos           (Paso 8)
  index.js        construirDescubre(): el director que lo encadena
```

Y la regla más importante de todas: **cada una de estas funciones es pura**.

> 📖 **Función pura**: una función que (1) con los mismos datos de entrada devuelve **siempre** el mismo resultado y (2) no toca nada de fuera: no lee la hora, no lee `localStorage`, no hace peticiones, no usa `Math.random()`. Todo lo que necesita le llega como parámetro.

¿Por qué importa tanto? Porque la función de hoy hace cosas como leer la hora actual por dentro (`estaAbierto(l)` sin pasarle la hora). Eso hace que dos llamadas iguales puedan dar resultados distintos y que no se pueda probar "¿qué saldría a las 9 de la noche?". La firma nueva sería:

```js
construirDescubre({
  locales,   // lista de locales
  perfil,    // lo que sabemos del usuario (Paso 5)
  ahora,     // la fecha y hora, pasada desde fuera
  semilla,   // número para la aleatoriedad controlada (Paso 2)
  stats,     // datos agregados que da el backend (Paso 1, 3)
})
// → [{ id, titulo, locales: [...] }, ...]
```

Quien llama (la página `Descubre.jsx`) es quien lee la hora, el usuario y el `localStorage`, y se lo pasa. La lógica queda limpia.

### Por qué así y no de otra forma

- **¿Por qué no un modelo de machine learning desde el principio?** Porque hay 33 locales de prueba y cero datos de uso. Un modelo necesita miles de ejemplos para aprender algo. Con reglas claras se funciona bien desde el día uno, y la arquitectura deja el hueco preparado para el modelo cuando haya datos.
- **¿Por qué no meterlo todo en el componente React?** Porque mezclar "qué se muestra" con "cómo se pinta" hace imposible probar la lógica sin la interfaz, y obliga a tocar componentes visuales cada vez que se ajusta un peso.

---

## 4. Quién hace qué: frontend vs backend

Esta es la sección clave para quien hace el backend.

### La regla general

| Va en el **backend** si… | Va en el **frontend** si… |
| --- | --- |
| Necesita datos de **muchos usuarios** a la vez | Solo necesita datos **del usuario actual** |
| El usuario **no debe poder manipularlo** (promociones pagadas) | Si el usuario lo manipula, solo se perjudica a sí mismo |
| Es un cálculo **caro** que conviene hacer una vez y guardar | Es barato y cambia en cada visita |
| Tiene que **sobrevivir** a que el usuario cambie de móvil | Puede vivir en el navegador |

### El reparto concreto

| Pieza | Dónde | Por qué |
| --- | --- | --- |
| Filtro de provincia y de categorías fuera del feed | 🖥️ Backend | Es la primera criba; no tiene sentido mandar al móvil locales que nunca se van a mostrar |
| Nota bayesiana (media global, `C`) | 🖥️ Backend | Necesita las opiniones de **todos** los locales |
| "Repetidores" (clientes que vuelven) | 🖥️ Backend | Necesita las citas de **todos** los usuarios |
| Guardar impresiones | 🖥️ Backend | Son datos de todos; son la base para afinar el sistema |
| Exposición de cada local (cuánto se ha mostrado) | 🖥️ Backend | Agregado de las impresiones de todos |
| Promociones activas | 🖥️ Backend | Es dinero: el cliente no debe poder inventárselas |
| Tabla de modos | 🖥️ + 📱 | Es configuración: vive en la base de datos y el front la recibe |
| Perfil del usuario (afinidad, fijos) | 📱 Frontend (fase 1) → 🖥️ (fase 2) | Solo usa datos de ese usuario; luego se mueve al servidor para que siga entre dispositivos |
| Semilla del día | 📱 Frontend | Es un cálculo trivial a partir del id de usuario y la fecha |
| Reparto, puntuación y re-ranking | 📱 Frontend (fase 1) → 🖥️ (fase 2) | Ver abajo |
| Registrar que una tarjeta se vio | 📱 Frontend | Solo el navegador sabe qué está en pantalla |

### ¿Por qué empezar con el ranking en el frontend?

Hoy hay 33 locales. Mandarlos todos al móvil cuesta poco, y montar el orden en el navegador tiene ventajas grandes mientras el sistema se está afinando:

- Se ajusta un peso y se ve el resultado al instante, sin desplegar el servidor.
- No hace falta un endpoint nuevo para empezar.
- Funciona sin conexión con los datos en caché.

### ¿Cuándo pasarlo al backend? (fase 2)

Cuando se cumpla **cualquiera** de estas condiciones:

- **Hay más de unos pocos cientos de locales.** Mandarlos todos al móvil empieza a pesar.
- **Hay promociones pagadas.** Si el orden se calcula en el móvil, alguien con conocimientos podría alterarlo. Con dinero de por medio, el orden lo tiene que dar el servidor.
- **Se quieren hacer pruebas A/B.** Es más fácil controlar a quién se le da cada versión desde el servidor.

> 📖 **Prueba A/B**: enseñar dos versiones de algo (A y B) a grupos distintos de usuarios y medir cuál funciona mejor. Por ejemplo: la mitad ve el feed con jitter fuerte y la otra con jitter suave, y se compara cuál consigue más reservas.

**Consejo importante para el backend:** si el servidor está hecho en **JavaScript/Node**, el código de `src/utils/ranking/` se puede reutilizar tal cual en el servidor, porque son funciones puras sin dependencias del navegador. Por eso es tan importante que sean puras. Si el servidor está en otro lenguaje, habrá que traducirlas, y las pruebas del Paso 17 sirven para comprobar que la traducción da los mismos resultados.

---

## 5. Paso 1 — La nota bayesiana

### Qué es

Una forma de calcular la nota de un local que **tiene en cuenta cuántas opiniones hay**. Si hay pocas, la nota se "acerca" a la media de todos los locales; si hay muchas, se queda prácticamente con la suya.

> 📖 **Media bayesiana**: un tipo de media que mezcla dos cosas: lo que dicen los datos de este local y lo que sabemos en general de todos los locales. El nombre viene de Thomas Bayes, un matemático del siglo XVIII que formalizó la idea de "empezar con una suposición razonable e ir corrigiéndola a medida que llegan datos". No hace falta saber nada más de él.

### Por qué

Volvamos al ejemplo:

- **Local A**: 1 opinión de 5★. Media = 5,0
- **Local B**: 40 opiniones con media de 4,7

Con la media simple, A gana. Pero intuitivamente todos sabemos que B es más fiable: **una sola opinión no demuestra nada** (puede ser el dueño, un amigo, o un buen día). La media bayesiana convierte esa intuición en un número.

### La fórmula

```
                C × m  +  n × media
notaRanking  =  ─────────────────────
                      C  +  n
```

Donde:

| Símbolo | Qué es | Ejemplo |
| --- | --- | --- |
| `media` | La media de las opiniones de **este** local | 5,0 para A |
| `n` | Cuántas opiniones tiene **este** local | 1 para A |
| `m` | La media de **todos** los locales juntos | 4,2 |
| `C` | Cuánta "confianza" le damos a la media general. Se suele tomar la **mediana** del número de opiniones por local | 5 |

> 📖 **Mediana**: el valor que queda en el medio cuando ordenas una lista. Si los locales tienen 0, 1, 3, 5, 8, 12 y 40 opiniones, la mediana es 5. Se usa en vez de la media porque no se deja arrastrar por un caso extremo: si un local tiene 1.000 opiniones, la media se dispararía, pero la mediana casi no cambia.

**La forma fácil de entenderlo:** es como si a cada local le regaláramos `C` opiniones "imaginarias" con la nota media general, y luego hiciéramos la media normal. Si un local tiene muy pocas opiniones reales, pesan más las imaginarias y su nota queda cerca de la media. Si tiene muchas, las imaginarias apenas influyen.

**Con números**, tomando `m = 4,2` y `C = 5`:

```
Local A:  (5 × 4,2 + 1 × 5,0) / (5 + 1)   = (21 + 5)   / 6   = 4,33
Local B:  (5 × 4,2 + 40 × 4,7) / (5 + 40) = (21 + 188) / 45  = 4,64
```

Ahora **B gana**, como debe ser. Y si A consigue 20 opiniones de 5★, su nota sube a 4,84 y pasará a B con todo merecimiento.

### Una distinción importante: nota que se ve vs nota que ordena

**La nota que ve el usuario no cambia.** La tarjeta y la ficha siguen diciendo "5,0 (1 opinión)", porque eso es lo que dicen sus clientes y mentir sería peor. La nota bayesiana **solo se usa por dentro, para ordenar**. Son dos funciones distintas:

```js
// lo que se enseña (ya existe)
notaLocal(local)          // → { nota: 5.0, cantidad: 1 }

// lo que se usa para ordenar (nueva)
notaRanking(local, stats) // → 4.33
```

### Reservas repetidas: una señal de calidad aún mejor

Una estrella es barata: cualquiera la deja. **Volver a reservar en el mismo sitio es caro**: nadie vuelve dos veces a un sitio malo. Por eso, cuando haya datos reales, el número de clientes que repiten debería pesar en la calidad tanto o más que la nota.

Se suma así:

```
calidad = notaRanking + k × log(1 + repetidores)
```

> 📖 **Logaritmo (`log`)**: una función que crece cada vez más despacio. `log(1+0) = 0`, `log(1+5) ≈ 1,8`, `log(1+50) ≈ 3,9`, `log(1+500) ≈ 6,2`. Se usa para que **pasar de 0 a 5 clientes que repiten importe mucho, y pasar de 200 a 205 casi nada**. Sin él, un local enorme aplastaría a todos los pequeños solo por tamaño.

`k` es un número pequeño que decide cuánto pesa esto frente a la nota. Empezaría con 0,15 y se ajustaría con datos.

### Cómo se programa

📱 **Frontend** (`calidad.js`):

```js
// Se calcula UNA vez para toda la lista, no por cada local.
export function estadisticasGlobales(locales) {
  const conOpiniones = locales.filter((l) => cantidadOpiniones(l) > 0)
  const m = media(conOpiniones.map(mediaOpiniones))
  const C = mediana(locales.map(cantidadOpiniones)) || 3 // por si todos tienen 0
  return { m, C }
}

export function notaRanking(local, { m, C }) {
  const n = cantidadOpiniones(local)
  const media = n ? mediaOpiniones(local) : m
  return (C * m + n * media) / (C + n)
}
```

🖥️ **Backend**:

- La tabla `locales` ya tiene `rating_cache` y `opiniones_count` (ver `tablas-backend.md`). Con eso basta para calcular la fórmula.
- `m` y `C` se calculan sobre **todos** los locales. Conviene guardarlos en una tabla pequeña de estadísticas y recalcularlos de vez en cuando (cada hora o cada noche), no en cada petición: cambian muy despacio.
- `repetidores`: es una consulta sobre `citas`, del tipo "cuántos usuarios distintos tienen 2 o más citas completadas en este local". Se guarda en una columna `repetidores_cache` en `locales` y se recalcula cada noche.

> 📖 **Caché** (*cache*): guardar el resultado de un cálculo para no repetirlo cada vez. `rating_cache` es la nota ya calculada; si no existiera, habría que sumar todas las opiniones cada vez que alguien abre Descubre.

> 📖 **Job / tarea programada / cron**: un trozo de código que el servidor ejecuta solo, a una hora fija ("todas las noches a las 4:00"). Así se recalculan los cachés sin que el usuario espere.

### Por qué así y no de otra forma

- **¿Por qué no simplemente "mínimo 5 opiniones para salir"?** Porque es una regla de todo o nada: un local con 4 opiniones excelentes desaparece del todo y uno con 5 mediocres sale. La media bayesiana es gradual y justa.
- **¿Por qué no multiplicar nota × número de opiniones?** Porque entonces el local con más clientes gana siempre, aunque sea peor. Aplasta a los pequeños.
- **¿Por qué es lo primero que se hace?** Porque es el cambio con mejor relación **impacto / esfuerzo**: unas 20 líneas, no cambia la arquitectura, y arregla un fallo visible desde el primer día.

---

## 6. Paso 2 — Semilla y jitter: que el feed cambie sin volverse loco

Este paso tiene dos conceptos que van juntos. Primero se explica el problema, luego cada concepto.

### El problema

Queremos que el feed **varíe**: que no salgan los mismos 5 locales en el héroe durante meses. Si siempre gana el mismo, los demás nunca tienen la oportunidad de que alguien los vea, y el usuario se aburre.

La solución ingenua sería barajar con `Math.random()`. **Es una mala idea**, por dos motivos:

1. **El orden cambiaría cada vez que se repinta la pantalla.** React repinta a menudo (al volver de otra pantalla, al cambiar un filtro). El usuario estaría viendo un local, se iría a la ficha, volvería… y el local ya no estaría donde lo dejó. Esto destroza la confianza: *"¿dónde estaba ese bar que vi hace un momento?"*.
2. **Barajar no distingue entre buenos y malos.** Un local con un 2,1 podría acabar en el héroe por puro azar.

Hacen falta dos cosas: que la aleatoriedad sea **estable** (siempre la misma durante un tiempo) y que sea **pequeña** (que solo mueva a los que están casi empatados). La primera la da la **semilla**; la segunda, el **jitter**.

### Concepto 1: la semilla

> 📖 **Semilla** (*seed*): un número de partida para un generador de números aleatorios. La propiedad clave es que **con la misma semilla, el generador produce siempre la misma secuencia de números**. Con otra semilla, otra secuencia distinta.

> 📖 **Generador pseudoaleatorio** (PRNG, *Pseudo-Random Number Generator*): una función matemática que produce números que **parecen** aleatorios pero que en realidad salen de una fórmula a partir de la semilla. "Pseudo" significa precisamente eso: parecen aleatorios pero son reproducibles. `Math.random()` también es un PRNG, pero no deja elegir la semilla; por eso no sirve aquí.

> 📖 **Determinista**: que con la misma entrada da siempre la misma salida. Un generador con semilla es determinista; `Math.random()` no lo es (desde nuestro punto de vista).

**¿Qué semilla usamos?** Una que salga del **usuario** y del **día**:

```
semilla = hash(idUsuario + "2026-11-14")
```

Esto da exactamente el comportamiento que queremos:

| Situación | ¿Cambia el orden? | Por qué |
| --- | --- | --- |
| El mismo usuario repinta la pantalla | **No** | Misma semilla |
| El mismo usuario vuelve 3 horas después, el mismo día | **No** | Misma semilla |
| El mismo usuario vuelve mañana | **Sí** | La fecha cambió |
| Otro usuario, el mismo día | **Sí** | El id cambió |

> 📖 **Hash**: una función que convierte cualquier texto en un número, de forma que (1) el mismo texto da siempre el mismo número y (2) textos parecidos dan números muy distintos. Aquí la usamos para convertir `"user-123" + "2026-11-14"` en un número que sirva de semilla.

**Detalle práctico:** el "día" no debería cambiar a medianoche, porque alguien que está mirando Descubre a las 23:59 vería cómo se le reordena todo de golpe. Mejor un corte a una hora en la que casi nadie usa la app, por ejemplo las **5:00 de la mañana**:

```js
function claveDelDia(ahora) {
  const d = new Date(ahora)
  d.setHours(d.getHours() - 5) // antes de las 5:00 sigue contando como "ayer"
  return d.toISOString().slice(0, 10) // "2026-11-14"
}
```

**¿Y si el usuario no ha iniciado sesión?** Se genera un identificador anónimo la primera vez (`crypto.randomUUID()`), se guarda en `localStorage` y se usa como `idUsuario`. Así el feed es estable también para quien no tiene cuenta.

> 📖 **UUID**: un identificador aleatorio tan largo (`3f2b9c1e-…`) que en la práctica nunca se repite. `crypto.randomUUID()` lo genera en el navegador.

### Concepto 2: el jitter

> 📖 **Jitter**: literalmente "temblor" o "nerviosismo". En este contexto, **un empujón pequeño y aleatorio que se suma a la puntuación de cada local**. No baraja la lista: hace que la puntuación de cada uno "tiemble" un poco.

La idea es que, en vez de barajar, sumamos a cada puntuación un número pequeño, positivo o negativo:

```
scoreFinal = score + (r − 0,5) × amplitud
```

Donde `r` es un número aleatorio entre 0 y 1 (sale del generador con semilla) y `amplitud` es el tamaño máximo del empujón.

**Por qué funciona:** imagina que las puntuaciones van de 0 a 1 y la amplitud es 0,1. Entonces cada local puede moverse como mucho ±0,05:

| Local | Score | Jitter | Score final | Puesto |
| --- | --- | --- | --- | --- |
| Pizzería Roma | 0,82 | −0,03 | 0,79 | 3º |
| Café Luna | 0,80 | +0,04 | **0,84** | **1º** |
| Bar Esquina | 0,79 | +0,01 | 0,80 | 2º |
| Taller de cerámica | 0,41 | +0,05 | 0,46 | sigue abajo |

Los tres primeros estaban **prácticamente empatados**, y el jitter los reordena: hoy gana Café Luna, mañana puede ganar otro. Pero el taller de cerámica, que estaba muy por debajo, **nunca llega arriba**: el empujón máximo no le da para tanto. Esto es exactamente lo que queremos: **variedad entre los buenos, sin premiar a los malos.**

**Un detalle técnico importante:** cada local tiene que sacar **su propio** número aleatorio, combinando la semilla del día con su id:

```js
const r = aleatorioCon(semilla ^ hashTexto(local.id))()
```

> 📖 **`^` (XOR)**: una operación entre números que los "mezcla" bit a bit. Aquí sirve para combinar dos números (la semilla y el hash del id) en uno nuevo, de forma que cada local tenga su propia semilla derivada.

¿Por qué así y no sacando números del generador en orden (el primero para el primer local, el segundo para el segundo…)? Porque entonces **el jitter de un local dependería de su posición en la lista**. Si mañana se añade un local nuevo al principio, todos los números se desplazan y el orden de todo el feed cambia sin motivo. Con un número por id, añadir o quitar locales no afecta al jitter de los demás.

### La amplitud no es igual en toda la pantalla

**Arriba del todo (el héroe, el primer bloque), el jitter es pequeño. Abajo, más grande.** La primera pantalla es la que decide si el usuario se queda: ahí van los locales de máxima confianza. La variedad y el riesgo entran más abajo, cuando el usuario ya ha decidido seguir mirando. (Esto se desarrolla en el Paso 8.)

### Cómo se programa

📱 **Frontend** (`semilla.js`). Son dos funciones muy conocidas, de pocas líneas cada una:

```js
// cyrb53: convierte un texto en un número. Rápido y con buena dispersión.
export function hashTexto(texto) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0) * 4294967296 + (h1 >>> 0)
}

// mulberry32: generador pseudoaleatorio. Devuelve una función que da números entre 0 y 1.
export function aleatorioCon(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function jitter(semilla, idLocal, amplitud) {
  const r = aleatorioCon(semilla ^ hashTexto(idLocal))()
  return (r - 0.5) * amplitud
}
```

> 📖 **cyrb53 y mulberry32**: nombres de dos algoritmos concretos, públicos y muy usados en JavaScript, para hash y para PRNG respectivamente. No hace falta entender cómo funcionan por dentro; lo que importa es lo que garantizan: rápidos, sin dependencias y deterministas.

En la página `Descubre.jsx`, el resultado de `construirDescubre` se guarda con `useMemo` dependiendo de la semilla. Así, repintar la pantalla no recalcula nada y el orden no se mueve.

> 📖 **`useMemo`**: una herramienta de React que guarda el resultado de un cálculo y solo lo repite si cambian los datos de los que depende.

🖥️ **Backend**: en la fase 1, nada. En la fase 2, si el ranking pasa al servidor, este calcula la semilla con la misma fórmula y el mismo algoritmo, para que el resultado sea idéntico al del cliente.

### Por qué así y no de otra forma

- **¿Por qué no `Math.random()`?** Explicado arriba: el orden cambiaría en cada repintado y podría subir locales malos.
- **¿Por qué no barajar la lista con semilla?** Barajar trata igual a un local de 4,8 que a uno de 2,1. El jitter solo mueve a los que están cerca.
- **¿Por qué por día y no por sesión?** Con semilla por sesión, si el usuario cierra la app y la abre 10 minutos después, todo estaría en otro sitio. Es una decisión todavía abierta (ver sección 19), pero el código está hecho para que cambiarla sea modificar **una línea**: lo que se mete en el hash.

---

## 7. Paso 3 — Registrar lo que se muestra (impresiones)

### Qué es

Guardar un registro de **qué locales se le enseñaron a cada usuario, en qué posición, en qué bloque, y si los tocó**.

> 📖 **Impresión**: cada vez que una tarjeta aparece en la pantalla del usuario. Si alguien abre Descubre y ve 12 tarjetas, son 12 impresiones. Es un término de publicidad.

> 📖 **CTR** (*Click-Through Rate*, tasa de clics): de todas las veces que se mostró algo, en cuántas se tocó. Si un local se mostró 200 veces y se tocó 10, su CTR es 5 %.

### Por qué

Todo lo que viene después (los pesos de la puntuación, la amplitud del jitter, la cuota de afinidad) son **números que hay que elegir**. Sin datos, se eligen a ojo y nunca se sabe si funcionan. Con impresiones se pueden responder preguntas como:

- ¿Los usuarios tocan más los locales abiertos que los cerrados? ¿Cuánto más?
- ¿El bloque de exploración consigue reservas o solo ocupa espacio?
- ¿A partir de qué posición ya casi nadie mira?

Además, las impresiones dan la **novedad** de un local (cuánto hace que no sale arriba), que se usa en el Paso 7.

Hoy **no se registra absolutamente nada**: no hay analítica en el proyecto. Por eso este paso va pronto en el orden, aunque no cambie nada visible: **cada día sin registrar son datos que se pierden para siempre.**

### Cómo se programa

📱 **Frontend**:

**1. Detectar que una tarjeta se vio de verdad.** No basta con que esté en la página: tiene que haber estado en pantalla. Se usa un `IntersectionObserver`.

> 📖 **`IntersectionObserver`**: una herramienta del navegador que avisa cuando un elemento entra o sale de la parte visible de la pantalla. Es mucho más eficiente que comprobar la posición de cada tarjeta en cada movimiento del scroll.

Una tarjeta cuenta como vista si ha estado **al menos al 50 % visible durante al menos 1 segundo**. Si el usuario pasa volando por encima con el scroll, no cuenta: no la ha visto.

Se usa **un solo observer para toda la página**, no uno por tarjeta, porque es más barato. Se envuelve en un hook:

```js
// en cada tarjeta
useImpresion(ref, { localId, bloque: 'antojo-1', posicion: 3 })
```

> 📖 **Hook**: una función de React que empieza por `use` y permite reutilizar lógica entre componentes. `useImpresion` encapsula todo lo del observer para que la tarjeta solo tenga que llamarlo.

**2. Registrar el toque.** En el `onClick` de la tarjeta se añade un evento `{ tipo: 'toque', localId, bloque, posicion }`.

**3. Guardar sin molestar.** Los eventos se acumulan en una **cola en memoria** y se guardan en bloque cada pocos segundos, no uno a uno.

> 📖 **Cola** (*queue*): una lista donde se van metiendo cosas por un lado y sacando por el otro, en orden. Aquí se van metiendo eventos y se sacan de golpe para enviarlos.

> 📖 **Batch** (lote): agrupar varias operaciones en una sola. Enviar 30 eventos en una petición en vez de 30 peticiones.

**4. Enviarlos al servidor.** Cuando haya backend, la cola se envía con `navigator.sendBeacon()`:

> 📖 **`navigator.sendBeacon()`**: una forma de enviar datos al servidor pensada justo para esto. Su ventaja es que **funciona aunque el usuario esté cerrando la pestaña**: el navegador garantiza que sale. Una petición normal (`fetch`) se cancelaría al cerrar.

Se envía cuando la cola llega a ~20 eventos o cuando la página se oculta (evento `visibilitychange`, que salta al cambiar de app o de pestaña).

**Mientras no haya backend**, la cola se guarda en `localStorage` con un máximo de unos 500 eventos (los más viejos se descartan), para no llenar el almacenamiento.

🖥️ **Backend**:

**1. Tabla `impresiones`** (detalle en la sección 15). Va a crecer **mucho**: cada visita a Descubre son decenas de filas. Por eso:

- Índices por `(local_id, creado_en)` y por `(usuario_id, creado_en)`.
- Borrar o resumir las filas de más de 90 días. Al principio se puede guardar todo y decidir más adelante.

> 📖 **Índice**: una estructura que la base de datos mantiene para encontrar filas rápido sin recorrer toda la tabla. Como el índice alfabético de un libro.

**2. Endpoint** `POST /eventos` que recibe una lista de eventos y los inserta. Debe ser **idempotente**.

> 📖 **Idempotente**: que hacer la misma operación dos veces da el mismo resultado que hacerla una. Importa porque en redes malas el cliente puede reenviar un lote que ya llegó. Se consigue haciendo que cada evento traiga un `id` único generado en el cliente, e ignorando los que ya existen.

**3. Tarea nocturna** que resume las impresiones en una tabla `local_exposicion`: por cada local, cuántas veces se mostró en las últimas 24 h, cuántas en el top 5, y cuándo fue la última vez que salió en el top 5. Eso es lo que usa el ranking; nunca se lee la tabla grande de impresiones en una petición de usuario.

> 📖 **Agregar / agregación**: resumir muchas filas en pocas. "Contar las impresiones por local" es una agregación.

### Privacidad

Las impresiones dicen **qué miró cada persona**. Hay que tratarlas como dato personal:

- No mandar nada más que lo listado (local, bloque, posición, tipo, fecha).
- Si el usuario borra su cuenta, se borran o se anonimizan sus impresiones.

### Por qué así y no de otra forma

- **¿Por qué no Google Analytics u otro servicio externo?** Se podría, pero mete a un tercero en los datos de los usuarios, añade peso a la app y no está pensado para alimentar un ranking. Lo que necesitamos es pequeño y muy concreto.
- **¿Por qué no contar "vista" en cuanto la tarjeta se monta?** Porque Descubre monta tarjetas que el usuario nunca llega a ver (las de abajo del todo). Inflaría las cifras y haría creer que algo se mostró cuando no.

---

## 8. Paso 4 — Los 4 modos de consumo

Este es el **concepto central** de todo el sistema.

### Qué es

Una clasificación **interna** de las categorías de locales según **cómo se consume el servicio**, no según qué es:

| Modo | Categorías | Frecuencia | ¿El usuario quiere variedad? |
| --- | --- | --- | --- |
| **Antojo** | Restaurante, Cafetería, Bar, Terraza, Comida saludable | Alta | **Sí.** Probar sitios nuevos es parte del disfrute |
| **Confianza** | Peluquería, Barbería, Uñas, Dentista, Veterinaria | Media | **No.** Busca uno bueno y se queda |
| **Capricho** | Spa, Tatuajes, Arte y talleres, Ocio | Baja | Sí, pero investiga mucho antes de decidir |
| **Rutina** | Gimnasio | Se decide una vez | No. Es casi una suscripción |

### Por qué

Porque cada modo pide **lo contrario** que otro:

- Si alguien va mucho a restaurantes, **le encanta descubrir restaurantes**. Enseñarle más es acertar.
- Si alguien va siempre a la misma barbería, **ya terminó de buscar barbería**. Enseñarle ocho barberías más no es recomendar, es ruido.

Un feed que trata igual a los dos se equivoca con uno de los dos **siempre**. Con los modos, cada grupo tiene sus propias reglas.

Y resuelve el problema del punto 1: **solo compiten entre sí locales del mismo modo**. Un dentista nunca compite con una pizzería.

### ⚠️ Regla de oro: los modos son invisibles

> **El usuario NUNCA ve esta clasificación.** No aparece "antojo" ni "confianza" en ninguna parte de la interfaz. Para él son locales que salen. Los modos son una herramienta interna de ordenación, no una forma de navegar.

Los bloques que ve el usuario tienen títulos normales ("Para comer hoy", "Mejor valorados"). Los componentes visuales no saben que existen los modos.

### Cómo se programa

📱 **Frontend** (`modos.js`). Es una tabla escrita a mano. No se entrena ni se calcula nada:

```js
export const MODO_DE_CATEGORIA = {
  Restaurante: 'antojo', Cafetería: 'antojo', Bar: 'antojo', Terraza: 'antojo', 'Comida saludable': 'antojo',
  Peluquería: 'confianza', Barbería: 'confianza', Uñas: 'confianza', Dentista: 'confianza', Veterinaria: 'confianza',
  Spa: 'capricho', Tatuajes: 'capricho', 'Arte y talleres': 'capricho', Ocio: 'capricho',
  Gimnasio: 'rutina',
}

// Lo que cambia de un modo a otro, como DATOS, no como ifs repartidos por el código.
export const CONFIG_MODO = {
  antojo:    { quiereVariedad: true,  pesos: { calidad: 0.40, contexto: 0.25, afinidad: 0.15, novedad: 0.20 } },
  confianza: { quiereVariedad: false, pesos: { calidad: 0.60, contexto: 0.20, afinidad: 0.15, novedad: 0.05 } },
  capricho:  { quiereVariedad: true,  pesos: { calidad: 0.50, contexto: 0.10, afinidad: 0.20, novedad: 0.20 } },
  rutina:    { quiereVariedad: false, pesos: { calidad: 0.60, contexto: 0.10, afinidad: 0.20, novedad: 0.10 } },
}

// Categorías que no van en un feed de descubrimiento: nadie "navega dentistas".
// Se llega a ellas buscando.
export const FUERA_DEL_FEED = new Set(['Dentista', 'Veterinaria'])
```

(Los pesos se explican en el Paso 7.)

**¿Por qué como datos y no como `if`?** Porque toda la personalidad del sistema queda **en un solo sitio**. Para cambiar cómo se comporta un modo, se cambia un número en una tabla, no se busca un `if (modo === 'antojo')` escondido en cinco archivos.

🖥️ **Backend**: la tabla `categorias` (ya prevista en `tablas-backend.md`) gana dos columnas: `modo` y `en_feed`. Así, cuando se cree una categoría nueva, se le asigna su modo desde la base de datos, sin desplegar la app. El front recibe la tabla de categorías junto con los locales.

### Por qué así y no de otra forma

- **¿Por qué no agrupar por categoría y ya?** Son 15 categorías. Quince cajones con reglas propias serían inmanejables, y además casi todas se comportan igual que alguna otra. Cuatro grupos de comportamiento cubren todo.
- **¿Por qué no aprender los grupos con un algoritmo?** Porque con 33 locales y sin datos no hay nada que aprender. Y aunque los hubiera, esta clasificación sale de cómo funciona el negocio, que es conocimiento que ya tenemos. Escribirla a mano son 15 líneas que funcionan igual con 33 locales que con 3.000.

---

## 9. Paso 5 — El perfil del usuario

### Qué es

Un objeto que resume **lo que sabemos de los gustos y hábitos de este usuario**, calculado a partir de lo que ya hace en la app:

```js
{
  esNuevo: true,
  afinidad: { Restaurante: 0.6, Cafetería: 0.25, Bar: 0.15 },
  subtipoPreferido: { categoria: 'Restaurante', cuota: 0.22 },
  categoriasResueltas: Map { 'Barbería' → { localId, hasta: '2027-05-14' } },
  fijos: [{ localId: 'barberia-yoel', profesionalId: 'pro-3' }],
}
```

Tiene tres partes: **afinidad**, **categorías resueltas** y **fijos**.

### 9.1 Afinidad

> 📖 **Afinidad**: cuánto le gusta a este usuario un tipo de local, en comparación con los demás tipos.

**Por qué:** dentro del modo antojo hay subtipos (restaurante, cafetería, bar, terraza, comida saludable) y no a todo el mundo le interesan igual. Si alguien tiene 3 de sus 5 favoritos en restaurantes, le estamos haciendo un favor enseñándole más restaurantes.

**Cómo se calcula.** Se suman "puntos de interés" por categoría, de tres fuentes, cada una con un peso según lo que significa:

| Fuente | Peso | Por qué ese peso |
| --- | --- | --- |
| Cada cita en un local de esa categoría | **2** | Reservar es lo que más compromete: ha gastado tiempo y dinero |
| Cada favorito de esa categoría | **1** | Guardar es interés claro, pero no le ha costado nada |
| Cada vez que usó el filtro de esa categoría | **0,5** | Es una señal, pero más débil: puede haber estado curioseando |

Luego se calcula qué parte del total tiene cada categoría:

```
Usuario con 2 citas en restaurantes, 3 favoritos restaurante, 1 favorito cafetería:
  Restaurante: 2×2 + 3×1 = 7
  Cafetería:   1×1       = 1
  Total = 8  →  Restaurante 87,5 %, Cafetería 12,5 %
```

**Cuándo se considera "detectada" una afinidad.** Hacen falta las dos condiciones:

1. **Un mínimo de señales** (por ejemplo, 3 puntos en total). Si no, un solo favorito suelto ya cambiaría el feed entero, y eso es reaccionar a ruido.
2. **Que una categoría destaque claramente** (por ejemplo, 40 % o más del total).

**La cuota.** Cuando hay afinidad detectada, se reserva entre un **10 % y un 30 %** de los huecos del bloque de antojo para esa categoría. Cuanto más clara es la afinidad, más cerca del 30 %:

```js
const cuota = clamp(0.10, 0.30, 0.10 + (porcentaje - 0.40) * 0.5)
```

> 📖 **`clamp(min, max, valor)`**: "pinzar" un número para que no se salga de un rango. Si da 0,05 lo sube a 0,10; si da 0,45 lo baja a 0,30; si está entre medias, lo deja igual.

> 📖 **Cuota**: una parte fija reservada. "Cuota del 20 %" quiere decir que de cada 10 huecos, 2 se guardan para la categoría preferida y los otros 8 se reparten como siempre.

**¿Por qué el máximo es 30 % y no 100 %?** Porque si llenamos el feed de restaurantes, el usuario deja de descubrir cafeterías, bares y terrazas que quizá le encantarían. El feed "se cierra en banda" y deja de hacer su trabajo, que es **descubrir**. Es un error muy conocido de los sistemas de recomendación: te enseñan solo lo que ya te gusta y te encierran en una burbuja.

**Dato que falta hoy:** el uso de filtros no se guarda en ningún sitio. Hay que añadir un contador en el panel de filtros que apunte cada vez que se filtra por una categoría.

### 9.2 Categoría resuelta y "fijos"

**Qué es:** una categoría está **resuelta** para un usuario cuando ya tiene un sitio fijo para eso. El ejemplo típico: ya tiene barbero.

**Por qué importa:** ir dos veces al mismo barbero dice **tres cosas distintas**, y cada una va a un sitio diferente del sistema:

1. **Habla bien de ese local** → es la señal de "repetidores" del Paso 1, que sirve para **todos** los usuarios.
2. **Este usuario ya no necesita descubrir barberías** → se le quitan los huecos de barbería en Descubre.
3. **No dice que le interese "cortarse el pelo" más que a otro** → por eso **no** suma a la afinidad en el modo confianza.

**La regla acordada:**

- Hacen falta **dos visitas** al mismo sitio.
- **La nota que dejó el usuario manda:**
  - **5★** → se consolida como fijo. Es muy probable que vuelva en 15-30 días.
  - **1-3★** → **no** es fijo aunque haya ido dos veces (fue por necesidad, no por gusto).
  - **4★ o sin nota** → *sin decidir* (ver sección 19). Propuesta: tratarlo como "probable", con medio peso.

**Caducidad:** una categoría resuelta no lo está para siempre. Se reabre si:

- pasan ~6 meses sin ir,
- el local cierra o se muda,
- la nota del local cae por debajo de un umbral.

Esto no necesita ningún proceso aparte: cada categoría resuelta guarda una fecha `hasta`, y al construir el perfil simplemente se ignora si ya pasó.

**Lealtad a la persona, no al local.** En peluquería y barbería pasa algo importante: **si tu barbero se cambia de local, tú te vas con el barbero**. Las citas ya guardan `profesional: { id, name }`. Por eso, en el modo confianza, el agrupado de visitas se haría **por profesional**; en el resto, por local. Se programa como una opción de la tabla de modos (`agruparPor: 'profesional' | 'local'`), para que cambiar de idea sea cambiar un dato.

### Cómo se programa

📱 **Frontend — fase 1** (`perfil.js`). Una función pura:

```js
construirPerfil({ citas, favoritos, filtrosUsados, locales, ahora }) → perfil
```

Se alimenta de lo que ya hay en `localStorage` (citas y favoritos) más el contador nuevo de filtros.

🖥️ **Backend — fase 2:**

- Las citas y favoritos ya van a estar en sus tablas (`citas`, `favoritos`).
- Falta guardar el uso de filtros: tabla `uso_filtros (usuario_id, categoria, veces, ultima_vez)`. Se actualiza con un **upsert**.

> 📖 **Upsert**: "insertar o actualizar". Si la fila existe, se actualiza (se suma 1 a `veces`); si no existe, se crea. Evita tener que consultar primero si existe.

- Endpoint `GET /perfil-descubre` que devuelve el perfil ya calculado. Así sigue al usuario aunque cambie de móvil.

**⚠️ Dato que hay que resolver en el backend: ¿cuándo una cita cuenta como "visita"?** Hoy los estados de reserva son 0 (pendiente), 1 (confirmada), 2 (pendiente de confirmación) y 3 (cancelada). **No existe "completada" ni "asistió".** Una cita confirmada cuya fecha ya pasó probablemente se hizo, pero no es seguro (el cliente pudo no presentarse). Dos opciones:

- **A (recomendada):** añadir un estado `4 = asistió`, que marca el dueño desde Mi Negocio, o que se pone solo si el dueño no marca "no vino" en las 24 h siguientes.
- **B (provisional):** contar como visita toda cita confirmada con fecha pasada.

Se puede empezar con la B y pasar a la A cuando el dueño tenga ese botón.

### Por qué así y no de otra forma

- **¿Por qué no filtrado colaborativo** (lo de "a la gente como tú también le gustó…")? Porque necesita miles de usuarios con historial para funcionar, y no los hay. Con pocos usuarios da recomendaciones malas. La afinidad propia funciona desde el primer favorito.

> 📖 **Filtrado colaborativo**: técnica de recomendación que busca usuarios con gustos parecidos a los tuyos y te recomienda lo que les gustó a ellos. Es lo que hace Amazon con "los clientes que compraron esto también compraron…".

---

## 10. Paso 6 — Nivel 1: el reparto de huecos

A partir de aquí se construye la pantalla. Hay dos niveles, inspirados en cómo monta Netflix su página de inicio: **primero se decide qué filas salen** (nivel 1, este paso) y **después qué va dentro de cada fila** (nivel 2, el siguiente).

### Qué es

> 📖 **Hueco** (*slot*): un sitio en la pantalla donde va una tarjeta. Un bloque de 8 tarjetas tiene 8 huecos.

El reparto decide, **según el perfil del usuario**, qué bloques salen en la pantalla, en qué orden, cuántos huecos tiene cada uno y de qué modo se llenan.

### Por qué

Porque la pregunta "¿cuántos restaurantes y cuántas peluquerías le enseño?" **no se puede responder con una puntuación**: depende de quién es el usuario. Un usuario nuevo y uno que ya tiene barbero fijo necesitan pantallas con formas distintas.

### Las plantillas

Se definen tres plantillas base, una por tipo de usuario:

**Usuario nuevo** (no sabemos nada de él):

| # | Bloque | Modo | Huecos | Riesgo |
| --- | --- | --- | --- | --- |
| 1 | Héroe | mezcla (lo mejor de todo) | 5 | 0 |
| 2 | Para comer y tomar algo | antojo | 12 | 0,1 |
| 3 | Mejor valorados | general | 8 | 0,1 |
| 4 | Date un capricho | capricho | 6 | 0,3 |
| 5 | Para descubrir | antojo | 8 | 0,5 |

¿Por qué empieza con un golpe de unos 12 de antojo? Porque es el modo con más frecuencia y más ganas de variedad: es lo que más probablemente le haga reservar algo esta semana.

**Usuario con afinidad detectada:** la misma, pero el bloque 2 lleva su cuota (10-30 %) de la categoría preferida.

**Usuario con barbero fijo** (u otra categoría de confianza resuelta): los huecos de esa categoría **desaparecen** del descubrimiento y se reparten entre antojo y capricho.

> 📖 **Riesgo**: lo dispuesto que está ese bloque a enseñar cosas inciertas (locales nuevos, poco vistos). Riesgo 0 = solo lo seguro. Riesgo 0,5 = la mitad de los huecos pueden ser "apuestas". Se usa en el Paso 8.

### Reglas fijas

- **Confianza casi nunca recibe huecos de descubrimiento**, salvo categorías que el usuario aún no tiene resueltas.
- **Si un bloque no reúne al menos 3 candidatos, no sale.** Así el sistema funciona igual con 33 locales que con 3.000: con pocos locales simplemente salen menos bloques, en vez de bloques con una sola tarjeta.

### Cómo se programa

📱 **Frontend — fase 1** (`reparto.js`):

```js
export function plantillaPara(perfil) {
  const base = perfil.esNuevo ? PLANTILLA_NUEVO : PLANTILLA_GENERAL
  return base
    .map((bloque) => ajustarPorAfinidad(bloque, perfil))
    .filter((bloque) => !bloqueResuelto(bloque, perfil))
}
// → [{ id, titulo, modo, huecos, riesgo, cuotaAfinidad?, nuevos? }, ...]
```

Las plantillas son **datos** (arrays de objetos), no código. Cambiar la forma de la pantalla es editar un array.

🖥️ **Backend — fase 2:** igual, pero en el servidor. **Este es el sitio natural para meter un modelo aprendido en el futuro:** cuando haya datos de impresiones y reservas, el reparto puede decidirse "aprendiendo qué combinación de bloques da más reservas a usuarios parecidos". Gracias a la separación en niveles, eso se puede hacer **sin tocar el nivel 2**.

### Por qué así y no de otra forma

- **¿Por qué no una sola lista ordenada por puntuación?** Porque entonces el modo con mejores notas (o con más locales) se come toda la pantalla. El reparto garantiza que cada tipo de local tenga su espacio.
- **¿Por qué plantillas fijas y no calcularlo todo dinámicamente?** Porque las plantillas son fáciles de razonar ("el usuario nuevo ve esto") y de probar. La parte dinámica (afinidad, resueltas) se aplica como ajustes sobre la plantilla.

---

## 11. Paso 7 — Nivel 2: puntuar dentro de cada hueco

### Qué es

Para cada bloque, se toman los candidatos **de su modo** y se les da una puntuación (*score*) para decidir el orden. **Solo compiten contra sus iguales**: los restaurantes contra restaurantes y cafeterías, nunca contra spas.

> 📖 **Score**: puntuación numérica. Aquí siempre entre 0 y 1, donde 1 es "el mejor candidato posible para este hueco".

### La fórmula

```
score = wCalidad × calidad  +  wContexto × contexto  +  wAfinidad × afinidad  +  wNovedad × novedad
```

Es una **suma ponderada**: cuatro factores, cada uno multiplicado por su peso (`w`), y los pesos suman 1.

> 📖 **Suma ponderada**: sumar varias cosas dando más importancia a unas que a otras. Como la nota final de una asignatura: el examen vale 60 % y las prácticas 40 %.

> 📖 **Peso** (*weight*, `w`): cuánto importa cada factor. Los pesos de cada modo están en `CONFIG_MODO` (Paso 4). En antojo la novedad pesa más que en confianza, porque en antojo la variedad **es** el servicio.

### Los cuatro factores

Cada factor tiene que estar **normalizado**, es decir, entre 0 y 1, para poder sumarlos.

> 📖 **Normalizar**: pasar un valor a una escala común, normalmente de 0 a 1. Hace falta porque la nota va de 1 a 5, los minutos hasta el cierre van de 0 a 600… y no se pueden sumar manzanas con minutos.

**1. Calidad** — ¿es un buen sitio?

```js
calidad = (notaRanking - 1) / 4   // pasa la escala 1-5 a 0-1
        + extraPorRepetidores     // del Paso 1
```

**2. Contexto** — ¿le sirve **ahora**?

Esto es lo que diferencia a Citaly de Netflix: **lo cerrado no sirve**.

| Situación | Valor |
| --- | --- |
| Abierto, y le quedan más de 45 minutos | 1,0 |
| Abierto, pero cierra en menos de 45 minutos | baja poco a poco hasta 0,4 |
| Cerrado, pero abre hoy más tarde | 0,5 |
| Cerrado y no abre hoy | 0,1 |

Además, solo en el modo antojo, se aplica un **ajuste por hora del día**: una cafetería vale más por la mañana y un bar, por la noche. Es una tabla pequeña de multiplicadores por categoría y franja horaria.

**3. Afinidad** — ¿le suele gustar este tipo de sitio? Sale directamente del perfil (Paso 5). Para un usuario nuevo vale lo mismo para todas las categorías.

**4. Novedad** — ¿hace mucho que no sale arriba?

```js
novedad = clamp(0, 1, horasDesdeUltimoTop / 72)
```

Si un local salió en el top hace 72 horas o más, novedad = 1. Si salió hace 2 horas, casi 0. **Evita que el feed se congele**: un local que lleva días arriba cede el sitio poco a poco. Sale de la tabla `local_exposicion` del Paso 3.

### El orden final dentro del bloque

1. Se calcula el `score` de cada candidato.
2. Se le suma el **jitter** del Paso 2, con la amplitud que toca según el riesgo del bloque.
3. Se ordena de mayor a menor.
4. Se llenan los huecos: **primero la cuota de afinidad** (si la hay) con los mejores de la categoría preferida, y **luego el resto** con los mejores de cualquier categoría del modo.

### Cómo se programa

📱 **Frontend — fase 1** (`puntuar.js`). Cada factor es una función pura aparte (`factorCalidad`, `factorContexto`…), y `puntuar()` las combina. Así se puede probar cada factor por separado.

Muy recomendable: que `puntuar()` devuelva **el desglose**, no solo el total:

```js
{ localId, score: 0.78, desglose: { calidad: 0.85, contexto: 1, afinidad: 0.4, novedad: 0.6, jitter: 0.02 } }
```

Así, cuando alguien pregunte "¿por qué sale este local primero?", la respuesta está a la vista (ver Paso 17).

🖥️ **Backend — fase 2:** igual en el servidor. Los datos que necesita y que solo él tiene: `notaRanking`, `repetidores` y `local_exposicion`.

### Por qué así y no de otra forma

- **¿Por qué una suma ponderada y no algo más sofisticado?** Porque es transparente: cada número tiene un significado y se puede explicar. Con datos de impresiones se pueden ajustar los pesos sin cambiar la estructura. Un modelo de caja negra no deja ver por qué decide lo que decide.
- **¿Por qué los pesos los fijamos nosotros?** Porque al principio no hay datos para aprenderlos. Se empieza con valores razonables y se ajustan cuando el Paso 3 tenga semanas de registros.

---

## 12. Paso 8 — Re-ranking: diversidad, exploración y locales nuevos

Con los bloques ya ordenados, una última pasada aplica reglas que la puntuación no capta.

### 12.1 Diversidad

**Qué es:** evitar que salgan seguidos varios locales demasiado parecidos.

**Por qué:** aunque las tres mejores puntuaciones sean tres cafeterías, enseñar tres cafeterías seguidas hace que el bloque parezca monótono y desperdicia huecos.

**Reglas:**

- No más de **2 locales seguidos de la misma categoría**.
- No **dos locales seguidos del mismo dueño** (cuando un dueño tenga varios).

**Cómo se programa:** con un algoritmo **voraz**.

> 📖 **Algoritmo voraz** (*greedy*): uno que en cada paso coge la mejor opción disponible en ese momento, sin replantearse lo anterior. Aquí: recorres la lista ordenada; si el siguiente local rompe una regla, lo saltas y coges el siguiente que no la rompa; el saltado se queda esperando su turno.

```js
function diversificar(ordenados) {
  const resultado = []
  const pendientes = [...ordenados]
  while (pendientes.length) {
    const i = pendientes.findIndex((l) => !rompeDiversidad(l, resultado))
    resultado.push(pendientes.splice(i === -1 ? 0 : i, 1)[0]) // si todos rompen, se coge el primero
  }
  return resultado
}
```

### 12.2 Exploración

**Qué es:** dejar que, de vez en cuando, salga un local que **no** es de los mejor puntuados, para darle una oportunidad.

> 📖 **Exploración vs explotación**: el dilema clásico de los sistemas que aprenden. **Explotar** es enseñar lo que ya sabes que funciona. **Explorar** es probar cosas de las que no sabes lo suficiente, por si resultan ser mejores. Si solo explotas, nunca descubres nada nuevo y los locales poco conocidos se quedan para siempre en el olvido. Si solo exploras, el feed es un caos.

**Por qué:** sin exploración, el sistema se retroalimenta: lo que sale arriba consigue clics → con los clics sube aún más → los demás nunca salen. Un local bueno que nadie ha visto todavía no tendría forma de demostrarlo.

**Cómo:** con **ε-greedy** (épsilon-greedy).

> 📖 **ε-greedy** (épsilon-greedy): la forma más simple de equilibrar exploración y explotación. Para cada hueco se tira un "dado": con probabilidad ε (épsilon, un número pequeño como 0,1 o 0,3) se coge un candidato **poco mostrado**; el resto de las veces, el mejor puntuado. Épsilon es simplemente el nombre de la letra griega que se usa para esa probabilidad.

Aquí, ε es el **riesgo del bloque** (Paso 6): 0 en el héroe, 0,1 en los primeros bloques y 0,5 en el de "Para descubrir". El "dado" usa el generador con semilla, nunca `Math.random()`, para mantener la estabilidad del Paso 2.

**Por qué ε-greedy y no algo más sofisticado:** existen métodos más elaborados (*Thompson Sampling*, *UCB*), pero los estudios publicados (incluido uno con participación de Netflix) encontraron que en situaciones como la nuestra, con poco tráfico y por lotes, **el ε-greedy bien ajustado funciona igual o mejor**, y los métodos sofisticados tienden a explorar de más. Lo simple gana.

> 📖 **Thompson Sampling**: un método de exploración basado en probabilidades. Se menciona solo para dejar claro que se consideró y por qué no se usa: tiende a gastar demasiados huecos probando cosas desconocidas, y al arrancar asume que lo desconocido tiene un 50 % de éxito, lo que favorece a cosas malas.

**La exploración va abajo, no arriba.** La primera pantalla es de máxima confianza. Lo nuevo y lo aleatorio entran a partir del tercer bloque, cuando el usuario ya ha decidido quedarse.

### 12.3 Locales nuevos: el arranque en frío

> 📖 **Arranque en frío** (*cold start*): el problema de qué hacer con algo de lo que no hay datos todavía. Un local recién llegado no tiene opiniones, ni reservas, ni impresiones.

**El problema es un círculo vicioso:**

```
local nuevo → 0 opiniones → la nota bayesiana lo pega a la media
→ nunca sube en el ranking → nadie lo ve → nunca consigue opiniones
```

La nota bayesiana, que es justa con los locales existentes, es injusta con los nuevos.

**La solución:** un **hueco protegido** para locales nuevos, con caducidad. En el bloque "Para descubrir" se reservan 2 huecos para locales dados de alta hace **menos de 30 días**. Pasados los 30 días, el local pierde la protección y compite normal, con las opiniones que haya conseguido.

**Dato que falta:** los locales no tienen fecha de alta. El backend tiene que añadir `fecha_alta` (sección 15).

### 12.4 Sin repetidos

Un `Set` de ids ya colocados en la pantalla: un local que ya salió en un bloque no vuelve a salir en otro.

> 📖 **`Set`**: una estructura de JavaScript que guarda valores sin repetir y permite comprobar muy rápido si un valor está dentro.

> 📖 **Dedupe** (deduplicar): quitar repetidos.

(Hoy el dedupe es por tipo de estantería y permite repetir entre estanterías distintas. Con los bloques por modo, el dedupe pasa a ser por pantalla.)

### Cómo se programa

📱 / 🖥️ `rerank.js`. Recibe los bloques ordenados y devuelve los bloques definitivos. Como el resto, es puro, y en la fase 2 se mueve tal cual al servidor.

---

## 13. Paso 9 — Promoción pagada

### Qué es

Que un local pueda **pagar** por salir más.

### La regla clave: la promoción es un hueco, no un peso

Hay dos formas de hacerlo, y solo una es correcta:

| ❌ Como peso | ✅ Como hueco |
| --- | --- |
| Sumar puntos al score de quien paga | Reservar **un hueco concreto** de la pantalla para un local que paga |
| El usuario no sabe qué está pagado | El hueco va **etiquetado** como patrocinado |
| Corrompe todo el orden: ya no se sabe si un local sale por bueno o por pagar | El resto del orden sigue siendo honesto |

Si pagar entra como un factor más del score, todo el orden queda contaminado y el usuario lo nota aunque no sepa explicarlo: deja de fiarse del feed.

### Reglas

- **Máximo un local patrocinado por pantalla.**
- **Solo dentro de su propio modo.** Una barbería no puede pagar por salir en el bloque de restaurantes.
- Va en una **posición fija** (por ejemplo, la tercera del bloque) y **no cuenta** para el dedupe.
- La tarjeta lo **etiqueta** visiblemente ("Patrocinado").

### Quién hace qué

🖥️ **Backend:** esto es **dinero**, así que lo controla el servidor:

- Tabla `promociones (local_id, desde, hasta, presupuesto_impresiones, activa)`.
- El servidor decide **qué** promoción toca y **cuenta** las impresiones gastadas (con el Paso 3).
- En la fase 1, si hubiera promociones, el servidor manda la lista de activas y el front solo las coloca. En cuanto haya dinero real, el orden entero debería darlo el servidor (sección 4).

📱 **Frontend:** colocar el local en su hueco y pintar la etiqueta. El objeto llega con `patrocinado: true`.

---

## 14. Paso 10 — Lo que va fuera de Descubre

### 14.1 "Cerca de ti" y la geolocalización

**El problema:** hoy "Cerca de ti" ordena por un campo `metros` fijo que no sabe dónde está el usuario.

**Opción A — Geolocalización real:**

> 📖 **Geolocalización**: obtener la posición del usuario (latitud y longitud) desde el móvil. En la web se hace con `navigator.geolocation.getCurrentPosition()`, y el navegador **siempre** pide permiso al usuario.

- Se pide el permiso **tras un gesto del usuario** (por ejemplo, al tocar "Ver lo que tengo cerca"), **nunca al abrir la app**. Pedir permisos sin contexto hace que la gente diga que no por reflejo, y el navegador puede bloquear la petición para siempre.
- La distancia se calcula con la **fórmula de haversine**.

> 📖 **Fórmula de haversine**: la fórmula para calcular la distancia entre dos puntos de la Tierra a partir de sus coordenadas, teniendo en cuenta que la Tierra es redonda. Son unas 6 líneas de código.

- 🖥️ **Backend:** la tabla `locales` ya prevé `lat` y `lng`. Hay que **rellenarlas** para cada local; es la parte costosa.
- La posición del usuario **no se guarda en el servidor**: se usa en el móvil para ordenar y ya. Es un dato muy sensible.

**Opción B — Mientras no haya coordenadas:** cambiarle el nombre al bloque, para que no prometa algo que no hace.

### 14.2 El atajo de retención va en Mis Citas, no en Descubre

> 📖 **Retención**: conseguir que un usuario vuelva. Lo contrario de descubrimiento: en vez de enseñarle algo nuevo, le facilitas repetir lo que ya le gusta.

**Por qué no en Descubre:** Descubre es para **descubrir**. Un botón "Reservar otra vez en Barbería Yoel" saca al usuario de la página en vez de enseñarle cosas: trabaja en contra de la propia pantalla.

**Dónde:** en **Mis Citas**, que gana así una razón de existir más allá de listar 5 o 6 citas.

**Cómo:** reutiliza `perfil.fijos` del Paso 5. Es la misma función con otra pantalla consumiéndola. No hay lógica nueva.

### 14.3 Provincia

Cuando haya locales en varias provincias, la provincia es un **filtro duro** en la etapa de candidatos: **nunca** se muestra un local de otra provincia en el feed. **No es un peso** (no es "menos puntos por estar lejos"): sencillamente no entra.

🖥️ **Backend:** columna `provincia` en `locales`, y el endpoint de locales filtra por ella antes de enviar nada. Es el filtro que de verdad escala: reduce el problema de miles de locales a unos cientos.

### 14.4 Búsqueda

Dentista y veterinaria no van en el feed, así que su camino natural es la **búsqueda**. Queda por decidir (sección 19) si la búsqueda usa también los modos o solo ordena por coincidencia de texto + nota bayesiana.

### 14.5 Amigos (lo último)

La idea de ver dónde come o se corta el pelo un amigo es potente: **resuelve el arranque en frío** de usuarios (una recomendación de un amigo vale desde el primer día, sin necesitar miles de usuarios).

Pero **dónde comes es inocuo; dónde vas al dentista, no.** Propuesta de privacidad:

- Visibilidad **por modo** y **opt-in**:
  - **Antojo** → compartible por defecto.
  - **Confianza y capricho** → privado salvo que el usuario lo active expresamente.

> 📖 **Opt-in**: que algo está desactivado por defecto y el usuario tiene que activarlo a propósito. Lo contrario es *opt-out*: activado por defecto y el usuario tiene que quitarlo.

Técnicamente sería **otra fuente de candidatos** en la etapa ①. Va al final porque es lo que más diseño de privacidad necesita.

---

## 15. Cambios en la base de datos

Sobre lo que ya está en `docs/tablas-backend.md`:

### Columnas nuevas en tablas existentes

| Tabla | Columna | Tipo | Para qué | Paso |
| --- | --- | --- | --- | --- |
| `categorias` | `modo` | enum `antojo`/`confianza`/`capricho`/`rutina` | El modo de consumo | 4 |
| `categorias` | `en_feed` | boolean | `false` para dentista, veterinaria | 4 |
| `locales` | `fecha_alta` | date | Hueco protegido de locales nuevos | 8 |
| `locales` | `repetidores_cache` | int | Clientes que repiten | 1 |
| `locales` | `provincia` | texto | Filtro duro de candidatos | 10 |
| `locales` | `lat` / `lng` | decimal | Ya previstas: **rellenarlas** | 10 |
| `citas` | `estado_reserva = 4` | smallint | "Asistió": saber qué cita fue una visita real | 5 |

Recordatorio: `rating_cache` y `opiniones_count` en `locales` (ya previstas) son la base de la nota bayesiana.

### Tablas nuevas

**`ranking_stats`** — una sola fila con las estadísticas globales.

| Campo | Tipo | Para qué |
| --- | --- | --- |
| `media_global` | decimal | `m` de la nota bayesiana |
| `c_bayes` | decimal | `C` de la nota bayesiana |
| `actualizado_en` | timestamp | |

**`impresiones`** — el registro de lo mostrado (Paso 3). Es la tabla que más crece.

| Campo | Tipo | Para qué |
| --- | --- | --- |
| `id` | uuid PK | Generado en el cliente → hace el endpoint idempotente |
| `usuario_id` | FK nullable | Null si no tiene cuenta |
| `anonimo_id` | texto nullable | El id anónimo del navegador |
| `local_id` | FK → locales | |
| `bloque` | texto | `antojo-1`, `explorar`… |
| `posicion` | smallint | 0, 1, 2… |
| `tipo` | enum `vista`/`toque`/`reserva` | |
| `patrocinado` | boolean | Para contar el gasto de promociones |
| `creado_en` | timestamp | |

Índices: `(local_id, creado_en)`, `(usuario_id, creado_en)`.

**`local_exposicion`** — resumen de impresiones, recalculado por una tarea programada (cada hora o cada noche).

| Campo | Tipo | Para qué |
| --- | --- | --- |
| `local_id` | PK/FK | |
| `vistas_24h` | int | |
| `toques_24h` | int | Para el CTR |
| `ultima_vez_top` | timestamp | Factor **novedad** |

**`uso_filtros`** — para la afinidad (Paso 5).

| Campo | Tipo |
| --- | --- |
| `usuario_id` | FK |
| `categoria` | texto |
| `veces` | int |
| `ultima_vez` | timestamp |
| PK | (`usuario_id`, `categoria`) |

**`promociones`** — Paso 9.

| Campo | Tipo |
| --- | --- |
| `id` | uuid PK |
| `local_id` | FK |
| `desde` / `hasta` | date |
| `presupuesto_impresiones` | int |
| `gastadas` | int |
| `activa` | boolean |

### Tareas programadas (cron) que necesita el backend

| Tarea | Cada cuánto | Qué hace |
| --- | --- | --- |
| Recalcular `ranking_stats` | Cada noche | Media global y mediana de opiniones |
| Recalcular `repetidores_cache` | Cada noche | Clientes con 2+ visitas por local |
| Resumir `impresiones` → `local_exposicion` | Cada hora | Vistas, toques, última vez en el top |
| Limpiar `impresiones` antiguas | Cada semana | Borrar o resumir lo de más de 90 días |
| Marcar citas como asistidas | Cada noche | Si se elige la regla automática del Paso 5 |

---

## 16. Endpoints de la API

> 📖 **Endpoint**: una dirección del servidor que el front llama para pedir o enviar datos. Por ejemplo, `GET /locales` pide la lista de locales.

### Fase 1 (ranking en el front)

| Método y ruta | Qué devuelve / hace | Notas |
| --- | --- | --- |
| `GET /locales?provincia=…` | Locales candidatos, ya filtrados por provincia y `en_feed`, con `rating_cache`, `opiniones_count`, `repetidores_cache`, `fecha_alta`, y su exposición | El front construye el ranking |
| `GET /categorias` | Categorías con `modo` y `en_feed` | Se puede cachear mucho tiempo |
| `GET /ranking-stats` | `media_global`, `c_bayes` | Cambia poco: cachear |
| `POST /eventos` | Recibe un lote de impresiones | Idempotente por `id` |
| `POST /uso-filtros` | Suma 1 a una categoría | Upsert |

### Fase 2 (ranking en el servidor)

| Método y ruta | Qué devuelve |
| --- | --- |
| `GET /descubre` | La pantalla entera ya montada: `[{ id, titulo, locales: [...] }]`. El servidor lee usuario, hora, perfil, promociones y semilla |
| `GET /perfil-descubre` | El perfil calculado (útil para depurar y para Mis Citas) |

En la fase 2, `GET /descubre` debe devolver **lo mismo** que daría `construirDescubre()` en el cliente con los mismos datos. Las pruebas de la sección 17 sirven para comprobarlo.

---

## 17. Cómo probarlo y depurarlo

### Pruebas automáticas

Como todo son funciones puras, se prueban sin abrir la app: se les dan datos inventados y se comprueba el resultado. Algunas pruebas que no pueden faltar:

- **Nota bayesiana:** el local de 1 opinión de 5★ queda por debajo del de 40 opiniones con 4,7.
- **Estabilidad:** misma semilla → mismo orden exacto. Otra semilla → otro orden.
- **El jitter no sube a los malos:** un local con score 0,4 nunca acaba por encima de uno con 0,8, con ninguna semilla.
- **Añadir un local no reordena a los demás** (el jitter va por id, no por posición).
- **Bloques mínimos:** con 2 candidatos, el bloque no sale.
- **Diversidad:** nunca hay 3 de la misma categoría seguidos.
- **Promoción:** como mucho una por pantalla, y siempre del modo del bloque.

> 📖 **Prueba unitaria** (*unit test*): un pequeño programa que comprueba automáticamente que una función devuelve lo esperado para unos datos concretos. Se ejecutan todas de golpe antes de publicar un cambio, para asegurarse de que no se ha roto nada.

**Para el backend:** si el ranking se traduce a otro lenguaje en la fase 2, conviene tener una lista de casos (entrada → salida esperada) en un JSON compartido, y que **las dos implementaciones** pasen las mismas pruebas.

### Modo de depuración

Un modo, **solo en desarrollo**, que muestra encima de cada tarjeta su puntuación desglosada:

```
calidad 0,85 · contexto 1,00 · afinidad 0,40 · novedad 0,60 · jitter +0,02 → 0,78
bloque: antojo-1 · posición 2 · (exploración)
```

Sin esto, ajustar pesos es adivinar. Con esto, cuando alguien pregunte "¿por qué sale este local primero?", la respuesta está en pantalla.

Se activaría con un parámetro en la URL (`?debug=ranking`) y no llegaría nunca a producción.

---

## 18. Orden de trabajo y fases

Ordenado por **dependencias** (qué necesita qué) y por **impacto / esfuerzo**:

| # | Qué | 📱 Frontend | 🖥️ Backend | Por qué en este momento |
| --- | --- | --- | --- | --- |
| 1 | **Nota bayesiana** | `calidad.js`, usarla en el orden actual | Exponer `rating_cache`, `opiniones_count`; `ranking_stats` | Arregla un fallo visible con poco esfuerzo, sin cambiar la arquitectura |
| 2 | **Semilla + jitter** | `semilla.js`, id anónimo | — | Independiente: el feed empieza a moverse ya |
| 3 | **Impresiones** | Hook `useImpresion`, cola, `sendBeacon` | Tabla `impresiones`, `POST /eventos`, tarea de resumen | Cuanto antes se guarde, antes se podrá afinar todo lo demás |
| 4 | **Modos + reparto + puntuación** | `modos.js`, `reparto.js`, `puntuar.js`, nuevo `construirDescubre` | Columnas `modo`, `en_feed` en `categorias` | La reescritura grande. Todo lo siguiente se apoya aquí |
| 5 | **Perfil: afinidad y resueltas** | `perfil.js`, contador de filtros | Estado "asistió" en citas; `uso_filtros` | Necesita el 4 y cerrar las dudas de la sección 19 |
| 6 | **Re-ranking** | `rerank.js` | `fecha_alta`, `local_exposicion` | Necesita el 4 y datos del 3 |
| 7 | **Atajo en Mis Citas** | Reutilizar `perfil.fijos` | — | Necesita el 5 |
| 8 | **Promociones** | Pintar el hueco y la etiqueta | Tabla `promociones`, conteo de gasto | Solo cuando se vaya a cobrar |
| 9 | **Pasar el ranking al servidor** | Consumir `GET /descubre` | Portar `src/utils/ranking/` | Cuando haya cientos de locales o dinero de por medio |
| 10 | **Amigos** | — | — | Lo último: necesita diseño de privacidad |
| — | **Provincia** | — | Columna y filtro | Cuando haya locales fuera de la provincia actual |

**El backend puede trabajar en paralelo** desde el principio en: estadísticas de la nota (1), tabla y endpoint de impresiones (3) y columnas de categorías (4). Ninguna depende del frontend.

---

## 19. Decisiones que siguen abiertas

Ninguna bloquea empezar, pero algunas bloquean pasos concretos.

| # | Pregunta | Bloquea | Propuesta |
| --- | --- | --- | --- |
| 1 | Un local visitado 2 veces con **4★**, ¿es fijo? | Paso 5 | "Probable", con medio peso |
| 2 | Visitado 2 veces **sin dejar nota**, ¿es fijo? | Paso 5 | Igual que 4★. Mucha gente no puntúa |
| 3 | ¿Qué reabre exactamente una categoría resuelta? | Paso 5 | 6 meses sin ir, cierre, mudanza o nota < 3,5 |
| 4 | Lealtad: ¿al local o al profesional? | Paso 5 | Profesional en modo confianza, local en el resto |
| 5 | ¿Cuándo cuenta una cita como visita? | Paso 5 | Estado nuevo "asistió" (sección 9.2) |
| 6 | Semilla: ¿por día o por sesión? | Paso 2 (cambio de 1 línea) | Por día, con corte a las 5:00 |
| 7 | ¿Cafetería y Bar deben ir juntos en antojo pese a su horario opuesto? | Paso 7 | Sí, con el ajuste horario del factor contexto |
| 8 | ¿La búsqueda usa los modos? | Búsqueda | Ordenar por texto + nota bayesiana, sin modos |
| 9 | Privacidad de amigos | Paso 10 | Por modo y opt-in |
| 10 | El campo `points` de `locales.json` ya no se usa | — | Borrarlo del JSON y no llevarlo a la base de datos |

---

## Glosario

Todos los términos técnicos del documento, en orden alfabético.

| Término | Qué significa | Para qué nos sirve |
| --- | --- | --- |
| **Afinidad** | Cuánto le gusta a un usuario un tipo de local en comparación con otros | Reservarle una parte de los huecos (cuota) a lo que le gusta |
| **Agregar / agregación** | Resumir muchas filas en pocas (contar, sumar, hacer medias) | Pasar millones de impresiones a una fila por local |
| **Algoritmo voraz** (*greedy*) | Algoritmo que en cada paso coge la mejor opción disponible sin replantearse lo anterior | Aplicar la diversidad de forma simple y rápida |
| **Arranque en frío** (*cold start*) | Qué hacer con algo de lo que aún no hay datos | Darle una oportunidad a los locales recién llegados |
| **Batch** (lote) | Agrupar muchas operaciones en una | Enviar impresiones de 20 en 20 y no de una en una |
| **Caché** | Guardar el resultado de un cálculo para no repetirlo | `rating_cache`, `repetidores_cache` |
| **Candidato** | Local que podría salir en la pantalla | Primera criba antes de puntuar |
| **`clamp`** | Limitar un número a un rango mínimo-máximo | Que la cuota esté siempre entre 10 % y 30 % |
| **Cola** (*queue*) | Lista donde entran cosas por un lado y salen por otro, en orden | Acumular impresiones antes de enviarlas |
| **Cron / tarea programada** | Código que el servidor ejecuta solo a horas fijas | Recalcular estadísticas por la noche |
| **CTR** | De las veces que se mostró algo, en cuántas se tocó | Medir qué funciona |
| **Cuota** | Parte de los huecos reservada para algo | 10-30 % para la categoría preferida |
| **cyrb53** | Un algoritmo concreto de hash, pequeño y rápido | Convertir "usuario + día" en una semilla |
| **Dedupe** | Quitar repetidos | Que un local no salga en dos bloques |
| **Determinista** | Que con la misma entrada da siempre la misma salida | Que el orden no se mueva al repintar |
| **Endpoint** | Dirección del servidor a la que llama el front | `GET /locales`, `POST /eventos` |
| **ε-greedy** (épsilon-greedy) | Con probabilidad ε elegir algo poco visto; si no, lo mejor | Exploración simple y controlable |
| **Exploración / explotación** | Probar cosas nuevas vs. usar lo que ya sabes que funciona | Equilibrar variedad y acierto |
| **Feed** | Lista de contenido por la que se hace scroll | Descubre |
| **Filtrado colaborativo** | Recomendar lo que gustó a usuarios parecidos | Descartado por ahora: necesita miles de usuarios |
| **Función pura** | Función que no lee ni toca nada de fuera y con la misma entrada da la misma salida | Poder probar el ranking sin la app y reutilizarlo en el servidor |
| **Geolocalización** | Obtener la posición del usuario | "Cerca de ti" de verdad |
| **Hash** | Función que convierte un texto en un número, siempre el mismo para el mismo texto | Crear la semilla |
| **Haversine** | Fórmula de distancia entre dos puntos de la Tierra | Calcular a cuántos metros está un local |
| **Hook** | Función de React que empieza por `use` y encapsula lógica reutilizable | `useImpresion` |
| **Hueco** (*slot*) | Sitio de la pantalla donde va una tarjeta | Unidad del reparto |
| **Idempotente** | Hacer algo dos veces da lo mismo que hacerlo una | Que reenviar impresiones no las duplique |
| **Impresión** | Cada vez que una tarjeta aparece en pantalla | Base para medir y para el factor novedad |
| **Índice** | Estructura de la base de datos para encontrar filas rápido | Consultas de impresiones por local o usuario |
| **`IntersectionObserver`** | API del navegador que avisa cuando un elemento entra o sale de la pantalla | Saber qué tarjetas se vieron de verdad |
| **Jitter** | Empujón pequeño y aleatorio sumado a una puntuación | Variar el orden entre empatados sin subir a los malos |
| **Logaritmo** | Función que crece cada vez más despacio | Que los repetidores importen, pero sin que los grandes aplasten |
| **Media bayesiana** | Media que tira hacia la media general cuando hay pocos datos | Que una sola opinión de 5★ no gane a 40 de 4,7 |
| **Mediana** | El valor del medio de una lista ordenada | El parámetro `C` de la nota bayesiana |
| **Modo de consumo** | Grupo interno de categorías según cómo se usan (antojo, confianza, capricho, rutina) | Que solo compitan locales que se sustituyen entre sí |
| **mulberry32** | Un algoritmo concreto de generador pseudoaleatorio | El generador con semilla |
| **Normalizar** | Pasar un valor a una escala común (0 a 1) | Poder sumar nota, minutos y horas en un mismo score |
| **Opt-in** | Desactivado por defecto; el usuario lo activa | Privacidad de la función de amigos |
| **Peso** (*weight*) | Cuánto importa un factor en una suma ponderada | Ajustar el comportamiento de cada modo |
| **Pipeline** | Cadena de etapas donde la salida de una es la entrada de la siguiente | Organizar todo el sistema |
| **PRNG** | Generador de números que parecen aleatorios pero salen de una fórmula y una semilla | Aleatoriedad reproducible |
| **Prueba A/B** | Enseñar dos versiones a grupos distintos y comparar resultados | Afinar pesos con datos reales |
| **Prueba unitaria** | Programa que comprueba automáticamente que una función hace lo esperado | Que los cambios no rompan el ranking |
| **Ranking** | Orden según una puntuación | El orden de Descubre |
| **Re-ranking** | Retocar un orden ya calculado aplicando reglas | Diversidad, exploración, locales nuevos |
| **Retención** | Conseguir que el usuario vuelva | Atajo "reservar otra vez" en Mis Citas |
| **Riesgo** (de un bloque) | Qué parte de sus huecos puede dedicarse a explorar | Exploración abajo, no arriba |
| **`sendBeacon`** | Forma de enviar datos que funciona aunque se cierre la pestaña | Que no se pierdan impresiones |
| **Score** | Puntuación numérica de un candidato (0 a 1) | Ordenar dentro de cada bloque |
| **Semilla** (*seed*) | Número de partida de un generador: misma semilla, misma secuencia | Orden estable durante el día y distinto cada día |
| **`Set`** | Estructura de JS que guarda valores sin repetir | Dedupe |
| **Suma ponderada** | Sumar varias cosas dando a cada una su importancia | La fórmula del score |
| **Thompson Sampling** | Método de exploración probabilístico más sofisticado | Considerado y descartado: explora de más |
| **Upsert** | Insertar o, si ya existe, actualizar | Contador de uso de filtros |
| **`useMemo`** | Herramienta de React que guarda un cálculo hasta que cambian sus datos | No recalcular el feed al repintar |
| **UUID** | Identificador aleatorio que en la práctica nunca se repite | Id anónimo del navegador, id de cada impresión |
| **XOR (`^`)** | Operación que mezcla dos números bit a bit | Combinar la semilla del día con el id del local |
