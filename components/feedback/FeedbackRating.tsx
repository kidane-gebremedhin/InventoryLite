'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'

import { showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import { FeedbackPriority, DATABASE_TABLE } from '@/lib/Enums'
import { APP_NAME } from '@/lib/app_config/config'

import { useAuthContext } from '../providers/AuthProvider'

interface FeedbackRatingProps {
  onFeedbackSubmitted?: () => void
  className?: string
}

export function FeedbackRating({ onFeedbackSubmitted, className = '' }: FeedbackRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general' as const
  })
  const [submitting, setSubmitting] = useState(false)
  const {currentUser} = useAuthContext()
  const { supabase } = useAuthContext();

  const handleStarClick = (star: number) => {
    setRating(star)
    if (star >= 4) {
      // Show positive feedback form for high ratings
      setFormData(prev => ({ ...prev, subject: `Great experience with ${APP_NAME}!` }))
    } else if (star <= 2) {
      // Show improvement feedback form for low ratings
      setFormData(prev => ({ ...prev, subject: 'Feedback for improvement' }))
    }
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    e.preventDefault()

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from(DATABASE_TABLE.feedback)
        .insert({
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          priority: rating <= 2 ? FeedbackPriority.HIGH : FeedbackPriority.MEDIUM,
          rating: rating
        })

      if (error) throw error

      showSuccessToast('Thank you for your feedback!')
      setShowForm(false)
      setRating(0)
      setFormData({ subject: '', message: '', category: 'general' })
      onFeedbackSubmitted?.()
    } catch (error: any) {
      showErrorToast('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How would you rate your experience?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your feedback helps us improve {APP_NAME}
        </p>

        {/* Star Rating */}
        <div className="flex justify-center space-x-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-colors duration-200"
            >
              {star <= (hoverRating || rating) ? (
                <StarIconSolid className="h-8 w-8 text-yellow-400" />
              ) : (
                <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
              )}
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            {rating === 1 && 'Very Poor'}
            {rating === 2 && 'Poor'}
            {rating === 3 && 'Fair'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Share Your Feedback</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

