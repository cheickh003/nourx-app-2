'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminStats } from '@/hooks/use-admin'

export default function AdminDashboardPage() {
  const { data, loading, error } = useAdminStats()

  return (
    <AdminLayout title="Dashboard Admin">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
          <p className="text-muted-foreground">KPIs projets, clients, support et revenus</p>
        </div>
        {loading && (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-8 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        )}
        {error && (
          <Card><CardContent className="p-6 text-destructive">Erreur: {error}</CardContent></Card>
        )}
        {data && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle>Projets</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.total_projects}</CardContent></Card>
            <Card><CardHeader><CardTitle>Clients</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.total_clients}</CardContent></Card>
            <Card><CardHeader><CardTitle>Tickets ouverts</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.open_tickets}</CardContent></Card>
            <Card><CardHeader><CardTitle>Revenus</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{Number(data.revenue_total).toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €</CardContent></Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

