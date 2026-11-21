# Plan: base del sistema de diseño + librería `ui/` (POC)

Fecha: 2026-11-19, revisión 2. Solo plan, sin código.

Fuentes:
- `design-system-research.md`: decisiones.
- `ui-inventory.md`: tokens y piezas.
- `design/a-exception-desk/project/Main.dc.html`: detalle visual.

Decisiones heredadas:
- Tailwind 4.3.5 CSS-first, con los tokens en `@theme` de `src/index.css`.
- Variantes con `Record<Union, string>` tipados.
- Sin cva, clsx ni tailwind-merge.
- Componentes en `src/components/ui/`.

**Regla de props**:
- `tone` = color, fondo o borde.
- `variant` = forma o tipografía.
- `size` = dimensiones.

**Excepción documentada**: en `EtaFlag` el `tone` también fija la tipografía (§2).

**Vocabulario de tonos**: el mismo nombre de tono significa lo mismo en todos los componentes.

| Tono | Significado |
|---|---|
| `solid` | relleno `fg` con texto `on-solid` (confirmado o terminado) |
| `solid-signal` | relleno `signal` con texto `on-solid` |
| `soft-accent` / `soft-signal` | fondo suave del color, texto oscuro del mismo color |
| `outline-accent` | fondo surface con borde y texto `accent` |
| `dashed` | borde dashed `mid` (sin dato o planificado) |
| `dashed-muted` | como `dashed` pero con fondo `surface-muted` y borde `border-dash` |
| `dashed-strong` | borde 1.5px dashed `fg-muted` (stale) |
| `dotted` | borde dotted `fg` (IA) |
| `neutral` | gris sin borde especial |
| `hollow` | fondo surface con borde `mid` |

El mapeo dominio → tono (ACT → `solid`, delay → `solid-signal`…) vivirá en un único archivo, `src/components/shipments/tones.ts`. **No se crea ahora** porque no tiene consumidores; se creará con el primer componente de dominio.

---

## 1. Tokens

### 1.1 `@theme` (en `src/index.css`, tras `@import 'tailwindcss';`)

Se mantienen la paleta, la escala y el `--spacing` por defecto. Solo se redefinen `--font-sans` y `--font-mono`; el resto son nombres nuevos.

```css
@theme {
  --font-sans: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;

  /* Neutros */
  --color-page: #F3F4F5;
  --color-surface: #FFFFFF;
  --color-surface-muted: #EEF0F2;    /* hover de botón, caja IA, contador */
  --color-border: #DCDFE3;
  --color-border-strong: #C6CBD1;    /* caja IA, línea de timeline */
  --color-border-control: #BFC4CA;   /* botón, input, ToggleButton */
  --color-border-dash: #7D858E;      /* PLN */
  --color-mid: #8A929B;              /* dot futuro, borde NA */
  --color-fg: #15191E;
  --color-fg-soft: #2B3138;          /* hover de solid */
  --color-fg-muted: #49515A;
  --color-fg-subtle: #5E6670;
  --color-on-solid: #FFFFFF;         /* texto sobre solid/solid-signal; contador pulsado */

  /* Acento */
  --color-accent: #1F5FA8;
  --color-accent-strong: #174A85;
  --color-accent-soft: #E7EFF8;

  /* Señal */
  --color-signal: #C2410C;
  --color-signal-strong: #A3360A;
  --color-signal-fg: #9A3412;
  --color-signal-soft: #FDEDE3;
  --color-signal-border: #F3B48C;
  --color-signal-wash: #FFF8F3;

  /* Notice pills: ámbar (late/overdue), rojo (customs). fg/soft ≥ 6:1 */
  --color-warning-fg: #854D0E;
  --color-warning-soft: #FEF3C7;
  --color-danger-fg: #991B1B;
  --color-danger-soft: #FEE2E2;

  /* Tipografía (lh 1.45 salvo chip y title) */
  --text-chip: 10.5px;    --text-chip--line-height: 16px;
  --text-label: 11px;     --text-label--line-height: 1.45;
  --text-caption: 11.5px; --text-caption--line-height: 1.45;
  --text-note: 12px;      --text-note--line-height: 1.45;
  --text-meta: 12.5px;    --text-meta--line-height: 1.45;
  --text-ui: 13px;        --text-ui--line-height: 1.45;
  --text-body: 13.5px;    --text-body--line-height: 1.45;
  --text-title: 22px;     --text-title--line-height: 1.25;
  --text-title--letter-spacing: -0.01em; --text-title--font-weight: 600;
  --tracking-label: 0.06em;
  --tracking-chip: 0.03em;

  /* Radio */
  --radius-chip: 3px;
}
```

