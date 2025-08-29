'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Auth } from '@/components/auth/Auth'

export default function HomePage() {
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
    <div className="bg-gradient-to-br from-teal-500 to-orange-500 text-white py-20 md:py-32">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              Inventory Management Simplified!
            </h1>
          </div>
          
          <div className="card">
            <Auth />
          </div>
        </div>
      </div>
    </div>
  )
}
