import { describe, expect, it } from 'vitest'
import { applyEvent, applyToShipment, initialLegState, type LegEvent, type LegState } from './stateMachine'

const act = (tag: LegEvent['tag'], occurredAt: string): LegEvent => ({ tag, occurredAt, confidence: 'ACTUAL' })

function run(state: LegState, ...events: LegEvent[]): LegState {
  return events.reduce((s, e) => applyEvent(s, e).state, state)
}

describe('applyEvent (PRD §8.7)', () => {
  it('applied: equal or higher rank; within a rank the state goes back and forth', () => {
    let s = run(initialLegState('road'), act('PICKED_UP', '2026-11-20T08:00:00Z'))
    let r = applyEvent(s, act('ARRIVED_AT_HUB', '2026-11-20T12:00:00Z'))
    expect(r.result).toBe('applied')
    s = applyEvent(r.state, act('DEPARTED_HUB', '2026-11-20T14:00:00Z')).state
    r = applyEvent(s, act('ARRIVED_AT_HUB', '2026-11-21T09:00:00Z'))
    expect(r).toMatchObject({ result: 'applied', state: { status: 'ARRIVED_AT_HUB' } })
  })

  it('rejected: lower rank with a later date than the current state', () => {
    const s = run(initialLegState('sea'), act('VESSEL_DEPARTED', '2026-11-14T10:00:00Z'))
    const r = applyEvent(s, act('GATE_IN_ORIGIN', '2026-11-15T10:00:00Z'))
    expect(r).toMatchObject({ result: 'rejected', state: { status: 'VESSEL_DEPARTED' } })
  })

  it('history: lower rank, earlier date, milestone not seen; state unchanged', () => {
    const s = run(initialLegState('sea'), act('VESSEL_DEPARTED', '2026-11-14T10:00:00Z'))
    const r = applyEvent(s, act('GATE_IN_ORIGIN', '2026-11-12T10:00:00Z'))
    expect(r).toMatchObject({ result: 'history', state: { status: 'VESSEL_DEPARTED' } })
  })

  it('duplicate: same milestone and same instant', () => {
    const s = run(initialLegState('road'), act('PICKED_UP', '2026-11-20T09:00:00+01:00'))
    expect(applyEvent(s, act('PICKED_UP', '2026-11-20T08:00:00Z')).result).toBe('duplicate')
  })

  it('final state: other events are history, EMPTY_RETURNED is applied without changing status', () => {
    const s = run(initialLegState('sea'), act('GATE_OUT_DESTINATION', '2026-11-16T10:00:00Z'))
    expect(applyEvent(s, act('CUSTOMS_HOLD', '2026-11-17T10:00:00Z'))).toMatchObject({
      result: 'history',
      state: { status: 'GATE_OUT_DESTINATION' },
    })
    expect(applyEvent(s, act('EMPTY_RETURNED', '2026-11-18T10:00:00Z'))).toMatchObject({
      result: 'applied',
      state: { status: 'GATE_OUT_DESTINATION' },
    })
  })

  it('next-leg close: an ACT event of leg i+1 closes leg i, missing milestones stay unreported', () => {
    const road = run(initialLegState('road'), act('PICKED_UP', '2026-11-09T08:00:00Z'))
    const rankless = applyToShipment([road, initialLegState('sea')], 1, act('DELAYED', '2026-11-09T09:00:00Z'))
    expect(rankless.legs[0].closed).toBe(false)
    const r = applyToShipment([road, initialLegState('sea')], 1, act('GATE_IN_ORIGIN', '2026-11-10T08:00:00Z'))
    expect(r.result).toBe('applied')
    expect(r.currentLegIndex).toBe(1)
    expect(r.legs[0]).toMatchObject({ status: 'PICKED_UP', closed: true })
    expect(r.legs[1]).toMatchObject({ status: 'GATE_IN_ORIGIN', closed: false })
    expect(applyEvent(r.legs[0], act('DELIVERED', '2026-11-10T07:00:00Z')).result).toBe('history')
  })
})
