'use client';
import { User } from '@/lib/types/Models';
import { Dispatch, SetStateAction, createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SIGNED_OUT } from '@/lib/Constants';

// Define the type for the context value
interface UserContextType {
    currentUser: User;
    setCurrentUser: Dispatch<SetStateAction<User>>
  };
  
// 1. Create the context
const UserContext = createContext<UserContextType>(null!);

// 2. Create a provider component
export function UserProvider({ children }: any) {  
  const defaultUser = {
    id: '',
    fullName: "",
    email: "",
    picturePicture: ""
  }
  
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const router = useRouter()

  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      if (!supabase) {
        return
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }

      // For Google auth, user data is in session.user.user_metadata
      const userData: User = {
        id: session.user.id,
        fullName: session.user.user_metadata.full_name,
        email: session.user.email!,
        picturePicture: session.user.user_metadata.picture
      }

      setCurrentUser(userData)
    }
    
    fetchCurrentUserInfo()

    if (!supabase) {
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === SIGNED_OUT) {
          router.push('/')
        } else if (session) {
          const userData: User = {
            id: session.user.id,
            fullName: session.user.user_metadata.full_name,
            email: session.user.email!,
            picturePicture: session.user.user_metadata.picture
          }
          setCurrentUser(userData)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])
  
  const value = { currentUser, setCurrentUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 3. Create a custom hook to use the context
export function useUserContext() {
  return useContext(UserContext);
}

