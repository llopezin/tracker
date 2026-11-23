// Golden test over the 7 fixtures, through the same path as the app: api client → mapShipments.
import { beforeAll, describe, expect, it } from 'vitest'
import type { Activity, Audience, ShipmentsResponse } from '../api/contracts'
import { fetchShipments, interpretText } from '../api/client'
import { initialAiReviews } from '../mock-server/fixtures/emails'
import { NOW } from './clock'
import { mapShipments, type ShipmentsData } from './mapShipment'
import { customerNotice } from './rules'
import type { ShipmentView } from './types'

const AI_24790 = 'ai:email-transpirineo-24790'
const BY = { by: 'ops@acme.com', at: NOW }
const initial: Activity = { aiReviews: initialAiReviews, actionsDone: {}, uploadedDocs: {} }

let data: ShipmentsData
beforeAll(async () => { // ops sees all 7
  const response: ShipmentsResponse = await fetchShipments('ops')
  const readings = await Promise.all(response.emails.map((e) => interpretText(e.body, 0)))
  data = { ...response, readings: Object.fromEntries(response.emails.map((e, i) => [e.id, readings[i]])) }
})

const views = (activity: Activity = initial, audience: Audience = 'ops') => mapShipments({ ...data, activity }, audience)
const view = (id: string, activity: Activity = initial, audience: Audience = 'ops'): ShipmentView =>
  views(activity, audience).find((v) => v.id === id)!
const actionsOf = (v: ShipmentView) => v.actions.map((a) => `${a.kind}${a.primary ? '*' : ''}${a.blockedBy ? `[${a.blockedBy}]` : ''}`)

type Row = {
  id: string; status: string; health: ShipmentView['health']; eta: ShipmentView['eta']; delta?: string
  stale: boolean; incidents: string[]; actions: string[]; tags: ShipmentView['tags']
}

const GOLDEN: Row[] = [
  { id: 'ACM-24812', status: 'tag.DEPARTED_HUB', health: 'ok', stale: false, tags: ['incident'],
    eta: { scope: 'delivery', from: '2026-11-23T12:00:00+01:00', to: '2026-11-23T16:00:00+01:00' },
    incidents: ['unmapped'], actions: ['contact_operator*'] },
  { id: 'ACM-24801', status: 'tag.NOT_DEPARTED', health: 'risk', stale: false, tags: ['incident'], eta: { scope: 'none' },
    incidents: ['missing_document'], actions: ['upload_document*', 'notify_customer'] },
  { id: 'ACM-24790', status: 'tag.IN_TRANSIT', health: 'ai', stale: false, tags: [],
    eta: { scope: 'delivery', from: '2026-11-23T15:00:00+01:00' },
    incidents: ['ai_pending'], actions: [`notify_customer*[${AI_24790}]`] },
  { id: 'ACM-24755', status: 'tag.AT_SEA', health: 'stale', stale: true, tags: ['stale'], eta: { scope: 'none' },
    incidents: ['stale'], actions: ['contact_operator*'] },
  { id: 'ACM-24817', status: 'tag.CUSTOMS_HOLD', health: 'delay', stale: false, delta: '+2 d', tags: ['customs', 'delayed', 'incident'],
    eta: { scope: 'none' },
    incidents: ['customs_hold', 'missing_document', 'delay'], actions: ['upload_document*', 'notify_customer', 'contact_operator'] },
  { id: 'ACM-24866', status: 'tag.AT_SEA', health: 'ok', stale: false, tags: [],
    eta: { scope: 'next_stop', from: '2026-12-05T08:00:00Z', place: 'Veracruz, Terminal Golfo' },
    incidents: [], actions: [] },
  { id: 'ACM-24844', status: 'tag.DELIVERED', health: 'ok', stale: false, tags: [], eta: { scope: 'none' },
    incidents: [], actions: [] },
]

describe('mapShipment golden', () => {
  it.each(GOLDEN)('$id', (row) => {
    const v = view(row.id)
    expect({
      id: v.id, status: v.status, health: v.health, eta: v.eta, delta: v.delta, stale: v.stale, tags: v.tags,
      incidents: v.incidents.map((i) => i.type), actions: actionsOf(v),
    }).toEqual(row)
  })

  it('every shown ETA has a next step with the same date string (EtaBlock lookup)', () => {
    for (const { eta, next } of views()) {
      if (eta.scope === 'none') continue
      const from = eta.from
      expect(next.some((s) => s.date === from && s.sources[0])).toBe(true)
    }
  })

  it('every done and next step shows at least one source', () => {
    for (const v of views()) {
      for (const s of [...v.done, ...v.next]) expect(s.sources.length, `${v.id} ${s.event}`).toBeGreaterThan(0)
    }
  })

  it('stale hours: 24755 is 88 h against 72 h', () => {
    expect(view('ACM-24755').incidents[0].summary).toBe('No update for 88 h (threshold 72 h)')
    expect(view('ACM-24866').staleThresholdHours).toBe(72)
  })

  it('exactly one UNKNOWN step (24812) and one pending AI (24790)', () => {
    const all = views()
    expect(all.flatMap((v) => v.done.filter((s) => s.label === 'UNKNOWN').map(() => v.id))).toEqual(['ACM-24812'])
    expect(all.filter((v) => v.incidents.some((i) => i.type === 'ai_pending')).map((v) => v.id)).toEqual(['ACM-24790'])
  })

  it('24817: duplicate arrival merges sources; port stage current; handover is not delivery', () => {
    const v = view('ACM-24817')
    expect(v.done.find((s) => s.event === 'Vessel arrived')?.sources.map((s) => s.label)).toEqual(['DCSA T&T · ARRI', 'Terminal API · pod_arrived_at'])
    expect(v.stages.map((s) => `${s.kind}:${s.progress}${s.current ? '*' : ''}`)).toEqual(['road:100', 'sea:100', 'port:50*', 'road:0'])
    expect(v.delivered).toBe(false)
    expect(customerNotice(v)).toMatchObject({ kind: 'customs', place: 'Veracruz, Terminal Golfo', reason: 'Held at customs' })
  })

  it('24790 pending: AI alternative, no notice, hidden from the customer', () => {
    const v = view('ACM-24790')
    expect(v.aiAlternative).toEqual({ from: '2026-11-24T12:00:00+01:00', confidence: 0.82 })
    expect(customerNotice(v)).toBeUndefined()
    const c = view('ACM-24790', initial, 'customer')
    expect(c.done.some((s) => s.label === 'AI' || s.sources.some((x) => x.ai))).toBe(false)
    expect(c).toMatchObject({ health: 'ok', actions: [], incidents: [] })
    expect(c).not.toHaveProperty('aiAlternative')
  })

  it('sort order: worst incident (blocking, attention, review, none), then delivery ETA, else next-stop ETA, else planned delivery', () => {
    expect(views().map((v) => v.id)).toEqual(
      ['ACM-24801', 'ACM-24817', 'ACM-24812', 'ACM-24755', 'ACM-24790', 'ACM-24844', 'ACM-24866'])
  })
})

