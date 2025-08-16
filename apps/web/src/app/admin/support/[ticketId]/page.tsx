'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { TicketDetailPage } from '@/components/admin/support/ticket-detail-page'

export default function AdminTicketDetailPage({ params }: { params: { ticketId: string } }) {
  return (
    <AdminLayout title={`Ticket ${params.ticketId}`}>
      <TicketDetailPage ticketId={params.ticketId} />
    </AdminLayout>
  )
}

