# UI inventory: tracker "A · Exception Desk"

Fuente: `design/a-exception-desk/project/Main.dc.html` (VIEW='ops'). `Customer.dc.html` es idéntico salvo `<title>`, la altura de preview y `VIEW='customer'`.
Análisis solo: no se ha tocado código de la app.

## A. Stack actual de `app/`

| Aspecto | Valor |
|---|---|
| Build | Vite ^8.3, `@vitejs/plugin-react` ^6.3, pnpm 12 |
| UI | React ^19.3 (StrictMode), TSX |
| Lenguaje | TypeScript ~7.0 (`tsc -b`), `jsx: react-jsx`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (sin enums/namespaces) |
| Estilos | Tailwind CSS **v4.3** vía `@tailwindcss/vite`. Sin `tailwind.config`; `src/index.css` = solo `@import 'tailwindcss';` (sin `@theme`, sin tokens, sin fuentes) |
| Routing | TanStack Router ^1.170, rutas por fichero, `autoCodeSplitting`; `routeTree.gen.ts` generado |
| Tests / lint | Vitest ^5 (`src/**/*.test.ts`, solo dominio), oxlint |
| Estado | `src/state/ShipmentsContext.tsx` (useReducer + Context sobre fixtures) |

Estructura de `src/`: `main.tsx`, `index.css`, `routes/` (`__root.tsx` layout con header/nav, `index.tsx` → redirige a `/ops`, `ops.tsx` lista simple, `shipments.$shipmentId.tsx` detalle mínimo), `domain/` (`types.ts`, `view.ts` + test), `state/`, `fixtures/`.
**No hay componentes de UI** (no hay `src/components/`). Las clases actuales son Tailwind por defecto (`slate-*`), que no coinciden con la paleta del diseño.

## B1. Tokens visuales

### Color: neutros

| Hex | Rol |
|---|---|
| `#F3F4F5` | Fondo de página; también fondo del tile "pre" |
| `#FFFFFF` | Superficie (tarjeta de la lista, inputs, botónes, chips) |
| `#F8F9FA` | Superficie secundaria (cabecera de la tabla, bloque Delivered) |
| `#FBFBFC` | Hover de fila y fondo del detalle expandido |
| `#EEF0F2` | Superficie apagada: hover de botón, contador de chip, PLN, caja IA, tile ai/stale |
| `#E6E8EB` | Divisor entre filas / items |
| `#DCDFE3` | Borde de tarjeta / lista, borde de ref, separador de leyenda |
| `#C6CBD1` | Borde de la caja IA; línea de timeline; tono stale c2 |
| `#BFC4CA` | Borde de controles (botón, input, chip de filtro) |
| `#DDE1E6` / `#D0D5DB` / `#ECEEF1` | Pista (track) de la ModeBar: road sólido / rayas sea-port |
| `#8A929B` | Neutro medio: punto de step futuro, borde NA, fill stale/pre, borde "Not available" |
| `#7D858E` | Borde discontinuo de PLN |
| `#5E6670` | Texto terciario (labels `.lbl`, meta, iconos) |
| `#49515A` | Texto secundario; borde stale |
| `#2B3138` | Texto de cuerpo suave; hover del botón primario |
| `#15191E` | Texto principal, botón primario, ACT, filtro pulsado, tile Delivered |

### Color: acento y estados

| Hex | Rol |
|---|---|
| `#1F5FA8` | Acento / enlace / focus ring / EST / marcador ok |
| `#174A85` | Hover de enlace, texto de "verified", texto de doc Available, chip de tipo de fuente |
| `#2E6FBA` / `#9FC0E4` | Fill de ModeBar en tono ok/ai (sólido / 2º color de la raya) |
| `#E7EFF8` | Fondo tile ok, doc Available, chip de tipo de fuente |
| `#BCD0E8` | Borde de doc Available |
| `#C2410C` | Señal (delayed/incident): botón `sig`, tile delay, pill delta, contador "Delayed", texto de estado delay/risk, punto Customs hold, borde Missing |
| `#A3360A` | Hover de `btn-sig` |
| `#D9550F` / `#F0A274` | Fill de ModeBar en tono delay/risk |
| `#9A3412` | Texto naranja oscuro: At risk, Flagged, Missing, nota de step |
| `#FDEDE3` | Fondo naranja suave: At risk, Flagged, tile risk, nota de step |
| `#F3B48C` | Borde naranja suave: banner, At risk, Flagged, tarjeta de acción primaria |
| `#FFF8F3` | Fondo de banner de alerta y de fila delayed |

