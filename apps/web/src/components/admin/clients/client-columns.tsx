
'use client'

import { useMutation } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Client } from "@/types/client"
import { ClientDialog } from "./client-dialog"
import { ClientUserDialog } from "./client-user-dialog"

import { useClientApi } from "@/hooks/use-client-api"
import { useToast } from "@/components/ui/use-toast"

const DeleteConfirmation = ({ client, onSuccess }: { client: Client, onSuccess: () => void}) => {
  const api = useClientApi();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/api/clients/${client.id}`),
    onSuccess: () => { toast({ title: 'Client supprimé' }); onSuccess(); },
    onError: (err: any) => { toast({ title: 'Erreur', description: err?.message || 'Suppression impossible' }); },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-500 hover:bg-red-50">
          Supprimer
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce client ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le client "{client.name}" sera définitivement supprimé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Suppression...' : 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const columns = ({ onSuccess }: { onSuccess: () => void }): ColumnDef<Client>[] => [
  {
    accessorKey: "name",
    header: "Nom",
  },
  {
    id: 'add_user',
    header: 'Utilisateur',
    cell: ({ row }) => {
      const client = row.original
      return (
        <ClientUserDialog
          clientId={client.id}
          clientName={client.name}
          onSuccess={onSuccess}
          trigger={<Button variant="outline" size="sm">Ajouter</Button>}
        />
      )
    }
  },
  {
    accessorKey: "status",
    header: "Statut",
    // TODO: Add colored badge for status
  },
  {
    accessorKey: "main_contact_name",
    header: "Contact Principal",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ClientDialog client={client} onSuccess={onSuccess} />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ClientUserDialog
                clientId={client.id}
                clientName={client.name}
                onSuccess={onSuccess}
                trigger={<div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent w-full">Ajouter un utilisateur</div>}
              />
            </DropdownMenuItem>
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <DeleteConfirmation client={client} onSuccess={onSuccess} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
