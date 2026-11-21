# Plan — componentes de la lista de envíos (`src/components/shipments/`)

Fecha: 2026-11-19. Depende de `design-system-plan.md` (§1 tokens, §2 componentes `ui/`, §5 convenciones), que sigue vigente.

## 0. Discrepancias encontradas (y supuestos)

| Hecho | Supuesto |
|---|---|
| `app/src/domain/` no existe (tampoco `state/`, `fixtures/`). | Las uniones literales se copian exactas de `data-model.md` §2 en `shipments/types.ts`, con comentario «pasar a `import type` desde `src/domain` cuando exista». |
| El diseño `Main.dc.html` ya no está en el repo. | Referencia visual: `ui-inventory.md` §B1–B2. |
| `Icon.tsx` no tiene `doc`. | Lote A lo añade. |
| `RefTag` solo tiene `mono` y `route`. | El nombre de cliente va como texto. |

## 1. Decisiones

**Props: view model plano, no `Shipment`.** Derivar estado actual, delayed, stale, filtrado para cliente y formato de fechas es lógica; los componentes son «vacíos». Reciben `ShipmentRowView` con strings ya formateados. El mapper `Shipment → ShipmentRowView` queda fuera de alcance.
- Reglas 1/4 por tipos: `EtaView` es unión discriminada; `next_stop` y `delivery` exigen `source`; `next_stop` exige `stopName`; `none` no lleva fecha.
- Regla 6: toda fecha es `DateStamp { text, iso, confidence }`.

**Compound vs plano: plano.** Sin context, `ShipmentRow.Header/Detail` obligaría a pasar los datos dos veces y cablear `expanded`/`aria-*` a mano. Ops y customer difieren por un flag, no por estructura. API: `<ShipmentRow row audience expanded onToggle onAccept onReject onAction />`. El timeline es lista de `TimelineStep` en `<ol>`.

**Ops vs customer:** prop `audience: 'ops' | 'customer'`. Filtrar pasos AI pending/rejected es trabajo del llamador. Pintar AI aceptado sin marca (regla 16) lo garantizan `stepTone`/`showAiMark` en `tones.ts`, con test.

**Alcance:** fila + detalle, ModeBar, EtaBlock, timeline, SourceLine, AiSourceBox, ActionCard mínima (solo ops, estado ready) y lista de documentos mínima.

## 2. Qué NO se hace

- FilterBar, AiBanner, AlertBanner, FilterSummary, PageHeader, EmptyState (hermanos de la lista en la página, llevan estado de filtro).
- TrackerPage, filtrado, orden, mapper.
- `useState`/`useReducer`/context.
- Eliminado del diseño: At risk, Possible +1 d, AiInlineAlt, Undo, leyenda, DeliveredGroup.
- ActionCard blocked/done; documentos sin Upload, Flagged ni Uploaded.
- Historial completo de ETA: solo «was <fecha anterior>».
- Cambios en otros `ui/` salvo `Icon.tsx`.
- Sin `className` libre, sin `style` inline, sin clases arbitrarias nuevas, sin dependencias, sin barrel.

## 3. Archivos y props

Todo en `app/src/components/shipments/`. Export nombrado, PascalCase, mapas de clases no exportados, `ui/` importado archivo a archivo.

### 3.1 `types.ts` (lote A) — copiar literal

