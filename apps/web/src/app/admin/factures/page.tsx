'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useInvoices } from '@/hooks/use-client-api'

export default function AdminInvoicesPage() {
  const { data: invoices, loading, error } = useInvoices()

  const openPdf = (id: number) => {
    window.open(`/api/invoices/${id}/pdf/`, '_blank')
  }

  return (
    <AdminLayout title="Factures">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Toutes les factures</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-destructive">Erreur: {error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Numéro</th>
                      <th className="text-left py-2">Client</th>
                      <th className="text-left py-2">Titre</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoices || []).map((inv: any) => (
                      <tr key={inv.id} className="border-b">
                        <td className="py-2">{inv.invoice_number}</td>
                        <td className="py-2">{inv.client_name || '-'}</td>
                        <td className="py-2">{inv.title}</td>
                        <td className="py-2 text-right">{parseFloat(inv.total_ttc).toLocaleString('fr-FR')} €</td>
                        <td className="py-2">{inv.status}</td>
                        <td className="py-2 text-right">
                          <Button variant="outline" size="sm" onClick={() => openPdf(inv.id)}>PDF</Button>
                        </td>
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

