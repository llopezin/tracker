// The 3 demo personas. No login: each route signs in as one of them.
import type { Persona, Role } from '../../api/contracts'
import { ACCOUNTS } from './shipments'

export const PERSONAS: Record<Role, Persona> = {
  ops: { email: 'ops@acme.com', audience: 'ops', sites: ['Zaragoza Plant', 'Valencia Warehouse', 'Bilbao Plant'] },
  subsidiary: { email: 'support.subsidiary@acme.com', audience: 'customer', accountId: ACCOUNTS.acmeMexico },
  customer: { email: 'client@gmail.com', audience: 'customer', accountId: ACCOUNTS.finalClient },
}
