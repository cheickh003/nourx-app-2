'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClientLayout } from '@/components/layout/client-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Euro, Download, CreditCard, ArrowLeft } from 'lucide-react'
import { useInvoice } from '@/hooks/use-client-api'
import { apiClient } from '@/lib/api'

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string
  const { data: invoice, loading, error, refetch } = useInvoice(id as any)

  const isOverdue = invoice?.is_overdue
  const canPay = invoice && (invoice.status === 'sent' || isOverdue)

  const totals = useMemo(() => {
    if (!invoice) return null
    return {
      subtotal: parseFloat(invoice.subtotal_ht || 0),
      tax: parseFloat(invoice.tax_amount || 0),
      total: parseFloat(invoice.total_ttc || 0),
      paid: parseFloat(invoice.paid_amount || 0),
      remaining: parseFloat(invoice.remaining_amount || (invoice.total_ttc || 0)),
    }
  }, [invoice])

  const onDownloadPdf = () => {
    if (!id) return
    window.open(`/api/invoices/${id}/pdf/`, '_blank')
  }

  const onPay = async () => {
    if (!id) return
    try {
      const data = await apiClient.post<{ checkout_url: string }>(`/api/payments/init/`, { invoice_id: id })
      if (data?.checkout_url) window.location.href = data.checkout_url
    } catch (e) {
      console.error('Paiement init erreur', e)
      alert("Impossible d'initialiser le paiement pour cette facture.")
    }
  }

  if (loading) {
    return (
      <ClientLayout title="Détail de la facture">
        <div className="p-6">
          <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
          <Card>
            <CardHeader><CardTitle>Chargement...</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  if (error || !invoice) {
    return (
      <ClientLayout title="Détail de la facture">
        <div className="p-6 space-y-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <Card>
            <CardHeader><CardTitle>Erreur</CardTitle></CardHeader>
            <CardContent>Impossible de charger la facture.</CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout title={`Facture ${invoice.invoice_number}`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
          <div className="flex gap-2 items-center">
            <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
              {isOverdue ? 'En retard' : invoice.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={onDownloadPdf}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            {canPay && (
              <Button size="sm" onClick={onPay}>
                <CreditCard className="h-4 w-4 mr-1" /> Payer
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{invoice.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Date d'émission</div>
                <div>{new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Échéance</div>
                <div className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              {invoice.project_title && (
                <div>
                  <div className="text-sm text-muted-foreground">Projet</div>
                  <div>{invoice.project_title}</div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Libellé</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qté</th>
                    <th className="text-right py-2">PU (HT)</th>
                    <th className="text-right py-2">Total (HT)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((it: any) => (
                    <tr key={it.id} className="border-b">
                      <td className="py-2">{it.title}</td>
                      <td className="py-2 text-muted-foreground">{it.description}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right">{parseFloat(it.unit_price).toLocaleString('fr-FR', {minimumFractionDigits:2})}</td>
                      <td className="py-2 text-right">{parseFloat(it.total_price).toLocaleString('fr-FR', {minimumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totals && (
              <div className="grid md:grid-cols-2 gap-4">
                <div />
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span>Sous-total (HT)</span><span>{totals.subtotal.toLocaleString('fr-FR', {minimumFractionDigits:2})}</span></div>
                  <div className="flex justify-between text-sm"><span>TVA</span><span>{totals.tax.toLocaleString('fr-FR', {minimumFractionDigits:2})}</span></div>
                  <div className="flex justify-between text-base font-semibold"><span>Total (TTC)</span><span>{totals.total.toLocaleString('fr-FR', {minimumFractionDigits:2})}</span></div>
                  {totals.paid > 0 && (
                    <div className="flex justify-between text-sm text-green-600"><span>Payé</span><span>{totals.paid.toLocaleString('fr-FR', {minimumFractionDigits:2})}</span></div>
                  )}
                  {totals.remaining > 0 && (
                    <div className="flex justify-between text-sm"><span>Reste à payer</span><span>{totals.remaining.toLocaleString('fr-FR', {minimumFractionDigits:2})}</span></div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

