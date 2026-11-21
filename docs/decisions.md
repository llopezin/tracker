# Decisions outside the spec (per TODO step)

Every item below is a choice not covered by the PRD / data-model, or a conflict between documents, and how it was resolved. Priority when in conflict: PRD > design > api-responses > data-model > status-codes (PRD §2).

## 0. Repo setup
- **Router:** TODO says "install react-router"; PRD §11 and the existing base use TanStack Router (file routes). Kept TanStack Router, did not install react-router.
- **Docs location:** the source docs live at the repo root; copies were placed in `app/docs/` as TODO asks. The root copies remain the originals.
- **`CLAUDE.md`:** already present in `app/` (plus a lowercase `claude.md` duplicate from the base); not modified.
- **Tailwind tokens:** already wired in `src/index.css` by the base; nothing to do.
- **Clock:** `NOW = '2026-11-22T10:40:00+01:00'` (Madrid is UTC+1 in November).
- **Contracts:** added `docs/contracts.md` to freeze module ownership, pipeline, store shape and i18n keys before parallel work.

## 1. Types
- `domain/types.ts` is a 1:1 copy of data-model §2, §4, §5, plus three small additions the docs need but don't define: `Leg` (union alias), `OrderResult` (alias), `Session` (shared session facts: AI reviews, actions done, uploaded docs, PRD §5) and `Notice` (one banner line, PRD §8.6).
- i18n: `t()` lives in `src/i18n/t.ts` (pure TS) so the domain can produce translated strings. `ShipmentView.status` is an i18n key (as data-model says); the other text fields in the view (`event`, `subStatus`, `summary`, `text`) are resolved with `t()` in the domain. Dates stay ISO and are formatted in components.
- Action template texts were written by the orchestrator (the design's exact copy isn't in the PRD).

## 3b. State machine (`domain/stateMachine.ts`)
- **Feed order:** updates are fed in arrival order (`source.receivedAt`, ties by array order), not by `occurredAt`; otherwise nothing could ever be `rejected`.
- **EST / PLN / NOT_MAPPED:** result `history`, state unchanged, not recorded as seen. Done vs next is decided by `confidence`, not by `order`.
- **Rankless tags** (`DOCUMENTS_MISSING`, `BREAKDOWN`, `DELAYED`, `EXCEPTION`, `DELIVERY_FAILED`): `applied` with status unchanged (they are in-order events the rules use).
- **Closed legs** (final state, `CANCELLED`, or next leg started): every later event is `history` (PRD §8.7); `EMPTY_RETURNED` after the final state is the exception: `applied` (recorded, status unchanged). (The agent first chose `rejected`; corrected to follow the PRD.) `history` steps are real older operator events and are shown as normal past steps to every role; only `rejected` (IGNORED) is hidden from customers.
- **`CANCELLED`:** `applied`, sets status and closes the leg.
- **Duplicate** (same tag, same instant) is checked first, also on closed legs.
- **Edge cases:** lower rank with the same date as the current status counts as "earlier" (→ `history` if unseen); lower rank, earlier date but milestone already seen at another date → `rejected`.
- **`statusAt`** is the date of the event that set the status, not the latest date seen.
- **Next-leg close** only when the event actually sets the next leg's status (ranked tag or `CANCELLED`); a rankless `DELAYED` on the next leg does not close the current one.
- **Mode-specific ranks:** `CUSTOMS_HOLD` / `CUSTOMS_RELEASED` / `READY_FOR_PICKUP` are rank 2–3 on road but rank 6 at sea; `AT_SEA` is rank 3.
- **PRD oddity, kept as specified:** same rank with an earlier date is still `applied`, so a late `ARRIVED_AT_HUB` can replace a newer `DEPARTED_HUB`.

## 1b / 2. Raw types and fixtures (`src/data/`)
- **`apiTypes.ts` isn't a verbatim copy:** DHL `service` is widened to `string`, unused optional DHL/T49 fields are dropped, and DCSA location/vessel objects are narrowed to the fields used.
- **Road legs of ACM-24755 / ACM-24866** are carrier haulage by the sea carrier, because the PRD lists no other operator for them. Each is a DHL-shaped stub with no events.
- **ACM-24790** customer name is "Final client". Account ids (`acc-acme-mexico`, `acc-final-client`, …) are invented.
- **Terminal49 is not a record leg:** the loader attaches it to the sea leg and hardcodes "Terminal Golfo" as its operator.
- Fixture timeline, checked against PRD §12: exactly 1 `NOT_MAPPED` (24812), exactly 1 pending AI read (24790), stale only on 24755 (88 h), and every active `plannedDelivery` is after NOW.

