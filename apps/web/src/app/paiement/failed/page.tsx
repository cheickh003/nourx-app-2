'use client'

import Link from 'next/link'

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Paiement échoué</h1>
        <p className="text-muted-foreground">Votre paiement n'a pas pu être finalisé.</p>
        <Link className="text-primary underline" href="/factures">Retour à mes factures</Link>
      </div>
    </div>
  )
}

