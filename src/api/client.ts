// The app's only door to the backend. Today it delegates to the in-browser mock (mock-api/); in production
// these become fetch calls and mock-api/ is deleted, with callers and contracts.ts unchanged.
// Data calls take the role: the backend returns only what that role may see (PRD §5).
import * as server from '../mock-api/server'

/** The role's shipments with their emails, operators and ops activity. */
export const fetchShipments = server.getShipments
/** Review an AI reading, upload a document or mark an action done. */
export const recordActivity = server.recordActivity
/** AI reading of one email (PRD §9), ~400 ms by default. */
export const interpretText = server.interpretText
/** Sync stand-in for login: the demo identity behind each route (PRD §5). */
export const getPersona = server.getPersona
