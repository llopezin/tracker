// Raw shipments + AI readings + ops activity → ShipmentView[] for the audience, in list order.
// Customers never get AI, UNKNOWN or IGNORED steps, rejected AI, aiAlternative or actions.
import type { Activity, AiReading, Audience, ShipmentPayload, ShipmentsResponse } from '../api/contracts'
import { t } from '../i18n/t'
import { NOW } from './clock'
import { mapLeg, type Leg, type Tag, type Update } from './adapters'
import * as rules from './rules'
import { applyToShipment, currentLegIndex } from './stateMachine'
import type { ShipmentView, StepView } from './types'

export interface ShipmentsData extends ShipmentsResponse {
  readings: Record<string, AiReading> // by email id
}

type Review = 'pending' | 'accepted' | 'rejected'

const FINAL: Record<'road' | 'sea', Tag> = { road: 'DELIVERED', sea: 'GATE_OUT_DESTINATION' }
const PRE_DEPARTURE = new Set<Tag>(['INFO_RECEIVED', 'BOOKING_CONFIRMED', 'EMPTY_DISPATCHED'])
const AT_PORT = new Set<Tag>(['VESSEL_ARRIVED', 'DISCHARGED', 'CUSTOMS_HOLD', 'CUSTOMS_RELEASED', 'READY_FOR_PICKUP', 'GATE_OUT_DESTINATION', 'EMPTY_RETURNED'])
const AT_ORIGIN = new Set<Tag>(['INFO_RECEIVED', 'PICKED_UP', 'BOOKING_CONFIRMED', 'EMPTY_DISPATCHED', 'GATE_IN_ORIGIN', 'LOADED_ON_VESSEL', 'VESSEL_DEPARTED'])
const HIDDEN_FROM_CUSTOMER = new Set<StepView['label']>(['AI', 'UNKNOWN', 'IGNORED'])

const OPTIONAL_DOC = 'cmr' // e-CMR fixture key
const tagKey = (tag: Tag | 'NOT_MAPPED' | 'NOT_DEPARTED') => `tag.${tag}` as const
const ms = Date.parse
const byReceived = <T extends { source: { receivedAt: string } }>(a: T, b: T) => ms(a.source.receivedAt) - ms(b.source.receivedAt)
const shortPlace = (name: string) => name.split(',')[0]

export function mapShipments(data: ShipmentsData, audience: Audience): ShipmentView[] {
  return rules.sortShipments(data.shipments.map((p) => mapShipment(p, data, audience)))
}