```ts
// Uniones alineadas 1:1 con data-model.md §2. Pasar a `import type` desde src/domain cuando exista.
export type Audience = 'ops' | 'customer'
export type Mode = 'road' | 'sea'
export type Confidence = 'ACTUAL' | 'ESTIMATED' | 'PLANNED'
export type SourceType = 'operator_api' | 'aggregator_api' | 'terminal_api' | 'dcsa_feed' | 'edi_315' | 'telematics' | 'email' | 'pdf'
export type AiReview = 'pending' | 'accepted' | 'rejected'

export type DateStamp = { text: string; iso: string; confidence: Confidence } // text ya formateado: "28 Nov · 14:00"
export type EtaDate = DateStamp & { confidence: 'ESTIMATED' | 'PLANNED' }

export type SourceView = {
  type: SourceType
  operatorName: string // "Galicar Express"
  receivedAt: string   // "23 Nov 09:12"
  url?: string
  ref?: string         // texto del enlace: "MSG 88213"
}

export type AiView = {
  quote: string
  confidencePct: number // 0–100
  readAs: string
  sender: string
  review: AiReview
  reviewedBy?: string
}

export type EtaView =
  | { kind: 'none'; operatorName?: string }
  | { kind: 'next_stop'; stopName: string; date: EtaDate; source: SourceView; delta?: string; previous?: string }
  | { kind: 'delivery'; date: EtaDate; source: SourceView; delta?: string; previous?: string }

export type StepPhase = 'completed' | 'next'
export type StepView = {
  id: string
  title: string
  place?: string
  date?: DateStamp     // ausente = ningún proveedor dio fecha (chip NA)
  previous?: string    // "was 27 Nov" tachado
  note?: string        // Tag soft-signal
  hold?: boolean       // punto solid-signal
  operatorName: string
  source?: SourceView
  ai?: AiView          // si existe, source también
}

export type BarPattern = 'road' | 'sea' | 'port'
export type BarSegmentView = { pattern: BarPattern; weight: 1 | 2 | 3; progress: 'done' | 'current' | 'future' }

export type RowStatus = 'ok' | 'delay' | 'incident' | 'ai' | 'stale' | 'pre' | 'delivered'
export type DocumentView = { id: string; name: string; note?: string; status: 'available' | 'missing'; url?: string }
export type ActionView = { id: string; title: string; description: string; buttonLabel: string; primary: boolean }

export type ShipmentRowView = {
  id: string
  description: string
  customerName?: string    // solo se pinta en ops
  refs: string[]           // RefTag mono
  route: string            // RefTag route
  status: RowStatus        // prioridad ya resuelta por el mapper
  currentMode: Mode
  statusText: string
  legsText: string
  segments: BarSegmentView[]
  eta: EtaView
  stale?: string           // "No update for 9 h"
  completed: StepView[]
  next: StepView[]
  actions: ActionView[]    // se ignora en customer
  documents: DocumentView[]
}
```

### 3.2 `tones.ts` (lote A) — único mapeo dominio → `ui`

Solo `import type` de `ui/` y `./types`. Sin JSX.

```ts
export const confidenceChip: Record<Confidence, { tone: ChipTone; short: string; long: string }> = {
  ACTUAL:    { tone: 'solid',          short: 'ACT', long: 'Confirmed' },
  ESTIMATED: { tone: 'outline-accent', short: 'EST', long: 'Estimate' },
  PLANNED:   { tone: 'dashed-muted',   short: 'PLN', long: 'Planned' },
}
export const noDateChip = { tone: 'dashed', short: 'NA', long: 'No ETA yet' } as const satisfies { tone: ChipTone; short: string; long: string }

export const statusTile: Record<RowStatus, { tone: IconTileTone; icon: IconName | 'mode'; label: string }> = {
  ok:        { tone: 'soft-accent',   icon: 'mode',      label: 'On track' },
  delay:     { tone: 'solid-signal',  icon: 'clock',     label: 'Delayed' },
  incident:  { tone: 'soft-signal',   icon: 'hold',      label: 'Incident' },
  ai:        { tone: 'dotted',        icon: 'doc-alert', label: 'AI update to review' },
  stale:     { tone: 'dashed-strong', icon: 'clock',     label: 'No recent updates' },
  pre:       { tone: 'neutral',       icon: 'box',       label: 'Booked' },
  delivered: { tone: 'solid',         icon: 'check',     label: 'Delivered' },
}
export function statusTileIcon(status: RowStatus, mode: Mode): IconName // 'mode' → road: 'truck', sea: 'ship'

export type BarTone = 'ok' | 'signal' | 'muted' | 'solid'
export const barTone: Record<RowStatus, BarTone> = {
  ok: 'ok', ai: 'ok', delay: 'signal', incident: 'signal', stale: 'muted', pre: 'muted', delivered: 'solid',
}

export const sourceTypeLabel: Record<SourceType, string> = {
  operator_api: 'Operator API', aggregator_api: 'Aggregator', terminal_api: 'Terminal API',
  dcsa_feed: 'DCSA feed', edi_315: 'EDI 315', telematics: 'Telematics', email: 'Email', pdf: 'PDF',
}

/** Regla 16: el cliente nunca ve marca de IA. */
export function showAiMark(step: StepView, audience: Audience): boolean // audience === 'ops' && step.ai !== undefined
export function stepTone(step: StepView, phase: StepPhase, audience: Audience): TimelineItemTone
// orden: hold → 'solid-signal'; showAiMark → 'dotted'; completed → 'solid'; next → 'hollow'
```

