// Terminal49 container (port / customs) → status updates + the active customs hold.
import type { T49ContainerResponse } from '../../api/contracts'
import type { SeaTag } from '../types'
import { byTime, type Update } from './shared'

export function mapTerminal49(raw: T49ContainerResponse, operatorName: string, idPrefix: string) {
  const a = raw.data.attributes
  const customsHold = a.holds_at_pod_terminal.some((h) => h.name === 'customs' && h.status === 'hold')
  const checkedAt = a.terminal_checked_at
  const updates: Update[] = []

  // `at` is when it happened; holds / availability carry no timestamp, so they use terminal_checked_at.
  const add = (tag: SeaTag, at: string | null | undefined, field: string) => {
    if (!at) return
    updates.push({
      id: `${idPrefix}/${field}`,
      tag,
      occurredAt: at,
      confidence: 'ACTUAL',
      ...(a.location_at_pod_terminal ? { place: { name: a.location_at_pod_terminal } } : {}), // else the leg's POD
      source: { type: 'terminal_api', operatorName, label: `Terminal API · ${field}`, receivedAt: checkedAt },
      order: 'applied', // placeholder: the state machine sets the real order
    })
  }

  add('VESSEL_ARRIVED', a.pod_arrived_at, 'pod_arrived_at')
  add('DISCHARGED', a.pod_discharged_at, 'pod_discharged_at')
  if (customsHold) add('CUSTOMS_HOLD', checkedAt, 'customs hold')
  if (a.available_for_pickup) add('READY_FOR_PICKUP', checkedAt, 'available_for_pickup')
  add('GATE_OUT_DESTINATION', a.pod_full_out_at, 'pod_full_out_at')
  add('EMPTY_RETURNED', a.empty_terminated_at, 'empty_terminated_at')
  updates.sort(byTime((u) => u.occurredAt))

  return { updates, customsHold }
}
