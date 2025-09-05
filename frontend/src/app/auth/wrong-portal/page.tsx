import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

interface WrongPortalPageProps {
  searchParams: Promise<{
    required?: string;
    current?: string;
  }>;
}

async function WrongPortalContent({ searchParams }: WrongPortalPageProps) {
  const params = await searchParams;
  const required = params.required || 'unknown';
  const current = params.current || 'unknown';

  const getPortalInfo = (portalType: string) => {
    switch (portalType) {
      case 'admin':
        return {
          name: 'Portail Administrateur',
          description: 'Gérez les organisations, les utilisateurs et les paramètres système.',
          loginPath: '/auth/admin-login',
          portalPath: '/admin',
          color: 'blue',
        };
      case 'client':
        return {
          name: 'Portail Client',
          description: 'Accédez à vos projets, factures et support technique.',
          loginPath: '/auth/login',
          portalPath: '/client',
          color: 'green',
        };
      default:
        return {
          name: 'Portail Inconnu',
          description: 'Le portail demandé n\'est pas reconnu.',
          loginPath: '/',
          portalPath: '/',
          color: 'gray',
        };
    }
  };

  const requiredPortal = getPortalInfo(required);
  const currentUserType = current === 'admin' ? 'Administrateur' : current === 'client' ? 'Client' : 'Utilisateur';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Mauvais portail
          </CardTitle>
          <CardDescription className="text-gray-600">
            Vous êtes connecté en tant que <strong>{currentUserType}</strong> mais tentez d'accéder au {requiredPortal.name.toLowerCase()}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-orange-800 mb-1">
                  Accès restreint
                </h3>
                <p className="text-sm text-orange-700">
                  Votre rôle actuel ne vous permet pas d'accéder à cette section.
                  Vous devez utiliser le portail approprié à votre profil utilisateur.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {requiredPortal.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {requiredPortal.description}
            </p>
            <Button asChild className="w-full" size="sm">
              <Link href={requiredPortal.loginPath}>
                Accéder au {requiredPortal.name.toLowerCase()}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              Vous pouvez également :
            </p>

            <div className="grid grid-cols-1 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/logout">
                  Changer de compte
                </Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  Retour à l'accueil
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Besoin d'aide avec vos accès ?
              </p>
              <Button asChild variant="link" size="sm">
                <Link href="mailto:support@nourx.com?subject=Problème d'accès portail">
                  Contacter le support
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function WrongPortalPage(props: WrongPortalPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <WrongPortalContent {...props} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Mauvais portail | NourX',
  description: 'Vous tentez d\'accéder à un portail qui ne correspond pas à votre profil utilisateur.',
};
