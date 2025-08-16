'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useClientApi } from '@/hooks/use-client-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AppSettings {
    CINETPAY_SITE_ID?: string;
    BRANDING_LOGO_URL?: string;
}

export function ConfigurationPage() {
  const api = useClientApi();
  const queryClient = useQueryClient();
  const form = useForm<AppSettings>();

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['appSettings'],
    queryFn: () => api.get('/api/settings/').then(res => {
        form.reset(res.data);
        return res.data;
    }),
  });

  const mutation = useMutation({
      mutationFn: (data: AppSettings) => api.post('/api/settings/', data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] })
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Configuration du Système</h1>
      {isLoading ? (
        <p>Chargement...</p>
      ) : (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Paramètres CinetPay</CardTitle></CardHeader>
                    <CardContent>
                        <FormField name="CINETPAY_SITE_ID" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Site ID</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
                    <CardContent>
                        <FormField name="BRANDING_LOGO_URL" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>URL du Logo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                    </CardContent>
                </Card>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
            </form>
        </Form>
      )}
    </div>
  );
}