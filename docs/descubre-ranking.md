# Citaly — Cómo se ordena y se muestra Descubre

Documento de diseño. Recoge la conversación completa sobre **qué local se le enseña a cada usuario, en qué orden y por qué**.

**Esto no es** una especificación de implementación ni código acordado. Es el razonamiento cerrado, las decisiones tomadas y lo que queda pendiente, para poder sentarse a construirlo sin volver a discutirlo todo.

Estado: **nada de esto está implementado.** Lo que hay hoy en `src/utils/descubre.js` es lo descrito en el punto 3.

---

## Mapa rápido

```
0. El problema
1. Cómo lo hacen las apps grandes        (investigación)
2. Por qué no se puede copiar            (la corrección importante)
3. Lo que falla hoy en el código         (3 fallos reales)
4. La solución: los 4 modos de consumo   (el invento)
5. Descubrimiento vs retención           (son dos trabajos, no uno)
6. La arquitectura de dos niveles
7. Decisiones tomadas
8. Lo que queda volando
9. Orden de implementación sugerido
```

---

## 0. El problema

Decidir qué tarjetas de locales aparecen primero, cuáles después y cuáles no aparecen, para un usuario concreto.

La idea de partida fue mezclar **aleatoriedad + gusto del usuario + promoción / bien valorados**, repartido por pesos.

Spoiler: la intuición de los pesos era correcta, pero faltaba una capa por encima.

---

## 1. Cómo lo hacen las apps grandes

### 1.1 El esqueleto común

Netflix, Instagram y X hacen las mismas tres etapas:

| Etapa | Qué hace | Coste |
| --- | --- | --- |
| **Generación de candidatos** | De millones a unos cientos. Filtros baratos: idioma, país, a quién sigues, disponibilidad | Barato |
| **Scoring** | Un modelo puntúa cada candidato prediciendo **una acción concreta** (¿lo verá? ¿le dará like? ¿reservará?) | Caro |
| **Re-ranking** | Rompe el orden puro de scores para meter diversidad, frescura, promoción y reglas de negocio | Barato |

La etapa 3 es la que casi todo el mundo olvida, y es donde se decide si un feed se siente vivo o repetitivo.

### 1.2 Instagram

- **No tiene un algoritmo.** Cada superficie (Feed, Stories, Explore, Reels) tiene el suyo.
- Señales agrupadas en cuatro familias: información del post, tu actividad, información de quién publica, y tu historial con esa persona.
- Las tres que más pesan, según Mosseri (enero 2025): **tiempo de visionado, likes y envíos**.
- **Lo aprovechable para nosotros:** las señales pesan distinto según la superficie. En Explore (donde no sigues a nadie) pesan muchísimo más que en el Feed. Es decir: el mismo catálogo se ordena distinto según el contexto de la pantalla.

### 1.3 Netflix

- La home se construye en **dos capas**: primero **qué filas aparecen y en qué orden**, luego **qué títulos van dentro de cada fila**.
- Modelo clásico (2015): plantillas con reglas sobre qué tipo de fila puede ir en qué posición. La personalización estaba en elegir y puntuar filas candidatas ("Porque viste X").
- Encima: deduplicación y ajuste al dispositivo.
- En 2026 publicaron **GenPage**, que sustituye todo el pipeline por un solo transformer que genera la página entera de una vez. (Irrelevante para nosotros a corto plazo, pero marca por dónde va el campo.)
- **Lo aprovechable:** la separación en dos capas. Es la base del punto 6.

### 1.4 X

- Código abierto. Mezcla fuentes *in-network* (a quién sigues) y *out-of-network*, puntúa con un modelo de engagement y aplica filtros de diversidad y de autor.
- **Lo aprovechable:** los filtros de diversidad por autor. Equivalente nuestro: no amontonar varios locales del mismo dueño o la misma categoría seguidos.

### 1.5 Aleatoriedad: exploration vs exploitation

El nombre técnico de lo que se quería meter como "aleatoriedad".

- Un estudio con participación de Netflix encontró que, **en horizontes cortos y por lotes, el epsilon-greedy con calendario optimizado gana consistentemente a Thompson Sampling**, porque TS tiende a sobre-explorar.
- Thompson además tiene un problema de arranque conocido: un prior uniforme asume un 50% de éxito para lo que nadie ha visto, y sobre-asigna tráfico a cosas malas.
- **Conclusión para nosotros:** lo simple gana. No hace falta nada bayesiano complicado para la exploración.

