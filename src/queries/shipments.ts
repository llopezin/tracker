// Shipments of a role, fetched and mapped into what the UI renders. Components read them through a selector,
// so each re-renders only when its slice changes.
import { QueryClient, queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { ActivityChange, AiReading, Email, Role } from '../api/contracts'
import { fetchShipments, getPersona, interpretText, recordActivity } from '../api/client'
import { mapShipments } from '../domain/mapShipment'
import { customerNotice } from '../domain/rules'
import type { Notice, ShipmentView } from '../domain/types'

export const queryClient = new QueryClient()

/** A failed AI read counts as unreadable (→ NOT_MAPPED) instead of failing every shipment; retried on the next fetch. */
const UNREAD: AiReading = { milestone: null, confidence: 0, quote: '', readAs: '' }

/** Each email is read by the AI once per page load, even when shipments are refetched. */
const readEmail = (email: Email) =>
  queryClient
    .ensureQueryData({ queryKey: ['emailReading', email.id], queryFn: () => interpretText(email.body), gcTime: Infinity })
    .catch(() => UNREAD)

export const shipmentsQuery = (role: Role) =>
  queryOptions({
    queryKey: ['shipments', role],
    queryFn: async () => {
      const response = await fetchShipments(role)
      const readings = await Promise.all(response.emails.map(readEmail))
      return mapShipments(
        { ...response, readings: Object.fromEntries(response.emails.map((e, i) => [e.id, readings[i]])) },
        getPersona(role).audience,
      )
    },
    // Dropped 1 s after the page unmounts: 0 would drop the loader's data before the page subscribes.
    gcTime: 1000,
  })

export const useShipments = <T>(role: Role, select: (shipments: ShipmentView[]) => T): T =>
  useSuspenseQuery({ ...shipmentsQuery(role), select }).data

const selectNotices = (shipments: ShipmentView[]): Notice[] =>
  shipments.map(customerNotice).filter((n): n is Notice => n !== undefined)

export const useNotices = (role: Role): Notice[] => useShipments(role, selectNotices)

/** Records an ops change, then refetches every role's shipments so all views agree. */
export function useRecordActivity(role: Role): (change: ActivityChange) => void {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (change: ActivityChange) => recordActivity(role, change),
    onSuccess: () => client.invalidateQueries({ queryKey: ['shipments'] }),
  }).mutate
}

/** Upload document targets the first missing (else flagged) required document; the optional e-CMR never counts. */
export function useRunAction(role: Role): (view: ShipmentView, action: ShipmentView['actions'][number]) => void {
  const record = useRecordActivity(role)
  return (view, action) => {
    const required = view.documents.filter((d) => d.key !== 'cmr')
    const docKey = action.kind === 'upload_document' ? (required.find((d) => d.status === 'missing') ?? required.find((d) => d.status === 'flagged'))?.key : undefined
    if (docKey) record({ type: 'upload', shipmentId: view.id, docKey })
    record({ type: 'act', shipmentId: view.id, actionKey: action.key, docKey })
  }
}
