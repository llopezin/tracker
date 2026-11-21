# Contracts between modules (frozen before parallel work)

## Ownership
- **A — data:** `src/api/**` (contracts + client), `src/mock-api/**` (fixtures, server, AI mock), `src/domain/adapters/**`.
- **B — state machine:** `src/domain/stateMachine.ts` (+ test).
- **C — UI:** `src/routes/**`, `src/components/**`, `src/data/**`, `ui.*` keys in `src/i18n/en.ts`.
- **D — rules:** `src/domain/rules.ts`, `src/domain/mapShipment.ts` (+ golden test).
- Shared, owned by orchestrator: `src/domain/types.ts`, `src/domain/clock.ts`, `src/i18n/t.ts`. Domain keys in `en.ts` are pre-seeded.

## Pipeline
```
shipmentsQuery(role).queryFn (data/shipments.ts)
  fetchShipments(role) → { shipments, emails, operators, activity }   // one call, already in the role's perimeter
  interpretText once per email (cached as ['emailReading', id])
  mapShipments({ ...response, readings }, audience) → ShipmentView[]   // pure, sorted per PRD §8.4
    per leg: mapDhl / mapDcsa / mapTerminal49 / mapEmail → status updates + ETAs
    state machine across legs → steps, ETA, rules (incidents, actions, health)
    customer audience: no AI/UNKNOWN/IGNORED steps, rejected AI, aiAlternative, actions
customerNotice(view) (rules.ts) → Notice | undefined                  // useNotices selector
```
- An AI update enters the state machine only if `activity.aiReviews[id].review === 'accepted'`.
- `Notice` is in `domain/types.ts`. Wire types (`ShipmentsResponse`, `Activity`, `ActivityChange`, raw payloads, `AiReading`, `Persona`) are in `api/contracts.ts`.
- Perimeter (PRD §5) is applied by the fake server: a role's call returns only its shipments and the emails / activity of those shipments. The frontend has no perimeter predicates.
- Import rules (enforced by oxlint): only `api/client.ts` imports `mock-api/**`; `domain/**` imports `api/contracts` type-only and never `api/client`; tests may import `mock-api/fixtures/**`.

## State (TanStack Query)
```ts
// data/shipments.ts
shipmentsQuery(role)                    // ['shipments', role], staleTime: Infinity; route loaders fetchQuery it (refetches once invalidated)
useShipments(role, select) / useShipment(role, id) / useNotices(role)
useRecordActivity(role) → (change: ActivityChange) => void   // backend stamps by/at, then invalidates ['shipments']
```

## i18n
- `t(key, params)` from `src/i18n/t.ts`. Keys: `tag.<TAG>`, `label.ops.<L>` / `label.customer.<L>`, `incident.<type>`, `action.<kind>`, `action.button.<kind>`, `notice.*`, `ui.*`.
- `ShipmentView.status` is an i18n key (`tag.X`). `StepView.event`, `subStatus`, `incidents[].summary`, `actions[].text` are already-translated strings (domain calls `t`).
- Dates in `ShipmentView` / `StepView` stay ISO. Components format them (Europe/Madrid, en-GB, e.g. "Mon 23 Nov · 14:00").
- Operator `readAs` / quotes are data, not UI text.
