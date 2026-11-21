import { describe, expect, it } from 'vitest'
import type { DcsaEventsResponse, DhlShipment, T49ContainerResponse } from '../../api/contracts'
import { interpretText } from '../../api/client'
import { EMAILS, initialAiReviews } from '../../mock-api/fixtures/emails'
import { OPERATORS } from '../../mock-api/fixtures/operators'
import { SHIPMENTS } from '../../mock-api/fixtures/shipments'
import { aiUpdateId, mapEmail } from './email'
import { mapDcsa } from './dcsa'
import { mapDhl } from './dhl'
import { mapTerminal49 } from './terminal49'

describe('mapDhl', () => {
  const raw24812 = SHIPMENTS[0].rawUpdates[0].raw[0].data as DhlShipment
  const r = mapDhl(raw24812, OPERATORS.galicar, 'X')

  it('maps events through the operator vocabulary, oldest first', () => {
    expect(r.updates.map((u) => u.tag)).toEqual(['PICKED_UP', 'NOT_MAPPED', 'DEPARTED_HUB'])
    expect(r.updates[0].confidence).toBe('ACTUAL')
    expect(r.updates[0].place?.name).toBe('Zaragoza')
  })

  it('keeps unknown status text as NOT_MAPPED with the raw text', () => {
    expect(r.updates[1].source.rawText).toBe('Linehaul manifest closed')
  })

  it('takes the ETA window and the agreed date from the operator', () => {
    expect(r.etas).toHaveLength(1)
    expect(r.etas[0].from).toBe('2026-11-23T12:00:00+01:00')
    expect(r.etas[0].to).toBe('2026-11-23T16:00:00+01:00')
    expect(r.agreedDeliveryDate).toBe('2026-11-23T18:00:00+01:00')
  })

  it('maps Spanish vocabulary and produces no ETA when the operator gives none', () => {
    const m = mapDhl(SHIPMENTS[1].rawUpdates[0].raw[0].data as DhlShipment, OPERATORS.moncayo, 'Y')
    expect(m.updates.map((u) => u.tag)).toEqual(['INFO_RECEIVED'])
    expect(m.etas).toEqual([])
  })
})

describe('mapDcsa', () => {
  const VER = { UNLocationCode: 'MXVER', location: { locationName: 'Veracruz' } }
  const VLC = { UNLocationCode: 'ESVLC', location: { locationName: 'Valencia' } }
  const raw: DcsaEventsResponse = [
    { eventID: 'e1', eventType: 'TRANSPORT', eventTypeCode: 'ARRI', eventClassifierCode: 'EST', eventDateTime: '2026-12-05T08:00:00Z', eventCreatedDateTime: '2026-11-22T05:30:00Z', transportCall: VER },
    { eventID: 'e2', eventType: 'TRANSPORT', eventTypeCode: 'DEPA', eventClassifierCode: 'ACT', eventDateTime: '2026-11-13T19:40:00Z', eventCreatedDateTime: '2026-11-13T19:40:00Z', transportCall: VLC },
    { eventID: 'e3', eventType: 'EQUIPMENT', eventTypeCode: 'GTIN', eventClassifierCode: 'ACT', eventDateTime: '2026-11-11T10:00:00Z', eventCreatedDateTime: '2026-11-11T10:00:00Z', transportCall: VLC },
    { eventID: 'e4', eventType: 'EQUIPMENT', eventTypeCode: 'INSP', eventClassifierCode: 'ACT', eventDateTime: '2026-11-12T10:00:00Z', eventCreatedDateTime: '2026-11-12T10:00:00Z', transportCall: VLC },
  ]
  const r = mapDcsa(raw, 'Nordhaven Lines', 'X')

  it('maps codes to sea tags with their classifier, oldest first', () => {
    expect(r.updates.map((u) => [u.tag, u.confidence])).toEqual([
      ['GATE_IN_ORIGIN', 'ACTUAL'], ['NOT_MAPPED', 'ACTUAL'], ['VESSEL_DEPARTED', 'ACTUAL'], ['VESSEL_ARRIVED', 'ESTIMATED'],
    ])
    expect(r.updates[2].source.label).toBe('DCSA T&T · DEPA')
    expect(r.updates[2].place).toEqual({ name: 'Valencia', unlocode: 'ESVLC' })
  })

  it('keeps a code without a tag as NOT_MAPPED with the raw code', () => {
    expect(r.updates[1].source.rawText).toBe('ACT INSP')
  })

  it('adds a DELAYED update when the carrier sends a delay reason', () => {
    const d = mapDcsa([{ ...raw[1], delayReasonCode: 'WEA' }], 'Nordhaven Lines', 'X')
    expect(d.updates.map((u) => [u.tag, u.source.label])).toEqual([
      ['VESSEL_DEPARTED', 'DCSA T&T · DEPA'], ['DELAYED', 'DCSA T&T · delayReasonCode WEA'],
    ])
  })

  it('turns EST ARRI into an ETA to the port', () => {
    expect(r.etas).toEqual([expect.objectContaining({ from: '2026-12-05T08:00:00Z' })])
    expect(r.etas[0].source.receivedAt).toBe('2026-11-22T05:30:00Z')
  })
})

