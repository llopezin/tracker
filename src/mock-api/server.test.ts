import { describe, expect, it } from 'vitest'
import type { Role } from '../api/contracts'
import { getShipments } from './server'

describe('fake server perimeter', () => {
  it.each<[Role, string[], string[], string[]]>([
    ['ops', ['ACM-24812', 'ACM-24801', 'ACM-24790', 'ACM-24755', 'ACM-24817', 'ACM-24866', 'ACM-24844'],
      ['email-transpirineo-24790', 'email-aduanas-24817'], ['ai:email-aduanas-24817']],
    ['subsidiary', ['ACM-24817', 'ACM-24866'], ['email-aduanas-24817'], ['ai:email-aduanas-24817']],
    ['customer', ['ACM-24790'], ['email-transpirineo-24790'], []],
  ])('%s gets exactly its perimeter', async (role, shipments, emails, reviews) => {
    const r = await getShipments(role)
    expect(r.shipments.map((s) => s.record.id)).toEqual(shipments)
    expect(r.emails.map((e) => e.id)).toEqual(emails)
    expect(Object.keys(r.activity.aiReviews)).toEqual(reviews)
  })
})
