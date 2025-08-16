
'use client';

import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useClientApi } from "@/hooks/use-client-api";
import { clientUserSchema, ClientUserFormData } from "./client-user-schema";
import { useToast } from "@/components/ui/use-toast";

interface ClientUserDialogProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function ClientUserDialog({ clientId, clientName, onSuccess, trigger }: ClientUserDialogProps) {
  const [open, setOpen] = useState(false);
  const api = useClientApi();
  const form = useForm<ClientUserFormData>({ resolver: zodResolver(clientUserSchema) });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: ClientUserFormData) => 
      api.post("/api/auth/create-client-user/", { ...data, client_id: clientId }),
    onSuccess: () => {
      toast({ title: 'Utilisateur créé', description: 'Un email de définition du mot de passe a été envoyé.' })
      onSuccess();
      setOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: (error as any)?.message || 'Création impossible' })
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">Ajouter un utilisateur</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un compte pour {clientName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <FormField name="first_name" control={form.control} render={({ field }) => <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField name="last_name" control={form.control} render={({ field }) => <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField name="email" control={form.control} render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField name="password" control={form.control} render={({ field }) => <FormItem><FormLabel>Mot de passe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>} />
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Création...' : 'Créer le compte'}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
