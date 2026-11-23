# CLAUDE.md

Clickable frontend prototype for shipment tracking (MarsBased technical test). Frontend only, synthetic data, simulated AI. 8 h budget: build only what the PRD asks for.

## Sources of truth (in priority order)

1. `docs/PRD.md`: scope, business rules, state machine, views, demo. Wins over everything else.
2. `docs/data-model.md`: the only definition of data shapes. Copy types from here; never invent fields.
3. `docs/api-responses.md` and `docs/status-codes.md`: exact raw shape of each provider format. Fixtures must match.
4. Design (Exception Desk): visual guide only (look, layout, components). If the design shows something the PRD doesn't mention, leave it out.

If two sources conflict, follow the higher one and mention the conflict in your summary. Don't resolve it silently.

## Non-negotiable rules

- **Never invent a status or an ETA.** Unknown codes become `NOT_MAPPED`. With no operator ETA, the row hides the ETA column (never a made-up date). The system never calculates a date.
- **Only `ACTUAL` moves a state.** `EST` and `PLN` produce ETAs, commitments or planned steps.
- **The state machine decides order.** Use `domain/stateMachine.ts` → `applyEvent(legState, event)` → `applied | history | rejected | duplicate`. Statuses never go backwards.
- **AI is pending until a human decides.** A pending AI update is visible only in `/ops`, never changes status or ETA, and blocks "Notify customer". Accepted updates reach the customer as normal steps with no AI mark.
- **The customer view never receives:** `AI`, `UNKNOWN`, `IGNORED`, rejected AI updates, `aiAlternative`, `actions`, `documents`.
- **Deterministic only.** Incidents, actions, health, delay, stale and `customerNotice` come from `domain/rules.ts`. No AI decides any of them.
- **Fixed clock.** Always use `NOW` from `domain/clock.ts` (`2026-11-22T10:40` Europe/Madrid). Never call `new Date()` for business logic.

## Architecture

```
src/
  api/
    contracts.ts   wire types: provider raw payloads, ShipmentPayload, Operator, AiReading, Persona, Role
    client.ts      the only way the app reaches the backend (today delegates to mock-api/); data calls take the role
  mock-api/        fake backend, imported only by api/client.ts (and by tests, fixtures only)
    fixtures/      shipments, emails + initial AI reviews, operators, personas, aiReadings (AI mock answers)
    server.ts      applies the role's perimeter (PRD §5), returns copies after a small delay (0 in tests); AI mock
  domain/          pure; only `import type` from api/contracts
    types.ts       copied from data-model.md
    adapters/      operator adapters, one file per wire format: raw payload → status updates + ETAs
      dhl.ts dcsa.ts terminal49.ts email.ts  (mapDhl, mapDcsa, mapTerminal49, mapEmail; confidence < 0.7 → NOT_MAPPED)
      vocabularies.ts  operator text → RoadTag (DHL-shaped road JSON)
      index.ts     mapLeg: runs the adapters of one leg and merges them (shared.ts: Tag, Update, byTime)
    stateMachine.ts
    rules.ts       eta, delay/delta, stale, health, incidents, actions, customerNotice, sortShipments (worst incident first)
    mapShipment.ts mapShipments(raw shipments + AI readings + activity, audience) → ShipmentView[] in list order
    clock.ts
  queries/shipments.ts  TanStack Query: shipmentsQuery(role), useShipments / useNotices selectors, useRecordActivity
  i18n/en.ts
  routes/          /, /ops, /subsidiary, /customer 
  components/      use the design-system library; don't create primitives that already exist
```

Flow: route loader → `queryClient.fetchQuery(shipmentsQuery(role))` (always fetches fresh: data is stale on arrival) → queryFn: `fetchShipments(role)` + `interpretText` per email → `mapShipments` (adapters/mapLeg per leg → state machine → rules) → `ShipmentView[]` for the role's audience → components. Components only read `ShipmentView`.

## Data and state (TanStack Query)

- **Query:** one query per role, `['shipments', role]`, default `staleTime` (0) and `gcTime: 1000`: every visit to a role fetches fresh, and a role's data is dropped 1 s after you leave it. Its data is already UI-ready: customer audiences never receive AI, UNKNOWN, IGNORED, rejected AI, `aiAlternative` or `actions` (applied inside `mapShipments`). Each email's AI reading is cached under `['emailReading', id]`, with `gcTime: Infinity`, so it runs once per page load (the only cache kept across visits).
- **Selectors:** components call `useShipments(role, select)` (stable or inline selectors, e.g. `(list) => list.find((s) => s.id === id)!`) or `useNotices(role)`, so each re-renders only when its slice changes. The page selects only the fields it filters on; rows and detail select their own shipment by id.
- **Activity:** AI reviews, uploads and actions done are held by the (mock) backend, seeded with the stored Aduanas Golfo review and lost on reload. `useRecordActivity(role)` sends a change and invalidates `['shipments']`, so every role sees it.
- The perimeter is applied by the API, never in the UI. Search, filters and expanded rows are local `useState`.

## Conventions

- TypeScript strict. No `any`. No new dependencies without a reason.
- **i18n:** no visible text inside components. Everything goes in `src/i18n/en.ts` and is read with `t('key', params)`. UI is in English.
- Tailwind with the design-system tokens. Usable on desktop and mobile, and with the keyboard.
- Keep files small and named after what they do. No speculative abstractions.

## Tests (Vitest)

- `domain/adapters/adapters.test.ts`: one `describe` per operator adapter (DHL, DCSA, Terminal49, email).
- One test per state machine case: applied, history, rejected, duplicate, next-leg close.
- A golden test of `mapShipments` over the 7 shipments: status, ETA, stale, incidents and actions must match the PRD data table.
- `pnpm test` must pass before a step is done.

## How to work

- One PRD section per task. Read that section and the matching part of `data-model.md` before writing code.
- Finish a step with its tests green before moving on.
- Out of scope (don't build): login, backend, polling/webhooks, real emails, air/rail, predicted ETA, natural-language search, internal perimeters by site (phase 2), transshipments, EDI and other phase-2 formats, databases or persistance of any kind other than local state.
- At the end of each task, document a short summary: what changed, what tests cover it, and any PRD conflict found.

