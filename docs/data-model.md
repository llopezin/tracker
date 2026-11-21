# Normalised data model

Single definition of data shapes. Scope, business rules and the state machine live in the PRD.
Inputs: `api-responses.md` · Code meanings: `status-codes.md`.

**Phase 1 adapters:** DHL Unified (road), DCSA T&T 2.2 (sea), Terminal49 (port/customs), free-text email (AI-read). Other formats (UPS, FedEx, AfterShip, Vizion, EDI 315, PDF) and transshipments are phase 2.

## 1. Input notes

- **Times:** everything is normalised to ISO 8601 with offset. If the source gives none, keep local time and mark the timezone unknown.
- **ETAs:** a single time, a window (`from`/`to`) or a date only. Road ETAs point at the consignee; sea ETAs point at a port or terminal.
- **Commitments** (to decide "delayed"): DHL `agreedDeliveryDate`, DCSA `PLN` of the same milestone; otherwise the internal plan (§4).
- **DHL:** `statusCode` is coarse. The tag comes from `events[].status` through a fixed vocabulary per operator; unknown text → `NOT_MAPPED`. Never refined by AI.
- **DCSA `SHIPMENT` events:** only `BKG` + `CONF` is mapped (`BOOKING_CONFIRMED`); the rest go to history.
- **DCSA `EST`/`PLN`:** never set status; they produce ETAs, commitments or planned steps.

## 2. Model

```ts
type Mode = 'road' | 'sea';
type Confidence = 'ACTUAL' | 'ESTIMATED' | 'PLANNED';

interface Place {
  name: string;                 // "Valencia, Muelle Sur Terminal"
  unlocode?: string;            // "ESVLC"
  countryCode?: string;         // ISO 3166-1 alpha-2
}

interface Source {
  type: 'operator_api' | 'dcsa_feed' | 'terminal_api' | 'email';
  operatorName: string;         // fictional operator
  label: string;                // chip text, e.g. "DCSA T&T · DEPA"
  receivedAt: string;           // ISO
  rawText?: string;             // original text; only for email and NOT_MAPPED
}

interface AiExtraction {
  rawQuote: string;             // sentence the reading is based on
  readAs: string;               // "Read as" summary
  modelConfidence: number;      // 0–1; < 0.7 → NOT_MAPPED
  review: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

interface StatusUpdate<Tag extends string> {
  id: string;
  tag: Tag | 'NOT_MAPPED';
  occurredAt: string;           // ISO; future if not ACTUAL
  confidence: Confidence;
  place?: Place;
  source: Source;
  ai?: AiExtraction;            // only for AI-read updates
  order: 'applied' | 'history' | 'rejected' | 'duplicate'; // PRD state machine result
}

interface EtaValue {
  from: string;                 // ISO
  to?: string;                  // end of window
  dateOnly?: boolean;
  source: Source;
}

type RoadTag =
  | 'INFO_RECEIVED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED_AT_HUB' | 'DEPARTED_HUB'
  | 'BORDER_CROSSED' | 'CUSTOMS_IN_PROGRESS' | 'CUSTOMS_HOLD' | 'CUSTOMS_RELEASED'
  | 'DOCUMENTS_MISSING' | 'OUT_FOR_DELIVERY' | 'ARRIVED_AT_DELIVERY' | 'DELIVERED'
  | 'DELIVERY_FAILED' | 'READY_FOR_PICKUP' | 'BREAKDOWN' | 'DELAYED' | 'EXCEPTION' | 'CANCELLED';

type SeaTag =
  | 'BOOKING_CONFIRMED' | 'EMPTY_DISPATCHED' | 'GATE_IN_ORIGIN' | 'LOADED_ON_VESSEL'
  | 'VESSEL_DEPARTED' | 'AT_SEA' | 'VESSEL_ARRIVED' | 'DISCHARGED' | 'CUSTOMS_HOLD'
  | 'CUSTOMS_RELEASED' | 'READY_FOR_PICKUP' | 'GATE_OUT_DESTINATION' | 'EMPTY_RETURNED'
  | 'DELAYED' | 'EXCEPTION' | 'CANCELLED';

interface RoadLeg {
  mode: 'road';
  operatorName: string;
  trackingNumber: string;
  from: Place;
  to: Place;
  status: RoadTag;
  updates: StatusUpdate<RoadTag>[];   // oldest first
  etaHistory: EtaValue[];             // every ETA received, oldest first
}

interface SeaLeg {
  mode: 'sea';
  carrierName: string;
  containerNumber: string;            // ISO 6346
  vessel?: string;
  voyage?: string;
  pol: Place;                         // port of loading
  pod: Place;                         // port of discharge
  status: SeaTag;
  updates: StatusUpdate<SeaTag>[];    // oldest first
  etaHistory: EtaValue[];
  terminal?: {                        // Terminal49; enables the "port" stage
    holds: { name: string; status: 'pending' | 'hold'; description?: string }[];
    availableForPickup?: boolean;
    lastFreeDay?: string;             // earliest of import_deadlines.*
  };
}

interface Shipment {
  id: string;                         // "ACM-24817"
  record: ShipmentRecord;             // §4
  legs: (RoadLeg | SeaLeg)[];
  currentLegIndex: number;
  lastUpdateAt: string;
}
```

## 3. Mapping (phase 1)

**Road — DHL-shaped operators:** `events[].status` → `RoadTag` through each operator's vocabulary in `data/operators.ts`. Cross-check: `statusCode = delivered` must be `DELIVERED`; `failure` → `DELIVERY_FAILED` or `EXCEPTION`. ETA from `estimatedDeliveryTimeFrame` (a window, or a single date).

