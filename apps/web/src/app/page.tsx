'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur NOURX
          </h1>
          <p className="text-xl text-gray-600">
            Votre espace client pour le suivi de vos projets
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Accédez à votre espace personnel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" size="lg" asChild>
                <Link href="/login">
                  Se connecter
                </Link>
              </Button>
              <div className="text-center text-sm text-gray-500">
                Première visite ? Contactez votre équipe NOURX pour obtenir vos accès.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            NOURX - Phase 2 Frontend Client Complete ✅
          </p>
        </div>
      </div>
    </div>
  )
}
