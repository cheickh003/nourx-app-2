
'use client';

import { KanbanBoard } from "./kanban-board";

export function ProjectKanbanPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pilotage des Projets</h1>
        {/* TODO: Add filters for projects/users */}
      </div>
      <KanbanBoard />
    </div>
  );
}
