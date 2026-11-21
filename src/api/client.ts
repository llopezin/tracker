// The app's only door to the backend (today the in-browser mock-api/; later, fetch calls with the same signatures).
// Data calls take the role: the backend returns only what that role may see.
import * as server from '../mock-api/server'

/** The role's shipments with their emails, operators and ops activity. */
export const fetchShipments = server.getShipments
/** Review an AI reading, upload a document or mark an action done. */
export const recordActivity = server.recordActivity
/** AI reading of one email (~400 ms by default). */
export const interpretText = server.interpretText
/** Sync stand-in for login: the demo identity behind each route. */
export const getPersona = server.getPersona
