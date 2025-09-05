import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ClientSidebar } from '@/components/client/ClientSidebar';
import { auth, canAccessClientPortal } from '@/lib/auth';

interface ClientLayoutProps {
  children: ReactNode;
}

export default async function ClientLayout({ children }: ClientLayoutProps) {
  // Vérification de session côté serveur
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('better-auth.session_token')?.value;

  if (!sessionToken) {
    // Rediriger vers la page de connexion client
    redirect('/auth/login');
  }

  // Valider la session et récupérer les informations utilisateur
  const sessionData = await auth.validateSession(sessionToken);

  if (!sessionData) {
    // Session invalide, rediriger vers la connexion
    redirect('/auth/login');
  }

  const { user } = sessionData;

  // Vérifier l'état du compte
  if (!user.isActive) {
    redirect('/auth/account-disabled?reason=account_disabled');
  }

  // Vérifier les permissions d'accès au portail client
  if (!canAccessClientPortal(user)) {
    // Rediriger vers la page "mauvais portail"
    redirect(`/auth/wrong-portal?required=client&current=${user.userType}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <ClientSidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