Radios por defecto que se reutilizan:

| Clase | Valor | Uso |
|---|---|---|
| `rounded-xs` | 2px | |
| `rounded-chip` | 3px | |
| `rounded-sm` | 4px | flag, contador |
| `rounded-md` | 6px | botón, input, panel |
| `rounded-lg` | 8px | tarjeta de lista, banner, tile de 40px |
| `rounded-full` | 999px | |

Espaciado con la escala por defecto: `gap-1.25` = 5px, `gap-1.75` = 7px, `h-9` = 36px, `min-h-8.5` = 34px, `min-h-7.5` = 30px. No hay sombras.

**Clases arbitrarias**: solo `border-[1.5px]` y `grid-cols-[14px_1fr]`. Es una lista cerrada.

Los tokens de la barra de ruta (`bar-*`, `track-*`) **no se añaden**; llegarán con ModeBar.

Tampoco están `surface-subtle`, `surface-hover`, `divider`, `text-micro`, `text-emphasis` ni `container-page` (`max-w-page`): no tienen uso en `ui/` y se añadirán con su primer consumidor.

### 1.2 `@layer base`

Se escribe en CSS, con `@apply` o `var(--color-…)`.

- **`body`**: `@apply bg-page text-fg text-body;`.
  - La familia ya la pone preflight a partir de `--font-sans`.
  - `tabular-nums` **no** va global: se aplica junto a `font-mono`, igual que en el diseño.
- **`a`**: color `var(--color-accent)`; en `a:hover`, `var(--color-accent-strong)`.
- **`:focus-visible`**: `outline: 2px solid var(--color-accent); outline-offset: 2px`.
- **`input[type=search]::-webkit-search-cancel-button`**: `appearance: none`, para ocultar la x nativa.

### 1.3 Fuentes

En `index.html`, dentro de `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
```

Por qué así:
- No añade dependencias.
- `display=swap` y la pila de fallback cubren el caso sin red.
- `@fontsource` queda como migración futura si hace falta trabajar sin red.

### 1.4 Modo oscuro: no

- No hay especificación de modo oscuro.
- Las piezas `solid` en `#15191E` y el lenguaje de bordes sólido, dashed y dotted necesitarían diseño propio.
- Como `ui/` solo usa tokens semánticos, se puede añadir más tarde redefiniéndolos bajo `[data-theme=dark]` sin tocar componentes.

---

## 2. Componentes (`src/components/ui/`)

Reglas comunes a todos:
- Sin estado.
- Los iconos entran como `ReactNode`; solo `SearchField` importa `Icon`.
- Las props nativas se pasan con `Omit<ComponentProps<'x'>, 'className' | 'style'>`.
- Todo uso de `font-mono` va con `tabular-nums`.

### Átomos

**Icon** (`Icon.tsx`)
- Props:
  - `name: IconName`
  - `size?: 12 | 14 | 16 | 18 | 20`, 16 por defecto
  - `rotate?: 0 | 90 | 180`, 0 por defecto
  - `label?: string`
- El SVG es de 24×24 con `fill="none"` y `stroke="currentColor"`.
- El trazo y los paths de cada icono están en un mapa (§7). No hay prop `strokeWidth`.
- `rotate` sale de un mapa estático `{0: '', 90: 'rotate-90', 180: 'rotate-180'}`, siempre con `transition-transform`.
- Con `label` lleva `role="img"` y `aria-label`; sin él, `aria-hidden="true"`.

**Button** (`Button.tsx`)
- Props:
  - `tone?: 'default' | 'solid' | 'solid-signal' | 'ghost'`
  - `size?: 'md' | 'sm'`
  - `icon?: ReactNode` (solo para el botón solo-icono; no se combina con texto)
  - el resto de props de `<button>`
- `type` es `"button"` por defecto.
- Botón de texto (`md`/`sm`) o botón solo-icono, que siempre es pequeño y exige `aria-label`.
- Cubre Verify, Undo, Clear filters, View shipment, Contact operator / Notify customer y el chevron ghost.
- Los dos botones crudos de dominio (ID del envío, cabecera Delivered) **no** son variantes de Button. En dominio serán `<button type="button">` sin más.

