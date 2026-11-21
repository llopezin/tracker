// Wire types the backend returns (today served by mock-api/ through api/client.ts).
// Raw provider shapes are copied from docs/api-responses.md (DHL, DCSA, Terminal49 only).
import type { RoadTag, SeaTag, ShipmentRecord } from '../domain/types'

// ── DHL Shipment Tracking Unified API ──
export type DhlStatusCode = 'pre-transit' | 'transit' | 'delivered' | 'failure' | 'unknown'

export interface DhlAddress {
  addressLocality?: string
  addressLocalityServicing?: string
  addressRegion?: string
  countryCode?: string
  postalCode?: string
  streetAddress?: string
  addressLine?: string
}

export interface DhlPlace {
  address?: DhlAddress
  servicePoint?: { url?: string; label?: string }
}

export interface DhlStatus {
  timestamp: string
  statusCode: DhlStatusCode
  location?: DhlPlace
  status?: string
  statusDetailed?: string
  description?: string
  remark?: string
  nextSteps?: string
}

export interface DhlEvent extends DhlStatus {
  pieceIds?: string[]
}

export interface DhlShipment {
  id?: string
  service?: string
  division?: string
  origin?: DhlPlace
  destination?: DhlPlace
  status?: DhlStatus
  pickUpDate?: string
  estimatedTimeOfDelivery?: string
  agreedDeliveryDate?: string
  estimatedDeliveryTimeFrame?: { estimatedFrom?: string; estimatedThrough?: string }
  estimatedTimeOfDeliveryRemark?: string
  events?: DhlEvent[]
}

// ── DCSA Track & Trace ──
export type DcsaClassifier = 'ACT' | 'PLN' | 'EST'

export interface DcsaEvent {
  eventTypeCode: string // transport / equipment / shipment code merged: DEPA, ARRI, GTIN, LOAD, DISC, GTOT, CONF, ...
  eventClassifierCode: DcsaClassifier
  eventDateTime: string // when it happened, or will happen (PLN / EST)
  eventCreatedDateTime: string // when the carrier sent it
  location: { locationName: string; UNLocationCode: string }
  delayReasonCode?: string // SMDG delay reason, e.g. "WEA"
}

export type DcsaEventsResponse = DcsaEvent[]

// ── Terminal49 container ──
export type T49ContainerStatus =
  | 'new' | 'on_ship' | 'available' | 'not_available' | 'grounded' | 'on_rail' | 'picked_up'
  | 'off_dock' | 'delivered' | 'dropped' | 'loaded' | 'empty_returned' | 'awaiting_inland_transfer'

export interface T49Hold {
  name: 'freight' | 'line' | 'customs' | 'USDA' | 'VACIS' | 'TMF' | 'other'
  status: 'pending' | 'hold'
  description?: string | null
}

export interface T49Fee {
  type: 'demurrage' | 'exam' | 'extended_dwell_time' | 'other' | 'total'
  amount: number
  currency_code?: string
}

export interface T49Container {
  id: string
  type: 'container'
  attributes: {
    number: string
    ref_numbers?: string[]
    current_status?: T49ContainerStatus
    availability_known?: boolean
    available_for_pickup?: boolean | null
    holds_at_pod_terminal?: T49Hold[]
    fees_at_pod_terminal?: T49Fee[]
    pickup_lfd?: string | null
    import_deadlines?: {
      pickup_lfd_line?: string | null
      pickup_lfd_terminal?: string | null
      pickup_lfd_rail?: string | null
    } | null
    pod_arrived_at?: string | null
    pod_discharged_at?: string | null
    pod_full_out_at?: string | null
    location_at_pod_terminal?: string | null
    ind_eta_at?: string | null
    empty_terminated_at?: string | null
    pod_timezone?: string | null
    terminal_checked_at?: string | null
  }
}

export interface T49ContainerResponse { data: T49Container }

// ── Email (synthetic, free text read by the AI mock) ──
export interface Email {
  id: string
  from: string
  operatorId: string
  receivedAt: string
  subject: string
  body: string
}

// ── Shipments as the backend stores them: record + raw payloads per leg ──
export type RawPayload =
  | { format: 'dhl'; data: DhlShipment }
  | { format: 'dcsa'; data: DcsaEventsResponse }
  | { format: 'terminal49'; data: T49ContainerResponse }

/** Raw responses and email ids received for record.legs[i], as operators sent them (before normalisation). */
export interface LegRawUpdates {
  raw: RawPayload[]
  emailIds: string[]
}

export interface ShipmentPayload {
  record: ShipmentRecord
  rawUpdates: LegRawUpdates[]
}

// ── Operator registry (status vocabularies live in domain/adapters/vocabularies.ts) ──
export type RawFormat = 'dhl' | 'dcsa' | 'terminal49' | 'email'

export interface Operator {
  id: string
  name: string
  role: 'road' | 'sea' | 'port' | 'customs'
  format: RawFormat
}

// ── AI reading of one email (PRD §9) ──
export interface AiReading {
  milestone: RoadTag | SeaTag | null
  at?: string
  location?: string
  eta?: string
  confidence: number
  quote: string
  readAs: string
}

// ── Shipments of a role, as one response ──
/** What ops did to the role's shipments (PRD §5), held by the backend. */
export interface Activity {
  aiReviews: Record<string, { review: 'accepted' | 'rejected'; by: string; at: string }> // by AI update id
  actionsDone: Record<string, { by: string; at: string; docKey?: string }> // by `${shipmentId}:${actionKey}`; docKey = uploaded document
  uploadedDocs: Record<string, { by: string; at: string }> // by `${shipmentId}:${documentKey}`
}

export type ActivityChange =
  | { type: 'review'; aiId: string; review: 'accepted' | 'rejected' }
  | { type: 'upload'; shipmentId: string; docKey: string }
  | { type: 'act'; shipmentId: string; actionKey: string; docKey?: string }

export interface ShipmentsResponse {
  shipments: ShipmentPayload[]
  emails: Email[]
  operators: Record<string, Operator>
  activity: Activity
}

// ── Demo identity (PRD §5); stands in for the logged-in user ──
export type Role = 'ops' | 'subsidiary' | 'customer'
export type Audience = 'ops' | 'customer'

export interface Persona {
  email: string
  audience: Audience
  /** Customer personas: the one account they may see. */
  accountId?: string
  /** Ops persona: the origin sites in its perimeter. */
  sites?: string[]
}