## 3a. Adapters (`src/domain/adapters/`) and AI mock (`src/ai/`)
- **CONFLICT, `lastFreeDay`:** PRD §6 names `pickup_lfd`, while data-model says "earliest of `import_deadlines.*`". Following the PRD: `pickup_lfd`, falling back to the earliest deadline only when it is null.
- **CONFLICT, `interpretText(text)`:** the function takes only the text, but the PRD says the response comes from a fixed map by email id. The mock finds the email by its exact body, then looks up that email's id.
- **DCSA `SHIPMENT` events other than BKG+CONF** are not emitted: "they go to history" has no tag to carry them, and no fixture contains one.
- **DHL:**
  - The top-level `status` is ignored (it repeats the newest event).
  - The window ETA wins over `estimatedTimeOfDelivery` when both are present.
  - `statusCode: delivered` with a non-`DELIVERED` vocabulary tag becomes `NOT_MAPPED`. The `failure` cross-check is not implemented.
  - `receivedAt` is the event timestamp.
- **DCSA:**
  - ACT/EST/PLN events all become updates carrying their confidence.
  - Only `EST ARRI` produces an `EtaValue`.
  - `delayReasonCode` emits an extra `DELAYED` update.
  - Codes without a tag become `NOT_MAPPED`.
- **Terminal49:**
  - Hold and ready-for-pickup updates are dated `terminal_checked_at`, which is also their `receivedAt`.
  - There is no `CUSTOMS_RELEASED`, because a single snapshot can't show a hold being removed.
  - `ind_eta_at` is not mapped.
- **Email / AI:**
  - The AI update id is `ai:<emailId>`. The initial accepted review (Aduanas Golfo) is `initialAiReviews` in `data/emails.ts`.
  - The AI update has confidence `ACTUAL` and `occurredAt` = the reading's date.
  - A new date in the email is an `AiEtaCandidate`, kept apart from `etas`.
  - The AI milestone is cast to the leg's tag type without validation.
- **Adapters return updates sorted by `occurredAt`.** The mapper re-sorts them by `receivedAt` before feeding the state machine.

## 5. Store and i18n (`src/state/`, `src/i18n/`)
- **Contract change:** store actions take the persona email from the route as a third argument (`accept(id, aiId, by)`). The store also exposes `session`, `accountOf` and `originSiteOf`, filled from `record.customerAccount` / `record.originSite.name` and used for the perimeter (`state/perimeter.ts`), because `ShipmentView` has neither field.
- **`ids` are not re-sorted after an action**, so rows don't jump while ops is reviewing.
- **Customer routes read `customerShipments`**, a projection computed when the shipment is mapped. They never receive the ops view with parts hidden in render.
- `init()` runs once from `__root.tsx`.

## 6. UI (`src/routes/`, `src/components/`)
- **CONFLICT, `/` route:** PRD §4 says the index only redirects, while §5 and TODO list three entry links. Implemented the three links (§5 is the more specific table).
- **No presenter layer:** the base components were rewritten to read `ShipmentView` / `StepView` directly (CLAUDE.md). The old `components/shipments/types.ts`, `sampleRows.ts`, `tones.test.ts` and `ConfidenceDate.tsx` were removed. Hardcoded English moved to `ui.*` keys.
- **ETA source:** `EtaView` has no source field, so the ETA block takes its source and the struck-through previous date from the `next` step whose `date` equals `eta.from`. The mapper guarantees that step exists.
- **Filters:**
  - Filters combine with AND.
  - Counters cover in-perimeter, non-delivered shipments.
  - Needs review = incidents containing `ai_pending`.
  - The delivered section hides while a filter is active and opens when a search matches a delivered shipment.
- **Styling and display:**
  - Delayed styling (signal border, tinted row, delta flag) is driven by `tags.includes('delayed')`, so a delayed row stands out even when its tone is `stale`.
  - Customer views show tone `ai` as `ok` (pending AI is invisible to them).
  - The banner drops the reason when it repeats the status ("Held at customs").
  - `ModeBar` rounds `stages.weight` into 1–3 flex sizes.
