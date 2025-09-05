export async function GET() {
  const now = new Date().toISOString();
  const categories = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Problème technique',
      description: 'Incident technique sur la plateforme',
      color: '#2563EB',
      formSchema: {
        fields: [
          { name: 'navigateur', type: 'select', label: 'Navigateur', required: true, options: ['Chrome','Firefox','Safari','Edge'] },
          { name: 'url', type: 'text', label: 'URL concernée', required: false, placeholder: 'https://...' },
          { name: 'capture', type: 'file', label: 'Capture d’écran', required: false },
        ],
      },
      slaResponseHours: 4,
      slaResolutionHours: 24,
      isActive: true,
      createdAt: now,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Facturation',
      description: 'Questions liées aux factures et paiements',
      color: '#16A34A',
      formSchema: {
        fields: [
          { name: 'numero_facture', type: 'text', label: 'Numéro de facture', required: true },
          { name: 'type_demande', type: 'select', label: 'Type de demande', required: true, options: ['Erreur de montant','Demande duplicata','Autre'] },
        ],
      },
      slaResponseHours: 8,
      slaResolutionHours: 72,
      isActive: true,
      createdAt: now,
    },
  ];

  return new Response(
    JSON.stringify({ categories }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}


