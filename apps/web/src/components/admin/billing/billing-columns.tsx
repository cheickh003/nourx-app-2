
'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Invoice } from "@/types/invoice"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoice_number",
    header: "Numéro",
  },
  {
    accessorKey: "client_name",
    header: "Client",
  },
  {
    accessorKey: "project_title",
    header: "Projet",
  },
  {
    accessorKey: "status",
    header: "Statut",
    // TODO: Add badge for status
  },
  {
    accessorKey: "total_ttc",
    header: "Montant",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_ttc"))
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "due_date",
    header: "Échéance",
    cell: ({ row }) => new Date(row.getValue("due_date")).toLocaleDateString('fr-FR'),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original
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
            <DropdownMenuItem>Modifier</DropdownMenuItem>
            <DropdownMenuItem>Voir le PDF</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500">Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