**Label** (`Label.tsx`)
- Props:
  - `size?: 'md' | 'sm'`
  - `tone?: 'subtle' | 'muted'`
  - `as?: 'span' | 'h2' | 'h3'`
- Es la cabecera de sección (`.lbl`): mayúsculas, 600, `tracking-label`.
- Tamaños:
  - `md` = `text-label` (11px, lh 1.45).
  - `sm` = `text-chip` (10.5px, lh 16px). También cubre el "Read as" de 10px.
- Tonos: `subtle` = `fg-subtle` (por defecto); `muted` = `fg-muted` (etiqueta de ETA cuando no hay ETA).

**Chip** (`Chip.tsx`)
- Props: `tone: 'solid' | 'outline-accent' | 'dashed-muted' | 'dashed' | 'dotted'`.
- Un solo tamaño: mono `text-chip` 600, `tracking-chip`, `px-1.25 py-px`, `rounded-chip`, borde de 1px (1.5px en `dotted`).
- Cubre los chips de confianza (ACT, EST, PLN, NA, AI-read).

**Tag** (`Tag.tsx`)
- Props: `tone: 'soft-accent' | 'soft-signal' | 'soft-warning' | 'soft-danger'`.
- Mono `text-caption`, `px-1.25`, `rounded-chip`, sin borde.
- `soft-accent` = tipo de fuente: bg `accent-soft`, texto `accent-strong`.
- `soft-signal` = nota de step: bg `signal-soft`, texto `signal-fg`.
- `soft-warning` = pill de CustomerNotice late/overdue: bg `warning-soft`, texto `warning-fg`.
- `soft-danger` = pill de CustomerNotice customs: bg `danger-soft`, texto `danger-fg`.

**EtaFlag** (`EtaFlag.tsx`)
- Props:
  - `tone: 'solid-signal' | 'dashed' | 'dashed-strong'`
  - `icon?: ReactNode`
- Forma: `inline-flex items-center gap-1.25 rounded-sm px-1.75`.
- **Excepción a la regla de props**: el `tone` fija también la tipografía, porque cada aspecto solo existe con una tipografía.
- Usos: `solid-signal` = delta (+1 d / Delayed); `dashed` = Not available; `dashed-strong` = Stale.
- No hay tonos para At risk ni Possible +1 d.

**RefTag** (`RefTag.tsx`)
- Props: `variant?: 'mono' | 'route'` (`mono` = número de contenedor, `route` = origen → destino).
- `rounded-full`, `px-1.75 py-px`, `text-caption`, texto `fg-muted`, bg `surface`, borde `border`.
- `route` = mono con borde dashed (excepción documentada, §5).

**IconTile** (`IconTile.tsx`)
- Props:
  - `tone: 'soft-accent' | 'solid-signal' | 'soft-signal' | 'dotted' | 'dashed-strong' | 'neutral' | 'solid'`
  - `size?: 'md' | 'sm'`
  - `label?: string`
  - `children` (el icono)
- Tamaños: `md` = 40px `rounded-lg`; `sm` = 32px `rounded-md`.
- Con `label` lleva `role="img"` y `aria-label`; sin él, nada (el `Icon` interno ya es `aria-hidden`).
- Cubre el StatusTile de la fila y el tile del banner de alerta (`solid-signal`, `sm`).

**Panel** (`Panel.tsx`)
- Props:
  - `tone?: 'surface' | 'surface-signal' | 'muted' | 'signal-wash'`
  - `radius?: 'md' | 'lg'`
  - `as?: 'div' | 'section' | 'article'`
  - `layout?: string`
  - `role` y `aria-*`
- Solo pone fondo, borde y radio.
- `layout` admite solo clases de padding, display, flex, grid, gap y overflow. **Prohibido** pasar `bg-`, `border-`, `rounded-` o `text-` (se verifica con grep, §6).
- Usos:
  - lista de envíos: `surface`/`lg`
  - docs: `surface`/`md`, envolviendo un `<ul>`
  - acción: `surface` o `surface-signal`
  - caja IA y banner IA: `muted`
  - banner de alerta: `signal-wash`/`lg`

Tonos de Chip:

