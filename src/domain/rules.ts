// Deterministic rules. Pure: no AI, no `new Date()`; `now` is always passed in.
import { t } from '../i18n/t'
import type { ActionKind, EtaValue, EtaView, IncidentType, Mode, Notice, ShipmentView, Health } from './types'

type Incident = ShipmentView['incidents'][number]
type Action = ShipmentView['actions'][number]

const hoursBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 3_600_000

const madridDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })

/** Calendar days from `a` to `b` in Europe/Madrid. */
export function calendarDays(a: string, b: string): number {
  const day = (iso: string) => Date.parse(`${madridDay.format(Date.parse(iso))}T00:00:00Z`)
  return Math.round((day(b) - day(a)) / 86_400_000)
}

// ── ETA ──

export interface EtaInput {
  delivery?: EtaValue          // latest ETA of the last leg (consignee)
  nextStop?: { eta: EtaValue; place: string } // latest ETA of the current leg when it isn't the last one
  blocked: boolean             // delivered, active hold, not departed or stale
}

export function eta({ delivery, nextStop, blocked }: EtaInput): EtaView {
  const pick = (e: EtaValue) => ({ from: e.from, ...(e.to ? { to: e.to } : {}), ...(e.dateOnly ? { dateOnly: true } : {}) })
  if (blocked) return { scope: 'none' }
  if (delivery) return { scope: 'delivery', ...pick(delivery) }
  if (nextStop) return { scope: 'next_stop', ...pick(nextStop.eta), place: nextStop.place }
  return { scope: 'none' }
}

// ── Delay ──

export interface DelayInput {
  etaVsCommitment: { eta: string; commitment: string }[] // latest operator ETA per open leg vs its commitment
  actVsPlan: { at: string; plan: string }[]               // ACT milestones that have a plan date
  plannedDelivery: string
  delivered: boolean
  operatorDelayed: boolean                                // DCSA delayReasonCode (DELAYED step)
  now: string
}

export interface Delay { delayed: boolean; days?: number; overdue: boolean; delta?: string }

/** Same-day slips are not counted: "+N d" needs N ≥ 1 calendar day. */
export function delay(i: DelayInput): Delay {
  const days = [
    ...i.etaVsCommitment.map((x) => calendarDays(x.commitment, x.eta)),
    ...i.actVsPlan.map((x) => calendarDays(x.plan, x.at)),
  ].filter((d) => d >= 1)
  const overdue = !i.delivered && Date.parse(i.now) > Date.parse(i.plannedDelivery)
  const max = days.length ? Math.max(...days) : undefined
  const delta = overdue ? t('notice.overdue') : max !== undefined ? t('notice.delta', { days: max }) : undefined
  return { delayed: overdue || max !== undefined || i.operatorDelayed, days: max, overdue, delta }
}

// ── Stale ──

export const STALE_HOURS: Record<Mode, number> = { road: 24, sea: 72 }

export function staleHours(lastEventAt: string, now: string, mode: Mode, applies: boolean) {
  const hours = Math.floor(hoursBetween(lastEventAt, now))
  return { stale: applies && hours > STALE_HOURS[mode], hours, threshold: STALE_HOURS[mode] }
}

// ── Health and order ──

export interface HealthInput { stale: boolean; hold: boolean; delayed: boolean; missingDocument: boolean; aiPending: boolean; departed: boolean }

/** First match wins. Delivered shipments go to their own section; their health is 'ok'. */
export function health(x: HealthInput & { delivered: boolean }): Health {
  if (x.delivered) return 'ok'
  if (x.stale) return 'stale'
  if (x.hold || x.delayed) return 'delay'
  if (x.missingDocument) return 'risk'
  if (x.aiPending) return 'ai'
  if (!x.departed) return 'pre'
  return 'ok'
}

/** Delivery ETA, else next-stop ETA, else planned delivery (ties by id). */
/** 0 blocking, 1 attention, 2 review. */
export const incidentRank: Record<IncidentType, 0 | 1 | 2> = {
  customs_hold: 0,
  missing_document: 0,
  delay: 1,
  stale: 1,
  unmapped: 1,
  ai_pending: 2,
}

/** Worst incident first (3 without incidents). */
export const severityRank = (incidents: { type: IncidentType }[]) => Math.min(3, ...incidents.map((i) => incidentRank[i.type]))

export function sortShipments(views: ShipmentView[]): ShipmentView[] {
  const key = (v: ShipmentView) => Date.parse(v.eta.scope === 'none' ? v.plannedDelivery : v.eta.from)
  return [...views].sort((a, b) => severityRank(a.incidents) - severityRank(b.incidents) || key(a) - key(b) || a.id.localeCompare(b.id))
}

// ── Incidents, actions, tags ──

export interface IncidentInput {
  hold?: { place: string }
  missingDocuments: string[]   // names
  delay: Delay
  aiPending: boolean
  stale: { stale: boolean; hours: number; threshold: number }
  unmappedOperators: string[]
}

