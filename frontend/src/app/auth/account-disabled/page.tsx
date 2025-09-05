import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface AccountDisabledPageProps {
  searchParams: Promise<{
    reason?: string;
  }>;
}

async function AccountDisabledContent({ searchParams }: AccountDisabledPageProps) {
  const params = await searchParams;
  const reason = params.reason || 'account_disabled';

  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'account_disabled':
        return {
          title: 'Compte désactivé',
          description: 'Votre compte a été désactivé. Cela peut être dû à une violation des conditions d\'utilisation ou à une demande d\'inactivité prolongée.',
          icon: AlertTriangle,
        };
      case 'suspended':
        return {
          title: 'Compte suspendu',
          description: 'Votre compte a été suspendu temporairement. Veuillez contacter le support pour plus d\'informations.',
          icon: AlertTriangle,
        };
      case 'expired':
        return {
          title: 'Accès expiré',
          description: 'Votre période d\'accès a expiré. Veuillez renouveler votre abonnement ou contacter le support.',
          icon: AlertTriangle,
        };
      default:
        return {
          title: 'Accès refusé',
          description: 'Votre accès a été restreint. Veuillez contacter le support pour obtenir de l\'aide.',
          icon: AlertTriangle,
        };
    }
  };

  const { title, description, icon: Icon } = getReasonMessage(reason);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Icon className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Pour réactiver votre compte ou obtenir plus d'informations, contactez notre équipe support.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="mailto:support@nourx.com">
                <Mail className="mr-2 h-4 w-4" />
                Contacter le support par email
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="tel:+33123456789">
                <Phone className="mr-2 h-4 w-4" />
                Appeler le support
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Vous pensez que c'est une erreur ?
              </p>
              <Button asChild variant="link" size="sm">
                <Link href="mailto:support@nourx.com?subject=Erreur compte désactivé">
                  Signaler une erreur
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="ghost" className="w-full" size="sm">
              <Link href="/">
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AccountDisabledPage(props: AccountDisabledPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AccountDisabledContent {...props} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Compte désactivé | NourX',
  description: 'Votre compte a été désactivé. Contactez le support pour obtenir de l\'aide.',
};