| Tono | Estilo | Uso de dominio |
|---|---|---|
| `solid` | bg `fg`, texto `on-solid`, borde `fg` | ACT |
| `outline-accent` | bg surface, texto y borde `accent` | EST |
| `dashed-muted` | bg `surface-muted`, texto `fg-muted`, borde dashed `border-dash` | PLN |
| `dashed` | bg surface, texto `fg-muted`, borde dashed `mid` | NA |
| `dotted` | bg surface, texto `fg`, `border-[1.5px] border-dotted border-fg` | AI-read y AI-read N % |

**AI-read siempre tiene fondo blanco.** El diseño usa `#EEF0F2` en una variante; es una desviación aceptada.

Tonos de EtaFlag:

| Tono | Estilo |
|---|---|
| `solid-signal` | mono `text-meta` 700, bg `signal`, texto `on-solid`, `py-px` |
| `dashed` | `text-body` 600, texto `fg-muted`, borde dashed `mid` |
| `dashed-strong` | `text-note` 600, texto `fg-soft`, `border-[1.5px] border-dashed border-fg-muted` |

Tonos de IconTile:

| Tono | Estilo | Estado de dominio |
|---|---|---|
| `soft-accent` | bg `accent-soft`, texto `accent` | ok |
| `solid-signal` | bg `signal`, texto `on-solid` | delay |
| `soft-signal` | bg `signal-soft`, texto `signal-fg`, borde `signal-border` | risk |
| `dotted` | bg `surface-muted`, texto `fg`, 1.5px dotted `fg` | ai |
| `dashed-strong` | bg `surface-muted`, texto `fg-soft`, 1.5px dashed `fg-muted` | stale |
| `neutral` | bg `page`, texto `fg-subtle`, borde `border` | pre |
| `solid` | bg `fg`, texto `on-solid` | delivered |

Tonos de Panel:

| Tono | Estilo |
|---|---|
| `surface` | bg surface, borde `border` |
| `surface-signal` | bg surface, borde `signal-border` |
| `muted` | bg `surface-muted`, borde `border-strong` |
| `signal-wash` | bg `signal-wash`, borde `signal-border` |

`radius` es `md` por defecto.

### Moléculas

**SearchField** (`SearchField.tsx`)
- Props:
  - `label: string` (obligatorio, `sr-only`)
  - el resto de props de `<input>` (`value`, `onChange`, `placeholder`…)
- El `<label>` es el contenedor: `flex items-center gap-2 h-9 min-w-65 px-2.5 rounded-md border border-border-control bg-surface`, con `focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent`.
- Dentro van `<Icon name="search" />` y el `<input type="search">`: mono `text-ui`, `tabular-nums`, `flex-1 min-w-0 bg-transparent outline-none`.
- Es controlado: el valor vive fuera.

**ToggleButton** (`ToggleButton.tsx`)
- Props:
  - `pressed: boolean`
  - `count: number` (los filtros siempre muestran contador)
  - `countTone?: 'neutral' | 'signal'`
  - el resto de props de `<button>`
- `aria-pressed={pressed}`, `type="button"`, `cursor-pointer`.
- Es el FilterChip.
- El contador es interno y no se exporta. Ver los estilos de ToggleButton.

**TimelineItem** (`TimelineItem.tsx`)
- Props:
  - `tone: 'solid' | 'solid-signal' | 'dotted' | 'hollow'`
  - `connector?: 'solid' | 'dashed'`
  - `children`
- Renderiza un `<li>` en `grid grid-cols-[14px_1fr] gap-2.5`.
- La columna 1 lleva un dot de 10px (`rounded-full`, `mt-1`) y una línea de 2px (`flex-1 mt-0.5`).
- La línea es `w-0.5 bg-border-strong` si es `solid`, o `w-0 border-l-2 border-dashed border-border-strong` si es `dashed`.
- La columna 2 es `children` con `min-w-0 pb-3.5`.
- **El consumidor lo coloca dentro de `<ol>`**.
- Tonos del dot: `solid` = bg `fg` (done); `solid-signal` = bg `signal` (hold); `dotted` = bg `surface-muted` con 2px dotted `fg`; `hollow` = bg surface con 2px `mid` (futuro).

Estilos de ToggleButton:

| Estado | Botón | Contador |
|---|---|---|
| Común | `inline-flex items-center gap-2 h-9 whitespace-nowrap rounded-md border text-ui font-medium cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed`; `pl-3 pr-1.5` con contador, `px-3` sin él | mono `tabular-nums`, `min-w-6 h-6 rounded-sm text-note font-semibold inline-flex items-center justify-center` |
| Sin pulsar | `bg-surface text-fg border-border-control hover:bg-surface-muted` | `neutral`: `bg-surface-muted text-fg` |
| Pulsado | `bg-fg text-on-solid border-fg hover:bg-fg-soft` | `neutral`: `bg-on-solid text-fg` |
| `signal`, cualquier estado | — | `bg-signal text-on-solid` |

