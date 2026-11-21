// Operator adapters, one per wire format: each turns one raw payload of a leg into status updates and ETAs.
// mapShipments then orders the updates of every leg with the state machine.
import type { AiReading, ShipmentPayload, ShipmentsResponse } from '../../api/contracts'
import { initialLegState, type LegState } from '../stateMachine'
import type { EtaValue, ShipmentRecord } from '../types'
import { mapDcsa } from './dcsa'
import { mapDhl } from './dhl'
import { mapEmail } from './email'
import { byTime, type Update } from './shared'
import { mapTerminal49 } from './terminal49'

export type { Tag, Update } from './shared'

export interface Leg {
  rec: ShipmentRecord['legs'][number]
  operator: string
  updates: Update[]     // oldest first; `order` set by the state machine
  etas: EtaValue[]      // operator + accepted AI, by arrival
  aiEtas: { updateId: string; eta: EtaValue }[] // AI dates, pending or not
  agreedDeliveryDate?: string
  port?: { customsHold: boolean } // Terminal49 data for this sea leg
  state: LegState
}

type LegSources = Pick<ShipmentsResponse, 'operators' | 'emails'> & { readings: Record<string, AiReading> }

/** Runs every adapter of record.legs[i] and merges their output. */
export function mapLeg({ record, rawUpdates }: ShipmentPayload, i: number, data: LegSources): Leg {
  const rec = record.legs[i]
  const operator = data.operators[rec.operatorId]
  const prefix = `${record.id}/L${i}`
  const leg: Leg = { rec, operator: operator.name, updates: [], etas: [], aiEtas: [], state: initialLegState(rec.mode) }
  for (const p of rawUpdates[i].raw) {
    if (p.format === 'dhl') {
      const { updates, etas, agreedDeliveryDate } = mapDhl(p.data, operator, `${prefix}/dhl`)
      leg.updates.push(...updates)
      leg.etas.push(...etas)
      leg.agreedDeliveryDate = agreedDeliveryDate
    } else if (p.format === 'dcsa') {
      const { updates, etas } = mapDcsa(p.data, operator.name, `${prefix}/dcsa`)
      leg.updates.push(...updates)
      leg.etas.push(...etas)
    } else {
      const { updates, customsHold } = mapTerminal49(p.data, data.operators['terminal-golfo'].name, `${prefix}/t49`)
      leg.updates.push(...updates)
      leg.port = { customsHold }
    }
  }
  for (const id of rawUpdates[i].emailIds) {
    const email = data.emails.find((e) => e.id === id)!
    const { update, aiEta } = mapEmail(email, data.readings[id], data.operators[email.operatorId].name)
    leg.updates.push(update)
    if (aiEta) leg.aiEtas.push({ updateId: update.id, eta: aiEta })
  }
  leg.updates.sort(byTime((u) => u.occurredAt))
  return leg
}
