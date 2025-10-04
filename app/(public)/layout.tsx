import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './../globals.css'
import Navbar from '@/components/layout/Navbar'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE, GOOGLE_SOURCE_SCRIPT } from '@/lib/app_config/config'
import CallToAction from '@/components/layout/CallToAction'
import Footer from '@/components/layout/Footer'

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
      <head>
        <script src={GOOGLE_SOURCE_SCRIPT} async defer></script>
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* Navbar */}
        <Navbar />
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
          <div className='pb-8'>
            {children}
          </div>
        </div>
        {/* Call to Action Section */}
        <CallToAction />
        <Footer />
      </body>
    </html>
  )
}