- **Actions and documents:**
  - The "Upload document" action uploads the first `missing` document (else the first `flagged` one).
  - The document "Open" button is inert (no file URLs in a mock).
- `routes/design-system.tsx` is kept dev-only and unlinked; it still has hardcoded English.
- `perimeter.ts` imports `ACCOUNTS` from the fixtures instead of redefining the ids (fixed by the orchestrator: the UI agent's guessed ids didn't match).

## 4. Rules and mapper (`domain/rules.ts`, `mapShipment.ts`, `customerView.ts`)
- **Feed order:** updates enter the state machine shipment-wide in arrival order (not per leg), because `applyToShipment` closes earlier legs.
- **Pending and rejected AI updates are never fed** to the state machine. Rules therefore filter on "operator update or accepted AI", not on `order`.
- **Done vs next:** decided by `confidence === 'ACTUAL'`. A rejected AI update keeps label `AI` with review `rejected` (ops history only).
- **Delay (§8.2):**
  - A slip inside the same calendar day is not a delay, so "+N d" always has N ≥ 1 (Europe/Madrid days).
  - Case 1 compares the ETA's `from`.
  - With several cases, the delta is the largest N; "Overdue" (case 3) wins.
  - Case 4 (operator-reported) can be a delay without a delta.
- **Stale (§8.3):** hours since the latest `receivedAt` over all operator updates (ACT/EST/PLN/NOT_MAPPED) plus accepted AI. The threshold follows the current leg's mode. Using the latest ACT instead would wrongly mark ACM-24866 stale, since its only recent item is an EST ARRI.
- **Active hold** = a Terminal49 customs hold on a sea leg, unless the shipment is delivered.
- **Departed** = some leg past `INFO_RECEIVED` / `BOOKING_CONFIRMED` / `EMPTY_DISPATCHED`.
- **Delivered** = the last leg reached its final tag, so 24817's road `DELIVERED` is only a handover (§7).
- **ETA:**
  - The delivery ETA comes from the last leg.
  - `next_stop` comes from the current leg's ETA when it isn't the last leg, with place = the record leg's `to.name`.
  - An accepted AI date joins that leg's ETA history; `previousDate` = the previous ETA.
- **Next steps:** the remaining plan milestones of open legs, plus the leg's ETA milestone, dated EST, else PLN, else NA.
- **Delivered shipments** get no incidents, actions or delta.
- **Actions:**
  - One action per kind, ordered by incident order; the first is primary.
  - `upload_document` is offered only when a `missing` or `flagged` document exists.
  - `notify_customer` is blocked by any pending AI read on the shipment.
  - `contact_operator` names the current leg's operator.
- **Notice reason:** the latest ACT `BREAKDOWN` / `DELAYED` / `CUSTOMS_HOLD`. For `DELAYED` the raw `delayReasonCode` is shown, since status-codes.md has no text table for those codes.
- **Customer projection:** tone `ai` → `ok` (or `pre`); `ai_pending` incidents removed; sources lose `ai` and `raw`.
- **Display fields:** `subStatus` = location of the latest ACT plus the reason; `operators` = the current leg's operator (+ Terminal Golfo with T49 data); `routeText` uses i18n keys `route.road/sea/port` (a new prefix).
- **Sort (§8.4):** by the ETA *shown*, so a stale or held shipment sorts by planned delivery even when an operator ETA exists.
- **Duplicate reports:** the two `VESSEL_ARRIVED` reports on 24817 (DCSA + T49, same instant) render as one step with two sources.

## 5b. Wiring
- `src/state/views.ts` (orchestrator) replaces the UI agent's temporary `mockViews.ts`: `loadAll` → `mapShipment` → `toCustomerView` → `customerNotice`. The store is seeded with `initialAiReviews`, so the Aduanas Golfo read starts accepted (PRD §6) and Needs review = 1.

