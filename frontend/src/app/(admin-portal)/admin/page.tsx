import { redirect } from 'next/navigation';

export default function AdminHomePage() {
  // Rediriger vers le dashboard par défaut
  redirect('/admin/dashboard');
}

export const metadata = {
  title: 'Portail Administrateur | NourX',
  description: 'Tableau de bord administrateur NourX',
};
