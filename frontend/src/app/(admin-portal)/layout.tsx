import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { auth, canAccessAdminPortal } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  console.log('🔍 AdminLayout - Vérification session');
  // Vérification de session côté serveur
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('better-auth.session_token')?.value;
  console.log('🍪 AdminLayout - Token trouvé:', sessionToken ? 'oui' : 'non');

  if (!sessionToken) {
    console.log('❌ AdminLayout - Pas de token, redirection vers admin-login');
    // Rediriger vers la page de connexion admin
    redirect('/auth/admin-login');
  }

  // Valider la session et récupérer les informations utilisateur
  console.log('🔍 AdminLayout - Validation session');
  const sessionData = await auth.validateSession(sessionToken);
  console.log('📋 AdminLayout - Données session:', sessionData ? 'valide' : 'null');

  if (!sessionData) {
    console.log('❌ AdminLayout - Session invalide, redirection vers admin-login');
    // Session invalide, rediriger vers la connexion
    redirect('/auth/admin-login');
  }

  const { user } = sessionData;

  // Vérifier l'état du compte
  if (!user.isActive) {
    redirect('/auth/account-disabled?reason=account_disabled');
  }

  // Vérifier les permissions d'accès au portail admin
  if (!canAccessAdminPortal(user)) {
    // Rediriger vers la page "mauvais portail"
    redirect(`/auth/wrong-portal?required=admin&current=${user.userType}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
