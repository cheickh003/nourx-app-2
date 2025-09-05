import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirection vers le dashboard client par défaut
  redirect('/client/dashboard');
}
