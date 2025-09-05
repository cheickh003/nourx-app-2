export async function GET() {
  return new Response(
    JSON.stringify({
      projects: { active: 0, pendingDeliverables: 0, total: 0 },
      tickets: { open: 0, inProgress: 0, waitingClient: 0, total: 0 },
      billing: { pendingInvoices: 0, pendingAmount: 0, paidThisMonth: 0, total: 0 },
      documents: { recent: 0, total: 0 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}


