'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { FeedbackRating } from '@/components/feedback/FeedbackRating'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { formatDateToLocalDate, getFeedbackCategoryColor, getFeedbackCategoryLabel, getFeedbackPriorityColor, getFeedbackStatusColor, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import { FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, RATING_STARTS } from '@/lib/Constants'
import { fetchUserFeedbacks, saveUserFeedback } from '@/lib/server_actions/feedback'
import { UserFeedback } from '@/lib/types/Models'
import { FeedbackCategory, FeedbackPriority, RatingStar } from '@/lib/Enums'

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: '',
    rating: 0
  })
  // Global States
  const {loading, setLoading} = useLoadingContext()

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchUserFeedbacks(
        {
          selectedStatus: '',
          selectedCategory: '',
          selectedPriority: '',
          selectedRating: 0,
          searchTerm: '',
          startIndex: 0,
          endIndex: 100
        }
      );

      if (error) throw error

      setFeedbacks(data || [])
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.rating == 0) {
      showErrorToast('Rating is required')
      return;
    }

    try {
      const feedback = {
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        rating: formData.rating
      };

      const { error } = await saveUserFeedback(feedback);

      if (error) throw error

      showSuccessToast('Feedback submitted successfully!')
      setFormData({
        category: '',
        subject: '',
        message: '',
        priority: '',
        rating: 0
      })
      setShowForm(false)
      loadFeedbacks()
    } catch (error: any) {
      showErrorToast('Failed to submit feedback')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback & Support</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Submit Feedback
        </button>
      </div>

      {/* Quick Rating Component */}
      <FeedbackRating onFeedbackSubmitted={loadFeedbacks} />

      {/* Feedback Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Submit Feedback</h2>
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
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="input-field"
                  required
                >
                  <option key='' value=''></option>
                  {FEEDBACK_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-field"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="input-field"
                  required
                >
                  {FEEDBACK_PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {RATING_STARTS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="text-2xl"
                    >
                      {star <= formData.rating ? (
                        <StarIconSolid className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-6 w-6 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to submit feedback and help us improve!
            </p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackCategoryColor(feedback.category)}`}>
                    {getFeedbackCategoryLabel(feedback.category)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackPriorityColor(feedback.priority)}`}>
                    {feedback.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeedbackStatusColor(feedback.status)}`}>
                    {feedback.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateToLocalDate(feedback.created_at)}
                </div>
              </div>

              <h3 className="font-medium text-gray-900 mb-2">{feedback.subject}</h3>
              <p className="text-gray-600 mb-3">{feedback.message}</p>

              {feedback.rating && (
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-500 mr-2">Rating:</span>
                  <div className="flex">
                    {RATING_STARTS.map((star) => (
                      <StarIconSolid
                        key={star}
                        className={`h-4 w-4 ${star <= feedback.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {feedback.admin_response && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Admin Response:</h4>
                  <p className="text-gray-600 text-sm">{feedback.admin_response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
