# Design system mínimo con Tailwind CSS: investigación

Fecha: 2026-11-19. Solo investigación; no incluye código de la app.

## Versión y stack

- **Tailwind CSS 4.3.5** es la última estable. `npm view tailwindcss` devuelve `latest: 4.3.5`, y en [GitHub releases](https://github.com/tailwindlabs/tailwindcss/releases) aparece marcada como "Latest" (6 nov). La rama v3 solo recibe mantenimiento (`v3-lts: 3.4.19`).
- La app ya usa esa versión: `tailwindcss` y `@tailwindcss/vite` `^4.3.5` (instalada 4.3.5), con Vite 8, React 19.3, TanStack Router y TS 7. `src/index.css` solo contiene `@import 'tailwindcss';`.
- La 4.3 añadió utilidades de scrollbar, `@container-size`, `@variant` apilado y compuesto, y `zoom-*` y `tab-*` ([blog v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3)). Nada de esto cambia el enfoque.
- Ni `tailwind.config.js` ni PostCSS hacen falta. La configuración es CSS-first.

## 1. Tokens

Fuente: [Theme variables](https://tailwindcss.com/docs/theme).

- **`@theme { … }`** declara variables CSS que, además, **generan utilidades**. Debe ir al nivel superior del archivo, nunca dentro de un selector o media query. En el CSS final quedan como variables normales en `:root`, así que `var(--color-…)` también funciona.
- **Namespaces** (prefijo → utilidad):
  - `--color-*` → `bg-*`, `text-*`, `border-*`, `fill-*`…
  - `--font-*` → `font-sans`; `--text-*` → tamaño (`text-sm`); `--font-weight-*`, `--leading-*`, `--tracking-*`
  - `--spacing` → base única: `p-4` = `calc(var(--spacing) * 4)`; `--spacing-*` para valores con nombre
  - `--radius-*` → `rounded-*`; `--shadow-*` → `shadow-*`; `--breakpoint-*` → `sm:`, `md:`…
  - otros: `--container-*`, `--ease-*`, `--animate-*`, `--blur-*`, `--aspect-*`
- **Extender o sobrescribir**: basta con declarar la variable. **Quitar los valores por defecto**: `--color-*: initial;` borra un namespace y `--*: initial;` borra todo el tema.
- **`@theme` o `:root`**: `@theme` es para tokens que deben tener utilidad. `:root` es para variables que no deben generarla.
- **`@theme inline`**: se usa cuando un token apunta a otra variable (`--font-sans: var(--font-inter)`). Así la utilidad lleva el valor directamente y no la referencia, lo que evita fallbacks inesperados. **`@theme static`** emite todas las variables, aunque no se usen.
- **Funciones en CSS**: `--spacing(4)` y `--alpha(var(--color-x) / 50%)` ([Functions & directives](https://tailwindcss.com/docs/functions-and-directives)).

**Recomendación para el POC**

- Mantener la paleta y escala por defecto: ya son coherentes y están en `oklch`.
- Añadir encima unos pocos **tokens semánticos**:
  - color: `--color-surface`, `--color-fg`, `--color-muted`, `--color-border`, `--color-primary`
  - estados de envío, solo si hacen falta: `--color-success`, `--color-warning`, `--color-danger`
  - `--font-sans` y, como mucho, un `--radius-*` o `--shadow-*` propios
- Los componentes usan clases semánticas (`bg-surface`, `text-fg`), no `bg-gray-50`.
- No hace falta `--*: initial`: es demasiada fricción para un POC.

### Modo oscuro

Fuente: [Dark mode](https://tailwindcss.com/docs/dark-mode).

- Por defecto, `dark:` sigue a `prefers-color-scheme`.
- Para controlarlo con un toggle: `@custom-variant dark (&:where(.dark, .dark *));`. Con atributo: `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`.
- Si se persiste la preferencia, se aplica con un script inline en `<head>` para evitar el FOUC.

**Patrón recomendado**

1. Los tokens semánticos se definen en `@theme`.
2. Se redefinen sus valores bajo `.dark`, o `[data-theme=dark]`, en `@layer base`.
3. Como las utilidades hacen referencia a `var(--color-surface)`, el tema cambia solo y no hay que poner `dark:` en cada componente.
4. `dark:` queda para excepciones puntuales.
5. Variante (patrón popularizado por shadcn/ui, no tomado de la documentación de Tailwind): poner los valores crudos en `:root`/`.dark` y mapearlos con `@theme inline { --color-surface: var(--surface); }`. Es igual de válida; hay que elegir una sola y documentarla.
6. ¿Hace falta el modo oscuro en el POC? Probablemente no. Con tokens semánticos se puede añadir más adelante sin tocar componentes.

### `@utility` y `@layer components`

Fuente: [Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles).

- `@utility nombre { … }` crea una utilidad propia que acepta variantes (`hover:`, `lg:`). La forma funcional `@utility tab-* { tab-size: --value(--tab-size-*); }` se usa para utilidades con valor. Se reserva para propiedades CSS sin utilidad nativa.
- `@layer components { .card { … } }` sirve para clases que las utilidades pueden sobrescribir, y para estilos de terceros. La documentación avisa de que se necesitan menos de las que uno cree.
- `@variant dark { … }` permite aplicar variantes dentro de CSS propio.

**Para el POC**: casi nada de esto. Los componentes se encapsulan en React, no en clases CSS.

## 2. Componentes React visuales (sin estado)

Fuente oficial: [Managing duplication](https://tailwindcss.com/docs/styling-with-utility-classes#managing-duplication).

- Para duplicación entre archivos, la documentación recomienda **crear un componente React**, que es la única fuente de verdad. Los bucles y la edición multicursor resuelven el resto.
- Para conflictos de estilo ([Managing style conflicts](https://tailwindcss.com/docs/styling-with-utility-classes#managing-style-conflicts)):
  - "nunca pongas dos clases en conflicto en el mismo elemento"
  - elegir la clase de forma condicional
  - las librerías de componentes deberían exponer **props concretas** en vez de aceptar clases externas, que suelen entrar en conflicto
- Para variantes, la documentación propone ([Detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names)) un **objeto que mapea cada valor de prop a un string de clases completo**: `{ primary: "bg-primary text-white hover:…", ghost: "…" }`.

### Opciones

| Opción | Versión npm | Cuándo |
|---|---|---|
| Objeto `Record<Variant, string>` + template string | — | **POC: suficiente.** Tipado con TS, sin dependencias. |
| `clsx` | 2.1.1 | Clases condicionales legibles. Muy pequeña. Opcional. |
| `tailwind-merge` | 3.7.0 (soporta Tailwind v4.0–v4.3) ([repo](https://github.com/dcastil/tailwind-merge)) | Solo si los componentes aceptan `className` desde fuera y debe ganar el del consumidor. |
| `class-variance-authority` (cva) | 0.7.1 | Muchas variantes combinadas (size × intent × state). Sigue en 0.x. |
| `tailwind-variants` | 4.0.2 | Como cva, más slots y merge integrado. Más API que aprender. |

**Recomendación mínima**

- Objetos de variantes tipados, sin dependencias.
- Que los componentes **no acepten `className` libre**, o solo para layout externo (márgenes, ancho), donde no hay conflicto. Con eso **no se necesita `tailwind-merge`**.
- El combo `cn()` = `twMerge(clsx(...))` (popularizado por shadcn/ui) solo merece la pena cuando aparezcan overrides reales. Añadirlo después es trivial: una función en `lib/cn.ts`.
- cva o tailwind-variants: no para el POC.

## 3. Estructura mínima

```
src/
  index.css            # @import "tailwindcss"; @theme {tokens}; overrides dark (opcional)
  components/ui/       # primitivos visuales sin estado: Button, Badge, Card, Table…
    Button.tsx         # un archivo por componente; variantes como objeto dentro
  lib/cn.ts            # SOLO si se adopta clsx/tailwind-merge más adelante
```

- Un único CSS con los tokens. Separarlo en `theme.css` e importarlo desde `index.css` solo si pasa de unas 60 líneas.
- Sin `tokens.ts` duplicado. Si JS necesita un valor (p. ej. para gráficos), se lee con `getComputedStyle(...).getPropertyValue('--color-primary')` o se usa `var(--color-primary)` directamente en SVG o estilos inline.
- Los componentes de dominio (p. ej. `ShipmentStatusBadge`) van fuera de `ui/`, junto a las rutas o en `components/`, y se componen a partir de los primitivos.

## 4. Antipatrones

1. **Clases construidas por string**: `` `bg-${color}-600` `` no se genera, porque el escáner lee texto plano y no ejecuta código. Hay que mapear a strings completos. `@source inline("…")` existe como safelist, pero es un parche ([fuente](https://tailwindcss.com/docs/detecting-classes-in-source-files)).
2. **Abuso de `@apply`** para recrear "clases semánticas" (`.btn { @apply … }`) en un proyecto React. Duplica la abstracción que ya da el componente. La documentación lo presenta sobre todo para **sobrescribir estilos de terceros**. En CSS modules o `<style>` aislados requiere `@reference "../index.css"` ([fuente](https://tailwindcss.com/docs/functions-and-directives#reference-directive)).
3. **Clases en conflicto en el mismo elemento** (`flex grid`, `p-2 p-4`). Gana el orden de la hoja, no el del atributo. Hay que elegir una de forma condicional.
4. **Usar colores crudos en componentes** (`bg-blue-600` repartido por todas partes) en vez de tokens semánticos. Cambiar la marca o añadir el modo oscuro obliga entonces a un grep masivo.
5. **Valores arbitrarios sistemáticos** (`p-[13px]`, `text-[#3a7]`). Si se repiten, deben ser un token en `@theme`.
6. **Tokens en `:root` cuando deberían generar utilidad**, o al revés: meter en `@theme` variables internas que no deben crear clases.
7. **Seguir con el modelo v3** (`tailwind.config.js`, `darkMode: 'class'`, `theme.extend`). En v4 todo eso es `@theme` y `@custom-variant`.
8. **Añadir cva, tailwind-variants o tailwind-merge "por si acaso"** en un POC: dependencias y API sin un problema real que resolver.

## Fuentes

- https://tailwindcss.com/docs/theme
- https://tailwindcss.com/docs/dark-mode
- https://tailwindcss.com/docs/adding-custom-styles
- https://tailwindcss.com/docs/functions-and-directives
- https://tailwindcss.com/docs/styling-with-utility-classes
- https://tailwindcss.com/docs/detecting-classes-in-source-files
- https://tailwindcss.com/blog/tailwindcss-v4-3
- https://github.com/tailwindlabs/tailwindcss/releases
- https://github.com/dcastil/tailwind-merge
- npm registry (`npm view`), consultado el 2026-11-19
