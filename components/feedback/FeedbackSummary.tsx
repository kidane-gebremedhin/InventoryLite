'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/supabase/supabase'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import MiniLoading from '../helpers/MiniLoading'
import { getCurrentDateTimeUTC } from '@/lib/helpers/Helper'
import { DATABASE_TABLE } from '@/lib/Enums'

interface FeedbackSummaryProps {
  className?: string
}

interface FeedbackStats {
  total: number
  open: number
  resolved: number
  averageRating: number
  recentCount: number
}

export function FeedbackSummary({ className = '' }: FeedbackSummaryProps) {
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    open: 0,
    resolved: 0,
    averageRating: 0,
    recentCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeedbackStats()
  }, [])

  const loadFeedbackStats = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .select('*')

      if (error) throw error

      const feedbacks = data || []
      const total = feedbacks.length
      const open = feedbacks.filter(f => f.status === 'open').length
      const resolved = feedbacks.filter(f => f.status === 'resolved').length
      
      const ratings = feedbacks.filter(f => f.rating !== null).map(f => f.rating!)
      const averageRating = ratings.length > 0 
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 
        : 0

      // Recent feedback (last 7 days)
      const weekAgo = getCurrentDateTimeUTC()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentCount = feedbacks.filter(f => getCurrentDateTimeUTC(f.created_at) > weekAgo).length

      setStats({
        total,
        open,
        resolved,
        averageRating,
        recentCount
      })
    } catch (error) {
      console.error('Error loading feedback stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <MiniLoading className={className} />
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Feedback Overview</h3>
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Total Feedback</span>
          <span className="text-sm font-medium text-gray-900">{stats.total}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Open Issues</span>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-3 w-3 text-red-500 mr-1" />
            <span className="text-sm font-medium text-red-600">{stats.open}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Resolved</span>
          <div className="flex items-center">
            <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">{stats.resolved}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">This Week</span>
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 text-blue-500 mr-1" />
            <span className="text-sm font-medium text-blue-600">{stats.recentCount}</span>
          </div>
        </div>

        {stats.averageRating > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Avg Rating</span>
            <div className="flex items-center">
              <StarIconSolid className="h-3 w-3 text-yellow-400 mr-1" />
              <span className="text-sm font-medium text-gray-900">{stats.averageRating}</span>
            </div>
          </div>
        )}
      </div>

      {stats.open > 0 && (
        <div className="mt-4 p-2 bg-red-50 rounded-md">
          <p className="text-xs text-red-700">
            {stats.open} open feedback item{stats.open !== 1 ? 's' : ''} need{stats.open !== 1 ? '' : 's'} attention
          </p>
        </div>
      )}
    </div>
  )
}

