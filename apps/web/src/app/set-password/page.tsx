"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useClientApi } from '@/hooks/use-client-api'
import { useToast } from '@/components/ui/use-toast'

export default function SetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const api = useClientApi()
  const { toast } = useToast()

  const [uid, setUid] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setUid(params.get('uid') || '')
    setToken(params.get('token') || '')
  }, [params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !token) {
      toast({ title: 'Lien invalide', description: 'Paramètres manquants.' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Mot de passe trop court', description: '8 caractères minimum.' })
      return
    }
    if (password !== confirm) {
      toast({ title: 'Les mots de passe ne correspondent pas' })
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/auth/set-password/', { uid, token, password })
      toast({ title: 'Mot de passe défini', description: 'Vous pouvez vous connecter.' })
      router.push('/login')
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible de définir le mot de passe.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Définir votre mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input type="password" placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'En cours...' : 'Valider'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

