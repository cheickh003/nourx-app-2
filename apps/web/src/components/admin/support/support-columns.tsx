
'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@/types/support"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: "Sujet",
  },
  {
    header: "Projet",
    accessorFn: (row) => row.project?.title || '-',
    id: 'project',
  },
  {
    accessorKey: "status",
    header: "Statut",
  },
  {
    accessorKey: "priority",
    header: "Priorité",
  },
  {
    header: "Assigné à",
    id: 'assigned_to',
    cell: ({ row }) => {
      const a = row.original.assigned_to
      return a ? `${a.first_name} ${a.last_name}` : 'Non assigné'
    },
  },
  {
    accessorKey: "messages_count",
    header: "Messages",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/admin/support/${row.original.id}`}>
        <Button variant="outline" size="sm">Détails</Button>
      </Link>
    ),
  },
]