describe('mapTerminal49', () => {
  const raw = SHIPMENTS[4].rawUpdates[1].raw.find((p) => p.format === 'terminal49')!.data as T49ContainerResponse
  const r = mapTerminal49(raw, 'Terminal Golfo', 'X')

  it('maps arrival, discharge and the active customs hold', () => {
    expect(r.updates.map((u) => u.tag)).toEqual(['VESSEL_ARRIVED', 'DISCHARGED', 'CUSTOMS_HOLD'])
    expect(r.updates.every((u) => u.source.type === 'terminal_api')).toBe(true)
  })

  it('reports the active customs hold', () => {
    expect(r.customsHold).toBe(true)
  })

  it('does not report ready for pickup or a hold when the hold is only pending', () => {
    const pending: T49ContainerResponse = { data: { ...raw.data, attributes: { ...raw.data.attributes,
      available_for_pickup: true, holds_at_pod_terminal: [{ name: 'customs', status: 'pending' }] } } }
    const p = mapTerminal49(pending, 'Terminal Golfo', 'X')
    expect(p.updates.map((u) => u.tag)).toEqual(['VESSEL_ARRIVED', 'DISCHARGED', 'READY_FOR_PICKUP'])
  })
})

describe('mapEmail', () => {
  const breakdown = EMAILS.find((e) => e.id === 'email-transpirineo-24790')!

  it('turns a confident reading into a pending AI update with the email as source', async () => {
    const r = mapEmail(breakdown, await interpretText(breakdown.body, 0), 'TransPirineo Logistics')
    expect(r.update.tag).toBe('BREAKDOWN')
    expect(r.update.ai).toMatchObject({ modelConfidence: 0.82, review: 'pending' })
    expect(r.update.source).toMatchObject({ type: 'email', rawText: breakdown.body })
    expect(r.aiEta).toEqual(expect.objectContaining({ from: '2026-11-24T12:00:00+01:00' }))
  })

  it('confidence below 0.7 → NOT_MAPPED, no AI review, no ETA', () => {
    const r = mapEmail(breakdown, { milestone: 'BREAKDOWN', eta: '2026-11-24', confidence: 0.69, quote: 'q', readAs: 'r' }, 'T')
    expect(r.update.tag).toBe('NOT_MAPPED')
    expect(r.update.ai).toBeUndefined()
    expect(r.aiEta).toBeUndefined()
  })

  it('unknown text → milestone null → NOT_MAPPED', async () => {
    const r = mapEmail({ ...breakdown, body: 'Hello' }, await interpretText('Hello', 0), 'T')
    expect(r.update.tag).toBe('NOT_MAPPED')
  })

  it('seeds the Aduanas Golfo reading as accepted under its update id', () => {
    expect(Object.keys(initialAiReviews)).toEqual([aiUpdateId('email-aduanas-24817')])
  })
})
