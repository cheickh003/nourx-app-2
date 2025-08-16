'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { clientSchema, ClientFormData } from "./client-schema";
import { useClientApi } from "@/hooks/use-client-api";
import { Client } from "@/types/client";
import { useToast } from "@/components/ui/use-toast";

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const api = useClientApi();
  const { toast } = useToast();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || { 
      name: '',
      email: '',
      phone: '',
      address: '',
      main_contact_name: '',
      main_contact_email: '',
      main_contact_phone: '',
      industry: '',
      company_size: undefined,
      status: 'prospect',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ClientFormData) => {
      const request = client
        ? api.put(`/api/clients/${client.id}`, data)
        : api.post("/api/clients", data);
      return request;
    },
    onSuccess: () => {
      toast({ title: client ? 'Client mis à jour' : 'Client créé' });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: (err?.message as string) || 'Échec de l\'opération' });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    // Nettoyage des champs optionnels vides pour éviter des validations inutiles côté API
    const payload: Record<string, any> = { ...data }
    ;['phone','address','main_contact_phone','industry','company_size'].forEach((k) => {
      if ((payload as any)[k] === '' || (payload as any)[k] === undefined) delete (payload as any)[k]
    })
    mutation.mutate(payload as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du client</FormLabel>
              <FormControl>
                <Input placeholder="ex: Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Client actif</SelectItem>
                  <SelectItem value="inactive">Client inactif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
        />

        <FormField
          control={form.control}
          name="company_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taille de l'entreprise</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une taille" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employés</SelectItem>
                  <SelectItem value="11-50">11-50 employés</SelectItem>
                  <SelectItem value="51-200">51-200 employés</SelectItem>
                  <SelectItem value="200+">200+ employés</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email principal</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@acme.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input placeholder="ex: +33 6 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-medium pt-4">Contact Principal</h3>
        <FormField
          control={form.control}
          name="main_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du contact</FormLabel>
              <FormControl>
                <Input placeholder="ex: Jean Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="main_contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email du contact</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jean.dupont@acme.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="main_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone du contact (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="ex: +33 6 12 34 56 78" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </Form>
  );
}