---

## 2. Por qué no se puede copiar

### 2.1 Multiproducto — la corrección importante

**Problema detectado:** el primer análisis usaba Netflix como modelo estructural sin ver que **Netflix es monoproducto**. Todo lo que vende es video: una peli compite con otra peli, siempre. Por eso puede permitirse un pool único y filas por género.

Citaly no. **Un dentista y una pizzería no compiten por nada.** No son alternativas, son necesidades distintas. Meterlos en el mismo `porNota` y dejar que gane el de mejor media es comparar peras con tornillos.

**Solución acordada:** la competencia tiene que pasar **dentro de grupos que de verdad se sustituyan entre sí**. De aquí salen los 4 modos del punto 4.

### 2.2 Son servicios físicos, no contenido

| Netflix / Instagram | Citaly |
| --- | --- |
| Disponible siempre | **Un local cerrado es inútil ahora mismo**, por muy bien valorado que esté |
| Sin coste de desplazamiento | Hay que ir físicamente |
| Frecuencia altísima (50 reels/hora) | **Frecuencia bajísima** (un corte de pelo al mes) |
| Consumo infinito | El éxito es **una** reserva |

### 2.3 El objetivo no es engagement

Instagram optimiza tiempo en pantalla. Para nosotros eso sería el objetivo equivocado: **el éxito de Citaly es una reserva, no que el usuario haga scroll media hora.** Un feed que retiene pero no convierte está fallando.

### 2.4 Sobre el tamaño del catálogo

Hoy hay 33 locales y 15 categorías, todos de prueba. Esto **no** debe usarse como excusa para un diseño pobre: la arquitectura del punto 6 está pensada para cientos o miles de locales, y degrada bien hacia abajo (si un bloque no reúne 3 locales, se salta).

---

## 3. Lo que falla hoy en el código

Tres fallos reales encontrados en `src/utils/descubre.js`:

### 3.1 La nota cruda rompe el orden

`porNota` ordena **solo por media, ignorando la cantidad de reseñas**.

> Un local con **un** comentario de 5★ le gana a uno con 40 comentarios y 4.7.

Y como el héroe son los 5 primeros por nota, eso va directo a la primera pantalla.

**Solución:** media bayesiana — encoger la nota hacia la media global según cuántas reseñas haya. Es el cambio con mejor relación impacto/esfuerzo de toda la lista.

### 3.2 "Cerca de ti" no sabe dónde estás

No hay geolocalización en el proyecto (`grep` de `navigator.geolocation` / `coords` / `latitud`: sin resultados). El campo `metros` es un valor **fijo de cada local**, igual para todos los usuarios.

El bloque "Cerca de ti · Del más cercano al más lejos" es el mismo orden para cualquiera y no mide distancia a nadie.

**Solución:** o entra geolocalización de verdad, o se deja de llamar "Cerca de ti".

### 3.3 El feed es idéntico para todos y no cambia nunca

Mismos 5 héroes hoy, mañana y dentro de un mes. Un usuario que entra tres veces ve exactamente lo mismo.

**Solución:** semilla por día + usuario (ver punto 6.3).

---

## 4. La solución: los 4 modos de consumo

**El eje no es la categoría, es cómo se consume el servicio.** Agrupar por categoría da 15 cajones que no dicen nada. Agrupar por comportamiento da cuatro, y cada uno quiere cosas distintas.

| Modo | Categorías | Frecuencia | ¿Quiere variedad? |
| --- | --- | --- | --- |
| **Antojo** | Restaurante, Cafetería, Bar, Terraza, Comida saludable | Alta | **Sí**, es el punto |
| **Confianza** | Peluquería, Barbería, Uñas, Dentista, Veterinaria | Media | **No**, busca uno y se queda |
| **Capricho** | Spa, Tatuajes, Arte y talleres, Ocio | Baja | Sí, pero investiga mucho antes |
| **Rutina** | Gimnasio | Decide una vez | No, es casi suscripción |

### Por qué esto lo resuelve

Cada modo quiere **lo contrario** que el otro:

