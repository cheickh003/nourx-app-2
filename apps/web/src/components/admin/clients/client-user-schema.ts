
import { z } from "zod";

export const clientUserSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis."),
  last_name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type ClientUserFormData = z.infer<typeof clientUserSchema>;
