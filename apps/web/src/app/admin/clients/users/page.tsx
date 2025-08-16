"use client"

import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClientApi } from '@/hooks/use-client-api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import type { Client } from '@/types/client'

interface MemberRow {
  id: string
  user: { id: number; email: string; first_name: string; last_name: string; is_staff: boolean; is_superuser: boolean }
  client: Client
}

export default function AdminClientUsersPage() {
  const api = useClientApi()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [filterClient, setFilterClient] = useState<string>('all')

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/api/clients')
      const d = res.data as any
      return Array.isArray(d?.results) ? d.results : d
    }
  })

  const { data: members, isLoading } = useQuery<MemberRow[]>({
    queryKey: ['client-members', filterClient],
    queryFn: async () => {
      const qs = filterClient && filterClient !== 'all' ? `?client=${filterClient}` : ''
      const res = await api.get(`/api/client-members${qs}`)
      const d = res.data as any
      return Array.isArray(d?.results) ? d.results : d
    }
  })

  const mReset = useMutation({
    mutationFn: async (user_id: number) => {
      await api.post('/api/auth/reset-password/', { user_id })
    },
    onSuccess: () => {
      toast({ title: 'Email envoyé', description: 'Lien de réinitialisation envoyé.' })
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e?.message || 'Échec envoi email' })
  })

  const mStatus = useMutation({
    mutationFn: async (p: { user_id: number; is_active: boolean }) => {
      await api.patch(`/api/auth/users/${p.user_id}/status/`, { is_active: p.is_active })
    },
    onSuccess: () => {
      toast({ title: 'Statut mis à jour' })
      qc.invalidateQueries({ queryKey: ['client-members'] })
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e?.message || 'Échec mise à jour' })
  })


  return (
    <AdminLayout title="Utilisateurs clients">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">Lister, réinitialiser mot de passe, activer/désactiver</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="w-64">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {(clients || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Nom</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Client</th>
                      <th className="text-left py-2">Rôle</th>
                      <th className="text-left py-2">Actif</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(members || []).map(m => (
                      <tr key={m.id} className="border-b">
                        <td className="py-2">{m.user.first_name} {m.user.last_name}</td>
                        <td className="py-2">{m.user.email}</td>
                        <td className="py-2">{m.client.name}</td>
                        <td className="py-2">Compte client</td>
                        <td className="py-2">{(m as any).user?.is_active ? 'Oui' : 'Non'}</td>
                        <td className="py-2 text-right flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => mReset.mutate(m.user.id)} disabled={mReset.isPending}>Reset mot de passe</Button>
                          <Button variant="outline" size="sm" onClick={() => mStatus.mutate({ user_id: m.user.id, is_active: !((m as any).user?.is_active) })} disabled={mStatus.isPending}>
                            {((m as any).user?.is_active) ? 'Désactiver' : 'Activer'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