function mapShipment(payload: ShipmentPayload, data: ShipmentsData, audience: Audience): ShipmentView {
  const { record } = payload
  const { activity } = data
  const now = NOW
  const isOps = audience === 'ops'
  const review = (u: Update): Review | undefined => (u.ai ? (activity.aiReviews[u.id]?.review ?? u.ai.review) : undefined)
  const counts = (u: Update) => !u.ai || review(u) === 'accepted' // operator events + accepted AI

  // 1. Map each leg, then feed the state machine in arrival order (ties keep array order: Array.sort is stable).
  const legs = record.legs.map((_, i) => mapLeg(payload, i, data))
  const queue = legs.flatMap((leg, li) => leg.updates.map((u) => ({ u, li }))).sort((a, b) => byReceived(a.u, b.u))
  let states = legs.map((l) => l.state)
  for (const { u, li } of queue) {
    if (!counts(u)) continue // pending / rejected AI is shown, never applied
    const r = applyToShipment(states, li, u)
    states = r.legs
    u.order = r.result
  }
  legs.forEach((l, i) => {
    l.state = states[i]
    const accepted = l.aiEtas.filter((c) => activity.aiReviews[c.updateId]?.review === 'accepted').map((c) => c.eta)
    l.etas = [...l.etas, ...accepted].sort(byReceived)
  })
  const current = currentLegIndex(states)
  const all = legs.flatMap((l) => l.updates)
  const cur = legs[current]
  const last = legs[legs.length - 1]

  // 2. Shipment facts.
  const delivered = last.state.status === FINAL[last.rec.mode]
  const departed = legs.some((l) => l.state.status !== undefined && !PRE_DEPARTURE.has(l.state.status))
  const holdLeg = delivered ? undefined : legs.find((l) => l.port?.customsHold)
  const pendingAi = all.find((u) => u.ai && review(u) === 'pending' && u.tag !== 'NOT_MAPPED')
  const counted = all.filter(counts)
  // No counted update at all → `now` (never stale before an event exists).
  const lastEventAt = counted.reduce((m, u) => (ms(u.source.receivedAt) > ms(m) ? u.source.receivedAt : m), counted[0]?.source.receivedAt ?? now)
  const stale = rules.staleHours(lastEventAt, now, cur.rec.mode, !delivered && departed)

  const documents = record.documents.map((d) => (activity.uploadedDocs[`${record.id}:${d.key}`] ? { ...d, status: 'uploaded' as const } : d))
  // e-CMR is optional: it never raises an incident or an upload.
  const required = documents.filter((d) => d.key !== OPTIONAL_DOC)
  const missing = required.filter((d) => d.status === 'missing')

  const delay = rules.delay({
    etaVsCommitment: legs.filter((l) => !l.state.closed).flatMap((l) => {
      const latest = l.etas.at(-1)
      const commitment = commitmentOf(l)
      return latest && commitment ? [{ eta: latest.from, commitment }] : []
    }),
    actVsPlan: legs.flatMap((l) =>
      Object.entries(l.rec.plan).flatMap(([tag, plan]) => {
        const act = l.updates.find((u) => u.tag === tag && u.confidence === 'ACTUAL' && counts(u) && u.order !== 'rejected')
        return act && plan ? [{ at: act.occurredAt, plan }] : []
      }),
    ),
    plannedDelivery: record.plannedDelivery,
    delivered,
    operatorDelayed: all.some((u) => u.tag === 'DELAYED' && counts(u) && u.order === 'applied'),
    now,
  })

  // 3. Steps.
  const done = doneSteps(legs, review, activity)
  const reason = rules.noticeReason({ done })
  // Same condition as "ETA not available": the next steps then show no operator EST either.
  const blocked = delivered || !!holdLeg || !departed || stale.stale
  const next = delivered ? [] : nextSteps(legs.slice(current), blocked)

  const list = delivered
    ? []
    : rules.incidents({
        hold: holdLeg ? { place: holdLeg.rec.to.name } : undefined,
        missingDocuments: missing.map((d) => d.name),
        delay,
        aiPending: isOps && pendingAi !== undefined,
        stale,
        unmappedOperators: isOps ? all.filter((u) => u.tag === 'NOT_MAPPED').map((u) => u.source.operatorName) : [],
      })
  const uploadedKey = activity.actionsDone[`${record.id}:upload_document`]?.docKey
  const uploadDoc = documents.find((d) => uploadedKey && d.key === uploadedKey) ?? missing[0] ?? required.find((d) => d.status === 'flagged')

  const pendingEta = legs.flatMap((l) => l.aiEtas).find((c) => all.some((u) => u.id === c.updateId && review(u) === 'pending'))
  const pendingConfidence = all.find((u) => u.id === pendingEta?.updateId)?.ai?.modelConfidence

  const statusTag: Tag | 'NOT_DEPARTED' = delivered ? FINAL[last.rec.mode] : !departed ? 'NOT_DEPARTED'
    : cur.state.status === 'VESSEL_DEPARTED' ? 'AT_SEA' : (cur.state.status ?? 'NOT_DEPARTED')
  const statusLabel = t(tagKey(statusTag))
  const deliveredAt = delivered ? last.updates.find((u) => u.tag === FINAL[last.rec.mode] && u.order === 'applied')?.occurredAt : undefined

  return {
    id: record.id,
    description: record.description,
    po: record.po,
    customer: record.customerName,
    origin: record.originSite.name,
    destination: record.destination.name,
    status: tagKey(statusTag),
    subStatus: reason && reason !== statusLabel ? reason : '',
    health: rules.health({ delivered, stale: stale.stale, hold: !!holdLeg, delayed: delay.delayed, missingDocument: missing.length > 0, aiPending: isOps && !!pendingAi, departed }),
    stages: stages(legs, current, delivered),
    done: isOps ? done : forCustomer(done),
    next: isOps ? next : forCustomer(next),
    eta: rules.eta({
      delivery: last.etas.at(-1),
      nextStop: cur !== last && cur.etas.length ? { eta: cur.etas[cur.etas.length - 1], place: cur.rec.to.name } : undefined,
      blocked,
    }),
    plannedDelivery: record.plannedDelivery,
    ...(delivered || !delay.delta ? {} : { delta: delay.delta }),
    ...(isOps && pendingEta && pendingConfidence !== undefined
      ? { aiAlternative: { from: pendingEta.eta.from, ...(pendingEta.eta.to ? { to: pendingEta.eta.to } : {}), confidence: pendingConfidence } }
      : {}),
    lastEventAt,
    stale: stale.stale,
    staleThresholdHours: stale.threshold,
    tags: rules.tags(list),
    incidents: list,
    actions: !isOps ? [] : rules.actions(list, {
      id: record.id,
      customer: record.customerName,
      operator: cur.operator,
      reason: reason ?? (pendingAi && pendingAi.tag !== 'NOT_MAPPED' ? t(tagKey(pendingAi.tag)) : list[0]?.summary ?? ''),
      uploadDocument: uploadDoc?.name,
      pendingAiId: pendingAi?.id,
      done: (key) => {
        const d = activity.actionsDone[`${record.id}:${key}`]
        return d && { by: d.by, at: d.at }
      },
    }),
    documents: isOps ? documents : [],
    delivered,
    ...(deliveredAt ? { deliveredAt } : {}),
  }
}