Mapeo de estados (TONE / TILE):

| Tono | Tile (bg / fg / borde) | Fill de la barra (c / c2 / marcador) |
|---|---|---|
| ok | `#E7EFF8` / `#1F5FA8` / — | `#2E6FBA` / `#9FC0E4` / `#1F5FA8` |
| delay | `#C2410C` / `#FFF` / — | `#D9550F` / `#F0A274` / `#C2410C` |
| risk (incident) | `#FDEDE3` / `#9A3412` / 1px `#F3B48C` | igual que delay |
| ai | `#EEF0F2` / `#15191E` / 1.5px dotted `#15191E` | igual que ok |
| stale | `#EEF0F2` / `#2B3138` / 1.5px dashed `#49515A` | `#8A929B` / `#C6CBD1` / marcador blanco con borde 2px dashed `#2B3138` + outline dashed en el tramo |
| pre (booked) | `#F3F4F5` / `#5E6670` / 1px `#DCDFE3` | `#8A929B` / `#C6CBD1` / `#8A929B` |
| delivered | `#15191E` / `#FFF` (icono check) | barra entera `#15191E` |

"Customs" no tiene color propio: es un tag/filtro y usa el tono delay más el icono de escudo (hold) y el patrón de tramo `port`.

Modos de tramo (se distinguen por patrón, no por color):

| Modo | Track | Fill |
|---|---|---|
| road | `#DDE1E6` sólido | color `c` sólido |
| sea | `repeating-línear-gradient(135deg, #D0D5DB 0 3px, #ECEEF1 3px 6px)` | igual a 135° con `c`/`c2` |
| port / customs | `repeating-línear-gradient(90deg, … 0 2px, … 2px 4px)` | igual a 90° con `c`/`c2` |

Caja gris de IA: bg `#EEF0F2`, borde 1px `#C6CBD1`, radio 6px; cita interior en `#FFFFFF`, radio 4px; firma visual = borde **1.5px dotted `#15191E`** en el chip "AI-read".
Lenguaje de bordes: sólido = confirmado, dashed = planificado/sin dato/stale, dotted = IA.

### Tipografía

| Token | Valor |
|---|---|
| Sans | `'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif` (400/500/600/700) |
| Mono | `'IBM Plex Mono', ui-monospace, Menlo, monospace` (400/500/600) + `tabular-nums`; para IDs, fechas, refs, contadores y chips de confianza |
| Base | 13.5px / line-height 1.45, `tabular-nums` global |

| Tamaño | Uso |
|---|---|
| 22px / 600, `-.01em` | H1 |
| 14px / 600 mono | ID de envío, ETA principal |
| 13.5px | cuerpo, "Not available" (600) |
| 13px / 500 | botón, chip de filtro, input, nombre de doc, subtítulo |
| 12.5px | meta (última sincronización, ordenación), fecha de step, pill de delta (700), texto del banner IA |
| 12px | botón sm, notas, operador, frescura, leyenda, At risk (600) |
| 11.5px | ref (mono), nota de doc, ayuda |
| 11px / 600 / `.06em` / MAYÚSCULAS | `.lbl` (cabeceras de sección). Variantes 10.5px (etiqueta de ETA) y 10px ("Read as") |
| 10.5px / 600 mono / `.03em` / lh 16px | `.cf` chip de confianza |

### Radios, sombras, espaciado

