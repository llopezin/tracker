// DCSA T&T events → status updates + ETAs. Tags come only from the fixed DCSA code table;
// any other code is NOT_MAPPED. ACT / EST / PLN all become updates with their confidence; only the state machine
// decides what ACT moves.
import type { DcsaClassifier, DcsaEventsResponse } from '../../api/contracts'
import type { Confidence, EtaValue, SeaTag, Source } from '../types'
import { byTime, type Update } from './shared'

const DCSA_CONFIDENCE: Record<DcsaClassifier, Confidence> = { ACT: 'ACTUAL', EST: 'ESTIMATED', PLN: 'PLANNED' }

// DCSA event code → tag (status-codes.md).
const DCSA_TAGS: Partial<Record<string, SeaTag>> = {
  CONF: 'BOOKING_CONFIRMED',
  GTIN: 'GATE_IN_ORIGIN',
  LOAD: 'LOADED_ON_VESSEL',
  DEPA: 'VESSEL_DEPARTED',
  ARRI: 'VESSEL_ARRIVED',
  DISC: 'DISCHARGED',
  GTOT: 'GATE_OUT_DESTINATION',
}

export function mapDcsa(raw: DcsaEventsResponse, operatorName: string, idPrefix: string) {
  const events = [...raw].sort(byTime((e) => e.eventDateTime))
  const updates: Update[] = []
  const etas: EtaValue[] = []

  events.forEach((ev, i) => {
    const code = ev.eventTypeCode
    const tag = DCSA_TAGS[code] ?? 'NOT_MAPPED'
    const source: Source = {
      type: 'dcsa_feed',
      operatorName,
      label: `DCSA T&T · ${code}`,
      receivedAt: ev.eventCreatedDateTime,
      ...(tag === 'NOT_MAPPED' ? { rawText: `${ev.eventClassifierCode} ${code}` } : {}),
    }
    const base = {
      occurredAt: ev.eventDateTime,
      confidence: DCSA_CONFIDENCE[ev.eventClassifierCode],
      place: { name: ev.transportCall.location.locationName, unlocode: ev.transportCall.UNLocationCode },
      source,
      order: 'applied' as const, // placeholder: the state machine sets the real order
    }
    updates.push({ id: `${idPrefix}/${i}`, tag, ...base })

    if (ev.delayReasonCode) {
      updates.push({ id: `${idPrefix}/${i}/delay`, tag: 'DELAYED', ...base,
        source: { ...source, label: `DCSA T&T · delayReasonCode ${ev.delayReasonCode}` } })
    }
    if (code === 'ARRI' && ev.eventClassifierCode === 'EST') {
      etas.push({ from: ev.eventDateTime, source: { ...source, label: 'DCSA T&T · EST ARRI' } })
    }
  })

  etas.sort(byTime((e) => e.source.receivedAt))
  return { updates, etas }
}
