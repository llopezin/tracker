// Email + AI reading → one AI update (review pending) or NOT_MAPPED.
// A new date is returned as a candidate only, never as a leg ETA.
import type { AiReading, Email } from '../../api/contracts'
import type { EtaValue, Source } from '../types'
import type { Update } from './shared'

export const AI_MIN_CONFIDENCE = 0.7

/** AI update id for an email (deterministic, key in activity.aiReviews). */
export const aiUpdateId = (emailId: string): string => `ai:${emailId}`

export function mapEmail(email: Email, reading: AiReading, operatorName: string) {
  const id = aiUpdateId(email.id)
  const source: Source = { type: 'email', operatorName, label: `Email · ${operatorName}`, receivedAt: email.receivedAt, rawText: email.body }

  if (reading.milestone === null || reading.confidence < AI_MIN_CONFIDENCE) {
    // No `ai` field: a NOT_MAPPED reading never needs review.
    const update: Update = { id, tag: 'NOT_MAPPED', occurredAt: email.receivedAt, confidence: 'ACTUAL', source, order: 'applied' }
    return { update, aiEta: undefined }
  }

  const update: Update = {
    id,
    tag: reading.milestone,
    occurredAt: reading.at ?? email.receivedAt,
    confidence: 'ACTUAL',
    ...(reading.location ? { place: { name: reading.location } } : {}),
    source,
    ai: { rawQuote: reading.quote, readAs: reading.readAs, modelConfidence: reading.confidence, review: 'pending' },
    order: 'applied', // placeholder: the state machine sets the real order (only once accepted)
  }
  const aiEta: EtaValue | undefined = reading.eta ? { from: reading.eta, source } : undefined
  return { update, aiEta }
}
