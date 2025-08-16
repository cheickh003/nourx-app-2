import type { Metadata } from 'next'
import './globals.css'
import { ReactQueryProvider } from '@/components/providers/react-query-provider'
import { Toaster } from '@/components/ui/use-toast'

export const metadata: Metadata = {
  title: 'NOURX - Espace Client',
  description: 'Portail client pour le suivi de vos projets avec NOURX',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <ReactQueryProvider>
          <Toaster>
            {children}
          </Toaster>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