/** Customer steps: no AI, UNKNOWN or IGNORED; no rejected AI source; provider name only ("Operator API · pod_arrived_at" → "Operator API"). */
const forCustomer = (steps: StepView[]): StepView[] =>
  steps.filter((s) => !HIDDEN_FROM_CUSTOMER.has(s.label)).map((s) => ({
    ...s,
    sources: s.sources.filter((x) => x.ai?.review !== 'rejected').map(({ label, operator, receivedAt }) => ({
      label: label.split(' · ')[0],
      operator,
      ...(receivedAt ? { receivedAt } : {}),
    })),
  }))

/** Road: DHL agreedDeliveryDate, else plan DELIVERED. Sea: DCSA PLN of the arrival, else plan VESSEL_ARRIVED. */
function commitmentOf(l: Leg): string | undefined {
  if (l.rec.mode === 'road') return l.agreedDeliveryDate ?? l.rec.plan.DELIVERED
  const pln = l.updates.filter((u) => u.tag === 'VESSEL_ARRIVED' && u.confidence === 'PLANNED').sort(byReceived).at(-1)
  return pln?.occurredAt ?? l.rec.plan.VESSEL_ARRIVED
}

/** ACT updates (operator, AI, NOT_MAPPED) as steps, oldest first. A `duplicate` becomes a second source. */
function doneSteps(legs: Leg[], review: (u: Update) => Review | undefined, activity: Activity): StepView[] {
  const steps: { at: number; tag: Update['tag']; step: StepView }[] = []
  for (const l of legs) {
    for (const u of l.updates) {
      if (u.confidence !== 'ACTUAL') continue
      const r = review(u)
      const source: StepView['sources'][number] = {
        label: u.source.label,
        operator: u.source.operatorName,
        receivedAt: u.source.receivedAt,
        ...(u.source.rawText ? { raw: u.source.rawText } : {}),
        ...(u.ai && r ? { ai: { id: u.id, confidence: u.ai.modelConfidence, quote: u.ai.rawQuote, readAs: u.ai.readAs, review: r,
          ...(activity.aiReviews[u.id] ? { reviewedBy: activity.aiReviews[u.id].by, reviewedAt: activity.aiReviews[u.id].at } : {}) } } : {}),
      }
      const at = Date.parse(u.occurredAt)
      if (u.order === 'duplicate' && (!u.ai || r === 'accepted')) {
        const same = steps.find((s) => s.tag === u.tag && s.at === at)
        if (same) { same.step.sources.push(source); continue }
      }
      const label: StepView['label'] = u.tag === 'NOT_MAPPED' ? 'UNKNOWN'
        : u.ai && r !== 'accepted' ? 'AI'
        : u.order === 'rejected' ? 'IGNORED'
        : 'ACT'
      const delayCode = u.tag === 'DELAYED' ? u.source.label.split('delayReasonCode ')[1] : undefined
      steps.push({
        at,
        tag: u.tag,
        step: {
          event: t(tagKey(u.tag)),
          location: u.place?.name ?? l.rec.to.name,
          operator: u.source.operatorName,
          label,
          date: u.occurredAt,
          ...(delayCode ? { note: delayCode } : {}),
          sources: [source],
        },
      })
    }
  }
  return steps.sort((a, b) => a.at - b.at).map((s) => s.step)
}

