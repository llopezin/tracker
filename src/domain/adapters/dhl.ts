// DHL-shaped road JSON → status updates + ETAs. Tags come only from the operator vocabulary; anything else is NOT_MAPPED.
import type { DhlPlace, DhlShipment } from '../../api/contracts'
import type { EtaValue, Place, Source } from '../types'
import { byTime, type Tag, type Update } from './shared'
import { VOCABULARIES } from './vocabularies'

const dhlPlace = (p?: DhlPlace): Place | undefined =>
  p?.address?.addressLocality ? { name: p.address.addressLocality, countryCode: p.address.countryCode } : undefined

export function mapDhl(raw: DhlShipment, operator: { id: string; name: string }, idPrefix: string) {
  const vocabulary = VOCABULARIES[operator.id]
  const source = (label: string, receivedAt: string): Source =>
    ({ type: 'operator_api', operatorName: operator.name, label: `Operator API · ${label}`, receivedAt })
  // The top-level `status` repeats the newest event, so only `events` are read.
  const events = [...raw.events].sort(byTime((e) => e.timestamp))

  const updates = events.map((ev, i): Update => {
    let tag: Tag | 'NOT_MAPPED' = vocabulary?.[ev.status] ?? 'NOT_MAPPED'
    // Cross-check (data-model §3): a `delivered` statusCode must map to DELIVERED.
    if (ev.statusCode === 'delivered' && tag !== 'DELIVERED') tag = 'NOT_MAPPED'
    return {
      id: `${idPrefix}/${i}`,
      tag,
      occurredAt: ev.timestamp,
      confidence: 'ACTUAL',
      place: dhlPlace(ev.location),
      source: { ...source(ev.status, ev.timestamp), ...(tag === 'NOT_MAPPED' ? { rawText: ev.status } : {}) },
      order: 'applied', // placeholder: the state machine sets the real order
    }
  })

  const frame = raw.estimatedDeliveryTimeFrame
  const etas: EtaValue[] = frame ? [{
    from: frame.estimatedFrom,
    ...(frame.estimatedThrough ? { to: frame.estimatedThrough } : {}),
    source: source('estimatedDeliveryTimeFrame', raw.status?.timestamp ?? events.at(-1)?.timestamp ?? ''),
  }] : []

  return { updates, etas, agreedDeliveryDate: raw.agreedDeliveryDate }
}