Los nombres de tono/icono deben existir en `ui/`; si alguno no existe, usar el más cercano existente y anotarlo (no añadir tonos a `ui/`).

`tones.test.ts` (lote A), 4 casos:
1. customer + `ai.review='accepted'` + completed → `stepTone` = `'solid'`, `showAiMark` = `false`.
2. ops + pending → `'dotted'`, `true`.
3. `hold` gana → `'solid-signal'`.
4. `statusTileIcon('ok','sea')` = `'ship'`.

### 3.3 Componentes

Firmas `export type XProps` + `export function X`.

| Archivo | Lote | Props | Composición |
|---|---|---|---|
| `ConfidenceDate.tsx` | A | `{ date?: DateStamp; audience: Audience; variant?: 'step' \| 'eta' }` | `Chip` (`confidenceChip` o `noDateChip`; `short` en ops, `long` en customer) + `<time dateTime={iso}>` mono `tabular-nums`. Color por confianza: ACTUAL `text-fg`, ESTIMATED `text-accent`, PLANNED `text-fg-muted`. `step` = tamaño meta; `eta` = `text-body font-semibold`. |
| `SourceLine.tsx` | A | `{ source: SourceView }` | `<p>` flex wrap gap-1.5, texto nota subtle: `Label size="sm"` «Source» + `Tag soft-accent` (`sourceTypeLabel`) + operador + `<a target="_blank" rel="noreferrer">` mono `{ref ?? 'Open'}` si hay url + «received {receivedAt}». |
| `AiSourceBox.tsx` | A | `{ source: SourceView; ai: AiView; onAccept: () => void; onReject: () => void }` (solo ops) | `Panel tone="muted"`: `Chip dotted` «AI-read {pct}%» + `Tag soft-accent` + remitente + hora; `<blockquote>` sobre surface; `Label sm` «Read as» + `readAs`; «Open original». Si pending: `Button size="sm"` primario Accept + `Button size="sm"` Reject. Si no: «Accepted by X» / «Rejected by X». |
| `EtaBlock.tsx` | A | `{ eta: EtaView; audience: Audience; stale?: string }` | `Label sm`: «Delivery ETA» / «ETA to {stopName}» / «ETA not available» (`tone="muted"`). Con fecha: `ConfidenceDate variant="eta"` + `EtaFlag solid-signal` (delta) + `<s>` «was {previous}» + `SourceLine`. `none`: `EtaFlag dashed` «Not available» + operador, sin fuente ni fecha. `stale`: `EtaFlag dashed-strong` + `Icon clock`. Alineado a la derecha. |
| `ModeBar.tsx` | A | `{ segments: BarSegmentView[]; status: RowStatus; label: string }` | `<div role="img" aria-label>` flex gap-0.5. Segmento: `h-2 basis-0 rounded-xs` + grow por weight (mapa) + patrón `bar-road/sea/port` + paleta (`bar-track` si future, si no `bar-{barTone}` vía mapa completo). Marcador tras `current`: `size-3 rounded-chip` (mapa por RowStatus; delivered sin marcador). Sin `style`. |
| `TimelineStep.tsx` | B | `{ step; phase; audience; connector?: TimelineItemConnector; onAccept: (stepId) => void; onReject: (stepId) => void }` | `TimelineItem tone={stepTone(...)}`. Título + lugar; fila con «was» tachado + `ConfidenceDate variant="step"` + `Tag soft-signal` (nota) + operador. Solo ops: `AiSourceBox` si `showAiMark` y source; si no, `SourceLine` si source. Customer: solo operador. |
| `ShipmentDetail.tsx` | B | `{ row; audience; id: string; onAccept; onReject; onAction: (actionId) => void }` | `<div id>` grid 3 columnas en md: «Completed» (`<ol>` de `TimelineStep` completed, connector solid salvo el último), «Next» (connector dashed), lateral (ops: ActionCards; todos: documentos). `ActionCard` y `DocumentList` son funciones locales no exportadas. |
| `ShipmentRow.tsx` | B | `{ row; audience; expanded: boolean; onToggle: (id) => void; onAccept; onReject; onAction }` | `<li>`; fondo por mapa (delay → signal-wash; resto surface + hover). Cabecera flex wrap: `IconTile` (statusTile) · botón ID (`aria-expanded`, `aria-controls`) + descripción + cliente (ops) + `RefTag`s + `RefTag route` · `ModeBar` + statusText + legsText · `EtaBlock` · `Button ghost` chevron con `rotate`. Si expanded → `ShipmentDetail` con id `` `${row.id}-detail` ``. |
| `ShipmentList.tsx` | B | `{ rows; audience; expandedIds: ReadonlySet<string>; onToggle; onAccept; onReject; onAction }` | `Panel radius="lg" as="section" aria-label="Shipments"`; cabecera de columnas (md+) con `Label`s; `<ul>` divide-y con `ShipmentRow` por fila. |

