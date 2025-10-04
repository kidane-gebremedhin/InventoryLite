'use client'

import { useState, useEffect } from 'react'

import { AdminFeedbackManager } from '@/components/feedback/AdminFeedbackManager'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { showErrorToast } from '@/lib/helpers/Helper'
import { FeedbackCategory, FeedbackPriority, FeedbackStatus, DATABASE_TABLE } from '@/lib/Enums'

import { useAuthContext } from '@/components/providers/AuthProvider'

interface Feedback {
  id: string
  category: FeedbackCategory.BUG | FeedbackCategory.FEATURE | FeedbackCategory.IMPROVEMENT | FeedbackCategory.GENERAL
  subject: string
  message: string
  status: FeedbackStatus.OPEN | FeedbackStatus.IN_PROGRESS | FeedbackStatus.RESOLVED | FeedbackStatus.CLOSED
  priority: FeedbackPriority.LOW | FeedbackPriority.MEDIUM | FeedbackPriority.HIGH | FeedbackPriority.URGENT
  rating: number | null
  admin_response: string | null
  created_at: string
  updated_at: string
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  // Global States
  const {loading, setLoading} = useLoadingContext()
  const { currentUser, supabase } = useAuthContext();

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
    } catch (error: any) {
      showErrorToast('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
      </div>
      <AdminFeedbackManager />
    </div>
  )
}
