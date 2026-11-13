# Modo claro

Estado (13-11-2026): **hecho, en revisión visual**. El oscuro es el de
siempre y va por defecto; el claro es papel crema con tinta de Taly.

## Cómo funciona

- `src/services/tema.js`: lee y guarda el tema (`localStorage`, clave
  `citaly_tema`), pone `<html data-tema="claro|oscuro">` y hace el cambio.
- `index.html` aplica el tema antes de pintar (sin parpadeo al recargar).
- `src/index.css`: todos los tokens. El bloque `:root, .tema-oscuro-fijo,
  .nosotros` es el oscuro; `:root[data-tema='claro']` el claro.
- **Cambio suave**: con View Transitions se funde la app entera en 0.7 s.
  El interruptor queda fuera del fundido para que se vea su animación. Sin
  View Transitions (Firefox) se usa la clase `.tema-cambiando`. Con
  movimiento reducido, el cambio es directo.

## Reglas para lo que se escriba a partir de ahora

| Para… | Usa |
|---|---|
| Fondos | `--background-color`, `-secondary`, `-another`, `--superficie-alta`, `--superficie-honda`, `--tarjeta-fondo` |
| Texto | `--fonts-color-primary`, `--fonts-color-primary-weak` |
| Texto en teal / mostaza / rosa / rojo | `--primary-texto`, `--yellow-texto`, `--rosa-texto`, `--peligro-texto` |
| Relleno teal / mostaza / rosa | `--primary-color`, `--yellow-color`, `--rosa` |
| Texto encima de un relleno teal o mostaza | `--fonts-color-secondary` (oscuro siempre) |
| Velos y bordes finos | `rgb(var(--tinte) / calc(α * var(--tinte-fuerza)))` |
| Sombras | `rgb(var(--sombra) / calc(α * var(--sombra-alfa)))` |
| Fondo detrás de un modal | `rgb(var(--velo-modal) / calc(α * var(--velo-alfa)))` |
| Velo que funde una foto con la página | `rgb(var(--fondo-rgb) / α)` |
| Algo que va SOBRE UNA FOTO | clase `tema-oscuro-fijo` en el contenedor |

**No escribir colores en hex** para nada que dependa del tema. Si un dibujo
necesita un color propio, `var(--mi-color, #valorOscuro)` en el SVG y el
valor claro en su CSS bajo `:root[data-tema='claro']`.

## Lo que se queda igual en los dos temas (a propósito)

- **Sobre nosotros** (`.nosotros`): su propio mundo, noche y papel.
- Zonas sobre foto (`tema-oscuro-fijo`): tarjetas de Descubre (la foto),
  héroe del carrusel, cabecera de la ficha del local, visores de foto,
  recorte de foto, corazones sobre foto.
- Papel y madera: cartel del menú, polaroids de Favoritos, nota de gracias
  (en claro solo se blanquean un poco para separarse del fondo).
- Taly (todas sus versiones), el QR y el cartel para imprimir, el PDF.

## Dibujos con versión clara

- `FondoDescubre`: cielo de papel, nubes y motas a tinta menta, árbol a tinta.
- `TimelineTurno`: cielo en acuarela clara, montañas de papel, nubes blancas;
  al cambiar de tema se repinta en el punto donde está.
- `RinconTaly` (header), `Tinta` (mapa de la ficha), lunas de los vacíos de
  Negocio, interruptor Próximas/Pasadas de Mis Citas, barra de abajo.
