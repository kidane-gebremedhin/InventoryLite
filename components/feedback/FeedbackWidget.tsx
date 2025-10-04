'use client'

import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { FeedbackRating } from './FeedbackRating'
import { APP_NAME } from '@/lib/app_config/config'

interface FeedbackWidgetProps {
  className?: string
}

export function FeedbackWidget({ className = '' }: FeedbackWidgetProps) {
  const [showRating, setShowRating] = useState(false)

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Rate Your Experience</h3>
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <p className="text-xs text-gray-600 mb-3">
        Help us improve {APP_NAME} with your feedback
      </p>

      {!showRating ? (
        <button
          onClick={() => setShowRating(true)}
          className="w-full bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200"
        >
          Rate Now
        </button>
      ) : (
        <FeedbackRating 
          onFeedbackSubmitted={() => setShowRating(false)}
          className="p-0 border-0 shadow-none"
        />
      )}
    </div>
  )
}