## 4. Base a ampliar (lote A)

**`ui/Icon.tsx`**: añadir `doc` (trazo 1.8, join round): `M6 3h8l4 4v14H6z` · `M14 3v4h4` (reutilizar el `docBody` existente).

**`index.css`** — en `@theme` (re-añadir con su primer consumidor):

```css
--color-surface-subtle: #F8F9FA;
--color-surface-hover: #FBFBFC;
--color-divider: #E6E8EB;
--color-bar-ok: #2E6FBA;     --color-bar-ok-2: #9FC0E4;
--color-bar-signal: #D9550F; --color-bar-signal-2: #F0A274;
--color-track: #D0D5DB;      --color-track-2: #ECEEF1;
```

Utilidades de barra (rayas como `@utility`, el hex fuera de componentes):

```css
@utility bar-road { background-color: var(--bar-a); }
@utility bar-sea  { background-image: repeating-linear-gradient(135deg, var(--bar-a) 0 3px, var(--bar-b) 3px 6px); }
@utility bar-port { background-image: repeating-linear-gradient(90deg, var(--bar-a) 0 2px, var(--bar-b) 2px 4px); }
@utility bar-track  { --bar-a: var(--color-track);      --bar-b: var(--color-track-2); }
@utility bar-ok     { --bar-a: var(--color-bar-ok);     --bar-b: var(--color-bar-ok-2); }
@utility bar-signal { --bar-a: var(--color-bar-signal); --bar-b: var(--color-bar-signal-2); }
@utility bar-muted  { --bar-a: var(--color-mid);        --bar-b: var(--color-border-strong); }
@utility bar-solid  { --bar-a: var(--color-fg);         --bar-b: var(--color-fg); }
```

Verificar que `--color-mid`, `--color-border-strong`, `--color-fg` existen; si no, usar los equivalentes reales.

