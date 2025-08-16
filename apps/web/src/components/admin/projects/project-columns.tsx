
'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Project } from "@/types/project"

export const columns: ColumnDef<Project>[] = [
  { accessorKey: "title", header: "Titre" },
  { accessorKey: "client_name", header: "Client" },
  { accessorKey: "status", header: "Statut" },
  { accessorKey: "progress", header: "Progression" },
  // TODO: Add actions
]