- En **antojo**, repetir restaurante *no* significa que quiera solo ese. La variedad y la exploración **son** el servicio.
- En **confianza**, repetir barbero significa que **ya terminó de buscar**. Enseñarle ocho barberías más no es recomendar, es ruido.

Un feed que trata igual a los dos se equivoca con uno de los dos siempre.

### Reglas que salen de la tabla

- **Dentista y veterinaria casi no deberían aparecer en un feed de descubrimiento.** Nadie navega dentistas por gusto. Eso es búsqueda, o recomendación de un amigo cuando hace falta.
- La **promoción solo puede comprarse dentro del propio modo**. Una barbería no puede pagar por salir en el bloque de antojo.

### Regla de oro: los modos son invisibles

> **El usuario NUNCA ve nada de esta clasificación.** No hay etiquetas de "antojo" ni "confianza" en ninguna parte de la interfaz. Para él son locales que casualmente le salen. Los modos son una herramienta interna de ordenación, no una taxonomía de producto.

### Por qué escala

- El modo es **metadato escrito a mano por categoría**: ~15 líneas de tabla. No se entrena, no necesita ML, no se degrada. Funciona igual con 33 que con 3000.
- Cuando haya volumen, el reparto de huecos (nivel 1) es el sitio natural donde enchufar un modelo aprendido, sin tocar el nivel 2.

---

## 5. Descubrimiento vs retención

**Problema detectado:** ¿qué significa que un usuario vaya dos veces al mismo barbero?

Esa señal dice **tres cosas distintas**, y cada una va a un sitio diferente:

1. **Habla del local, no de la categoría.** Es una señal de calidad fortísima sobre *ese* barbero, y es reutilizable **para otros usuarios**. Una reserva repetida vale mucho más que una estrella: nadie vuelve dos veces a un sitio malo. Debería pesar más que la nota en el ranking global.
2. **Marca la categoría como resuelta _para ese usuario_.** Barbería deja de ser terreno de descubrimiento.
3. **No dice nada sobre su interés en cortarse el pelo.** Dice que ya lo tiene solucionado.

De ahí la conclusión más importante de toda la conversación:

> **Descubre está haciendo un solo trabajo cuando en realidad son dos: descubrimiento y retención. Y quieren comportamientos opuestos.**

**Solución acordada:** separarlos de pantalla. El atajo de retención ("Reservar otra vez en Yoel") **no va en Descubre** — ver decisión 7.2.

---

## 6. La arquitectura de dos niveles

Es el modelo de Netflix (filas, luego títulos), pero con el reparto hecho **por modo** en vez de por género.

### 6.1 Nivel 1 — Reparto de huecos

Decide **qué bloques salen y cuántos**, según el historial del usuario.

| Perfil de usuario | Reparto |
| --- | --- |
| **Nuevo** | Golpe de ~12 locales de **antojo** + lo mejor valorado en general |
| **Con afinidad detectada** | Antojo sigue mandando, pero con cuota del subtipo preferido (ver 6.2) |
| **Con barbero fijo** | Confianza deja de recibir huecos de descubrimiento; se reparten a antojo y capricho |

Reglas fijas:

- **Confianza casi nunca recibe huecos de descubrimiento**, salvo que la categoría esté sin resolver.
- **La promoción es un hueco contado y etiquetado**, no un peso. Si "pagó por aparecer" entra como factor del score, corrompe todo el orden y el usuario lo nota aunque no sepa explicarlo. Una promo por pantalla como mucho.

### 6.2 Afinidad dentro del modo

**Problema:** dentro de antojo hay subtipos (restaurante, cafetería, bar, terraza, comida saludable) y no todos interesan igual.

**Solución acordada:** detectar la afinidad por señales de comportamiento —

- uso repetido de un filtro concreto,
- composición de favoritos (p. ej. 3 de 5 favoritos son restaurantes),
- historial de citas.

Una vez detectada, **entre un 10% y un 30% de los huecos de antojo se reservan a ese subtipo**. El resto de subtipos siguen compitiendo entre ellos en discover normal.

La cuota es deliberadamente baja: con un 100% el feed se cierra en banda y deja de descubrir, que es justo lo que no queremos.

### 6.3 Nivel 2 — Competencia dentro del hueco

Aquí sí aplican los pesos, pero **compitiendo solo contra sus iguales**.