## 5. Datos de muestra — `src/components/shipments/sampleRows.ts` (lote B)

No va en `routes/` (TanStack lo convertiría en ruta). Exporta `opsRows`, `customerRows`, `etaExamples`. Todo sintético.

| ID | Caso | Contenido |
|---|---|---|
| 24817 | Normal, colapsada | Arvena Zaragoza plant → Talleres Ebro, Madrid. Road doméstico, Galicar Express. `ok`. ETA `delivery` EST, `operator_api`. |
| 24822 | Retraso | Zaragoza, ES → Querétaro, MX: road → sea (Nordhaven Lines, `NHLU4821937`, Valencia → Veracruz) → road. `delay`, tramo actual sea. ETA `next_stop` «Veracruz port» EST, `aggregator_api`, `delta '+1 d'`, `previous '27 Nov'`. |
| 24830 | Expandida con paso AI | Multimodal. `ai`. Completed: Picked up (ACT, operator_api), Gate in Valencia (ACT, terminal_api), Vessel departed (ACT, dcsa_feed), paso AI email pending 82 % con cita. Next: Vessel arrival Veracruz (EST), Customs MX (PLN), Delivery (sin fecha → NA). Una acción. Docs: Bill of lading, Commercial invoice (available). |
| 24835 | ETA none + incidencia | Arvena Lleida → Bilbao. Road for-hire doméstico, Galicar Express. `incident`. ETA `none`. Doc DeCA missing (regla 17; sin e-CMR, regla 18). Acción primaria «Upload DeCA». `stale: 'No update for 9 h'`. |

`customerRows`: 24817, 24822, 24830 sin `customerName`, `actions: []`; en 24830 el paso AI `accepted` y `status: 'ok'`; ningún pending/rejected (regla 16). `etaExamples`: los tres tipos.

**`routes/design-system.tsx`** (lote B): añadir `'doc'` a `iconNames`; al final una `<section>` «Shipments» con EtaBlock ×3, ModeBar por cada RowStatus, `ShipmentList audience="ops"` y `audience="customer"` con `expandedIds = new Set(['24830'])` (constante de módulo). Callbacks `() => {}`. Sin estado. No regenerar `routeTree.gen.ts`.

## 6. Verificación (integrador)

1. `pnpm lint --deny-warnings`, `pnpm build`, `pnpm exec vitest run` (incluye `tones.test.ts`).
2. `.bar-sea`, `.bar-ok`, `.bg-surface-hover` presentes en `dist/assets/*.css`.
3. Greps vacíos sobre `src/components/ui src/components/shipments`:
   - clases dinámicas: `grep -rnE '[a-z0-9]-\$\{|\[[^]]*\$\{'`
   - colores crudos: `grep -rnE '#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|\b(slate|gray|zinc|neutral|stone)-'`
   - estado: `grep -rnE 'useState|useReducer|useContext|createContext' src/components`
   - `layout` con bg/border/rounded/text
   - `style=` y `\b(bg|text|border|grid-cols|basis|grow)-\[` en shipments
4. `/design-system` en dev: fila delayed con wash y `+1 d`; paso AI dotted + caja gris + Accept/Reject en ops; en customer el mismo paso `solid`, sin marca AI; chips largos en customer.

## 7. Lotes (archivos disjuntos)

Ninguno ejecuta `vite build` ni toca `routeTree.gen.ts`.

**Lote A** — `index.css`, `ui/Icon.tsx`, `shipments/{types.ts, tones.ts, tones.test.ts, ConfidenceDate.tsx, SourceLine.tsx, AiSourceBox.tsx, EtaBlock.tsx, ModeBar.tsx}`.

**Lote B** — `shipments/{TimelineStep.tsx, ShipmentDetail.tsx, ShipmentRow.tsx, ShipmentList.tsx, sampleRows.ts}`, `routes/design-system.tsx`. Compila cuando A esté integrado.
