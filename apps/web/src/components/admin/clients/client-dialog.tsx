
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import { Client } from "@/types/client";

interface ClientDialogProps {
  client?: Client;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function ClientDialog({ client, onSuccess, trigger }: ClientDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Modifier le client' : 'Créer un nouveau client'}</DialogTitle>
          <DialogDescription>
            Remplissez les informations du client ici.
          </DialogDescription>
        </DialogHeader>
        <ClientForm client={client} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
