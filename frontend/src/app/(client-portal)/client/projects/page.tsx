import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Données fictives pour les projets (à remplacer par des données réelles depuis l'API)
const projects = [
  {
    id: 'refonte-site-web',
    name: 'Refonte site web',
    description: 'Développement d\'une nouvelle plateforme',
    progress: 75,
    status: 'active',
    dueDate: '15 mars'
  },
  {
    id: 'application-mobile',
    name: 'Application mobile',
    description: 'Développement iOS et Android',
    progress: 45,
    status: 'pending',
    dueDate: '30 mars'
  }
];

export default function ClientProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Projets"
        description="Suivez l'avancement de vos projets"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projets actifs</CardTitle>
            <CardDescription>
              En cours de réalisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-sm text-gray-600">2 livrables en attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terminés ce mois</CardTitle>
            <CardDescription>
              Projets finalisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-sm text-gray-600">Tous validés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Échéances proches</CardTitle>
            <CardDescription>
              À surveiller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-sm text-red-600">Dans 3 jours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Progression</span>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    {project.status === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    <span>
                      {project.status === 'active' ? 'Phase de développement' : 'En attente de validation'}
                    </span>
                  </div>
                  <span>•</span>
                  <span>Échéance: {project.dueDate}</span>
                </div>
                <Link href={`/client/projects/${project.id}`}>
                  <Button size="sm" className="w-full">
                    Voir les détails
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
