import type { Activity, Email } from '../../api/contracts'

export const EMAILS: Email[] = [
  {
    id: 'email-transpirineo-24790',
    from: 'traffic@transpirineo.example',
    operatorId: 'transpirineo',
    receivedAt: '2026-11-22T08:55:00+01:00',
    subject: 'ACM-24790 / TP-88213 – incident on route',
    body:
      'Hello, our truck carrying ACM-24790 broke down this morning at 07:30 on the A7 near Lyon (Vienne). ' +
      'A replacement tractor is on its way. Delivery to Stuttgart is now expected on Tuesday 24 November before 12:00. ' +
      'Sorry for the inconvenience. TransPirineo Traffic Desk',
  },
  {
    id: 'email-aduanas-24817',
    from: 'despacho@aduanasgolfo.example',
    operatorId: 'aduanas-golfo',
    receivedAt: '2026-11-19T16:45:00-06:00',
    subject: 'NDHU7654321 – retención aduanal Veracruz',
    body:
      'Buenas tardes. Container NDHU7654321 (ACM-24817) is held by customs at Veracruz since 19 Nov 10:00 for documentary review: ' +
      'the commercial invoice values do not match the packing list. Please send a corrected commercial invoice. ' +
      'Saludos, Aduanas Golfo',
  },
]

/**
 * Initial review state (PRD §6 "Estado inicial"): the Aduanas Golfo reading is accepted; TransPirineo stays pending.
 * Keyed by the AI update id (`ai:<emailId>`, domain/adapters/email.ts `aiUpdateId`).
 */
export const initialAiReviews: Activity['aiReviews'] = {
  'ai:email-aduanas-24817': { review: 'accepted', by: 'ops@acme.com', at: '2026-11-20T09:15:00+01:00' },
}
