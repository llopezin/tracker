import { createFileRoute } from '@tanstack/react-router'
import { PageLoading, ShipmentsPage } from '../components/shipments/ShipmentsPage'
import { queryClient, shipmentsQuery } from '../data/shipments'

export const Route = createFileRoute('/customer')({
  loader: () => queryClient.fetchQuery(shipmentsQuery('customer')),
  pendingMs: 0,
  pendingComponent: PageLoading,
  component: CustomerPage,
})

function CustomerPage() {
  return <ShipmentsPage role="customer" />
}
