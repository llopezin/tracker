// DHL-shaped road JSON → status updates + ETAs. Tags come only from the operator vocabulary; anything else is NOT_MAPPED.
import type { DhlPlace, DhlShipment } from '../../api/contracts'
import type { EtaValue, Place } from '../types'
import { byTime, type Tag, type Update } from './shared'
import { VOCABULARIES } from './vocabularies'

const dhlPlace = (p?: DhlPlace): Place | undefined =>
  p?.address?.addressLocality ? { name: p.address.addressLocality, countryCode: p.address.countryCode } : undefined

export function mapDhl(raw: DhlShipment, operator: { id: string; name: string }, idPrefix: string) {
  const vocabulary = VOCABULARIES[operator.id]
  // The top-level `status` repeats the newest event, so only `events` are read.
  const events = [...(raw.events ?? [])].sort(byTime((e) => e.timestamp))

  const updates = events.map((ev, i): Update => {
    const text = ev.status ?? ''
    let tag: Tag | 'NOT_MAPPED' = vocabulary?.[text] ?? 'NOT_MAPPED'
    // Cross-check (data-model §3): a `delivered` statusCode must map to DELIVERED.
    if (ev.statusCode === 'delivered' && tag !== 'DELIVERED') tag = 'NOT_MAPPED'
    return {
      id: `${idPrefix}/${i}`,
      tag,
      occurredAt: ev.timestamp,
      confidence: 'ACTUAL',
      place: dhlPlace(ev.location),
      source: {
        type: 'operator_api',
        operatorName: operator.name,
        label: `Operator API · ${text || ev.statusCode}`,
        receivedAt: ev.timestamp,
        ...(tag === 'NOT_MAPPED' ? { rawText: text || ev.statusCode } : {}),
      },
      order: 'applied', // placeholder: the state machine sets the real order
    }
  })

  const etas: EtaValue[] = []
  const frame = raw.estimatedDeliveryTimeFrame
  const etaFrom = frame?.estimatedFrom ?? raw.estimatedTimeOfDelivery
  if (etaFrom) {
    etas.push({
      from: etaFrom,
      ...(frame?.estimatedFrom && frame.estimatedThrough ? { to: frame.estimatedThrough } : {}),
      source: {
        type: 'operator_api',
        operatorName: operator.name,
        label: frame?.estimatedFrom ? 'Operator API · estimatedDeliveryTimeFrame' : 'Operator API · estimatedTimeOfDelivery',
        receivedAt: raw.status?.timestamp ?? events.at(-1)?.timestamp ?? '',
      },
    })
  }

  return { updates, etas, agreedDeliveryDate: raw.agreedDeliveryDate }
}
