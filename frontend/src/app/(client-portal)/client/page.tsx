import { redirect } from 'next/navigation';

export default function ClientHomePage() {
  // Rediriger vers le dashboard par défaut
  redirect('/client/dashboard');
}

export const metadata = {
  title: 'Portail Client | NourX',
  description: 'Tableau de bord client NourX',
};
