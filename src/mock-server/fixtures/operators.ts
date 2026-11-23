// Operator registry as the backend returns it. Status vocabularies live in domain/adapters/vocabularies.ts.
import type { Operator } from '../../api/contracts'

export const OPERATORS: Record<string, Operator> = {
  galicar: { id: 'galicar', name: 'Galicar Express', role: 'road', format: 'dhl' },
  moncayo: { id: 'moncayo', name: 'Transportes Moncayo', role: 'road', format: 'dhl' },
  transpirineo: { id: 'transpirineo', name: 'TransPirineo Logistics', role: 'road', format: 'dhl' },
  bajio: { id: 'bajio', name: 'Logística Bajío', role: 'road', format: 'dhl' },
  nordhaven: { id: 'nordhaven', name: 'Nordhaven Lines', role: 'sea', format: 'dcsa' },
  meridia: { id: 'meridia', name: 'Meridia Shipping', role: 'sea', format: 'dcsa' },
  'terminal-golfo': { id: 'terminal-golfo', name: 'Terminal Golfo', role: 'port', format: 'terminal49' },
  'aduanas-golfo': { id: 'aduanas-golfo', name: 'Aduanas Golfo', role: 'customs', format: 'email' },
}
