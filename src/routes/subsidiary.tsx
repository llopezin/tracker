import { createFileRoute } from '@tanstack/react-router'
import { PageLoading, ShipmentsPage } from '../components/shipments/ShipmentsPage'
import { queryClient, shipmentsQuery } from '../queries/shipments'

export const Route = createFileRoute('/subsidiary')({
  loader: () => queryClient.fetchQuery(shipmentsQuery('subsidiary')),
  pendingMs: 0,
  pendingComponent: PageLoading,
  component: SubsidiaryPage,
})

function SubsidiaryPage() {
  return <ShipmentsPage role="subsidiary" />
}
