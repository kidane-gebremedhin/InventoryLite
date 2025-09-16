'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/supabase/supabase'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { DEFAULT_USER_ROLE } from '@/lib/Constants'
import { DATABASE_TABLE } from '@/lib/Enums'

interface FeedbackNotificationProps {
  className?: string
}

export function FeedbackNotification({ className = '' }: FeedbackNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [userRole, setUserRole] = useState<string>(DEFAULT_USER_ROLE)

  useEffect(() => {
    if (userRole === 'admin') {
      loadUnreadCount()
    }
  }, [userRole])

  const loadUnreadCount = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .select('id')
        .eq('status', 'open')

      if (error) throw error
      setUnreadCount(data?.length || 0)
    } catch (error) {
      console.error('Error loading unread feedback count:', error)
    }
  }

  // Only show for admins and managers
  if (userRole !== 'admin' && userRole !== 'manager') {
    return null
  }

  return (
    <Link 
      href="/dashboard/feedback" 
      className={`relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 ${className}`}
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