## 7. Review round (two reviewers + scope agent) and fixes
Fixed:
- **Planned steps have a source:** "Internal plan · Acme" (PRD §12, "each step shows its source"). This needs `StepView.sources[].receivedAt` to be optional, a small deviation from data-model §5.
- **Blocked ETA:** when the row shows "ETA not available" (stale, hold, not departed), the detail no longer shows the operator's EST on that milestone; it falls back to PLN/NA.
- **Customer projection:** also drops `unmapped` incidents and rebuilds `tags` from what remains.
- **Banner:** a `late` notice without a day count shows "Delayed" instead of "+ d late".
- **Done actions stay listed** with "Done by … · hh:mm" after their incident is resolved. A done upload names the document actually uploaded (`Session.actionsDone[].docKey`, optional). This replaces the §6 note "uploads the first missing, else first flagged" for done actions.
- **e-CMR (`cmr`) is optional:** it never raises `missing_document` and is never chosen for upload (PRD §8.5).
- **Upload text is neutral:** "Upload {document} for {id}." (it applies to the domestic DeCA too).
- **Not-departed shipments:** the mode bar is muted and empty, never in the delay colour.
- **Keyboard:** after an action, focus moves to the row's detail container instead of `<body>`.
- **Labels and copy:**
  - Customer source labels show only the source type ("Operator API", "DCSA T&T", "Terminal API", "Email"), with no API field names.
  - The search placeholder is shortened to "Search by ID".
- A redundant customer tone branch was removed from `tones.ts`.

Not changed, deliberately:
- **Planning notes the base already contained in `app/docs/`** (`design-system-plan.md`, `design-system-research.md`, `shipment-table-plan.md`, `ui-inventory.md`). The scope agent flagged them as not needed for delivery; deleting them is the author's call.
- **`/design-system` route and the TanStack devtools:** dev-only, from the base. In production the route renders nothing but stays registered.
- **Fields mapped but not rendered** (`trackingNumber`, `containerNumber`, `vessel`, `voyage`, `lastFreeDay`, `staleThresholdHours`, unused domain types): kept, because data-model is the source of truth for shapes.
- **`client@gmail.com`:** the PRD §5 persona. The scope agent suggests `client@example.com`; left as the PRD says.
- **Stale thresholds 24 h / 72 h** follow PRD §8.3 (the historic `rules.md` says 6 h road).
- **Known focus gap:** if an action removes the row from an active filter, focus still falls to `<body>`.
- **Role switching:** a "← Switch role" link to `/` was added to every view header. Session state lives in memory, so typing a URL resets the demo.
- **`vercel.json`:** a SPA rewrite to `index.html`, so role routes load directly.

## 8. Write-up and README
- The write-up is `docs/writeup.md` (English, since the brief is in English; about 3 pages).
- The README was rewritten in English with run instructions, routes and the demo script.
- "Compare against the 5 reference repos": no repos are identified in any document, so this was skipped rather than inventing them.
- Vercel deploy and git repo: not done. There is no git repository and no Vercel CLI here; both need the author's accounts.

