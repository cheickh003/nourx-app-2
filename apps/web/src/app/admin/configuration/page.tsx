'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { ConfigurationPage } from '@/components/admin/configuration/configuration-page'

export default function AdminConfigurationPage() {
  return (
    <AdminLayout title="Configuration">
      <ConfigurationPage />
    </AdminLayout>
  )
}

