'use client'

import { useState, useEffect } from 'react'

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ROUTE_PATH, UserRole } from '@/lib/Enums'
import { fetchUnreadCount } from '@/lib/server_actions/feedback'
import { useAuthContext } from '../providers/AuthProvider'

interface FeedbackNotificationProps {
  className?: string
}

export function FeedbackNotification({ className = '' }: FeedbackNotificationProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const {currentUser} = useAuthContext()

  useEffect(() => {
    if (currentUser?.subscriptionInfo?.role === UserRole.SUPER_ADMIN) {
      loadUnreadCount()
    }
  }, [currentUser])

  const loadUnreadCount = async () => {
    try {
      const { data, error } = await fetchUnreadCount();

      if (error) throw error
      setUnreadCount(data?.length || 0)
    } catch (error) {
    }
  }

  if (currentUser?.subscriptionInfo?.role !== UserRole.SUPER_ADMIN) return <></>

  return (
    <Link 
      href={ROUTE_PATH.FEEDBACK} 
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

