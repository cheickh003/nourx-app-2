
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";

export function ProjectDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nouveau Projet</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Créer un nouveau projet</DialogTitle></DialogHeader>
        <ProjectForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
