import Link from 'next/link';
import React from 'react';
import { APP_MOTO, APP_NAME } from '@/lib/app_config/config';

const App = () => {

  return (
    <>
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-green-500 to-teal-500 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            {APP_MOTO}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Gain complete control and visibility over your demand and inventory levels to boost efficiency from anywhere, anytime.
          </p>
          <Link href = "/pricing-plan" className="px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50">
            Get Started
          </Link>
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
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Demand tracking with pre-orders</h3>
              <p className="text-gray-600">
                Monitor demand and fulfill orders.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Easy Order Management</h3>
              <p className="text-gray-600">
                Manage purchase orders and sales orders with ease.
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
                Generate insightful reports on sales, stock turnover, and inventory aging to make informed business decisions.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-700">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Multi Store Support</h3>
              <p className="text-gray-600">
                Place order from/to any store thet you configured.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-teal-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.592 1L21 12h-3m-4 0h-4m-7 0H3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Multi User Support</h3>
              <p className="text-gray-600">
                Add staff members to facilitate your workflow.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-white p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col items-center text-center">
              <div className="mb-4 text-orange-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h-2m6 0h-2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Backup and Export</h3>
              <p className="text-gray-600">
                Export your data as PDF and/or Excel
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
                "{APP_NAME} transformed how we manage our shop. It's stock level monitor is powerful which saved us countless hours!"
              </p>
              <p className="font-semibold text-gray-800">- Duram H., CEO of IManufacturingCo</p>
            </div>
            {/* Testimonial Card 2 */}
            <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
              <img
                src="https://placehold.co/80x80/2a2a2a/ffffff?text=AS"
                alt="Customer Avatar"
                className="w-20 h-20 rounded-full mb-4 object-cover"
              />
              <p className="text-lg italic mb-4 text-gray-700">
                "The Inventory Aging and Turnover reports are business critical ones, it is a game-changer. Now we can see which items are selling and which ones are tying up capital."
              </p>
              <p className="font-semibold text-gray-800">- Abebe Alem, Steel Retailer AA</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default App;
