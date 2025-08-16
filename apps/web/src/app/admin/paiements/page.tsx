'use client'

import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePayments } from '@/hooks/use-client-api'
import Link from 'next/link'

export default function AdminPaymentsPage() {
  const { data: payments, loading, error } = usePayments()
  return (
    <AdminLayout title="Paiements">
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tous les paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-destructive">Erreur: {error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Transaction</th>
                      <th className="text-right py-2">Montant</th>
                      <th className="text-left py-2">Devise</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-left py-2">Facture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments || []).map((p: any) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                        <td className="py-2 text-xs">{p.cinetpay_transaction_id}</td>
                        <td className="py-2 text-right">{parseFloat(p.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2">{p.currency}</td>
                        <td className="py-2">{p.status}</td>
                        <td className="py-2">{p.invoice ? <Link href={`/factures/${p.invoice}`}>Voir</Link> : '-'}</td>
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

