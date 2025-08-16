'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientLayout } from '@/components/layout/client-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApiMutation, useProjects } from '@/hooks/use-client-api'

export default function NewSupportTicketPage() {
  const router = useRouter()
  const { data: projects } = useProjects()
  const { mutate, loading, error } = useApiMutation<any, any>()

  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('normal')
  const [projectId, setProjectId] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await mutate('/api/tickets', 'POST', {
        subject,
        description,
        priority,
        project: projectId ? Number(projectId) : null,
      })
      router.push('/support')
    } catch (e) {
      // error state is shown below
    }
  }

  return (
    <ClientLayout title="Nouveau ticket">
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Créer un ticket de support</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Sujet</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} className="w-full border rounded-md px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="low">Faible</option>
                    <option value="normal">Normale</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projet (optionnel)</label>
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="">—</option>
                    {(projects || []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">Erreur: {error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Envoi...' : 'Créer le ticket'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/support')}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}