/** Remaining plan milestones (plus the leg's ETA milestone): operator EST (unless `blocked`), else PLN date, else NA. */
function nextSteps(legs: Leg[], blocked: boolean): StepView[] {
  const plan = { label: t('source.plan.label'), operator: t('source.plan.operator') }
  return legs.flatMap((l) => {
    if (l.state.closed) return []
    const etaTag: Tag = l.rec.mode === 'road' ? 'DELIVERED' : 'VESSEL_ARRIVED'
    const planned = Object.entries(l.rec.plan) as [Tag, string | undefined][]
    if (l.etas.length && !planned.some(([tag]) => tag === etaTag)) planned.push([etaTag, undefined])
    return planned
      .filter(([tag]) => !l.state.seen.some((s) => s.tag === tag))
      .sort(([, a], [, b]) => (a && b ? Date.parse(a) - Date.parse(b) : a ? -1 : 1))
      .map(([tag, planDate]): StepView => {
        const base = { event: t(tagKey(tag)), location: AT_ORIGIN.has(tag) ? l.rec.from.name : l.rec.to.name, operator: l.operator }
        const latest = tag === etaTag && !blocked ? l.etas.at(-1) : undefined
        if (latest) {
          const previous = l.etas.at(-2)
          return {
            ...base,
            label: 'EST',
            date: latest.from,
            ...(previous && previous.from !== latest.from ? { previousDate: previous.from } : {}),
            sources: [{ label: latest.source.label, operator: latest.source.operatorName, receivedAt: latest.source.receivedAt }],
          }
        }
        return planDate ? { ...base, label: 'PLN', date: planDate, sources: [plan] } : { ...base, label: 'NA', sources: [plan] }
      })
  })
}

/** One stage per leg, plus `port` after a sea leg with Terminal49 data. */
function stages(legs: Leg[], current: number, delivered: boolean): ShipmentView['stages'] {
  return legs.flatMap((l, i): ShipmentView['stages'] => {
    const status = l.state.status
    const passed = i < current || delivered || l.state.closed
    const isCurrent = i === current && !delivered
    const route = { from: shortPlace(l.rec.from.name), to: shortPlace(l.rec.to.name), operator: l.operator }
    if (l.rec.mode === 'road') {
      const progress = passed ? 100 : i > current || !status || PRE_DEPARTURE.has(status) ? 0 : 50
      return [{ kind: 'road' as const, weight: 1, progress, current: isCurrent, ...route }]
    }
    const arrived = passed || (status !== undefined && AT_PORT.has(status))
    const sea = { kind: 'sea' as const, weight: 3, progress: arrived ? 100 : i === current && status === 'VESSEL_DEPARTED' ? 50 : 0, current: isCurrent && !(arrived && l.port), ...route }
    if (!l.port) return [sea]
    const terminal = l.updates.find((u) => u.source.type === 'terminal_api')?.source.operatorName ?? l.operator
    const port = { kind: 'port' as const, weight: 1, progress: passed ? 100 : arrived ? 50 : 0, current: isCurrent && arrived, from: route.to, to: route.to, operator: terminal }
    return [sea, port]
  })
}
