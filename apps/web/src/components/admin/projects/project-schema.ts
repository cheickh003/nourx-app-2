
import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
  client: z.string().min(1, "Un client doit être sélectionné."),
  status: z.string().min(1, "Le statut est requis."),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
