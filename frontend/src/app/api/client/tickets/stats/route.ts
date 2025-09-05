export async function GET() {
  return new Response(
    JSON.stringify({
      total: 0,
      byStatus: {
        open: 0,
        in_progress: 0,
        waiting_client: 0,
        resolved: 0,
        closed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
      averageResponseTime: 0,
      averageResolutionTime: 0,
      slaBreaches: 0,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}