## 9. Restructure: fake backend behind an API client
- **Why:** app code imported mock data directly (`src/data/`), so swapping in a real backend would have meant touching the domain and the store. The app now talks to a fake backend through `api/client.ts`, as it would in production: in production the client's functions become `fetch` calls and `mock-api/` is deleted. No behaviour visible in the demo changed and all 38 existing assertions are the same. In those tests only imports changed, plus the golden test's loader call (`loadAll(0)` → `loadSources('ops', 0)`) and a type name (`ShipmentFixture` → `ShipmentPayload`). One new test file, `mock-api/server.test.ts`, checks each role's perimeter (3 cases, 41 tests in total).
- **Supersedes** the paths and wiring named earlier in §1b/2 (`src/data/`), §3a (`data/emails.ts`, `src/ai/`), §5b (`loadAll`, the `initialAiReviews` seed) and the §6 note on `perimeter.ts` importing `ACCOUNTS`. Those sections are kept as history.
- **Layout:** `api/contracts.ts` (wire types: the old `apiTypes.ts` plus `ShipmentPayload` / `LegPayload` / `RawPayload`, renamed from the `*Fixture` types, and `Operator`, `AiReading`, `Persona`), `api/client.ts`, `mock-api/` (fixtures, `server.ts`, `interpretText.ts`), `domain/ingest.ts` (the old `data/load.ts`, now pure and sync), `domain/adapters/vocabularies.ts`.
- **Vocabularies stayed in the domain:** the per-operator status text → `RoadTag` maps are normalisation knowledge, not backend data, so `Operator` has no `vocabulary` and `adaptDhl` looks the map up by `operator.id` (its operator parameter is now `{ id, name }`). That keeps the DHL test calls unchanged.
- **contracts → domain/types is type-only:** `contracts.ts` reuses `ShipmentRecord`, `RoadTag` and `SeaTag` from `domain/types.ts` with `import type`, so those shapes stay a 1:1 copy of data-model in one place.
- **Operator names reach `mapShipment` through `AdaptedLeg.operator`,** filled in by `ingest`, because the domain can no longer import the operator registry. `mapShipment`'s signature is unchanged.
- **AI readings:** `views.ts` calls `client.interpretText` once per email returned by `fetchEmails()`, awaits them all and passes a map keyed by email id to `ingest`. Before, it was called per leg reference, which gives the same result here because each email feeds exactly one leg.
- **Perimeter in the fake API, not the UI (requirement change):** once the role is known, the data calls take it (`fetchShipments(role)`, `fetchEmails(role)`, `fetchAiReviews(role)`) and `mock-api/server.ts` returns only that role's data. ops gets origin site ∈ the persona's `sites`. subsidiary and customer get `customerAccount === accountId`. Emails and AI reviews are limited to those shipments. `fetchOperators()` stays unscoped (master data). The frontend never receives an out-of-perimeter shipment, so `state/perimeter.ts`, the `allowed` predicates and the store's `accountOf` / `originSiteOf` maps were deleted. Counters, search and the banner work only on what the API returned. `Audience` and `Role` now live in `api/contracts.ts`.
- **Customers still receive raw emails** for their own shipments, because normalisation and AI reading run in the frontend (PRD §7, §9). In production the backend would send already-normalised views, and customers would never get raw emails.
- **Store per role, shared session:** `byRole[role] = { shipments, customerShipments, notices, ids }`. `ShipmentsPage` calls `load(role)` on enter, and the result is cached per role. `load` fetches the role's AI reviews and data, calls `interpretText` once per email in the role's response and awaits all readings, then maps synchronously inside `set` with the current session. A role loaded later therefore reflects earlier actions, and an action during a load is never lost. Fetched reviews are merged under the session's (`{ ...stored, ...session }`), so a review made in the session is never overwritten. An action updates the session and recomputes that shipment once, then writes it into every loaded role that has it. Payloads and ingested events stay cached per id in `views.ts`. Needs review is still 1 in `/ops`.
- **The AI mock runs per role:** `/customer` reads the TransPirineo email again after `/ops` did. The answer is the same, since the map is fixed.
- **The server knows the AI update id scheme** (`ai:<emailId>`) to filter stored reviews by email. It is the same literal as the fixture key.
- **Personas:** `getPersona(role)` is a sync stand-in for login. Routes pass only the role. `ShipmentsPage` reads the email, audience and ops sites (header) from the persona. There are no hardcoded ids or site names left in app code.
- **Fake latency:** `server.ts` waits 100 ms per call (0 when Vitest sets `MODE=test`) and returns `structuredClone` copies. `interpretText` keeps its own 400 ms default.
- **Fixture independence:** `initialAiReviews` uses the literal key `ai:email-aduanas-24817` instead of importing `aiUpdateId` from the domain, so the mock backend does not depend on frontend code. The email adapter test checks that the two agree.
- **Golden test** loads through `state/views.loadSources('ops', 0)`, the same client → ingest path the app uses. ops sees all 7 shipments.
- **Lint:** `.oxlintrc.json` overrides use `no-restricted-imports` (oxlint supports it, including `regex` patterns and `allowTypeImports`). App folders cannot import `mock-api`. `domain/**` cannot import `mock-api`, `api/client`, `state`, `components` or `routes`, and can import `api/contracts` only with `import type`. `mock-api/**` cannot import the app or the client. Tests (a later override) may import `mock-api/fixtures/**` and `api/client` but not the rest of `mock-api`. Each rule was checked with a deliberately bad import. oxlint's regex has no look-ahead, so the test rule uses a glob group with a negation instead.
- **CONFLICT, file paths in the PRD:** PRD §6 says fixtures live in `src/data/` and §9 names `ai/interpretText.ts`. These are paths only, not behaviour, so the PRD was left as is. The fixtures are now in `src/mock-api/fixtures/` and the AI mock is `src/mock-api/interpretText.ts`, called through `api/client.interpretText`.
- `ShipmentPayload.legs` renamed to `rawUpdates` (`LegPayload` → `LegRawUpdates`): it holds what operators sent per leg, before normalisation; `updates` stays the normalised `StatusUpdate[]`.

