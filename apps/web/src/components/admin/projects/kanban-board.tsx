
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { useClientApi } from '@/hooks/use-client-api';

// Define types based on your API response
interface Task {
  id: string;
  title: string;
  project: { id: string; title: string };
}

interface KanbanColumn {
  label: string;
  tasks: Task[];
}

type KanbanData = Record<string, KanbanColumn>;

export function KanbanBoard() {
  const api = useClientApi();
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<KanbanData>({});

  const { data, isLoading } = useQuery<KanbanData>({
    queryKey: ['kanbanData'],
    queryFn: () => api.get('/api/tasks/kanban/').then(res => res.data),
  });

  useEffect(() => {
    if (data) {
      setColumns(data);
    }
  }, [data]);

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: string }) => 
      api.post(`/api/tasks/${taskId}/update_status/`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanData'] });
    },
    // TODO: Add optimistic updates for a smoother UI
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const startCol = columns[source.droppableId];
    const endCol = columns[destination.droppableId];
    const task = startCol.tasks.find(t => t.id === draggableId);

    if (!task) return;

    // Optimistic update on the client
    const newStartTasks = Array.from(startCol.tasks);
    newStartTasks.splice(source.index, 1);

    const newEndTasks = Array.from(endCol.tasks);
    newEndTasks.splice(destination.index, 0, task);

    const newColumns = {
      ...columns,
      [source.droppableId]: {
        ...startCol,
        tasks: newStartTasks,
      },
      [destination.droppableId]: {
        ...endCol,
        tasks: newEndTasks,
      },
    };
    setColumns(newColumns);

    // Trigger the API call
    updateTaskStatusMutation.mutate({ taskId: draggableId, newStatus: destination.droppableId });
  };

  if (isLoading) return <p>Chargement du tableau de bord...</p>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.entries(columns).map(([columnId, column]) => (
          <Droppable key={columnId} droppableId={columnId}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-gray-100 rounded-lg p-4 w-80 flex-shrink-0 ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}>
                <h2 className="font-bold mb-4">{column.label} ({column.tasks.length})</h2>
                <div className="space-y-3 min-h-[400px]">
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-md p-3 shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                          <p className="font-semibold">{task.title}</p>
                          <p className="text-sm text-gray-500">Projet: {task.project.title}</p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
