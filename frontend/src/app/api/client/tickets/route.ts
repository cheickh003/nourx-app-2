const globalStore: { tickets?: any[] } = (globalThis as any).__nourx_ticket_store__ || ((globalThis as any).__nourx_ticket_store__ = {});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '20');
  const tickets = globalStore.tickets || [];

  return new Response(
    JSON.stringify({
      tickets: tickets.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: tickets.length,
        hasNext: page * limit < tickets.length,
        hasPrev: page > 1,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = (globalThis as any).crypto?.randomUUID?.() || '33333333-3333-3333-3333-333333333333';
    const now = new Date().toISOString();

    // Réponse minimale pour satisfaire l'UI (utilise ticket.id pour rediriger)
    const ticket = {
      id,
      organizationId: '00000000-0000-0000-0000-000000000000',
      categoryId: body?.categoryId ?? null,
      title: body?.title ?? 'Sans titre',
      description: body?.description ?? '',
      status: 'open',
      priority: body?.priority ?? 'medium',
      createdBy: '00000000-0000-0000-0000-000000000000',
      assignedTo: null,
      dueDate: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // stocker en mémoire pour alimenter la liste
    if (!globalStore.tickets) globalStore.tickets = [];
    globalStore.tickets.unshift(ticket);

    return new Response(JSON.stringify(ticket), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: 'Invalid request' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


