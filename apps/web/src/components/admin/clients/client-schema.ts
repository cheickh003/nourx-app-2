
import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Adresse email invalide." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  main_contact_name: z.string().min(2, { message: "Le nom du contact doit contenir au moins 2 caractères." }),
  main_contact_email: z.string().email({ message: "Adresse email du contact invalide." }),
  main_contact_phone: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.enum(["1-10", "11-50", "51-200", "200+"]).optional(),
  status: z.enum(["prospect", "active", "inactive", "archived"]),
});

export type ClientFormData = z.infer<typeof clientSchema>;
