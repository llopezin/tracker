import { createFileRoute } from '@tanstack/react-router'
import { PageLoading, ShipmentsPage } from '../components/shipments/ShipmentsPage'
import { queryClient, shipmentsQuery } from '../queries/shipments'

export const Route = createFileRoute('/ops')({
  loader: () => queryClient.fetchQuery(shipmentsQuery('ops')),
  pendingMs: 0,
  pendingComponent: PageLoading,
  component: OpsPage,
})

function OpsPage() {
  return <ShipmentsPage role="ops" />
}
