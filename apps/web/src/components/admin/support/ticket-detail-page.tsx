
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClientApi } from '@/hooks/use-client-api';
import { Ticket } from '@/types/support';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Assume these types exist
interface TicketAttachment { id: string; file_name: string; url?: string; file_size: number; mime_type: string; message_id?: string }
interface TicketMessage { id: string; author: { first_name: string; last_name?: string } | null; message: string; created_at: string; attachments?: TicketAttachment[] }
interface StaffUser { id: number; first_name: string; last_name: string }

function TicketActions({ ticket, staff, onSuccess }: { ticket: Ticket, staff: StaffUser[], onSuccess: () => void }) {
    const api = useClientApi();
    const mutation = useMutation({
        mutationFn: (data: { status?: string; assignee_id?: string }) => 
            api.post(`/api/tickets/${ticket.id}/${data.status ? 'update_status' : 'assign'}`, data),
        onSuccess,
    });

    return (
      <div className="flex gap-4">
        <Select onValueChange={(status) => mutation.mutate({ status })} defaultValue={ticket.status}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(assignee_id) => mutation.mutate({ assignee_id })}
          defaultValue={ticket.assigned_to ? String(ticket.assigned_to.id) : undefined}
        >
          <SelectTrigger><SelectValue placeholder="Assigner à..." /></SelectTrigger>
          <SelectContent>
            {staff?.map(s => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.first_name} {s.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
}

export function TicketDetailPage({ ticketId }: { ticketId: string }) {
  const api = useClientApi();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery<Ticket>({ 
    queryKey: ['ticket', ticketId], 
    queryFn: () => api.get(`/api/tickets/${ticketId}`).then(res => res.data) 
  });
  const { data: comments } = useQuery<TicketMessage[]>({ 
    queryKey: ['ticketComments', ticketId], 
    queryFn: () => api.get(`/api/tickets/${ticketId}/comments`).then(res => res.data) 
  });
  const { data: staff } = useQuery<StaffUser[]>({ 
    queryKey: ['staff'], 
    queryFn: () => api.get('/api/staff/').then(res => res.data) 
  });

  const commentMutation = useMutation({
      mutationFn: (message: string) => api.post(`/api/tickets/${ticketId}/comments`, { message }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticketComments', ticketId] })
  });

  if (isLoading) return <p>Chargement du ticket...</p>;
  if (!ticket) return <p>Ticket non trouvé.</p>;

  return (
    <div className="container mx-auto py-10 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
            <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {comments?.map(c => (
                  <div key={c.id} className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      <strong>{c.author ? `${c.author.first_name}${c.author.last_name ? ' ' + c.author.last_name : ''}` : 'Système'}:</strong> {new Date(c.created_at).toLocaleString('fr-FR')}
                    </div>
                    <div>{c.message}</div>
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {c.attachments.map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3">
                            {(a.mime_type || '').startsWith('image/') && a.url ? (
                              <a href={a.url} target="_blank" rel="noreferrer">
                                <img src={a.url} alt={a.file_name} className="h-16 w-16 object-cover rounded border" />
                              </a>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-muted rounded">{a.mime_type || 'fichier'}</span>
                            )}
                            <div className="text-xs">
                              <a className="underline" href={a.url} target="_blank" rel="noreferrer">{a.file_name}</a>
                              <div className="text-muted-foreground">{(((a.file_size ?? 0) / (1024*1024)) as number).toFixed(1)} MB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const form = e.currentTarget as HTMLFormElement & { message: { value: string }, attachments: { files: FileList } }
                  const text = form.message.value.trim()
                  const files = form.attachments?.files
                  if (!text && (!files || files.length === 0)) return
                  // Front validation fichiers
                  const allowed = [
                    'image/jpeg','image/png','image/gif','application/pdf','application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain','application/zip'
                  ]
                  const maxSize = 20 * 1024 * 1024
                  const invalid: string[] = []
                  if (files && files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                      const f = files[i]
                      if (f.size > maxSize) invalid.push(`${f.name}: trop volumineux`)
                      if (!allowed.includes(f.type)) invalid.push(`${f.name}: type non autorisé (${f.type || 'inconnu'})`)
                    }
                  }
                  if (invalid.length) {
                    // lazy import toast to avoid extra imports mismatch
                    try { (require('@/components/ui/use-toast') as any).useToast().toast({ title: 'Fichier non valide', description: invalid.join(' | ') }) } catch {}
                    return
                  }
                  commentMutation.mutate(text, { 
                    onSuccess: async (created: any) => {
                      if (files && files.length > 0) {
                        const createdId = created?.data?.id || created?.id
                        // CSRF token for multipart
                        let csrfToken: string | null = null
                        try {
                          const csrfRes = await fetch('/csrf', { credentials: 'include' })
                          const csrfJson = await csrfRes.json()
                          csrfToken = csrfJson?.csrftoken || csrfJson?.csrfToken || null
                        } catch {}
                        for (let i = 0; i < files.length; i++) {
                          const fd = new FormData()
                          fd.append('file', files[i])
                          if (createdId) fd.append('message_id', createdId)
                          await fetch(`/api/tickets/${ticketId}/attachments/`, { method: 'POST', body: fd, credentials: 'include', headers: csrfToken ? { 'X-CSRFToken': csrfToken } : undefined })
                        }
                        queryClient.invalidateQueries({ queryKey: ['ticketComments', ticketId] })
                      }
                      form.reset();
                    }
                  })
                }}>
                    <Textarea name="message" placeholder="Votre réponse..." />
                    <div className="mt-2"><input type="file" name="attachments" multiple /></div>
                    <Button type="submit" className="mt-2">Répondre</Button>
                </form>
            </CardContent>
        </Card>
      </div>
      <div>
        <Card>
            <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p><strong>Client:</strong> {ticket.client_name}</p>
                <p><strong>Priorité:</strong> {ticket.priority}</p>
                <TicketActions ticket={ticket} staff={staff || []} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
