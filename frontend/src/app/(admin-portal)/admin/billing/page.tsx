'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Send,
  Euro,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MoreHorizontal,
  TrendingUp,
  Mail
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import BillingTable from '@/components/admin/BillingTable';
import Link from 'next/link';

// Types pour la facturation
interface Invoice {
  id: string;
  number: string;
  type: 'quote' | 'invoice' | 'credit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  organizationName: string;
  organizationId: string;
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
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EmailHistory {
  id: string;
  type: 'send' | 'reminder' | 'overdue';
  sentAt: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'delivered' | 'failed';
}

interface BillingStats {
  totalRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  paidThisMonth: number;
  quotesPending: number;
  averagePaymentDelay: number;
}

// Données mockées pour la démonstration
const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    number: '2024-001',
    type: 'invoice',
    status: 'paid',
    organizationName: 'TechCorp SA',
    organizationId: 'org-1',
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
        unitPrice: 15000,
        total: 15000,
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
      }
    ],
    createdAt: '2024-08-15T00:00:00Z',
    updatedAt: '2024-08-20T00:00:00Z',
  },
  {
    id: 'INV-002',
    number: '2024-002',
    type: 'invoice',
    status: 'overdue',
    organizationName: 'StartupXYZ',
    organizationId: 'org-2',
    projectName: 'Application Mobile',
    projectId: 'proj-2',
    amount: 8500,
    currency: 'EUR',
    issueDate: '2024-08-01T00:00:00Z',
    dueDate: '2024-08-31T00:00:00Z',
    description: 'Développement application mobile iOS/Android',
    items: [
      {
        id: 'item-1',
        description: 'Développement application mobile',
        quantity: 1,
        unitPrice: 8500,
        total: 8500,
      }
    ],
    emailHistory: [
      {
        id: 'email-1',
        type: 'send',
        sentAt: '2024-08-01T09:00:00Z',
        recipient: 'compta@startupxyz.com',
        subject: 'Facture 2024-002 - Application Mobile',
        status: 'delivered',
      },
      {
        id: 'email-2',
        type: 'reminder',
        sentAt: '2024-09-02T09:00:00Z',
        recipient: 'compta@startupxyz.com',
        subject: 'Rappel - Facture 2024-002 en retard',
        status: 'delivered',
      }
    ],
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-09-02T00:00:00Z',
  },
  {
    id: 'QUO-001',
    number: 'DEV-2024-001',
    type: 'quote',
    status: 'sent',
    organizationName: 'Consulting Plus',
    organizationId: 'org-3',
    projectName: 'Refonte Site Web',
    projectId: 'proj-3',
    amount: 25000,
    currency: 'EUR',
    issueDate: '2024-09-01T00:00:00Z',
    description: 'Refonte complète du site web corporate avec CMS',
    items: [
      {
        id: 'item-1',
        description: 'Refonte site web corporate',
        quantity: 1,
        unitPrice: 20000,
        total: 20000,
      },
      {
        id: 'item-2',
        description: 'Intégration CMS personnalisé',
        quantity: 1,
        unitPrice: 5000,
        total: 5000,
      }
    ],
    emailHistory: [
      {
        id: 'email-1',
        type: 'send',
        sentAt: '2024-09-01T14:30:00Z',
        recipient: 'direction@consultingplus.com',
        subject: 'Devis DEV-2024-001 - Refonte Site Web',
        status: 'delivered',
      }
    ],
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

const mockStats: BillingStats = {
  totalRevenue: 127500,
  pendingInvoices: 18500,
  overdueInvoices: 8500,
  paidThisMonth: 28500,
  quotesPending: 2,
  averagePaymentDelay: 8.5,
};

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setInvoices(mockInvoices);
      setStats(mockStats);
      setLoading(false);
    };

    loadData();
  }, []);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la facturation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturation"
        description="Gestion des devis, factures et avoirs"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle facture
            </Button>
          </div>
        }
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Chiffre d'affaires total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.pendingInvoices.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Factures non payées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.overdueInvoices.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueInvoices > 0 ? 'Action requise' : 'Aucun retard'}
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
                €{stats.paidThisMonth.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Paiements reçus
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertes */}
      {stats && stats.overdueInvoices > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.overdueInvoices > 0 ? 'Factures en retard' : 'Aucune facture en retard'}</strong>
            {stats.overdueInvoices > 0 && ` - ${stats.overdueInvoices.toLocaleString()}€ à recouvrer`}
          </AlertDescription>
        </Alert>
      )}

      {/* Table de facturation avec code-splitting */}
      <BillingTable
        invoices={invoices}
        stats={stats}
        activeTab={activeTab}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onActiveTabChange={setActiveTab}
        onSearchTermChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
      />
    </div>
  );
}