| Token | Valor | Uso |
|---|---|---|
| radius-xs | 2px | segmentos de la ModeBar |
| radius-sm | 3px | chip `.cf`, marcador, chip de fuente, nota |
| radius-md | 4px | pills (delta, At risk, Stale, Not available), contador, cita |
| radius-lg | 6px | botónes, input, chips de filtro, caja IA, tarjetas de acción, lista de docs, icono del banner |
| radius-xl | 8px | tarjeta de la lista, banner de alerta, tile de 40px |
| radius-full | 999px | `.ref`, puntos de timeline (50%) |
| Sombra | solo `box-shadow: 0 0 0 1px <mk>` (anillo del marcador). Sin sombras de elevación | |
| Focus | `outline: 2px solid #1F5FA8; outline-offset: 2px` | |
| Alturas | 36 (input, chip de filtro), 34 (btn), 30 (btn-sm), 26 (btn del banner IA), 24 (contador), 40 (tile, columnas laterales), 8 (barra), 16 (marcador) | |
| Espaciado | gaps 2/4/5/6/7/8/10/12/14/16/18/24. Main: padding 24, gap 14, max-w 1440. Fila: padding 14×16, gap 12×16. Detalle: padding `4 16 18 72`, grid `auto-fit minmax(330px,1fr)` gap 16. Banner: 12×14. Cabecera de tabla: 8×16 | |
| Columnas de fila | `0 0 40px` · `1 1 300px` · `1.3 1 320px` · `1 1 250px` (alíneada a la derecha) · `0 0 40px` | |

## B2. Inventario de componentes

Leyenda: **V** = solo visual (props → render); **S** = implica estado o interacción (el estado queda fuera del scope; el componente recibe `pressed` / `expanded` / `onX` por props).

### Átomos

| Componente | Propósito | Variantes vistas | Props visuales | V/S |
|---|---|---|---|---|
| Icon | Glifos SVG de trazo | truck, ship, hold (escudo), clock, doc-alert, box, doc, check, chevron-down, chevron-right, search, alert-triangle | `name`, `size` (12/14/16/18/20), `strokeWidth` | V |
| Label (`.lbl`) | Cabecera de sección en mayúsculas | 11 / 10.5 / 10px | `size`, `tone` | V |
| Mono / DateText | Fecha, ID o número en mono tabular | color según confianza (`dStyle`), tachado ("was"), cursiva (alt) | `confidence?`, `strike?`, `italic?` | V |
| Button | Acción | `default`, `primary` (negro), `signal` (naranja), `ghost`; tamaño `md`/`sm`; `disabled` | `variant`, `size`, `icon?` | V (el onClick lo pasa el padre) |
| ConfidenceChip (`.cf`) | Calidad del dato | ACT, EST, PLN, NA ("No ETA"), AI ("AI-read", opcionalmente "AI-read 82%"). Vista cliente: labels largos (Confirmed/Estimate/Planned/No ETA yet) | `kind`, `labelMode: short/long`, `confidencePct?` | V |
| StatusChip (doc) | Estado de documento (comparte forma con `.cf`) | Available, Flagged, Missing, Uploaded | `status` | V |
| RefTag (`.ref`) | Referencia en pill | PO (mono), cliente (sans), ruta (borde dashed) | `variant: mono/sans/route` | V |
| Pill / Flag | Etiqueta de ETA o riesgo | DeltaPill (sólida `#C2410C`, "+1 d"/"Delayed"), AtRisk (suave), NotAvailable (dashed gris), Stale (dashed + reloj), PossibleDelta (dotted naranja), NoteTag (nota de step `#FDEDE3`), SourceTypeTag (azul `#E7EFF8`) | `variant`, `icon?` | V |
| CountBadge | Contador dentro del chip de filtro | neutral (`#EEF0F2`), inverted (blanco sobre negro cuando está pulsado), signal (`#C2410C`) | `tone` | V |
| StatusTile | Cuadrado de 40px con icono y tono | ok, delay, risk, ai, stale, pre, delivered | `tone`, `icon` | V |
| TimelineDot | Nodo de timeline | done (negro), hold (naranja), ai (dotted), future (hueco con borde `#8A929B`) + conector sólido/dashed | `variant`, `connector: solid/dashed` | V |
| LegendSwatch | Muestra de modo o tono | road, sea, port, delayed, stale | `mode`, `tone` | V |
| Link | Enlace de texto | normal, mono | — | V |
| Divider | Separador vertical de 1×16 | — | — | V |

### Moléculas

