'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import Loading from '@/components/helpers/Loading'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const {loading, setLoading} = useLoadingContext()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <Loading isLoading={loading} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
