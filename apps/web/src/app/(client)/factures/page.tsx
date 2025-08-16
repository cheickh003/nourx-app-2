'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  FileText,
  Euro,
  Calendar,
  Download,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  ExternalLink
} from 'lucide-react'
import { useInvoices, useApiMutation } from '@/hooks/use-client-api'
import { apiClient } from '@/lib/api'
import Link from 'next/link'

function InvoiceCard({ invoice, onDownloadPdf }: { invoice: any; onDownloadPdf: (invoice: any) => void }) {
  const getStatusColor = (status: string, isOverdue: boolean = false) => {
    if (isOverdue) return 'destructive'
    switch (status) {
      case 'paid': return 'default'
      case 'sent': return 'secondary' 
      case 'overdue': return 'destructive'
      case 'partially_paid': return 'secondary'
      case 'cancelled': return 'secondary'
      case 'refunded': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string, isOverdue: boolean = false) => {
    if (isOverdue) return 'En retard'
    switch (status) {
      case 'paid': return 'Payée'
      case 'sent': return 'Envoyée'
      case 'overdue': return 'En retard'
      case 'partially_paid': return 'Partiellement payée'
      case 'cancelled': return 'Annulée'
      case 'refunded': return 'Remboursée'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  const isOverdue = invoice.is_overdue
  const canPay = invoice.status === 'sent' || isOverdue

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
            <CardDescription className="truncate">{invoice.title}</CardDescription>
            {invoice.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {invoice.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end ml-2">
            <Badge variant={getStatusColor(invoice.status, isOverdue)}>
              {getStatusLabel(invoice.status, isOverdue)}
            </Badge>
            {invoice.payment_status && (
              <span className="text-xs text-muted-foreground">
                {invoice.payment_status}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <div className="flex items-center justify-center text-2xl font-bold">
              <Euro className="h-6 w-6 mr-1" />
              {parseFloat(invoice.total_ttc).toLocaleString('fr-FR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              TTC {invoice.currency || 'EUR'}
            </p>
            {invoice.paid_amount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {parseFloat(invoice.paid_amount).toLocaleString('fr-FR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}€ payé{invoice.paid_amount !== invoice.total_ttc ? ` • Reste: ${parseFloat(invoice.remaining_amount).toLocaleString('fr-FR')}€` : ''}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date d'émission</span>
              <span>{new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date d'échéance</span>
              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {invoice.project_title && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projet</span>
                <span>{invoice.project_title}</span>
              </div>
            )}
            {invoice.external_reference && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Référence</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{invoice.external_reference}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canPay && (
              <Button className="flex-1" onClick={() => onPay(invoice)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payer maintenant
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDownloadPdf(invoice)}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/factures/${invoice.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                Détails
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InvoicesPage() {
  const { data: invoices, loading, error } = useInvoices()
  const downloadMutation = useApiMutation()

  const handleDownloadPdf = async (invoice: any) => {
    try {
      // Use window.open to download the PDF directly
      window.open(`/api/invoices/${invoice.id}/pdf/`, '_blank')
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error)
    }
  }

  const onPay = async (invoice: any) => {
    try {
      const data = await apiClient.post<{ checkout_url: string }>('/api/payments/init/', { invoice_id: invoice.id })
      if (data?.checkout_url) window.location.href = data.checkout_url
    } catch (e) {
      console.error('Paiement init erreur', e)
      alert('Impossible d\'initialiser le paiement pour cette facture.')
    }
  }

  if (loading) {
    return (
      <ClientLayout title="Mes Factures">
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error) {
    return (
      <ClientLayout title="Mes Factures">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des factures: {error}</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  const pendingInvoices = invoices?.filter(i => i.status === 'sent' && !i.is_overdue) || []
  const paidInvoices = invoices?.filter(i => i.status === 'paid') || []
  const partiallyPaidInvoices = invoices?.filter(i => i.status === 'partially_paid') || []
  const overdueInvoices = invoices?.filter(i => i.is_overdue) || []
  
  const totalPending = [...pendingInvoices, ...overdueInvoices].reduce((sum, inv) => sum + parseFloat(inv.remaining_amount || inv.total_ttc), 0)
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_ttc), 0)
  const totalPartiallyPaid = partiallyPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0)

  return (
    <ClientLayout title="Mes Factures">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Mes Factures</h1>
          <p className="text-muted-foreground">
            Consultez et payez vos factures en toute sécurité
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{pendingInvoices.length}</div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
                  <p className="text-sm text-muted-foreground">En retard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{paidInvoices.length}</div>
                  <p className="text-sm text-muted-foreground">Payées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{partiallyPaidInvoices.length}</div>
                  <p className="text-sm text-muted-foreground">Partielles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-lg font-bold text-primary">
                    {totalPending.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}€
                  </div>
                  <p className="text-sm text-muted-foreground">À payer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {overdueInvoices.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Vous avez {overdueInvoices.length} facture{overdueInvoices.length > 1 ? 's' : ''} en retard.
                  Merci de procéder au paiement dans les plus brefs délais.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              À payer ({pendingInvoices.length + overdueInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Payées ({paidInvoices.length + partiallyPaidInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Toutes ({invoices?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingInvoices.length === 0 && overdueInvoices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50 text-green-500" />
                  <p className="text-muted-foreground">
                    Aucune facture en attente de paiement
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...overdueInvoices, ...pendingInvoices].map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} onDownloadPdf={handleDownloadPdf} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-6">
            {paidInvoices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucune facture payée
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...paidInvoices, ...partiallyPaidInvoices].map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} onDownloadPdf={handleDownloadPdf} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {!invoices || invoices.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucune facture disponible
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {invoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} onDownloadPdf={handleDownloadPdf} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}
