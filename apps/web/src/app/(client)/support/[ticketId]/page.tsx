'use client'

import { ClientLayout } from '@/components/layout/client-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useClientApi } from '@/hooks/use-client-api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function ClientTicketDetailPage({ params }: { params: { ticketId: string } }) {
  const api = useClientApi()
  const queryClient = useQueryClient()
  const ticketId = params.ticketId
  const { user } = useAuth()
  const { toast } = useToast()
  const ALLOWED_MIME_TYPES = [
    'image/jpeg','image/png','image/gif','application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','application/zip'
  ]
  const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024
  const formatBytes = (bytes: number) => {
    if (bytes === undefined || bytes === null) return ''
    const sizes = ['B','KB','MB','GB']
    const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
  const isImage = (mime?: string) => (mime || '').startsWith('image/')

  const { data: ticket, isLoading } = useQuery<any>({
    queryKey: ['clientTicket', ticketId],
    queryFn: () => api.get(`/api/tickets/${ticketId}`).then(res => res.data),
  })

  const { data: comments } = useQuery<any[]>({
    queryKey: ['clientTicketComments', ticketId],
    queryFn: () => api.get(`/api/tickets/${ticketId}/comments`).then(res => res.data),
  })

  const commentMutation = useMutation({
    mutationFn: (message: string) => api.post(`/api/tickets/${ticketId}/comments`, { message }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientTicketComments', ticketId] }),
  })

  if (isLoading) {
    return (
      <ClientLayout title="Support">
        <div className="p-6">Chargement du ticket...</div>
      </ClientLayout>
    )
  }

  if (!ticket) {
    return (
      <ClientLayout title="Support">
        <div className="p-6">Ticket introuvable.</div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout title={`Ticket #${ticket.ticket_number || ticket.id}`}>
      <div className="p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments?.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <strong>{c.author ? `${c.author.first_name}${c.author.last_name ? ' ' + c.author.last_name : ''}` : 'Système'}:</strong> {new Date(c.created_at).toLocaleString('fr-FR')}
                  </div>
                  <div>{c.message}</div>
                  {Array.isArray((c as any).attachments) && (c as any).attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {(c as any).attachments.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3">
                          {isImage(a.mime_type) && a.url ? (
                            <a href={a.url} target="_blank" rel="noreferrer">
                              <img src={a.url} alt={a.file_name} className="h-16 w-16 object-cover rounded border" />
                            </a>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-muted rounded">{a.mime_type || 'fichier'}</span>
                          )}
                          <div className="text-xs">
                            {a.url ? (
                              <a className="underline" href={a.url} target="_blank" rel="noreferrer">{a.file_name}</a>
                            ) : (
                              <span>{a.file_name} <span className="text-muted-foreground">(non accessible)</span></span>
                            )}
                            <div className="text-muted-foreground">{formatBytes(a.file_size)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget as HTMLFormElement & { message: { value: string }, attachments: { files: FileList } }
                  const text = form.message.value.trim()
                  const files = form.attachments?.files
                  if (!text && (!files || files.length === 0)) return
                  // front validation
                  const invalid: string[] = []
                  if (files && files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                      const f = files[i]
                      if (f.size > MAX_ATTACHMENT_SIZE) invalid.push(`${f.name}: trop volumineux`)
                      if (!ALLOWED_MIME_TYPES.includes(f.type)) invalid.push(`${f.name}: type non autorisé (${f.type || 'inconnu'})`)
                    }
                  }
                  if (invalid.length) {
                    toast({ title: 'Fichier non valide', description: invalid.join(' | ') })
                    return
                  }
                  commentMutation.mutate(text, {
                    onSuccess: async (created: any) => {
                      // Upload attachments if any
                      if (files && files.length > 0) {
                        // Fetch CSRF token for multipart POST
                        let csrfToken: string | null = null
                        try {
                          const csrfRes = await fetch('/csrf', { credentials: 'include' })
                          const csrfJson = await csrfRes.json()
                          csrfToken = csrfJson?.csrftoken || csrfJson?.csrfToken || null
                        } catch {}
                        for (let i = 0; i < files.length; i++) {
                          const fd = new FormData()
                          fd.append('file', files[i])
                          const createdId = created?.data?.id || created?.id
                          if (createdId) fd.append('message_id', createdId)
                          await fetch(`/api/tickets/${ticketId}/attachments/`, {
                            method: 'POST',
                            body: fd,
                            credentials: 'include',
                            headers: csrfToken ? { 'X-CSRFToken': csrfToken } : undefined,
                          })
                        }
                        queryClient.invalidateQueries({ queryKey: ['clientTicketComments', ticketId] })
                      }
                      form.reset()
                    }
                  })
                }}
              >
                <Textarea name="message" placeholder="Votre message..." />
                <div className="mt-2">
                  <input type="file" name="attachments" multiple accept={ALLOWED_MIME_TYPES.join(',')} />
                </div>
                <Button type="submit" className="mt-2" disabled={commentMutation.isPending}>
                  {commentMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Statut:</strong> {ticket.status}</div>
              <div><strong>Priorité:</strong> {ticket.priority}</div>
              {ticket.project?.title && <div><strong>Projet:</strong> {ticket.project.title}</div>}
              {ticket.assigned_to_name && <div><strong>Assigné à:</strong> {ticket.assigned_to_name}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  )
}
