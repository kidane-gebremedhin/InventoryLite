import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { APP_NAME } from '@/lib/Constants'
import { LoadingProvider } from '@/components/context_apis/LoadingProvider'
import { UserProvider } from '@/components/context_apis/UserProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} - Inventory Management Simplified!`,
  description: 'A comprehensive inventory management system for businesses of all sizes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={inter.className}>
        <LoadingProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </LoadingProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
