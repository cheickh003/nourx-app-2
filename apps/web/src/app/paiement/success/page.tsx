'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const params = useSearchParams()
  const [status, setStatus] = useState<string>('processing')
  const tx = params.get('transaction_id') || params.get('transactionId') || ''

  useEffect(() => {
    const verify = async () => {
      if (!tx) { setStatus('unknown'); return }
      try {
        const resp = await fetch(`/api/payments/check/?transaction_id=${encodeURIComponent(tx)}`, { credentials: 'include' })
        const data = await resp.json()
        setStatus(data.status || 'completed')
      } catch {
        setStatus('unknown')
      }
    }
    verify()
  }, [tx])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold">Paiement terminé</h1>
        <p className="text-muted-foreground">Statut: {status}</p>
        <Link className="text-primary underline" href="/factures">Retour à mes factures</Link>
      </div>
    </div>
  )
}

