'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useClientApi } from '@/hooks/use-client-api';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/project';
import { ProjectDataTable } from './project-data-table';
import { columns } from './project-columns';
import { ProjectDialog } from './project-dialog';

export function ProjectPage() {
  const api = useClientApi();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['adminProjects'],
    queryFn: () => api.get('/api/projects/').then(res => res.data.results),
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Projets</h1>
        <div className="flex gap-2">
          <Link href="/admin/projects/kanban">
            <Button variant="outline">Vue Kanban</Button>
          </Link>
          <ProjectDialog onSuccess={handleSuccess} />
        </div>
      </div>
      {isLoading && <p>Chargement...</p>}
      {projects && <ProjectDataTable columns={columns} data={projects} />}
    </div>
  );
}