// Shipments of a role, fetched and mapped once into what the UI renders. Components read them through a selector,
// so each one re-renders only when its slice changes (structural sharing keeps unchanged rows at the same reference).
import { QueryClient, queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { ActivityChange, AiReading, Email, Role } from '../api/contracts'
import { fetchShipments, getPersona, interpretText, recordActivity } from '../api/client'
import { mapShipments } from '../domain/mapShipment'
import { customerNotice } from '../domain/rules'
import type { Notice, ShipmentView } from '../domain/types'

export const queryClient = new QueryClient()

/** A failed AI read counts as unreadable (→ NOT_MAPPED) instead of failing every shipment; it is retried on the next fetch. */
const UNREAD: AiReading = { milestone: null, confidence: 0, quote: '', readAs: '' }

/** Each email is read by the AI once per page load (PRD §9), even when the shipments are fetched again. */
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
    staleTime: Infinity, // changes only through recordActivity, which refetches
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