| Factor | Qué mide | Por qué |
| --- | --- | --- |
| **Calidad** | Nota bayesiana + nº de reseñas + reservas repetidas | Base de confianza sin el sesgo de la reseña única |
| **Contexto** | Abierto ahora, cierra pronto, día/hora | Es servicio físico: lo cerrado no sirve |
| **Afinidad** | Categorías de favoritos y citas pasadas | La única señal personal real disponible |
| **Novedad** | Hace cuánto que no sale arriba | Evita que el feed se congele |

**La aleatoriedad va con semilla, nunca `Math.random()` por render.** Esto es lo más importante del nivel 2:

- Si el orden cambia en cada repintado, el usuario pierde el sitio donde estaba y deja de fiarse.
- Lo correcto es **semilla por día + usuario**: distinto hoy que ayer, estable mientras lo usa.
- Y en vez de barajar, **jitter sobre el score** (un empujón pequeño y acotado): el orden varía entre los que están empatados, pero un local malo nunca salta al héroe.

**La exploración va abajo, no arriba.** La primera pantalla es de máxima confianza (abierto, bien valorado, afín). Lo aleatorio y lo nuevo entran a partir del tercer bloque, cuando el usuario ya decidió quedarse.

---

## 7. Decisiones tomadas

### 7.1 Taxonomía de 4 modos — **ACEPTADA**

Se adopta tal cual está en el punto 4. Usuario nuevo recibe ~12 locales de antojo de golpe, mezclando nota bayesiana y orden. Afinidad con cuota del 10–30% una vez detectada (6.2).

**Los modos son internos y nunca visibles para el usuario.**

### 7.2 El atajo de retención — **FUERA DE DESCUBRE**

**Razonamiento:** Descubre es para descubrir. Meter un atajo que literalmente saca al usuario de la página es trabajar en contra de la propia pantalla.

**Decisión:** va en **Mis Citas**, que además gana una razón de existir más allá de mostrar las 5 o 6 citas del usuario promedio.

**Abierto:** si más adelante conviene una sección aparte para cosas de este estilo. Queda a confirmación.

### 7.3 Cuándo una categoría está "resuelta" — **SEGUNDA VISITA, CON FILTRO DE NOTA**

- **Dos visitas al mismo local** (barbero, manicurista...) bastan para marcarlo como fijo.
- Pero **la puntuación manda**:
  - **5★** → muy probable que vuelva a los 15–30 días. Se consolida como fijo.
  - **1–3★** → se descarta como fijo para ese usuario, aunque haya ido dos veces.

### 7.4 Provincia — **DISEÑADO, NO CONSTRUIDO**

Hoy no hay nada con esa metodología y no se va a montar ahora. Queda anotado:

> Cuando entre, la provincia es **filtro duro en la generación de candidatos**, no un peso. Nunca se muestra un local de otra provincia en el feed. Es la etapa 1 de las apps grandes y es la que de verdad escala.

---

## 8. Lo que queda volando

Para revisar con calma. Ninguno bloquea empezar.

### 8.1 Huecos en la regla del "fijo" (7.3)

- **¿Qué pasa con 4★?** La regla define 5★ (fijo) y 1–3★ (descartado). El 4 está sin definir.
- **¿Y si va dos veces y no puntúa nunca?** Hace falta un valor por defecto. Mucha gente no deja reseña.
- **¿Qué reabre una categoría resuelta?** Se habló de: el local cierra, se muda, se le cae la nota, o pasan ~6 meses sin ir. Faltan los números concretos.

### 8.2 La lealtad puede ser a la persona, no al local

En `citasDemo.js` las citas guardan `profesional: { id, name }`. En barbería y peluquería esto es enorme: **si tu barbero se cambia de local, tú te vas con el barbero, no te quedas con el local.**

Hoy el diseño trata la lealtad como local↔usuario. Puede que el eje correcto sea profesional↔usuario, al menos en el modo confianza. Sin decidir.

### 8.3 Arranque en frío de un local nuevo

Trampa clásica y hay que resolverla antes de que haya locales reales:

> Local nuevo → 0 comentarios → la media bayesiana lo pega a la media global → nunca sube en el ranking → nadie lo visita → nunca consigue comentarios.

Probablemente necesite un **hueco protegido para locales nuevos**, con caducidad.

### 8.4 La hora del día dentro de antojo

