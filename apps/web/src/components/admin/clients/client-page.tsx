'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useClientApi } from '@/hooks/use-client-api';
import { Client } from '@/types/client';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClientDialog } from './client-dialog';
import { ClientUserDialog } from './client-user-dialog';

// Main Page Component
export function ClientPage() {
  const [isMounted, setIsMounted] = useState(false);
  const api = useClientApi();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: clients, isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/api/clients/');
      const d = response.data as any;
      return Array.isArray(d?.results) ? d.results : d;
    },
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const columns: ColumnDef<Client>[] = [
    { accessorKey: "name", header: "Nom" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "status", header: "Statut" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex gap-2">
            <ClientDialog client={client} onSuccess={handleSuccess} trigger={<Button variant='outline' size='sm'>Modifier</Button>} />
            <ClientUserDialog clientId={client.id} clientName={client.name} onSuccess={handleSuccess} trigger={<Button variant='default' size='sm'>Créer Compte</Button>} />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: clients || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isMounted) {
    return <p>Chargement...</p>; // Avoid hydration errors
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Clients</h1>
        <ClientDialog onSuccess={handleSuccess} trigger={<Button>Nouveau Client</Button>} />
      </div>
      
      {isLoading && <p>Chargement des clients...</p>}
      {error && <p className="text-red-500">Erreur de chargement des clients.</p>}
      
      {clients && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">Aucun client.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}