**Sea:**

| Tag | DCSA | Terminal49 |
|---|---|---|
| `BOOKING_CONFIRMED` | `SHIPMENT` `BKG` + `CONF` | — |
| `GATE_IN_ORIGIN` | `GTIN` + `LADEN` @ POL | — |
| `LOADED_ON_VESSEL` | `LOAD` @ POL | — |
| `VESSEL_DEPARTED` | `DEPA` + `ACT` @ POL | — |
| `AT_SEA` | derived: after departure, before arrival | — |
| `VESSEL_ARRIVED` | `ARRI` + `ACT` @ POD | `pod_arrived_at` |
| `DISCHARGED` | `DISC` @ POD | `pod_discharged_at` |
| `CUSTOMS_HOLD` | — | hold `customs` + `status hold` |
| `CUSTOMS_RELEASED` | — | customs hold removed |
| `READY_FOR_PICKUP` | — | `available_for_pickup` and no active hold |
| `GATE_OUT_DESTINATION` | `GTOT` + `LADEN` @ POD | `pod_full_out_at` |
| `EMPTY_RETURNED` | `GTIN` + `EMPTY` | `empty_terminated_at` |
| `DELAYED` | `delayReasonCode` present | — |

**Email:** AI mock → `AiExtraction` + a tag of the leg's mode, or `NOT_MAPPED`.

## 4. Internal record (`data/shipments.ts`)

What the manufacturer knows; no provider sends it.

```ts
interface ShipmentRecord {
  id: string;                         // "ACM-24817"
  description: string;                // goods
  po: string;                         // customer's purchase order
  customerAccount: string;            // perimeter for /filial and /cliente
  customerName: string;               // shown in /ops
  originSite: Place;                  // perimeter for /ops
  destination: Place;
  plannedDelivery: string;            // ISO
  legs: {
    mode: Mode;
    operatorId: string;
    from: Place;
    to: Place;
    plan: Partial<Record<RoadTag | SeaTag, string>>; // planned date per milestone
  }[];
  documents: {
    key: string;
    name: string;                     // "DeCA", "Commercial invoice"
    status: 'ok' | 'flagged' | 'missing';
    note?: string;
  }[];
}
```

The "missing document" incident comes from `documents[].status = 'missing'`. Provider signals (`DOCUMENTS_MISSING`, a Terminal49 customs hold, an accepted customs email) are shown as steps only.

## 5. View model (what components read)

Built by `mapShipment` from `Shipment` + session.

```ts
interface ShipmentView {
  id: string;
  description: string;
  po: string;
  customer: string;                   // /ops only
  origin: string;
  destination: string;
  status: string;                     // i18n key from the current tag
  subStatus: string;                  // reason (place is already in the mode bar)
  tone: 'ok' | 'delay' | 'risk' | 'ai' | 'stale' | 'pre';
  stages: {
    kind: 'road' | 'sea' | 'port';    // port only with Terminal49 data
    weight: number;                   // relative width
    progress: number;                 // 0–100
    current: boolean;
    from: string;                     // short place name ("Valencia")
    to: string;                       // same as from for port
    operator: string;                 // port: the terminal operator
  }[];
  done: StepView[];                   // oldest first
  next: StepView[];                   // in order
  eta:
    | { scope: 'delivery' | 'next_stop'; from: string; to?: string; dateOnly?: boolean; place?: string }
    | { scope: 'none' };
  plannedDelivery: string;
  delta?: string;                     // "+1 d" or "Overdue"
  aiAlternative?: { from: string; to?: string; confidence: number }; // pending AI date, /ops only
  lastEventAt: string;                // UI shows "Updated 25 min ago"
  stale: boolean;
  staleThresholdHours: number;        // 24 road, 72 sea
  tags: ('delayed' | 'incident' | 'customs' | 'stale')[];
  incidents: {
    type: 'customs_hold' | 'missing_document' | 'delay' | 'ai_pending' | 'stale' | 'unmapped';
    summary: string;
  }[];
  actions: {                          // /ops only
    key: string;
    kind: 'upload_document' | 'notify_customer' | 'contact_operator';
    text: string;
    primary: boolean;
    blockedBy?: string;               // AI update id to accept first
    done?: { by: string; at: string };
  }[];
  documents: {
    key: string;
    name: string;
    status: 'ok' | 'flagged' | 'missing' | 'uploaded';
    note?: string;
  }[];
  delivered: boolean;
  deliveredAt?: string;
}

interface StepView {
  event: string;                      // i18n label of the tag
  location: string;
  operator: string;
  label: 'ACT' | 'EST' | 'PLN' | 'NA' | 'AI' | 'UNKNOWN' | 'IGNORED';
  date?: string;                      // empty if NA
  previousDate?: string;              // struck-through earlier date
  note?: string;
  sources: {
    label: string;
    operator: string;
    receivedAt: string;
    raw?: string;                     // email and UNKNOWN only
    ai?: { id: string; confidence: number; quote: string; readAs: string; review: 'pending' | 'accepted' | 'rejected' };
  }[];
}
```

**Labels:** `ACTUAL` → `ACT`, `ESTIMATED` → `EST`, `PLANNED` → `PLN`, planned without date → `NA`, pending AI → `AI`, `NOT_MAPPED` → `UNKNOWN`, `order = 'rejected'` → `IGNORED`.
**Customer view** never receives `AI`, `UNKNOWN`, `IGNORED`, rejected AI updates, `aiAlternative` or `actions`. Accepted AI updates reach it as normal steps, with no AI mark.