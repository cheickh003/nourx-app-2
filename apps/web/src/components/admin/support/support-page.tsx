
'use client';

import { useQuery } from '@tanstack/react-query';
import { useClientApi } from '@/hooks/use-client-api';
import { Ticket } from '@/types/support';
import { SupportDataTable } from './support-data-table';
import { columns } from './support-columns';

export function SupportPage() {
  const api = useClientApi();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['adminTickets'],
    queryFn: () => api.get('/api/tickets').then(res => (res.data as any).results ?? (res.data as any)),
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion du Support</h1>
      </div>
      {isLoading && <p>Chargement des tickets...</p>}
      {tickets && <SupportDataTable columns={columns} data={tickets} />}
    </div>
  );
}
