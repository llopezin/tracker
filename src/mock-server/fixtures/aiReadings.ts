// Fixed AI readings per email id. Unknown text reads as nothing.
import type { AiReading } from '../../api/contracts'

export const AI_READINGS: Record<string, AiReading> = {
  'email-transpirineo-24790': {
    milestone: 'BREAKDOWN',
    at: '2026-11-22T07:30:00+01:00',
    location: 'A7 near Lyon (Vienne)',
    eta: '2026-11-24T12:00:00+01:00',
    confidence: 0.82,
    quote: 'Delivery to Stuttgart is now expected on Tuesday 24 November before 12:00.',
    readAs: 'Vehicle breakdown near Lyon. New delivery date: Tue 24 Nov, before 12:00.',
  },
  'email-aduanas-24817': {
    milestone: 'CUSTOMS_HOLD',
    at: '2026-11-19T10:00:00-06:00',
    location: 'Veracruz',
    confidence: 0.91,
    quote: 'Container NDHU7654321 (ACM-24817) is held by customs at Veracruz since 19 Nov 10:00 for documentary review',
    readAs: 'Customs hold at Veracruz: commercial invoice does not match the packing list.',
  },
}

export const UNREADABLE: AiReading = { milestone: null, confidence: 0, quote: '', readAs: '' }
