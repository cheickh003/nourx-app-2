import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building, Users, Mail, Phone, MapPin, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { getJson } from '@/lib/api-client'
import UsersTab from './users/page'

interface Organization {
  id: string;
  name: string;
  siret: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface OrganizationStats {
  userCount: number;
  activeUsers: number;
  projectCount: number;
  ticketCount: number;
}

async function fetchOrganization(id: string): Promise<Organization> {
  try {
    const result = await getJson<{ success: boolean; data: Organization }>(`/api/orgs/${id}`)
    if (!result.success || !result.data) {
      notFound()
    }
    return result.data
  } catch (error) {
    console.error('Error fetching organization:', error)
    notFound()
  }
}

async function fetchOrganizationStats(id: string): Promise<OrganizationStats> {
  try {
    // Essayer de récupérer les statistiques depuis l'API users
    const usersStats = await getJson<{ success: boolean; data: any }>(`/api/orgs/${id}/users/stats`)
    
    return {
      userCount: usersStats.data?.total || 0,
      activeUsers: usersStats.data?.active || 0,
      projectCount: 0, // TODO: à implémenter plus tard
      ticketCount: 0,  // TODO: à implémenter plus tard
    }
  } catch (error) {
    console.error('Error fetching organization stats:', error)
    return {
      userCount: 0,
      activeUsers: 0,
      projectCount: 0,
      ticketCount: 0,
    }
  }
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Promise<{ tab?: string }>
}) {
  const [organization, stats] = await Promise.all([
    fetchOrganization(params.id),
    fetchOrganizationStats(params.id),
  ])

  const params_data = await searchParams;
  const activeTab = params_data?.tab || 'overview'

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.name}
        description={`Créée le ${new Date(organization.createdAt).toLocaleDateString('fr-FR')}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/orgs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Badge variant={organization.deletedAt ? "destructive" : "default"}>
              {organization.deletedAt ? "Inactive" : "Active"}
            </Badge>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.userCount}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projets</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projectCount}</div>
                <p className="text-xs text-muted-foreground">
                  0 en cours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ticketCount}</div>
                <p className="text-xs text-muted-foreground">
                  0 ouverts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activité</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  cette semaine
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
                <CardDescription>
                  Détails de l&apos;organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">SIRET:</span>
                  <span className="text-sm text-gray-600">
                    {organization.siret || "Non renseigné"}
                  </span>
                </div>

                {organization.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Adresse:</span>
                    <span className="text-sm text-gray-600">
                      {organization.address}
                    </span>
                  </div>
                )}

                {organization.contactEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-gray-600">
                      {organization.contactEmail}
                    </span>
                  </div>
                )}

                {organization.contactPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Téléphone:</span>
                    <span className="text-sm text-gray-600">
                      {organization.contactPhone}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Dernière MAJ:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(organization.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Dernières actions sur cette organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 text-center py-8">
                  Aucune activité récente
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projets</CardTitle>
              <CardDescription>
                Gérez les projets de cette organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun projet pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les projets seront disponibles dans une version ultérieure
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de support</CardTitle>
              <CardDescription>
                Tickets de support de cette organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun ticket pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les tickets seront disponibles dans une version ultérieure
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}