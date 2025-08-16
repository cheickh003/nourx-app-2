'use client'

import { ClientLayout } from '@/components/layout/client-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Euro, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { usePayments } from '@/hooks/use-client-api'

function Status({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    completed: { label: 'Terminé', variant: 'default' },
    processing: { label: 'En traitement', variant: 'secondary' },
    pending: { label: 'En attente', variant: 'secondary' },
    failed: { label: 'Échoué', variant: 'destructive' },
    cancelled: { label: 'Annulé', variant: 'secondary' },
    refunded: { label: 'Remboursé', variant: 'secondary' },
  }
  const s = map[status] || { label: status, variant: 'secondary' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function PaymentsPage() {
  const { data: payments, loading, error } = usePayments()

  return (
    <ClientLayout title="Mes Paiements">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
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
                      <th className="text-left py-2">Facture</th>
                      <th className="text-left py-2">Transaction</th>
                      <th className="text-right py-2">Montant</th>
                      <th className="text-left py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments || []).map((p: any) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                        <td className="py-2">
                          {p.invoice ? (
                            <Link href={`/factures/${p.invoice}`} className="text-primary underline flex items-center gap-1">
                              Voir facture <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : '-'}
                        </td>
                        <td className="py-2 text-xs">{p.cinetpay_transaction_id}</td>
                        <td className="py-2 text-right font-medium">
                          <span className="inline-flex items-center"><Euro className="h-4 w-4 mr-1" />{parseFloat(p.amount).toLocaleString('fr-FR', {minimumFractionDigits:2})}</span> {p.currency}
                        </td>
                        <td className="py-2"><Status status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