El contador se resuelve con un mapa por clave `'signal' | 'pressed' | 'idle'`: si es `signal`, gana; si no, depende de `pressed`.

En total hay **12 componentes**: 9 átomos y 3 moléculas.

---

## 3. Qué NO se hace

- **Lo eliminado del diseño**:
  - At risk y Possible +1 d: EtaFlag no tiene esos tonos.
  - Undo: Accept/Reject usan Button.
  - Leyenda: no hay LegendItem, LegendSwatch ni Divider.
- **Dominio**: ShipmentRow, ShipmentDetail, ShipmentList, DeliveredGroup, FilterBar, TrackerPage, EtaBlock, SourceLine, AiSourceBox, AiInlineAlt, ActionCard, DocumentItem, TimelineStep y **ModeBar**. Irán después en `src/components/shipments/`, con sus tokens `bar-*` y `track-*`.
- **No son componente**:
  - Mono/DateText: `font-mono tabular-nums` más el mapa de dominio.
  - Link: lo cubre el estilo base de `a`.
  - Banners: Panel más composición.
  - PageHeader, FilterSummary, EmptyState: maquetación única de página.
- **Botón de 26px del banner IA**: se usa `size="sm"` (30px). Es una desviación aceptada.
- **Sin dependencias**: nada de cva, clsx, tailwind-merge ni `cn()`. Ningún componente acepta `className`; Panel solo acepta `layout`.
- **Sin estado ni context, sin modo oscuro y sin `--*: initial`.**
- **Sin tests de componentes**: Vitest solo incluye `*.test.ts` y no hay librería de DOM.
- **Sin migrar `__root.tsx` ni las rutas `slate-*`**: queda para un paso posterior.
- **Sin barrel**: se importa archivo a archivo.

## 4. Estructura

```
app/index.html                       # fuentes (§1.3)
app/src/index.css                    # @import, @theme, @layer base
app/src/components/ui/{Icon,Button,Label,Chip,Tag,EtaFlag,RefTag,IconTile,Panel,SearchField,ToggleButton,TimelineItem}.tsx
app/src/routes/design-system.tsx     # muestra (§6)
```

`routeTree.gen.ts` no se edita a mano: **lo regenera solo el integrador al final**.

## 5. Convenciones

- **Exports**:
  - Archivo en PascalCase, con export **nombrado**.
  - Se exportan `XProps` y las uniones (`ButtonTone`, `ChipTone`…).
  - Los mapas `const toneClasses: Record<ChipTone, string>` no se exportan (`only-export-components`).
- **Excepción documentada**: `RefTag variant='route'` también cambia el borde (dashed), igual que `EtaFlag` mezcla tono y tipografía.
- **Tonos repetidos** (Chip/IconTile/EtaFlag: `soft-signal`, `dotted`, `dashed-strong`): no se abstraen; cada mapa lleva un comentario «mantener en sync con X».
- **Tipos**: uniones de literales, sin `enum` (`erasableSyntaxOnly`).
- **Clases**:
  - Strings completos, combinados con template literal a partir de strings literales.
  - **Nunca** `` `bg-${x}` `` ni `` `w-[${n}%]` ``.
  - Cada propiedad CSS se decide en un solo mapa, para que no haya dos clases en conflicto.
  - En `ui/` no hay hex ni paleta por defecto.
- **React 19**: `ref` como prop, sin `forwardRef`.
- **a11y mínima**:
  - `type="button"` por defecto y `cursor-pointer` en Button y ToggleButton.
  - Los botones de solo icono exigen `aria-label` por tipos.
  - `aria-pressed` en ToggleButton; el padre pasa `aria-expanded` por props.
  - Los iconos son `aria-hidden` salvo que lleven `label`.
  - SearchField tiene label obligatorio.
  - Focus visible global, y en SearchField con `focus-within`.
  - El color nunca es el único portador de significado.

## 6. Verificación

Lo ejecuta el integrador tras juntar los lotes.

