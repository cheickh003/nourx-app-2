import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { Users, Plus, Building, Eye } from 'lucide-react'
import Link from 'next/link'
import { getJson } from '@/lib/api-client'

interface Organization {
  id: string;
  name: string;
  users: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

async function fetchOrganizations(): Promise<Organization[]> {
  // Appel backend (Lot 2): liste paginée des organisations
  const result = await getJson<{ success: boolean; data: any[]; pagination?: any }>('/api/orgs?page=1&limit=20')
  const orgs = Array.isArray(result.data) ? result.data : []
  // Adapter au modèle de table de la page (temporaire: users/status non fournis par l'API => valeurs par défaut)
  return orgs.map((o: any) => ({
    id: o.id,
    name: o.name,
    users: typeof o.users_count === 'number' ? o.users_count : 0,
    status: o.deleted_at ? 'inactive' : 'active',
    createdAt: o.created_at ?? o.createdAt ?? new Date().toISOString(),
  }))
}

export default async function AdminOrgsPage() {
  const organizations = await fetchOrganizations()
  const columns = [
    {
      key: 'name',
      label: 'Nom de l\'organisation',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium">{String(value)}</span>
        </div>
      )
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      render: (value: unknown) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{String(value)}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: unknown) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          String(value) === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {String(value) === 'active' ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      render: (value: unknown) => new Date(String(value)).toLocaleDateString('fr-FR')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Link href={`/admin/orgs/${String(item.id)}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Voir
            </Button>
          </Link>
          <Link href={`/admin/orgs/${String(item.id)}?tab=users`}>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Utilisateurs
            </Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organisations"
        description="Gérez les organisations et leurs utilisateurs"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle organisation
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total organisations</CardTitle>
            <CardDescription>
              Organisations enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-sm text-gray-600">+2 ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisations actives</CardTitle>
            <CardDescription>
              Avec utilisateurs actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => org.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">85% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total utilisateurs</CardTitle>
            <CardDescription>
              À travers toutes les organisations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((total, org) => total + (org.users || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Utilisateurs actifs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les organisations</CardTitle>
          <CardDescription>
            Liste complète des organisations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={organizations as unknown as Record<string, unknown>[]}
            columns={columns}
            searchable={true}
            searchPlaceholder="Rechercher une organisation..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
