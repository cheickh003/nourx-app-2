'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjects } from '@/hooks/use-client-api'

export default function AdminProjectsPage() {
  const { data: projects, loading, error } = useProjects()

  return (
    <AdminLayout title="Projets">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tous les projets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-destructive">Erreur: {error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Titre</th>
                      <th className="text-left py-2">Client</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-right py-2">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projects || []).map((p: any) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{p.title}</td>
                        <td className="py-2">{p.client_name || '-'}</td>
                        <td className="py-2">{p.status}</td>
                        <td className="py-2 text-right">{p.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