1. `pnpm exec vite build`, una vez, para regenerar `routeTree.gen.ts` con la nueva ruta. Hace falta porque `tsc` se ejecuta antes que vite.
2. `pnpm lint --deny-warnings` y `pnpm build` (`build` ya incluye `tsc -b`).
3. Comprobar que las utilidades propias se generaron: `grep -lE '\.rounded-chip|\.text-chip|\.bg-page' dist/assets/*.css` debe encontrar las tres (comprobarlo una a una).
4. Greps que deben devolver vacío:
   - Clases dinámicas: `grep -rnE '[a-z0-9]-\$\{|\[[^]]*\$\{' src/components/ui`
   - Colores crudos: `grep -rnE '#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|\b(slate|gray|zinc|neutral|stone)-' src/components/ui`
   - Estado: `grep -rnE 'useState|useReducer|useContext|createContext' src/components/ui`
   - `layout` de Panel: `grep -rnE 'layout="[^"]*\b(bg|border|rounded|text)-' src`
5. Ruta `/design-system` (`src/routes/design-system.tsx`):
   - Página estática, sin estado y sin enlace en la navegación.
   - Pinta cada componente en todas sus variantes, con un contenedor `bg-page`, porque el layout raíz aún pinta `slate-50`.
   - Se compara a ojo con Main.dc.html usando `pnpm dev`.

---

## Descartado en revisión

- **Quitar `radius` de Panel**: se mantiene. `surface` necesita 8px en la tarjeta de lista y 6px en docs y acciones, y fijar el radio por tono obligaría a duplicar tonos.
- **`as='ul'` en Panel**: se elimina por simplicidad. Panel envuelve el `<ul>`, y no hace falta tipado polimórfico.
- Todo lo demás de ambas revisiones está aplicado.

---

## 7. Lotes de implementación

Los lotes tienen archivos disjuntos. Cada subagente lee §1, §2 y §5 de este plan y el apartado de su lote. Ninguno ejecuta `vite build` ni toca `routeTree.gen.ts`; eso es del integrador (§6).

### Lote A: tokens y base

**Archivos**: `app/src/index.css` y `app/index.html`.

1. `index.css`: `@import 'tailwindcss';`, después el bloque `@theme` de §1.1 copiado literal, y después `@layer base` con las cuatro reglas de §1.2.
2. `index.html`: los tres `<link>` de §1.3 en `<head>`, antes de `<title>`.

**Hecho** cuando `pnpm exec vite build` compila sin errores.

### Lote B: átomos de texto y acción

**Archivos** en `app/src/components/ui/`: `Icon.tsx`, `Button.tsx`, `Label.tsx`, `Chip.tsx`, `Tag.tsx`, `EtaFlag.tsx`, `RefTag.tsx`.

**Icon**: mapa `Record<IconName, { sw: number; cap?: 'round'; join?: 'round'; body: ReactNode }>`, con todos los SVG en `viewBox="0 0 24 24"`.

| Icono | Trazo | Paths |
|---|---|---|
| `truck` | 1.8, join round | `M3 6h11v9H3z` · `M14 9h4l3 3v3h-7z` · circle(7,17,1.8) · circle(17,17,1.8) |
| `ship` | 1.8, join round | `M3.5 14.5l2 5h13l2-5z` · `M6 14.5V9h12v5.5` · `M10 9V5h4v4` |
| `hold` | 1.9, join round | `M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z` · `M10 9.5v5M14 9.5v5` |
| `clock` | 2, cap round | circle(12,12,8.5) · `M12 7.5V12l3 2` |
| `doc-alert` | 1.8, join + cap round | `M6 3h8l4 4v14H6z` · `M14 3v4h4` · `M12 10.5v4.5` · `M12 17.6v.4` |
| `box` | 1.8, join round | `M4 7.5l8-4 8 4v9l-8 4-8-4z` · `M4 7.5l8 4 8-4` · `M12 11.5v9` |
| `doc` | 1.8, join round | `M6 3h8l4 4v14H6z` · `M14 3v4h4` |
| `check` | 2.2, cap round | `M5 12.5l4.5 4.5L19 7.5` |
| `chevron-down` | 2, cap round | `M6 9l6 6 6-6` |
| `chevron-right` | 2 | `M9 6l6 6-6 6` |
| `search` | 2 | circle(11,11,6.5) · `M16 16l4.5 4.5` |
| `alert-triangle` | 2, cap round | `M12 4l9 16H3z` · `M12 10v4.5` · `M12 17.5v.3` |

