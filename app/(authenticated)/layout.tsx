import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './../globals.css'
import { Toaster } from 'react-hot-toast'
import { LoadingProvider } from '@/components/context_apis/LoadingProvider'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE, GOOGLE_SOURCE_SCRIPT } from '@/lib/app_config/config'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { createClient } from '@/supabase/server'

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
  const supabase = await createClient();

  return (
    <html lang="en">
      <head>
        <script src={GOOGLE_SOURCE_SCRIPT} async defer></script>
      </head>
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
