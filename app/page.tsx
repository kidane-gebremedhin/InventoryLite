'use client'

import { APP_MOTO, APP_NAME } from '@/lib/Constants';
import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const App = () => {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    
    checkUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased">
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a href="#" className="flex items-center space-x-2">
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
          </a>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-600 hover:text-teal-600">Features</a>
            <a href="#" className="text-gray-600 hover:text-teal-600">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-teal-600">Contact</a>
            <Link href = '/auth' className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all duration-200">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-teal-500 to-orange-500 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            {APP_MOTO}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Streamline your stock, automate orders, and gain complete control over your inventory from anywhere, anytime.
          </p>
          <button className="px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50">
            Get Started Free
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Key Features to Empower Your Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature Card 1 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-teal-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2m6 0H9m5 0a2 2 0 012-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm2-11V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2h10z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Real-time Stock Tracking</h3>
              <p className="text-gray-600">
                Monitor inventory levels across all your locations with instant updates, preventing stockouts and overstocking.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Automated Order Management</h3>
              <p className="text-gray-600">
                Automate purchase orders and sales orders, reducing manual effort and potential errors.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-teal-700">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m0 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Detailed Reporting & Analytics</h3>
              <p className="text-gray-600">
                Generate insightful reports on sales, stock movement, and profitability to make informed decisions.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-700">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Multi-Channel Integration</h3>
              <p className="text-gray-600">
                Connect seamlessly with your e-commerce platforms, POS systems, and accounting software.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-teal-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.592 1L21 12h-3m-4 0h-4m-7 0H3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Warehouse Management</h3>
              <p className="text-gray-600">
                Optimize warehouse operations, manage bins, and track items efficiently within your storage facilities.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h-2m6 0h-2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Barcode Scanning</h3>
              <p className="text-gray-600">
                Speed up inventory processes with integrated barcode and QR code scanning capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial Card 1 */}
            <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
              <img
                src="https://placehold.co/80x80/2a2a2a/ffffff?text=JD"
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full mb-4 object-cover"
              />
              <p className="text-lg italic mb-4 text-gray-700">
                "SwiftStock transformed how we manage our inventory. It's intuitive, powerful, and has saved us countless hours!"
              </p>
              <p className="font-semibold text-gray-800">- Jane Doe, CEO of RetailCo</p>
            </div>
            {/* Testimonial Card 2 */}
            <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
              <img
                src="https://placehold.co/80x80/2a2a2a/ffffff?text=AS"
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full mb-4 object-cover"
              />
              <p className="text-lg italic mb-4 text-gray-700">
                "The multi-channel integration is a game-changer. All our sales and stock are perfectly synced."
              </p>
              <p className="font-semibold text-gray-800">- Alex Smith, E-commerce Manager at TechGadgets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-tr from-teal-600 to-orange-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
            Ready to Take Control of Your Inventory?
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of businesses already optimizing their operations with SwiftStock. Start your free trial today!
          </p>
          <button className="px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} SwiftStock. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
