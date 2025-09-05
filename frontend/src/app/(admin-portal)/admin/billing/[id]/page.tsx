'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building,
  User,
  Calendar,
  Euro,
  Mail,
  Phone,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

// Types pour les détails de facture
interface InvoiceDetail {
  id: string;
  number: string;
  type: 'quote' | 'invoice' | 'credit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  organizationName: string;
  organizationId: string;
  organizationDetails: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
    taxId?: string;
  };
  projectName?: string;
  projectId?: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  description: string;
  items: InvoiceItem[];
  emailHistory: EmailHistory[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

interface EmailHistory {
  id: string;
  type: 'send' | 'reminder' | 'overdue';
  sentAt: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed';
  openedAt?: string;
}

// Données mockées pour la démonstration
const mockInvoiceDetail: InvoiceDetail = {
  id: 'INV-001',
  number: '2024-001',
  type: 'invoice',
  status: 'paid',
  organizationName: 'TechCorp SA',
  organizationId: 'org-1',
  organizationDetails: {
    address: '123 Rue de la Technologie',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    phone: '+33 1 23 45 67 89',
    email: 'facturation@techcorp.com',
    taxId: 'FR123456789',
  },
  projectName: 'Plateforme E-commerce',
  projectId: 'proj-1',
  amount: 15000,
  currency: 'EUR',
  issueDate: '2024-08-15T00:00:00Z',
  dueDate: '2024-09-15T00:00:00Z',
  paidDate: '2024-08-20T00:00:00Z',
  description: 'Facture pour la phase 1 du développement e-commerce',
  items: [
    {
      id: 'item-1',
      description: 'Développement plateforme e-commerce - Phase 1',
      quantity: 1,
      unitPrice: 12000,
      total: 12000,
      taxRate: 20,
    },
    {
      id: 'item-2',
      description: 'Formation équipe technique',
      quantity: 2,
      unitPrice: 750,
      total: 1500,
      taxRate: 20,
    },
    {
      id: 'item-3',
      description: 'Support technique - 3 mois',
      quantity: 1,
      unitPrice: 1500,
      total: 1500,
      taxRate: 20,
    }
  ],
  emailHistory: [
    {
      id: 'email-1',
      type: 'send',
      sentAt: '2024-08-15T10:30:00Z',
      recipient: 'facturation@techcorp.com',
      subject: 'Facture 2024-001 - Plateforme E-commerce',
      status: 'delivered',
      openedAt: '2024-08-15T11:15:00Z',
    },
    {
      id: 'email-2',
      type: 'reminder',
      sentAt: '2024-08-25T09:00:00Z',
      recipient: 'facturation@techcorp.com',
      subject: 'Rappel - Facture 2024-001 en attente',
      status: 'delivered',
    }
  ],
  notes: 'Paiement effectué par virement bancaire. Référence: TC-2024-001',
  createdAt: '2024-08-15T00:00:00Z',
  updatedAt: '2024-08-20T00:00:00Z',
};

export default function AdminBillingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    const loadInvoiceDetail = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // En production, remplacer par un appel API réel
      setInvoice(mockInvoiceDetail);
      setLoading(false);
    };

    if (params.id) {
      loadInvoiceDetail();
    }
  }, [params.id]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'paid':
        return 'outline';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyée';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quote':
        return 'Devis';
      case 'invoice':
        return 'Facture';
      case 'credit_note':
        return 'Avoir';
      default:
        return type;
    }
  };

  const getEmailStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEmailStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'sent':
        return 'Envoyé';
      case 'failed':
        return 'Échec';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Facture introuvable</h3>
            <p className="text-gray-600 mb-4">
              La facture demandée n'existe pas ou a été supprimée.
            </p>
            <Link href="/admin/billing">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la facturation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = invoice.items.reduce((sum, item) => {
    const taxRate = item.taxRate || 0;
    return sum + (item.total * taxRate / 100);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <PageHeader
          title={`${getTypeLabel(invoice.type)} ${invoice.number}`}
          description={`Émise le ${new Date(invoice.issueDate).toLocaleDateString('fr-FR')}`}
        />
        <div className="flex items-center space-x-2">
          <Link href="/admin/billing">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Envoyer par email
          </Button>
        </div>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {getStatusLabel(invoice.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Montant total</label>
                <div className="mt-1">
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: invoice.currency
                    }).format(invoice.amount)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date d'émission</label>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
              {invoice.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Échéance</label>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </div>

            {invoice.paidDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date de paiement</label>
                <div className="mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  {new Date(invoice.paidDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}

            {invoice.description && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm">{invoice.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium">{invoice.organizationName}</h4>
              {invoice.organizationDetails.taxId && (
                <p className="text-sm text-gray-500">N° TVA: {invoice.organizationDetails.taxId}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <div>
                  <div>{invoice.organizationDetails.address}</div>
                  <div>{invoice.organizationDetails.postalCode} {invoice.organizationDetails.city}</div>
                  <div>{invoice.organizationDetails.country}</div>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {invoice.organizationDetails.email}
              </div>

              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                {invoice.organizationDetails.phone}
              </div>
            </div>

            {invoice.projectName && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500">Projet associé</label>
                  <p className="mt-1 text-sm">{invoice.projectName}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.description}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>Quantité: {item.quantity}</span>
                    <span>
                      Prix unitaire: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: invoice.currency
                      }).format(item.unitPrice)}
                    </span>
                    {item.taxRate && <span>TVA: {item.taxRate}%</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: invoice.currency
                    }).format(item.total)}
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            {/* Totaux */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT</span>
                <span>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency
                  }).format(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>TVA</span>
                <span>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency
                  }).format(taxAmount)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total TTC</span>
                <span>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency
                  }).format(invoice.amount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Historique des communications
          </CardTitle>
          <CardDescription>
            Emails envoyés concernant cette facture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoice.emailHistory.map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getEmailStatusIcon(email.status)}
                  <div>
                    <div className="font-medium">{email.subject}</div>
                    <div className="text-sm text-gray-500">
                      Envoyé à {email.recipient} le {new Date(email.sentAt).toLocaleDateString('fr-FR')} à {new Date(email.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {email.openedAt && (
                        <span className="ml-2 text-green-600">
                          • Lu le {new Date(email.openedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={email.status === 'delivered' ? 'outline' : email.status === 'failed' ? 'destructive' : 'secondary'}>
                    {getEmailStatusLabel(email.status)}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1 capitalize">
                    {email.type === 'send' ? 'Envoi initial' :
                     email.type === 'reminder' ? 'Rappel' : 'Relance'}
                  </div>
                </div>
              </div>
            ))}

            {invoice.emailHistory.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucun email envoyé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
