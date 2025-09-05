import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FileQuestion className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Page non trouvée</CardTitle>
          <CardDescription>
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Vérifiez l&apos;URL ou retournez à la page d&apos;accueil.
          </p>
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/client/dashboard">
                Aller au tableau de bord
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="javascript:history.back()">
                Retour à la page précédente
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
