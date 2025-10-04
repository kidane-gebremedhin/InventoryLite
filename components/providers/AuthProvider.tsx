'use client'

import { ROUTE_PATH } from '@/lib/Enums'
import { fetchUserProfile } from '@/lib/helpers/Helper'
import { User } from '@/lib/types/Models'
import { createClient } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, useRef } from 'react'

type AuthContextType = {
  supabase: ReturnType<typeof createClient>
  currentUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode; }) {
  const [currentUser, setCurrentUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const supabase = createClient();
  
  useEffect(() => {
    // 1. Get initial session on page reload
    supabase.auth.getSession().then(async ({ data }) => {
        
        const currentUser = await fetchUserProfile(data.session.user);
        setCurrentUser(currentUser);
    });

    // 2. LISTEN to changes (login, logout, token refresh, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const currentUser = await fetchUserProfile(newSession?.user);
        setCurrentUser(currentUser);
      }
    );

    // Unsubscribe when the component unmounts
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push(ROUTE_PATH.SIGNIN)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}${ROUTE_PATH.OAUTH_GOOGLE_WEBHOOK}`,
      },
    })
  }

  const value = {
    supabase,
    currentUser,
    loading,
    signOut,
    signInWithGoogle,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext);
}