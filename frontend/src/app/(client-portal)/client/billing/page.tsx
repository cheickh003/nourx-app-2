'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/DataTable';
import {
  Receipt,
  Download,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import useSWR from 'swr';
import { getInvoices, getBillingStats, downloadInvoice, sendInvoiceByEmail, markInvoiceAsPaid } from '@/lib/api/billing';
import type { Invoice, InvoiceFilters, BillingStats } from '@/lib/api/billing';

export default function ClientBillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Charger les statistiques
  const { data: stats, error: statsError, mutate: mutateStats } = useSWR(
    'billing-stats',
    getBillingStats,
    { refreshInterval: 30000 }
  );

  // Charger les factures avec filtres
  const { data: invoicesData, error: invoicesError, mutate: mutateInvoices, isLoading } = useSWR(
    ['invoices', activeTab, filters, currentPage],
    () => getInvoices({
      ...filters,
      type: activeTab === 'invoices' ? 'invoice' : 'quote'
    }, currentPage),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Facture téléchargée avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleSendByEmail = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await sendInvoiceByEmail(invoiceId);
      toast.success(`Facture ${invoiceNumber} envoyée par email`);
      mutateInvoices();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi par email');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await markInvoiceAsPaid(invoiceId);
      toast.success(`Facture ${invoiceNumber} marquée comme payée`);
      mutateInvoices();
      mutateStats();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
      overdue: 'En retard',
      cancelled: 'Annulée',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.draft}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const invoiceColumns = [
    {
      key: 'number',
      header: 'Numéro',
      render: (invoice: Invoice) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(invoice.status)}
          <span className="font-medium">{invoice.number}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (invoice: Invoice) => (
        <div>
          <p className="font-medium">{invoice.description || 'Sans description'}</p>
          {invoice.projectName && (
            <p className="text-sm text-gray-600">Projet: {invoice.projectName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Montant',
      render: (invoice: Invoice) => (
        <span className="font-medium">
          {invoice.amount.toLocaleString('fr-FR', {
            style: 'currency',
            currency: invoice.currency,
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (invoice: Invoice) => getStatusBadge(invoice.status),
    },
    {
      key: 'dueDate',
      header: 'Échéance',
      render: (invoice: Invoice) => (
        <span className="text-sm text-gray-600">
          {invoice.dueDate
            ? format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })
            : 'N/A'
          }
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (invoice: Invoice) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(invoice.id, invoice.number)}
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>

          {invoice.status === 'sent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendByEmail(invoice.id, invoice.number)}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          )}

          {invoice.status === 'sent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAsPaid(invoice.id, invoice.number)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Marquer payée
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Facturation"
        description="Gérez vos factures et paiements"
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingAmount?.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }) || '0 €'} à payer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payé ce mois</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.paidThisMonth?.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              }) || '0 €'}
            </div>
            <p className="text-xs text-muted-foreground">
              Paiements effectués
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overdueInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              Factures en retard de paiement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets Factures/Devis */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'invoices' | 'quotes')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Factures</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Devis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Factures</CardTitle>
                <CardDescription>
                  Historique de vos factures
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => mutateInvoices()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <DataTable
                  data={invoicesData?.invoices || []}
                  columns={invoiceColumns}
                  pagination={invoicesData?.pagination}
                  onPageChange={setCurrentPage}
                  currentPage={currentPage}
                  emptyMessage="Aucune facture trouvée"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Devis</CardTitle>
                <CardDescription>
                  Historique de vos devis
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => mutateInvoices()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <DataTable
                  data={invoicesData?.invoices || []}
                  columns={invoiceColumns}
                  pagination={invoicesData?.pagination}
                  onPageChange={setCurrentPage}
                  currentPage={currentPage}
                  emptyMessage="Aucun devis trouvé"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