¿De verdad "Cafetería" y "Bar" son el mismo modo? Lo son estructuralmente, pero tienen un eje horario fuerte: café por la mañana, bar de noche. Puede que antojo necesite un peso horario interno.

### 8.5 No hay forma de medir nada

`grep` de analytics / tracking / logEvent en `src/`: **sin resultados**. No se registran vistas, ni clics, ni impresiones.

> Sin eso, los pesos del nivel 2 no se pueden afinar. Se estarían ajustando a ciegas.

No hace falta nada sofisticado, pero sí registrar al menos: local mostrado, posición, bloque, y si se tocó.

### 8.6 Dónde encaja la búsqueda

Si dentista y veterinaria no van en el feed (punto 4), su vía natural es la búsqueda. ¿La búsqueda usa también los modos, o ignora todo esto y ordena solo por relevancia textual + nota?

### 8.7 Privacidad de la función de amigos

La idea de ver dónde se corta el pelo un amigo o dónde sale a comer con su familia es, además, **la salida al problema del arranque en frío**: la recomendación de un amigo es de confianza alta y funciona desde el primer día, con pocos usuarios. El filtrado colaborativo clásico necesita miles; el grafo social lo esquiva.

Pero: **dónde comes es inocuo, dónde vas al dentista no.** El mismo mecanismo que comparte "la barbería de Yoel" comparte "la clínica dental" y "el tatuador".

Propuesta a validar: visibilidad **por modo y opt-in**, no un interruptor global.

- **Antojo** → compartible por defecto (es lo social de verdad).
- **Confianza y capricho** → privado salvo que se active expresamente.

Si esto se diseña al revés, se arregla con un escándalo, no con un parche.

### 8.8 Semilla: ¿por día o por sesión?

Decidido que lleva semilla (6.3), pero no si rota cada día natural o cada sesión. Afecta a si el usuario puede reencontrar lo que vio hace un rato.

### 8.9 Limpieza menor

El campo `points` de `locales.json` ya no se usa como respaldo de la nota (lo dice el comentario de `notaLocal`). Queda muerto en el JSON.

---

## 9. Orden de implementación sugerido

Por dependencia y por relación impacto/esfuerzo:

| # | Qué | Por qué en ese momento |
| --- | --- | --- |
| 1 | **Nota bayesiana** | Arregla un fallo real (3.1), no cambia arquitectura, mejora el orden actual desde el día uno |
| 2 | **Tabla de modos + reparto de huecos** | Es lo que resuelve el problema de fondo (2.1). Todo lo demás se apoya aquí |
| 3 | **Semilla diaria + jitter** | Hace que el feed respire (3.3). Independiente del resto |
| 4 | **Detección de afinidad y cuota 10–30%** | Necesita que 2 esté montado |
| 5 | **Lealtad / categoría resuelta + atajo en Mis Citas** | Necesita 2 y las respuestas de 8.1 |
| 6 | **Registro de impresiones** (8.5) | Cuanto antes mejor: sin esto no se afina nada de lo anterior |
| 7 | **Amigos** | Al final: es lo que más diseño de privacidad necesita (8.7) |
| — | **Provincia** | Cuando haya locales fuera de la provincia (7.4) |

---

## Fuentes

Investigación de la que salió el punto 1:

- [Instagram Ranking Explained — Adam Mosseri](https://about.instagram.com/blog/announcements/instagram-ranking-explained)
- [Social Media Today — señales de ranking 2025](https://www.socialmediatoday.com/news/instagram-shares-new-explainer-on-how-its-feed-reels-and-stories-algorithm/651705/)
- [Netflix Tech Blog — Learning a Personalized Homepage](https://gwern.net/doc/www/netflixtechblog.com/2f5717e8bbdc98d2caf5c7a972359fbb7e7c0b28.html)
- [GenPage: Towards End-to-End Generative Homepage Construction at Netflix (2026)](https://arxiv.org/pdf/2606.31031)
- [InfoQ — Netflix LLM homepage generation](https://infoq.com/news/2026/07/netflix-llm-homepage-generation)
- [Optimization of Epsilon-Greedy Exploration](https://arxiv.org/html/2506.03324v1)
- [Cold-start Problems in Recommendation Systems via Contextual-bandit Algorithms](https://arxiv.org/pdf/1405.7544)
