import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './../globals.css'
import { Toaster } from 'react-hot-toast'
import { LoadingProvider } from '@/components/context_apis/LoadingProvider'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/app_config/config'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TITLE}`,
  description: APP_DESCRIPTION,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
          <div className='pb-8'>
            <AuthProvider>
              <LoadingProvider>
                {children}
              </LoadingProvider>
            </AuthProvider>
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