export function incidents(i: IncidentInput): Incident[] {
  const out: Incident[] = []
  if (i.hold) out.push({ type: 'customs_hold', summary: t('incident.customs_hold', { place: i.hold.place }) })
  for (const document of i.missingDocuments) out.push({ type: 'missing_document', summary: t('incident.missing_document', { document }) })
  if (i.delay.delayed) out.push({ type: 'delay', summary: t('incident.delay', { delta: i.delay.delta ?? '' }).trim() })
  if (i.aiPending) out.push({ type: 'ai_pending', summary: t('incident.ai_pending') })
  if (i.stale.stale) out.push({ type: 'stale', summary: t('incident.stale', { hours: i.stale.hours, threshold: i.stale.threshold }) })
  for (const operator of new Set(i.unmappedOperators)) out.push({ type: 'unmapped', summary: t('incident.unmapped', { operator }) })
  return out
}

const ACTIONS: Record<IncidentType, ActionKind[]> = {
  customs_hold: ['upload_document', 'notify_customer', 'contact_operator'],
  missing_document: ['upload_document', 'notify_customer'],
  delay: ['notify_customer', 'contact_operator'],
  ai_pending: ['notify_customer'],
  stale: ['contact_operator'],
  unmapped: ['contact_operator'],
}

export interface ActionInput {
  id: string
  customer: string
  operator: string
  reason: string
  uploadDocument?: string      // uploaded document if done, else first missing, else first flagged document name
  pendingAiId?: string         // blocks notify_customer
  done: (key: string) => { by: string; at: string } | undefined
}

/** Actions in incident order, one per kind; the first is primary. Upload needs a flagged/missing document. */
export function actions(list: Incident[], a: ActionInput): Action[] {
  // A done action stays listed (with "Done by …") even after its incident is resolved.
  const doneKinds = (['upload_document', 'notify_customer', 'contact_operator'] as const).filter((k) => a.done(k))
  const required = [...list.flatMap((i) => ACTIONS[i.type]), ...doneKinds]
  const kinds = [...new Set(required)].filter((k) => k !== 'upload_document' || a.uploadDocument)
  const text: Record<ActionKind, string> = {
    upload_document: t('action.upload_document', { document: a.uploadDocument ?? '', id: a.id }),
    notify_customer: t('action.notify_customer', { customer: a.customer, id: a.id, reason: a.reason }),
    contact_operator: t('action.contact_operator', { operator: a.operator, id: a.id }),
  }
  return kinds.map((kind, i) => {
    const done = a.done(kind)
    return {
      key: kind,
      kind,
      text: text[kind],
      primary: i === 0,
      ...(kind === 'notify_customer' && a.pendingAiId ? { blockedBy: a.pendingAiId } : {}),
      ...(done ? { done } : {}),
    }
  })
}

const TAGS: Record<IncidentType, ShipmentView['tags']> = {
  customs_hold: ['customs', 'delayed'],
  missing_document: ['incident'],
  delay: ['delayed'],
  ai_pending: [],
  stale: ['stale'],
  unmapped: ['incident'],
}

export function tags(list: Incident[]): ShipmentView['tags'] {
  return [...new Set(list.flatMap((i) => TAGS[i.type]))]
}

// ── Customer notice ──

const REASON_EVENTS = [t('tag.BREAKDOWN'), t('tag.DELAYED'), t('tag.CUSTOMS_HOLD')]

/** Reason = label of the latest confirmed (operator or accepted AI) BREAKDOWN / DELAYED / CUSTOMS_HOLD step. */
export function noticeReason(view: Pick<ShipmentView, 'done'>): string | undefined {
  const step = view.done.filter((s) => s.label === 'ACT' && REASON_EVENTS.includes(s.event)).at(-1)
  if (!step) return undefined
  return step.event === t('tag.DELAYED') && step.note ? step.note : step.event
}

/** One banner line per affected shipment. Pending/rejected AI steps carry label 'AI', so 'ACT' keeps operator + accepted AI. */
export function customerNotice(view: ShipmentView): Notice | undefined {
  if (view.delivered) return undefined
  const types = new Set(view.incidents.map((i) => i.type))
  const reason = noticeReason(view)
  const base = { shipmentId: view.id, ...(reason ? { reason } : {}) }
  if (types.has('customs_hold')) {
    const place = view.done.filter((s) => s.label === 'ACT' && s.event === t('tag.CUSTOMS_HOLD')).at(-1)?.location
    return { ...base, kind: 'customs', ...(place ? { place } : {}) }
  }
  if (!types.has('delay')) return undefined
  const newEta = view.eta.scope === 'none' ? {} : { newEta: view.eta.from }
  if (view.delta === t('notice.overdue')) return { ...base, kind: 'overdue', ...newEta }
  const days = view.delta?.match(/\d+/)?.[0]
  return { ...base, kind: 'late', ...(days ? { days: Number(days) } : {}), ...newEta }
}
