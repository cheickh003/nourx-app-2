import { AuthGuard } from '@/components/auth/auth-guard'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard role="client">
      {children}
    </AuthGuard>
  )
}
