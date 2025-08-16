
'use client';

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invoiceSchema, InvoiceFormData } from "./invoice-schema";
import { useClientApi } from "@/hooks/use-client-api";
import { Client } from "@/types/client";
import { Trash2 } from "lucide-react";

interface InvoiceFormProps {
  onSuccess: () => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const api = useClientApi();
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'draft',
      items: [{ title: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: clients } = useQuery<Client[]>({ queryKey: ['clients'], queryFn: () => api.get('/api/clients/').then(res => res.data.results) });
  // TODO: Load projects based on selected client

  const mutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.post("/api/billing/invoices/", data),
    onSuccess: () => onSuccess(),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-4">
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
        {/* Project select would go here */}
        <FormField name="title" control={form.control} render={({ field }) => (
            <FormItem><FormLabel>Titre de la facture</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div>
          <h3 class="text-lg font-semibold">Articles</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md my-2">
              <FormField name={`items.${index}.title`} control={form.control} render={({ field }) => <FormItem className="flex-1"><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
              <FormField name={`items.${index}.quantity`} control={form.control} render={({ field }) => <FormItem><FormLabel>Qté</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
              <FormField name={`items.${index}.unit_price`} control={form.control} render={({ field }) => <FormItem><FormLabel>Prix Unitaire</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>} />
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ title: '', quantity: 1, unit_price: 0 })}>Ajouter un article</Button>
        </div>

        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Création...' : 'Créer la facture'}</Button>
      </form>
    </Form>
  );
}
