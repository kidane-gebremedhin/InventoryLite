'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { FeedbackRating } from '@/components/feedback/FeedbackRating'
import { AdminFeedbackManager } from '@/components/feedback/AdminFeedbackManager'
import { fetchCurrentTenantId, currentUserRole } from '@/lib/db_queries/DBQuery'
import Loading from '@/components/helpers/Loading'

interface Feedback {
  id: string
  category: 'bug' | 'feature' | 'improvement' | 'general'
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  rating: number | null
  admin_response: string | null
  created_at: string
  updated_at: string
}

const categories = [
  { value: 'bug', label: 'Bug Report', color: 'bg-red-100 text-red-800' },
  { value: 'feature', label: 'Feature Request', color: 'bg-blue-100 text-blue-800' },
  { value: 'improvement', label: 'Improvement', color: 'bg-green-100 text-green-800' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
]

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
]

const statuses = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
]

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('user')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: 'general' as const,
    subject: '',
    message: '',
    priority: 'medium' as const,
    rating: 0
  })

  useEffect(() => {
    loadUserRole()
    loadFeedbacks()
  }, [])

  const loadUserRole = async () => {
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserRole(currentUserRole)
    } catch (error) {
      console.error('Error loading user role:', error)
    }
  }

  const loadFeedbacks = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
    } catch (error: any) {
      toast.error('Failed to load feedback')
      console.error('Error loading feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to submit feedback')
        return
      }

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          tenant_id: await fetchCurrentTenantId(),
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          priority: formData.priority,
          rating: formData.rating > 0 ? formData.rating : null
        })

      if (error) throw error

      toast.success('Feedback submitted successfully!')
      setFormData({
        category: 'general',
        subject: '',
        message: '',
        priority: 'medium',
        rating: 0
      })
      setShowForm(false)
      loadFeedbacks()
    } catch (error: any) {
      toast.error('Failed to submit feedback')
      console.error('Error submitting feedback:', error)
    }
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category
  }

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <Loading />
  }

  // Show admin view for admins and managers
  if (userRole === 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
        </div>
        <AdminFeedbackManager />
      </div>
    )
  }

  // Show user view for regular users
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
                  {categories.map(category => (
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
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (Optional)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(feedback.category)}`}>
                    {getCategoryLabel(feedback.category)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                    {feedback.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(feedback.created_at).toUTCString()}
                </div>
              </div>

              <h3 className="font-medium text-gray-900 mb-2">{feedback.subject}</h3>
              <p className="text-gray-600 mb-3">{feedback.message}</p>

              {feedback.rating && (
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-500 mr-2">Rating:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
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
