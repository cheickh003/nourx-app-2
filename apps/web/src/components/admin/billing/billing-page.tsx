'use client';

import { useQuery } from '@tanstack/react-query';
import { useClientApi } from '@/hooks/use-client-api';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types/invoice';
import { BillingDataTable } from './billing-data-table';
import { columns } from './billing-columns';

import { InvoiceDialog } from './invoice-dialog';
import { useQueryClient } from '@tanstack/react-query';

export function BillingPage() {
  const api = useClientApi();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['adminInvoices'],
    queryFn: () => api.get('/api/billing/').then(res => res.data.results), // DRF pagination
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['adminInvoices'] });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion de la Facturation</h1>
        <InvoiceDialog onSuccess={handleSuccess} />
      </div>
      {isLoading && <p>Chargement des factures...</p>}
      {invoices && <BillingDataTable columns={columns} data={invoices} />}
    </div>
  );
}