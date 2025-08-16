'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { SupportPage } from '@/components/admin/support/support-page'

export default function AdminSupportPage() {
  return (
    <AdminLayout title="Support">
      <SupportPage />
    </AdminLayout>
  )
}

