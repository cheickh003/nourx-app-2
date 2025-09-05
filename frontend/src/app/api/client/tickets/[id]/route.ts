export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const now = new Date().toISOString();
  const ticket = {
    id,
    organizationId: '00000000-0000-0000-0000-000000000000',
    categoryId: null,
    title: 'Ticket mock',
    description: 'Contenu du ticket',
    status: 'open',
    priority: 'medium',
    createdBy: '00000000-0000-0000-0000-000000000000',
    assignedTo: null,
    dueDate: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return new Response(JSON.stringify(ticket), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}


