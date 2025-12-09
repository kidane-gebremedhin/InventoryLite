'use client'

import { ROUTE_PATH } from '@/lib/Enums'
import { clearUserCookies, clearUserCache, fetchUserProfile } from '@/lib/server_actions/user'
import { User } from '@/lib/types/Models'
import { createClient } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

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
      fetchUserProfile(data?.session?.user, true)
        .then(currentUser => {
          setCurrentUser(currentUser);
        });
    });

    // 2. LISTEN to changes (login, logout, token refresh, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        fetchUserProfile(newSession?.user, true)
          .then(currentUser => {
            setCurrentUser(currentUser);
          });
      }
    );

    // Unsubscribe when the component unmounts
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await clearUserCache(currentUser);
    await clearUserCookies();
    // This should be below cookie clearance
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