describe('demo transitions', () => {
  it('accept the TransPirineo reading → ETA Tue 24, Mon 23 struck, +1 d, notice', () => {
    const accepted = { ...initial, aiReviews: { ...initial.aiReviews, [AI_24790]: { review: 'accepted' as const, ...BY } } }
    const v = view('ACM-24790', accepted)
    expect(v.eta).toEqual({ scope: 'delivery', from: '2026-11-24T12:00:00+01:00' })
    expect(v.next.at(-1)).toMatchObject({ label: 'EST', date: '2026-11-24T12:00:00+01:00', previousDate: '2026-11-23T15:00:00+01:00' })
    expect(v.next.find((s) => s.date === '2026-11-24T12:00:00+01:00')?.sources[0].label).toBe('Email · TransPirineo Logistics')
    expect({ health: v.health, delta: v.delta, ai: v.aiAlternative, actions: actionsOf(v) })
      .toEqual({ health: 'delay', delta: '+1 d', ai: undefined, actions: ['notify_customer*', 'contact_operator'] })
    expect(customerNotice(v)).toEqual({ shipmentId: 'ACM-24790', kind: 'late', days: 1, newEta: '2026-11-24T12:00:00+01:00', reason: 'Vehicle breakdown' })
    const step = view('ACM-24790', accepted, 'customer').done.find((s) => s.event === 'Vehicle breakdown')
    expect(step).toMatchObject({ label: 'ACT' })
    expect(step?.sources.some((s) => s.ai || s.raw)).toBe(false)
  })

  it('reject the TransPirineo reading → kept in ops history as rejected, nothing changes', () => {
    const rejected = { ...initial, aiReviews: { ...initial.aiReviews, [AI_24790]: { review: 'rejected' as const, ...BY } } }
    const v = view('ACM-24790', rejected)
    expect(v.done.find((s) => s.sources[0].ai)?.sources[0].ai?.review).toBe('rejected')
    expect({ health: v.health, eta: v.eta.scope, alt: v.aiAlternative, delta: v.delta }).toEqual({ health: 'ok', eta: 'delivery', alt: undefined, delta: undefined })
    expect(view('ACM-24790', rejected, 'customer').done.some((s) => s.event === 'Vehicle breakdown')).toBe(false)
  })

  it('24817: upload corrected invoice → uploaded, hold stays; notify → done', () => {
    const v = view('ACM-24817', { ...initial, uploadedDocs: { 'ACM-24817:invoice-corrected': BY }, actionsDone: { 'ACM-24817:notify_customer': BY } })
    expect(v.documents.find((d) => d.key === 'invoice-corrected')?.status).toBe('uploaded')
    expect(v.incidents.map((i) => i.type)).toEqual(['customs_hold', 'delay'])
    expect(v.actions.find((a) => a.kind === 'notify_customer')?.done).toEqual(BY)
    expect(v.eta.scope).toBe('none')
    const up = view('ACM-24817', { ...initial, uploadedDocs: { 'ACM-24817:invoice-corrected': BY }, actionsDone: { 'ACM-24817:upload_document': { ...BY, docKey: 'invoice-corrected' } } })
    expect(up.actions[0]).toMatchObject({ kind: 'upload_document', text: 'Upload Corrected commercial invoice for ACM-24817.', done: BY })
  })

  it('24801: upload DeCA resolves missing_document', () => {
    const v = view('ACM-24801', { ...initial, uploadedDocs: { 'ACM-24801:deca': BY }, actionsDone: { 'ACM-24801:upload_document': { ...BY, docKey: 'deca' } } })
    expect({ health: v.health, incidents: v.incidents, actions: v.actions }).toEqual({
      health: 'pre', incidents: [],
      actions: [{ key: 'upload_document', kind: 'upload_document', text: 'Upload DeCA for ACM-24801.', primary: true, done: BY }],
    })
  })
})
