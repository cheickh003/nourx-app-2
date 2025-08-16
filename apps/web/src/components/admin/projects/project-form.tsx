
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientApi } from "@/hooks/use-client-api";
import { ProjectFormData, projectSchema } from "./project-schema";
import { Client } from "@/types/client";

interface ProjectFormProps {
  onSuccess: () => void;
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const api = useClientApi();
  const form = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });

  const { data: clients } = useQuery<Client[]>({ queryKey: ['clients'], queryFn: () => api.get('/api/clients/').then(res => res.data.results) });

  const mutation = useMutation({
    mutationFn: (data: ProjectFormData) => api.post("/api/projects/", data),
    onSuccess: () => onSuccess(),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <FormField name="title" control={form.control} render={({ field }) => <FormItem><FormLabel>Titre du projet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField name="client" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Client</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger></FormControl>
              <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        {/* TODO: Add other fields like status, dates, etc. */}
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Création...' : 'Créer le projet'}</Button>
      </form>
    </Form>
  );
}