| Componente | Composición | Variantes / notas | V/S |
|---|---|---|---|
| SearchInput | Icon(search) + input mono + label solo para lectores de pantalla | 36px, min-w 260 | **S** (valor controlado) |
| FilterChip | botón + texto + CountBadge | pulsado (negro) / no pulsado; contador signal si "Delayed" > 0; `aria-pressed` | **S** (toggle) |
| ModeBar | N segmentos (flex = peso) con track/fill por modo + marcador del tramo actual | tonos ok/delay/ai/stale/pre; marcador relleno o dashed (stale); outline dashed en stale; versión Delivered = barra negra | V |
| EtaBlock | operador + Label (tipo de ETA) + fecha mono o NotAvailable + DeltaPill/AtRisk + motivo + "Planned delivery" + fila alt (PossibleDelta + ConfidenceChip AI + fecha en cursiva) + StalePill + frescura | tipos: Delivery ETA / ETA to next stop · X / ETA not available | V |
| SourceLine | "Source" + SourceTypeTag + Link mono + "received" | fuente simple, no IA | V |
| AiSourceBox | caja gris + ConfidenceChip(AI %) + tipo/remitente/hora + blockquote + "Read as" + Link "Open original" + estado + Button primary "Verify" con aviso / línea "Verified by… Undo" | pendiente / verificado; en cliente sin Verify | **S** (verify/undo) |
| AiInlineAlt | caja gris compacta + ConfidenceChip AI + fecha alternativa + aviso | dentro de un step "Next" | V |
| AiBanner | barra gris + ConfidenceChip AI + texto + N Buttons sm (ID mono + estado) | ops / cliente | V (los botónes abren una fila: S en el padre) |
| AlertBanner | tile naranja 32px con Icon alert + título + texto + Button sm | solo vista cliente | V |
| ActionCard | tarjeta (borde naranja si es primaria) + título + descripción + Button (signal/default) | ready / blocked (disabled + motivo) / done (texto azul) | **S** (done/blocked) |
| DocumentItem | Icon(doc) + nombre + nota + StatusChip + Link Open / Button signal Upload / texto de espera | available, flagged, missing, uploaded; en cliente no hay Upload | **S** (upload) |
| TimelineStep | TimelineDot + evento · lugar + [Mono "was"] ConfidenceChip + DateText + NoteTag + operador + SourceLine / AiSourceBox / AiInlineAlt | done / next | V |
| LegendItem | ConfidenceChip o LegendSwatch + texto | — | V |
| FilterSummary | "Showing X of Y · filtros" + Button sm "Clear filters" | — | V |
| EmptyState | texto + Button "Clear filters" | — | V |
| PageHeader | H1 + contador + subtítulo + "Last sync" mono | ops / cliente | V |

### Organismos

| Componente | Composición | V/S |
|---|---|---|
| ShipmentRow | StatusTile + (ID-button + desc + RefTags) + (ModeBar + estado + texto de tramos) + EtaBlock + Button ghost con chevron; fondo `#FFF8F3` si está delayed; hover `#FBFBFC` | **S** (expandido) |
| ShipmentDetail (panel expandido) | grid: Timeline "Completed" (TimelineStep[]) · Timeline "Next" · lateral (ActionCard[] + lista de DocumentItem) | V (lo que contiene puede ser S) |
| ShipmentList | tarjeta + cabecera de columnas (Labels) + EmptyState + ShipmentRow[] + DeliveredGroup | V |
| DeliveredGroup | botón colapsable (chevron-right + "Delivered" + contador) + DeliveredRow[] (tile delivered + refs + barra negra + ACT + fecha) | **S** (abierto/cerrado) |
| FilterBar | SearchInput + Label "Show only" + FilterChip[] + "Sorted by" | **S** |
| Legend / EtaTypesLegend | LegendItem[] + Divider | V |
| TrackerPage | PageHeader + AlertBanner? + FilterBar + FilterSummary? + AiBanner? + ShipmentList + Legend | — |

### Diferencias ops / cliente (solo visuales)
Cliente: título "Your shipments", AlertBanner visible, labels largos en ConfidenceChip, sin RefTag de cliente, sin ActionCards, sin Verify/Undo, sin AiInlineAlt ni PossibleDelta, docs Missing muestran un texto de espera en lugar de Upload, solo se muestran los steps de IA ya verificados.
