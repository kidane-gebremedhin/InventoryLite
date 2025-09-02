'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'

declare global {
  interface Window {
    google: any
  }
}

export function Auth() {
  const router = useRouter()
  const googleSignInRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Google Sign-In when the script loads
    if (window.google && googleSignInRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.renderButton(googleSignInRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: '100%',
      })
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    try {
      if (!supabase) {
        showErrorToast()
        return
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) {
        throw error
      }

      showSuccessToast('Signed in successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      showErrorToast()
    }
  }

  return (
    <>
      {/* Load Google Sign-In script */}
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={() => {
          // Re-initialize when script loads
          if (window.google && googleSignInRef.current) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            })

            window.google.accounts.id.renderButton(googleSignInRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: '100%',
            })
          }
        }}
      />
      
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 mt-2">
            𝙎𝒊𝙜𝒏 𝒊𝙣 𝙬𝒊𝙩𝒉 𝒚𝙤𝒖𝙧 𝙂𝒐𝙤𝒈𝙡𝒆 𝒂𝙘𝒄𝙤𝒖𝙣𝒕 𝒂𝙣𝒅 𝒕𝙝𝒂𝙩'𝙨 𝙖𝒍𝙡.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign-In Button */}
          <div ref={googleSignInRef} className="flex justify-center"></div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to the <Link target='_blank' href='/terms-of-service' className='text-blue-600'><u>Terms of Service</u></Link> and <Link target='_blank' href='/privacy-policy' className='text-blue-600'><u>Privacy Policy</u></Link>
            </p>
          </div>
        </div>

        {/* Alternative sign-in options */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>
      </div>
    </>
  )
}
