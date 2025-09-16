'use client';
import { User, UserSubscriptionInfo } from '@/lib/types/Models';
import { Dispatch, SetStateAction, createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '@/supabase/supabase'
import { useRouter } from 'next/navigation'
import { SIGNED_OUT } from '@/lib/Constants';
import { RPC_FUNCTION } from '@/lib/Enums';
import { showServerErrorToast } from '@/lib/helpers/Helper';
import { Session } from '@supabase/supabase-js';

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
    picturePicture: "",
    subscriptionInfo: null
  }
  
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const router = useRouter()

  useEffect(() => {
    const fetchUserSubscriptionInfo = async (session: Session): Promise<UserSubscriptionInfo> => {
      // RPC call to fetch subscription info
      const searchParams = { current_user_id: session.user.id }
      const { data, error }: {data: UserSubscriptionInfo[], error: any} = await supabase
        .rpc(RPC_FUNCTION.FETCH_USER_SUBSCRIPTION_INFO, searchParams)
      if (error) {
        showServerErrorToast('Login failed.')
        return null;
      }

      return data.length > 0 ? data[0] : null;
    }

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
        picturePicture: session.user.user_metadata.picture,
        subscriptionInfo: await fetchUserSubscriptionInfo(session)
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
            picturePicture: session.user.user_metadata.picture,
            subscriptionInfo: await fetchUserSubscriptionInfo(session)
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

