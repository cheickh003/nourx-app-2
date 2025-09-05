'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Download,
  Mail,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Building,
  Calendar,
  Euro,
  Hash,
  User,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getInvoice, downloadInvoice, sendInvoiceByEmail, markInvoiceAsPaid } from '@/lib/api/billing';
import type { Invoice } from '@/lib/api/billing';

// Composant Separator manquant - création rapide
const SeparatorComponent = () => <hr className="my-4 border-gray-200" />;

interface InvoiceDetailPageProps {
  params: { id: string };
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const router = useRouter();
  const { id } = params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Charger les détails de la facture
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoiceData = await getInvoice(id);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Erreur lors du chargement de la facture:', error);
        toast.error('Erreur lors du chargement de la facture');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadInvoice();
    }
  }, [id]);

  const handleDownload = async () => {
    if (!invoice) return;

    setIsActionLoading(true);
    try {
      const blob = await downloadInvoice(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Facture téléchargée avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendByEmail = async () => {
    if (!invoice) return;

    setIsActionLoading(true);
    try {
      await sendInvoiceByEmail(invoice.id);
      toast.success(`Facture ${invoice.number} envoyée par email`);
      // Recharger les données pour mettre à jour le statut
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error('Erreur lors de l\'envoi par email');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    setIsActionLoading(true);
    try {
      await markInvoiceAsPaid(invoice.id);
      toast.success(`Facture ${invoice.number} marquée comme payée`);
      // Recharger les données pour mettre à jour le statut
      const updatedInvoice = await getInvoice(id);
      setInvoice(updatedInvoice);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePayment = () => {
    // Simulation d'un paiement - en production, cela redirigerait vers un PSP
    toast.info('Redirection vers le système de paiement...');
    setTimeout(() => {
      toast.success('Paiement simulé avec succès');
      handleMarkAsPaid();
    }, 2000);
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
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'sent':
        return <Clock className="h-6 w-6 text-blue-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const isOverdue = invoice?.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';
  const canPay = invoice?.status === 'sent' || (invoice?.status === 'overdue' && !invoice.paidAt);
  const canDownload = true; // Toujours permettre le téléchargement
  const canSendEmail = invoice?.status === 'sent';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Facture non trouvée"
          description="La facture demandée n'existe pas ou vous n'y avez pas accès"
          actions={
            <Link href="/client/billing">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la facturation
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Facture ${invoice.number}`}
        description={`Facture ${invoice.type === 'quote' ? 'devis' : ''} - ${invoice.description || 'Sans description'}`}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/client/billing">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut et montant */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <CardTitle className="text-2xl">
                      {invoice.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: invoice.currency,
                      })}
                    </CardTitle>
                    <CardDescription>
                      {invoice.type === 'quote' ? 'Devis' : 'Facture'}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(invoice.status)}
                  {isOverdue && (
                    <p className="text-sm text-red-600 mt-1">En retard</p>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Détails de la facture */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Numéro</span>
                  </div>
                  <p className="text-sm text-gray-600">{invoice.number}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Date d'émission</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(invoice.createdAt), 'PPP', { locale: fr })}
                  </p>
                </div>

                {invoice.dueDate && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Échéance</span>
                    </div>
                    <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {format(new Date(invoice.dueDate), 'PPP', { locale: fr })}
                    </p>
                  </div>
                )}

                {invoice.sentAt && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Envoyée le</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.sentAt), 'PPP', { locale: fr })}
                    </p>
                  </div>
                )}

                {invoice.paidAt && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Payée le</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(invoice.paidAt), 'PPP', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              {invoice.description && (
                <>
                  <SeparatorComponent />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Description</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                  </div>
                </>
              )}

              {invoice.projectName && (
                <>
                  <SeparatorComponent />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Projet associé</span>
                    </div>
                    <p className="text-sm text-gray-600">{invoice.projectName}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Aperçu de la facture (simulation) */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la facture</CardTitle>
              <CardDescription>
                Visualisation simplifiée du document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">NOURX</h3>
                      <p className="text-sm text-gray-600">Services informatiques</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold">{invoice.number}</h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  <SeparatorComponent />

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-2">Émis par :</h4>
                      <p className="text-sm text-gray-600">
                        NOURX<br />
                        123 Rue de la Tech<br />
                        75001 Paris<br />
                        contact@nourx.com
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Client :</h4>
                      <p className="text-sm text-gray-600">
                        Votre organisation<br />
                        {invoice.projectName && `Projet: ${invoice.projectName}`}
                      </p>
                    </div>
                  </div>

                  <SeparatorComponent />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Description</span>
                      <span>Montant</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{invoice.description || 'Services informatiques'}</span>
                      <span>
                        {invoice.amount.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: invoice.currency,
                        })}
                      </span>
                    </div>
                  </div>

                  <SeparatorComponent />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      {invoice.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: invoice.currency,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions et informations */}
        <div className="space-y-6">
          {/* Actions principales */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canDownload && (
                <Button
                  className="w-full"
                  onClick={handleDownload}
                  disabled={isActionLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              )}

              {canSendEmail && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSendByEmail}
                  disabled={isActionLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer par email
                </Button>
              )}

              {canPay && (
                <Button
                  className="w-full"
                  onClick={handlePayment}
                  disabled={isActionLoading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer maintenant
                </Button>
              )}

              {invoice.status === 'sent' && !invoice.paidAt && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleMarkAsPaid}
                  disabled={isActionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme payée
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Informations de paiement */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Montant total</span>
                </div>
                <p className="text-lg font-bold">
                  {invoice.amount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency,
                  })}
                </p>
              </div>

              {invoice.dueDate && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Échéance</span>
                  </div>
                  <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {format(new Date(invoice.dueDate), 'PPP', { locale: fr })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Mode de paiement</span>
                </div>
                <p className="text-sm text-gray-600">
                  Virement bancaire ou carte de crédit
                </p>
              </div>

              {invoice.status === 'paid' && invoice.paidAt && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Payée le</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(invoice.paidAt), 'PPP à p', { locale: fr })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique des envois */}
          {invoice.sentAt && (
            <Card>
              <CardHeader>
                <CardTitle>Historique des envois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Envoyée par email</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(invoice.sentAt), 'PPP à p', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
