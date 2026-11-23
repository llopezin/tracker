# Shipment tracking prototype

Clickable frontend prototype that gives one view of road and sea shipments. Ops works by exception; customers and the subsidiary see their own shipments. Frontend only: synthetic data, simulated AI, fixed clock (`NOW = 22 Nov 2026 10:40`, Europe/Madrid).

Stack: Vite + React + TypeScript + Tailwind + TanStack Router + Vitest.

```bash
pnpm install
pnpm dev     # http://localhost:5173
pnpm test    # Vitest: operator mappers, state machine, fake server perimeter, golden test over the 7 shipments
pnpm build   # typecheck + production build
pnpm lint    # oxlint
```

## Routes (no login; one demo persona each)

| Route | Role | Perimeter |
| --- | --- | --- |
| `/` | — | Links to the three views |
| `/ops` | Operations (ops@acme.com) | Shipments from Zaragoza Plant, Valencia Warehouse and Bilbao Plant |
| `/subsidiary` | Subsidiary (Acme México) | ACM-24817, ACM-24866 |
| `/customer` | End customer | ACM-24790 |

Session state (AI reviews, actions, uploads) is shared across routes and lost on reload. Switch roles with the "← Switch role" link at the top of each view; typing a URL reloads the page and resets the demo.

## Deploy (Vercel)

The repo root is the Vite project, so import it with the Vite preset; no Root Directory setting is needed. `vercel.json` rewrites every path to `index.html` so `/ops`, `/subsidiary` and `/customer` load directly.

## Layout

```
src/
  api/         contracts.ts (wire types) + client.ts (the app's only door to the backend; data calls take the role)
  mock-api/    fake backend behind the client: fixtures/ (incl. AI readings), server.ts (each role's perimeter + AI mock)
  domain/      operators.ts (+ vocabularies), stateMachine.ts, rules.ts, mapShipment.ts (pure TS)
  queries/      shipments.ts (TanStack Query: shipments query, selector hooks, activity mutation)
  i18n/        en.ts + t()
  routes/      /, /ops, /subsidiary, /customer
  components/  ui/ (design-system primitives), shipments/
```

Docs: `docs/PRD.md` (scope and rules), `docs/data-model.md`, `docs/writeup.md`.
