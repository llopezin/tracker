// Copied from docs/data-model.md §2, §4, §5. Do not add fields here without updating data-model.md.

export type Mode = 'road' | 'sea'
export type Confidence = 'ACTUAL' | 'ESTIMATED' | 'PLANNED'

export interface Place {
  name: string
  unlocode?: string
  countryCode?: string
}

export interface Source {
  type: 'operator_api' | 'dcsa_feed' | 'terminal_api' | 'email'
  operatorName: string
  label: string
  receivedAt: string
  rawText?: string
}

export interface AiExtraction {
  rawQuote: string
  readAs: string
  modelConfidence: number
  review: 'pending' | 'accepted' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
}

export type OrderResult = 'applied' | 'history' | 'rejected' | 'duplicate'

export interface StatusUpdate<Tag extends string> {
  id: string
  tag: Tag | 'NOT_MAPPED'
  occurredAt: string
  confidence: Confidence
  place?: Place
  source: Source
  ai?: AiExtraction
  order: OrderResult
}

export interface EtaValue {
  from: string
  to?: string
  dateOnly?: boolean
  source: Source
}

export type RoadTag =
  | 'INFO_RECEIVED' | 'PICKED_UP' | 'IN_TRANSIT' | 'ARRIVED_AT_HUB' | 'DEPARTED_HUB'
  | 'BORDER_CROSSED' | 'CUSTOMS_IN_PROGRESS' | 'CUSTOMS_HOLD' | 'CUSTOMS_RELEASED'
  | 'DOCUMENTS_MISSING' | 'OUT_FOR_DELIVERY' | 'ARRIVED_AT_DELIVERY' | 'DELIVERED'
  | 'DELIVERY_FAILED' | 'READY_FOR_PICKUP' | 'BREAKDOWN' | 'DELAYED' | 'EXCEPTION' | 'CANCELLED'

export type SeaTag =
  | 'BOOKING_CONFIRMED' | 'EMPTY_DISPATCHED' | 'GATE_IN_ORIGIN' | 'LOADED_ON_VESSEL'
  | 'VESSEL_DEPARTED' | 'AT_SEA' | 'VESSEL_ARRIVED' | 'DISCHARGED' | 'CUSTOMS_HOLD'
  | 'CUSTOMS_RELEASED' | 'READY_FOR_PICKUP' | 'GATE_OUT_DESTINATION' | 'EMPTY_RETURNED'
  | 'DELAYED' | 'EXCEPTION' | 'CANCELLED'

export interface RoadLeg {
  mode: 'road'
  operatorName: string
  trackingNumber: string
  from: Place
  to: Place
  status: RoadTag
  updates: StatusUpdate<RoadTag>[]
  etaHistory: EtaValue[]
}

export interface SeaLeg {
  mode: 'sea'
  carrierName: string
  containerNumber: string
  vessel?: string
  voyage?: string
  pol: Place
  pod: Place
  status: SeaTag
  updates: StatusUpdate<SeaTag>[]
  etaHistory: EtaValue[]
  terminal?: {
    holds: { name: string; status: 'pending' | 'hold'; description?: string }[]
    availableForPickup?: boolean
    lastFreeDay?: string
  }
}

export type Leg = RoadLeg | SeaLeg

export interface Shipment {
  id: string
  record: ShipmentRecord
  legs: Leg[]
  currentLegIndex: number
  lastUpdateAt: string
}

// §4 Internal record
export interface ShipmentRecord {
  id: string
  description: string
  po: string
  customerAccount: string
  customerName: string
  originSite: Place
  destination: Place
  plannedDelivery: string
  legs: {
    mode: Mode
    operatorId: string
    from: Place
    to: Place
    plan: Partial<Record<RoadTag | SeaTag, string>>
  }[]
  documents: {
    key: string
    name: string
    status: 'ok' | 'flagged' | 'missing'
    note?: string
  }[]
}

// §5 View model
/** Shipment health: the single most important state for the glance (PRD §8.4, first match wins). `pre` = not departed, `ai` = AI read waiting for review. */
export type Health = 'ok' | 'delay' | 'risk' | 'ai' | 'stale' | 'pre'
export type IncidentType = 'customs_hold' | 'missing_document' | 'delay' | 'ai_pending' | 'stale' | 'unmapped'
export type ActionKind = 'upload_document' | 'notify_customer' | 'contact_operator'
export type StepLabel = 'ACT' | 'EST' | 'PLN' | 'NA' | 'AI' | 'UNKNOWN' | 'IGNORED'

export interface StepView {
  event: string
  location: string
  operator: string
  label: StepLabel
  date?: string
  previousDate?: string
  note?: string
  sources: {
    label: string
    operator: string
    receivedAt?: string // absent for internal-plan steps
    raw?: string
    ai?: { id: string; confidence: number; quote: string; readAs: string; review: 'pending' | 'accepted' | 'rejected'; reviewedBy?: string; reviewedAt?: string }
  }[]
}

export type EtaView =
  | { scope: 'delivery' | 'next_stop'; from: string; to?: string; dateOnly?: boolean; place?: string }
  | { scope: 'none' }

export interface ShipmentView {
  id: string
  description: string
  po: string
  customer: string
  origin: string
  destination: string
  operators: string
  status: string
  subStatus: string
  health: Health
  routeText: string
  stages: { kind: 'road' | 'sea' | 'port'; weight: number; progress: number; current: boolean }[]
  done: StepView[]
  next: StepView[]
  eta: EtaView
  plannedDelivery: string
  delta?: string
  aiAlternative?: { from: string; to?: string; confidence: number }
  lastEventAt: string
  stale: boolean
  staleThresholdHours: number
  tags: ('delayed' | 'incident' | 'customs' | 'stale')[]
  incidents: { type: IncidentType; summary: string }[]
  actions: {
    key: string
    kind: ActionKind
    text: string
    primary: boolean
    blockedBy?: string
    done?: { by: string; at: string }
  }[]
  documents: {
    key: string
    name: string
    status: 'ok' | 'flagged' | 'missing' | 'uploaded'
    note?: string
  }[]
  delivered: boolean
  deliveredAt?: string
}

// Customer notice line (PRD §8.6). Not in data-model.md: computed by rules.customerNotice.
export interface Notice {
  shipmentId: string
  kind: 'late' | 'overdue' | 'customs'
  days?: number       // for 'late'
  newEta?: string     // ISO, operator ETA or accepted AI date
  place?: string      // for 'customs'
  reason?: string     // already translated milestone label, e.g. "Vehicle breakdown"
}
