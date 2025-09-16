import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/Constants'
import { LoadingProvider } from '@/components/context_apis/LoadingProvider'
import { UserProvider } from '@/components/context_apis/UserProvider'
import Link from 'next/link'
import { getCurrentDateTimeUTC } from '@/lib/helpers/Helper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TITLE}`,
  description: APP_DESCRIPTION,
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
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
          {/* Navbar */}
          <nav className="bg-white shadow-sm py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                {/* Using a simple SVG for a logo placeholder */}
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h6a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/product-demo" className="text-gray-600 hover:text-teal-600">Demo</Link>
                <Link href = '/pricing-plans'>
                  Pricing
                </Link>
                <a href="#" className="text-gray-600 hover:text-teal-600">Contact</a>
                <Link href = '/auth' className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-200">
                  Sign In
                </Link>
              </div>
            </div>
          </nav>
          <div className='pb-8'>
            <LoadingProvider>
              <UserProvider>
                {children}
              </UserProvider>
            </LoadingProvider>
            <Toaster position="top-right" />
          </div>
        </div>
        
        {/* Call to Action Section */}
        <section className="bg-gradient-to-tr from-green-500 to-teal-500 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
              Ready to Take Control of Your Inventory?
            </h2>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join hundreds of businesses already optimizing their operations with {APP_NAME}. Start your free trial today!
            </p>
            <Link href = "/pricing-plans" className="px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50">
              Get Started
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-8">
          <div className="container mx-auto px-4 text-center text-sm">
            <p>&copy; {getCurrentDateTimeUTC().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
