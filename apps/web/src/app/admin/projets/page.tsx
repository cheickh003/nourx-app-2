'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects, useClients, useApiMutation } from '@/hooks/use-client-api'
import type { Project, Client } from '@/types/client'

// Align with backend Project.STATUS_CHOICES
// Django: 'draft', 'active', 'on_hold', 'completed', 'cancelled'
const PROJECT_STATUSES = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'active', label: 'Actif' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

export default function AdminProjectsPage() {
  const { data: projects, loading, error, refetch } = useProjects()
  const { data: clients } = useClients()
  const { mutate, loading: mutationLoading } = useApiMutation()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const handleCreateClick = () => {
    setSelectedProject(null)
    setDialogOpen(true)
  }

  const handleEditClick = (project: Project) => {
    setSelectedProject(project)
    setDialogOpen(true)
  }

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      try {
        await mutate(`/api/projects/${id}`, 'DELETE')
        refetch()
      } catch (e) {
        console.error(e)
        // Handle error display
      }
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    
    // Convert progress to number
    data.progress = Number(data.progress)

    try {
      if (selectedProject) {
        await mutate(`/api/projects/${selectedProject.id}`, 'PATCH', data)
      } else {
        await mutate('/api/projects', 'POST', data)
      }
      refetch()
      setDialogOpen(false)
    } catch (e) {
      console.error(e)
      // Handle error display
    }
  }

  return (
    <AdminLayout title="Projets">
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreateClick}>Créer un projet</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Tous les projets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-destructive">Erreur: {error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Titre</th>
                      <th className="text-left py-2">Client</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-left py-2">Progression</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projects || []).map((p: Project) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2">{p.title}</td>
                        <td className="py-2">{p.client_name || '-'}</td>
                        <td className="py-2">{PROJECT_STATUSES.find(s => s.value === p.status)?.label || p.status}</td>
                        <td className="py-2">{p.progress}%</td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(p)}>
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => handleDeleteClick(p.id)}
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProject ? 'Modifier le projet' : 'Créer un projet'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titre
                </Label>
                <Input id="title" name="title" defaultValue={selectedProject?.title} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Select name="client" defaultValue={selectedProject?.client}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map((client: Client) => (
                      <SelectItem key={client.id} value={`${client.id}`}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Statut
                </Label>
                <Select name="status" defaultValue={selectedProject?.status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="progress" className="text-right">
                  Progression (%)
                </Label>
                <Input id="progress" name="progress" type="number" defaultValue={selectedProject?.progress} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutationLoading}>
                {mutationLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
