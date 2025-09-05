import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Receipt,
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
  TrendingUp,
  Mail
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';

// Types pour la facturation (extraite de la page originale)
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

interface BillingTableProps {
  invoices: Invoice[];
  stats: BillingStats | null;
  activeTab: string;
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  onActiveTabChange: (tab: string) => void;
  onSearchTermChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onTypeFilterChange: (type: string) => void;
}

export function BillingTableContent({
  invoices,
  stats,
  activeTab,
  searchTerm,
  statusFilter,
  typeFilter,
  onActiveTabChange,
  onSearchTermChange,
  onStatusFilterChange,
  onTypeFilterChange,
}: BillingTableProps) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <FileText className="h-4 w-4" />;
      case 'invoice':
        return <Receipt className="h-4 w-4" />;
      case 'credit_note':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.projectName && invoice.projectName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: 'number',
      label: 'Numéro',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(String(item.type))}
          <div>
            <div className="font-medium">{String(value)}</div>
            <div className="text-xs text-gray-500">{getTypeLabel(String(item.type))}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      label: 'Client',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{String(value)}</div>
          {item.projectName && (
            <div className="text-sm text-gray-500 truncate">{String(item.projectName)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: unknown) => (
        <Badge variant={getStatusBadgeVariant(String(value))}>
          {getStatusLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="text-right">
          <div className="font-medium">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: String(item.currency)
            }).format(Number(value))}
          </div>
        </div>
      ),
    },
    {
      key: 'issueDate',
      label: 'Date d\'émission',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Échéance',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'emailHistory',
      label: 'E-mails',
      render: (value: unknown) => {
        const history = value as EmailHistory[];
        return (
          <div className="flex items-center space-x-1">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{history.length}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Link href={`/admin/billing/${String(item.id)}`}>
            <Button variant="ghost" size="sm" aria-label="Voir les détails de la facture">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" aria-label="Télécharger la facture">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Envoyer la facture par email">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Alertes */}
      {stats && stats.overdueInvoices > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Factures en retard</strong>
            {stats.overdueInvoices > 0 && ` - ${stats.overdueInvoices.toLocaleString()}€ à recouvrer`}
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets et filtres */}
      <Tabs value={activeTab} onValueChange={onActiveTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices">Toutes</TabsTrigger>
            <TabsTrigger value="quotes">Devis</TabsTrigger>
            <TabsTrigger value="invoices_only">Factures</TabsTrigger>
            <TabsTrigger value="credit_notes">Avoirs</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyée</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="quote">Devis</SelectItem>
                <SelectItem value="invoice">Facture</SelectItem>
                <SelectItem value="credit_note">Avoir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {['invoices', 'quotes', 'invoices_only', 'credit_notes'].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tabValue === 'invoices' && 'Tous les documents'}
                  {tabValue === 'quotes' && 'Devis'}
                  {tabValue === 'invoices_only' && 'Factures'}
                  {tabValue === 'credit_notes' && 'Avoirs'}
                  {' '}
                  ({filteredInvoices.filter(inv => {
                    if (tabValue === 'invoices') return true;
                    if (tabValue === 'quotes') return inv.type === 'quote';
                    if (tabValue === 'invoices_only') return inv.type === 'invoice';
                    if (tabValue === 'credit_notes') return inv.type === 'credit_note';
                    return true;
                  }).length})
                </CardTitle>
                <CardDescription>
                  Gestion et suivi des documents de facturation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredInvoices.filter(inv => {
                    if (tabValue === 'invoices') return true;
                    if (tabValue === 'quotes') return inv.type === 'quote';
                    if (tabValue === 'invoices_only') return inv.type === 'invoice';
                    if (tabValue === 'credit_notes') return inv.type === 'credit_note';
                    return true;
                  }) as unknown as Record<string, unknown>[]}
                  columns={columns}
                  searchable={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
