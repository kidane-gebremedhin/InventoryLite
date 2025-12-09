import './../globals.css'
import Navbar from '@/components/layout/Navbar'
import CallToAction from '@/components/layout/CallToAction'
import Footer from '@/components/layout/Footer'
import PartnersLogoLoop from '@/components/helpers/PartnersLogoLoop'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <Navbar />
      <div className="bg-gray-50 font-sans text-gray-800 antialiased">
        {children}
      </div>
      <PartnersLogoLoop />
      {/* Call to Action Section */}
      <CallToAction />
      <Footer />
    </div>
  )
}
