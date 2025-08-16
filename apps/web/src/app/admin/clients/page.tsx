'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientUserGlobalDialog } from '@/components/admin/clients/client-user-global-dialog'
import { ClientUserDialog } from '@/components/admin/clients/client-user-dialog'
import type { Client } from '@/types/client'
import { apiClient, handleApiError } from '@/lib/api'

export default function AdminClientsPage() {
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Client>>({
    name: '', email: '', phone: '', address: '',
    main_contact_name: '', main_contact_email: '', main_contact_phone: '',
    industry: '', company_size: '', status: 'prospect', notes: ''
  })

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res: any = await apiClient.get<any>('/api/clients')
      setItems(Array.isArray(res?.results) ? res.results : res)
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startCreate = () => {
    setForm({ name: '', email: '', main_contact_name: '', main_contact_email: '', status: 'prospect' } as any)
    setCreating(true)
    setEditId(null)
  }

  const startEdit = (c: Client) => {
    setForm({ ...c })
    setEditId(c.id)
    setCreating(false)
  }

  const cancel = () => {
    setCreating(false)
    setEditId(null)
  }

  const saveCreate = async () => {
    try {
      setLoading(true)
      await apiClient.post('/api/clients', form)
      setCreating(false)
      await load()
    } catch (e) { setError(handleApiError(e)) } finally { setLoading(false) }
  }

  const saveEdit = async () => {
    if (!editId) return
    try {
      setLoading(true)
      await apiClient.patch(`/api/clients/${editId}`, form)
      setEditId(null)
      await load()
    } catch (e) { setError(handleApiError(e)) } finally { setLoading(false) }
  }

  return (
    <AdminLayout title="Clients">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestion des clients</h1>
            <p className="text-muted-foreground">Créer, modifier et suivre vos clients/prospects</p>
          </div>
          <div className="flex gap-2">
            <ClientUserGlobalDialog clients={items} onSuccess={load} />
            <Button onClick={startCreate}>Nouveau client</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Chargement...</div>}
            {error && <div className="text-destructive">Erreur: {error}</div>}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Nom</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Contact</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-left py-2">Utilisateur</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2">{c.name}</td>
                        <td className="py-2">{c.email}</td>
                        <td className="py-2">{c.main_contact_name}</td>
                        <td className="py-2">{c.status}</td>
                        <td className="py-2">
                          <ClientUserDialog
                            clientId={c.id}
                            clientName={c.name}
                            onSuccess={load}
                            trigger={<Button variant="outline" size="sm">Ajouter</Button>}
                          />
                        </td>
                        <td className="py-2 text-right"><Button variant="outline" size="sm" onClick={() => startEdit(c)}>Modifier</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {(creating || editId) && (
          <Card>
            <CardHeader>
              <CardTitle>{creating ? 'Nouveau client' : 'Modifier client'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Nom</label>
                  <Input value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Email</label>
                  <Input value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Téléphone</label>
                  <Input value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Adresse</label>
                  <Input value={form.address || ''} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Contact principal</label>
                  <Input value={form.main_contact_name || ''} onChange={(e) => setForm(f => ({ ...f, main_contact_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Email contact</label>
                  <Input value={form.main_contact_email || ''} onChange={(e) => setForm(f => ({ ...f, main_contact_email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Téléphone contact</label>
                  <Input value={form.main_contact_phone || ''} onChange={(e) => setForm(f => ({ ...f, main_contact_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Secteur</label>
                  <Input value={form.industry || ''} onChange={(e) => setForm(f => ({ ...f, industry: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm">Taille</label>
                  <Select value={(form.company_size as any) || ''} onValueChange={(v) => setForm(f => ({ ...f, company_size: v as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employés</SelectItem>
                      <SelectItem value="11-50">11-50 employés</SelectItem>
                      <SelectItem value="51-200">51-200 employés</SelectItem>
                      <SelectItem value="200+">200+ employés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Statut</label>
                  <select className="w-full border rounded-md px-3 py-2" value={form.status || 'prospect'} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="prospect">Prospect</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">Notes</label>
                  <Input value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {creating ? (
                  <Button onClick={saveCreate} disabled={loading}>Créer</Button>
                ) : (
                  <Button onClick={saveEdit} disabled={loading}>Enregistrer</Button>
                )}
                <Button variant="outline" onClick={cancel}>Annuler</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