`clock` y `check` usan un trazo único. El diseño varía entre 1.8 y 2.4 según el tamaño; es una desviación aceptada.

**Button**:

- Base: `inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed`.

Tamaños:

| Size | Con texto | Solo icono |
|---|---|---|
| `md` | `min-h-8.5 px-3 text-ui` | — |
| `sm` | `min-h-7.5 px-2.5 text-note` | `min-h-7.5 px-1.5 text-note` (clave `icon`) |

El tamaño se resuelve con un mapa por clave `'md' | 'sm' | 'icon'`, para que no haya dos clases de padding en conflicto.

Tonos:

| Tone | Clases |
|---|---|
| `default` | `bg-surface text-fg border-border-control hover:bg-surface-muted` |
| `solid` | `bg-fg text-on-solid border-fg hover:bg-fg-soft` |
| `solid-signal` | `bg-signal text-on-solid border-signal hover:bg-signal-strong` |
| `ghost` | `bg-transparent text-fg border-transparent hover:bg-surface-muted` |

Tipos: `ButtonProps = Base & ({ children: ReactNode } | { children?: undefined; icon: ReactNode; 'aria-label': string })`.

**Label**:
- Base: `uppercase font-semibold tracking-label`.
- size `md` = `text-label`; `sm` = `text-chip`.
- tone `subtle` = `text-fg-subtle`; `muted` = `text-fg-muted`.

**Chip**:
- Base: `inline-block whitespace-nowrap rounded-chip px-1.25 font-mono tabular-nums text-chip font-semibold tracking-chip`.
- Cada tono, con su anchura de borde incluida, sigue la tabla de tonos de Chip (§2).

**Tag**:
- Base: `inline-block whitespace-nowrap rounded-chip px-1.25 font-mono tabular-nums text-caption`.
- `accent` = `bg-accent-soft text-accent-strong`; `signal` = `bg-signal-soft text-signal-fg`.

**EtaFlag**:
- Base: `inline-flex items-center gap-1.25 whitespace-nowrap rounded-sm px-1.75`.
- Cada tono sigue la tabla de tonos de EtaFlag (§2), con borde `border` y `border-dashed` donde toque.

**RefTag**:
- Base: `inline-block whitespace-nowrap rounded-full border border-border bg-surface px-1.75 text-caption text-fg-muted`.
- `mono` = `font-mono tabular-nums`; `sans` = `font-sans`; `route` = `font-mono tabular-nums border-dashed`.

### Lote C: contenedores, moléculas y muestra

**Archivos**: `app/src/components/ui/IconTile.tsx`, `Panel.tsx`, `SearchField.tsx`, `ToggleButton.tsx`, `TimelineItem.tsx` y `app/src/routes/design-system.tsx`.

- **IconTile**:
  - Base: `inline-flex shrink-0 items-center justify-center`.
  - size `md` = `size-10 rounded-lg`; `sm` = `size-8 rounded-md`.
  - Los tonos siguen la tabla de tonos de IconTile (§2). Los bordes son `border` o `border-[1.5px]`, con `border-dotted` o `border-dashed` cuando toque.
- **Panel**:
  - Renderiza `const El = as ?? 'div'` y `<El>` con `` `${toneClasses[tone]} ${radiusClasses[radius]} ${layout ?? ''}` ``.
  - Los tonos siguen la tabla de tonos de Panel (§2), siempre con `border`.
  - radius `md` = `rounded-md`; `lg` = `rounded-lg`.
- **SearchField**, **ToggleButton**, **TimelineItem**: según §2. SearchField importa `Icon` del lote B usando la API de §2.
- **`routes/design-system.tsx`**:
  - `export const Route = createFileRoute('/design-system')({ component: DesignSystemPage })`.
  - Página estática dentro de `<div className="bg-page p-6 flex flex-col gap-6">`.
  - Una sección por componente (título con `Label`) que pinta todas las variantes, tonos y tamaños.
  - Icon: los 12 nombres más `rotate` 90 y 180.
  - Button: los 4 tonos × 2 tamaños, uno con icono solo, uno `disabled`, y Accept/Reject como ejemplo.
  - ToggleButton: `pressed` true y false, más `countTone="signal"`.
  - TimelineItem: dentro de un `<ol>`, con los 4 tonos y los 2 conectores.
  - SearchField: con `value=""` y `onChange={() => {}}`.
  - Importa los componentes de los lotes B y C. Compila una vez integrado.
