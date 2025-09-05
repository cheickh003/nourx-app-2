export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = (globalThis as any).crypto?.randomUUID?.() || '44444444-4444-4444-4444-444444444444';
    const now = new Date().toISOString();

    const reply = {
      id,
      ticketId: params.id,
      authorId: '00000000-0000-0000-0000-000000000000',
      content: body?.content ?? '',
      isInternal: !!body?.isInternal,
      attachments: body?.attachments ?? [],
      createdAt: now,
    };

    return new Response(JSON.stringify(reply), {
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


