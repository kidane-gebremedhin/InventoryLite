'use client'

import { AdminFeedbackManager } from '@/components/feedback/AdminFeedbackManager'

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
      </div>
      <AdminFeedbackManager />
    </div>
  )
}
