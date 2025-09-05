'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        await fetch('/api/auth/sign-out', { method: 'POST' });
      } catch (_) {
        // ignore
      } finally {
        router.replace('/auth/login');
      }
    };
    run();
  }, [router]);

  return null;
}

// Metadata cannot be exported from a client component. If needed, add a
// server-only head in a separate file or rely on layout metadata.

