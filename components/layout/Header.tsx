'use client'

import { useState } from 'react'
import { supabase } from '@/supabase/supabase'
import { 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { FeedbackNotification } from '@/components/feedback/FeedbackNotification'
import { useUserContext } from '@/components/context_apis/UserProvider'
import MiniLoading from '../helpers/MiniLoading'
import { capitalizeFirstLetter } from '@/lib/helpers/Helper'


export function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
    // Global States
  const {currentUser, setCurrentUser} = useUserContext()

  const handleSignOut = async () => {
    if (!supabase) return
    
    setLoading(true)
    await supabase.auth.signOut()
  }

  if (loading) {
    return <MiniLoading />
  }
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome back, {capitalizeFirstLetter(currentUser.fullName.split(" ")[0])}.
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <FeedbackNotification />
          <button className="text-gray-400 hover:text-gray-600">
            <BellIcon className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              {currentUser.picturePicture ? (
                <img 
                  src={currentUser.picturePicture} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8" />
              )}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{currentUser.fullName}</div>
                  <div className="text-gray-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
