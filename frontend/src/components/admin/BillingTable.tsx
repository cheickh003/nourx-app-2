import dynamic from 'next/dynamic';

// Chargement paresseux du composant de table de facturation
const BillingTableContent = dynamic(() => import('./BillingTableContent').then(mod => ({ default: mod.BillingTableContent })), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <span className="ml-2 text-gray-600">Chargement de la table...</span>
    </div>
  ),
  ssr: false // Désactiver SSR pour éviter les problèmes avec react-pdf
});

// Composant wrapper pour le code-splitting
export default function BillingTable(props: any) {
  return <BillingTableContent {...props} />;
}