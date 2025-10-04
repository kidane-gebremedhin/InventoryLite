'use client'

import Link from 'next/link'
import Image from 'next/image';
import { useAuthContext } from '../providers/AuthProvider';
import MiniLoading from '../helpers/MiniLoading';
import { useState, useEffect } from 'react';
import { ROUTE_PATH } from '@/lib/Enums';

export function Auth() {
  const { currentUser, loading, signInWithGoogle } = useAuthContext()
  const googleSSOImage = "/images/auth_providers/google/google-sso-1.JPG";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  });

  if (!isMounted) return <MiniLoading />

  return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 mt-2">
            𝙎𝒊𝙜𝒏 𝒊𝙣 𝙬𝒊𝙩𝒉 𝒚𝙤𝒖𝙧 𝙂𝒐𝙤𝒈𝙡𝒆 𝒂𝙘𝒄𝙤𝒖𝙣𝒕 𝒂𝙣𝒅 𝒕𝙝𝒂𝙩'𝙨 𝒊𝒕.
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign-In Button */}
          <div className="w-full">
            <button
              onClick={signInWithGoogle}
              className="flex justify-center text-gray-600 py-2 px-8">
              <Image
                src={googleSSOImage}
                width={400}
                height={50}
                alt="Continue with Google"
                className="rounded-lg shadow-lg"
              />
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to the <Link target='_blank' href={ROUTE_PATH.TERMS_OF_SERVICE} className='text-blue-600'><u>Terms of Service</u></Link> and <Link target='_blank' href={ROUTE_PATH.PRIVACY_POLICY} className='text-blue-600'><u>Privacy Policy</u></Link>
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
  )
}