## 10. English naming
- **CONFLICT, Spanish names in the PRD:** PRD routes `/filial` → `/subsidiary` and `/cliente` → `/customer` (files `routes/filial.tsx` → `subsidiary.tsx`, `routes/cliente.tsx` → `customer.tsx`). `Role` and persona keys `'filial' | 'cliente'` → `'subsidiary' | 'customer'`, and i18n keys `ui.index.filial`, `filialHint`, `cliente`, `clienteHint` → `ui.index.subsidiary`, `subsidiaryHint`, `customer`, `customerHint`. A few Spanish code comments in `src/` were translated. Names only, no behaviour change. `Role 'customer'` (the end-customer persona) is not `Audience 'customer'` (the customer-facing view, used by both subsidiary and customer). The PRD and the other copied source docs stay unchanged, and the deliberately Spanish fixture content (operator vocabulary, names, places, emails, ids such as `email-aduanas-24817`) is kept.

## 11. Naming: tone → health
- `ShipmentView.tone` (PRD §8.4, data-model §5) renamed to `health`: the value is a priority state computed in the domain, not a visual property. UI primitives keep their visual `tone` props.

## 12. Data, normalization and state cleanup (2026-11-19)
- **Zustand removed.** Data per role comes from TanStack Router `loader`s (`data/loadRole.ts`, `staleTime: Infinity`, `pendingMs: 0`); the session is a `useReducer` in a React context mounted in `__root.tsx` (`data/session.tsx`); views are derived per page in one `useMemo` (`data/useShipmentViews.ts`). Supersedes the store design in §5 and §9 ("Store per role") and the per-shipment recompute: with 7 shipments, re-mapping the role on each action is cheap and removes the cache module.
- **Stored AI reviews** are merged under the session's own by `<StoredReviews>` per page instead of being copied into the session on load, so the server data and session facts stay separate.
- **Adapters consolidated, not deleted.** The contracts carry raw provider payloads and `mapShipment` is kept, so normalization still has to happen. `domain/adapters/{dhl,dcsa,terminal49,email}.ts` and `domain/ingest.ts` are merged into `domain/normalize.ts` (`readDhl`, `readDcsa`, `readTerminal49`, `readEmail`, `normalize`), with the same logic, output shape (`AdaptedShipment`) and update ids. `vocabularies.ts` moved to `domain/`. The four adapter test files became `domain/normalize.test.ts` with the same assertions.
- **Mock API:** `server.ts` computes a role's perimeter in one function; the AI mock lives there and its fixed answers moved to `fixtures/aiReadings.ts` (`interpretText.ts` deleted). `api/client.ts` re-exports the server calls with the same names and signatures.

## 13. TanStack Query, one mapper (2026-11-19)
- **Supersedes §12's loaders, session and `normalize` stage.** One query per role; its queryFn fetches the raw shipments and maps them straight to `ShipmentView[]` (`mapShipments`). `normalize`/`AdaptedShipment`, `loadRole`, `session.tsx`/`StoredReviews`, `useShipmentViews` and `customerView.ts` are deleted.
- **Operator mappers** (`domain/operators.ts`) output status updates + ETAs, not finished steps: the state machine runs across all legs in arrival order (duplicates, IGNORED, next-leg close), so the step labels can only be decided once every leg is mapped.
- **Customer rules moved into `mapShipments`** (by audience) instead of a post-pass; the golden assertions are unchanged.
- **Activity lives in the mock backend** (`recordActivity`), which stamps `by`/`at`. Changes invalidate every role's query. Unused leg fields (tracking/container number, vessel, voyage, last free day, pickup availability) are no longer read.
- **CONFLICT, data-model §5:** `StepView.sources[].ai` gains `reviewedBy` / `reviewedAt` (from `AiExtraction`) so the "reviewed by" line needs no session.

## 14. Adapters folder (2026-11-20)
- **`domain/adapters/`:** `domain/operators.ts` split into one file per wire format (`dhl.ts`, `dcsa.ts`, `terminal49.ts`, `email.ts`), plus `index.ts` with `mapLeg` (moved out of `mapShipment.ts`) and `shared.ts` (`Tag`, `Update`, `byTime`). `vocabularies.ts` sits next to the DHL adapter. Same logic and update ids; `operators.test.ts` → `adapters/adapters.test.ts`. Inside `domain/` so the domain keeps no dependency outside itself.
