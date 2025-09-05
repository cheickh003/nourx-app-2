// Reverse proxy to backend Better Auth. Falls back to mock if backend is unavailable.

const BACKEND_AUTH_BASE = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001';

async function proxy(request: Request) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, BACKEND_AUTH_BASE);
  // Ensure path starts with /api/auth/
  const path = url.pathname.replace(/^\/api\/auth/, '/api/auth');
  target.pathname = path;

  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
    redirect: 'manual',
    // Pass body for non-GET methods
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.clone().text(),
  };
  // Avoid overriding Host header
  init.headers.delete('host');

  const resp = await fetch(target.toString(), init);
  // Pass through status/body/headers (including Set-Cookie)
  const headers = new Headers(resp.headers);
  const text = await resp.text();
  return new Response(text, { status: resp.status, headers });
}

export async function GET(request: Request) {
  try {
    return await proxy(request);
  } catch (e) {
    // Fallback minimal session response (dev only)
    const url = new URL(request.url);
    if (url.pathname.includes('/session')) {
      return new Response(JSON.stringify({ data: { session: null, user: null } }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { message: 'Auth backend unavailable' } }), { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    return await proxy(request);
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: 'Auth backend unavailable' } }), { status: 502 });
  }
}
