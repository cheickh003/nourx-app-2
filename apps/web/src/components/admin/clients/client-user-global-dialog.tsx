'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClientApi } from '@/hooks/use-client-api'
import { useToast } from '@/components/ui/use-toast'
import type { Client } from '@/types/client'

const globalUserSchema = z.object({
  client_id: z.string().uuid('Client invalide'),
  first_name: z.string().min(2, 'Le prénom est requis.'),
  last_name: z.string().min(2, 'Le nom est requis.'),
  email: z.string().email('Email invalide.'),
  password: z.string().min(8, 'Au moins 8 caractères.'),
})

type GlobalUserForm = z.infer<typeof globalUserSchema>

export function ClientUserGlobalDialog({ clients, onSuccess, loading }: { clients: Client[]; onSuccess: () => void; loading?: boolean }) {
  const [open, setOpen] = useState(false)
  const api = useClientApi()
  const { toast } = useToast()

  const form = useForm<GlobalUserForm>({ resolver: zodResolver(globalUserSchema) })

  const mutation = useMutation({
    mutationFn: (data: GlobalUserForm) => api.post('/api/auth/create-client-user/', data),
    onSuccess: () => {
      toast({ title: 'Utilisateur créé', description: "Un email de définition du mot de passe a été envoyé." })
      onSuccess()
      setOpen(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error?.message || 'Création impossible' })
    },
  })

  const disabled = loading || !clients || clients.length === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>Ajouter un utilisateur</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un utilisateur client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              name="client_id"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="first_name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="last_name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="password" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Création...' : 'Créer le compte'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
