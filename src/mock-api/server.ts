// Fake backend. Every call is scoped to the role's perimeter (PRD §5) and answers with a copy after a small
// delay (0 under Vitest), so the frontend never holds an out-of-perimeter shipment. Activity lives in memory: lost on reload.
import type { Activity, ActivityChange, AiReading, Persona, Role, ShipmentsResponse } from '../api/contracts'
import { NOW } from '../domain/clock'
import { AI_READINGS, UNREADABLE } from './fixtures/aiReadings'
import { EMAILS, initialAiReviews } from './fixtures/emails'
import { OPERATORS } from './fixtures/operators'
import { PERSONAS } from './fixtures/personas'
import { SHIPMENTS } from './fixtures/shipments'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 100
const AI_LATENCY_MS = 400

async function reply<T>(data: T, delayMs = LATENCY_MS): Promise<T> {
  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  return structuredClone(data)
}

let activity: Activity = { aiReviews: initialAiReviews, actionsDone: {}, uploadedDocs: {} }

const pick = <T>(record: Record<string, T>, keep: (key: string) => boolean) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => keep(key)))

/** Ops sees its origin sites, customer roles their own account; plus the emails and activity of those shipments. */
export function getShipments(role: Role): Promise<ShipmentsResponse> {
  const { sites, accountId } = PERSONAS[role]
  const shipments = SHIPMENTS.filter(({ record }) => (sites ? sites.includes(record.originSite.name) : record.customerAccount === accountId))
  const ids = new Set(shipments.map((s) => s.record.id))
  const emailIds = new Set(shipments.flatMap((s) => s.rawUpdates.flatMap((l) => l.emailIds)))
  const ofShipment = (key: string) => ids.has(key.split(':')[0])
  return reply({
    shipments,
    emails: EMAILS.filter((e) => emailIds.has(e.id)),
    operators: OPERATORS,
    activity: {
      aiReviews: pick(activity.aiReviews, (key) => emailIds.has(key.slice('ai:'.length))), // key = `ai:<emailId>`
      actionsDone: pick(activity.actionsDone, ofShipment),
      uploadedDocs: pick(activity.uploadedDocs, ofShipment),
    },
  })
}

/** Records what the role's user did; the backend stamps who and when. */
export function recordActivity(role: Role, change: ActivityChange): Promise<void> {
  const done = { by: PERSONAS[role].email, at: NOW }
  if (change.type === 'review') activity = { ...activity, aiReviews: { ...activity.aiReviews, [change.aiId]: { review: change.review, ...done } } }
  if (change.type === 'upload') activity = { ...activity, uploadedDocs: { ...activity.uploadedDocs, [`${change.shipmentId}:${change.docKey}`]: done } }
  if (change.type === 'act') {
    const entry = { ...done, ...(change.docKey ? { docKey: change.docKey } : {}) }
    activity = { ...activity, actionsDone: { ...activity.actionsDone, [`${change.shipmentId}:${change.actionKey}`]: entry } }
  }
  return reply(undefined)
}

export const getPersona = (role: Role): Persona => structuredClone(PERSONAS[role])

/** Mock AI: identifies the email by its exact body, then answers from the fixed map. */
export function interpretText(text: string, delayMs = AI_LATENCY_MS): Promise<AiReading> {
  const id = EMAILS.find((e) => e.body === text)?.id
  return reply((id && AI_READINGS[id]) || UNREADABLE, delayMs)
}
