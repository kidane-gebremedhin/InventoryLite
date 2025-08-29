'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { 
  ChatBubbleLeftRightIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { ALL_OPTIONS } from '@/lib/Constants'
import Loading from '../helpers/Loading'

interface Feedback {
  id: string
  user_id: string
  tenant_id: string
  category: string
  subject: string
  message: string
  status: string
  priority: string
  rating: number | null
  admin_response: string | null
  created_at: string
  tenant: {
    name: string
    domain: string
  }
}

export function AdminFeedbackManager() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [filter, setFilter] = useState(ALL_OPTIONS)

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          tenant:tenants(name, domain)
        `)
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

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId)

      if (error) throw error
      toast.success('Status updated successfully')
      loadFeedbacks()
    } catch (error: any) {
      toast.error('Failed to update status')
      console.error('Error updating status:', error)
    }
  }

  const handleResponseSubmit = async () => {
    if (!supabase || !selectedFeedback) return

    try {
      const { error } = await supabase
        .from('feedback')
        .update({ 
          admin_response: responseText,
          status: 'resolved'
        })
        .eq('id', selectedFeedback.id)

      if (error) throw error

      toast.success('Response submitted successfully')
      setShowResponseModal(false)
      setResponseText('')
      setSelectedFeedback(null)
      loadFeedbacks()
    } catch (error: any) {
      toast.error('Failed to submit response')
      console.error('Error submitting response:', error)
    }
  }

  const getFilteredFeedbacks = () => {
    if (filter === ALL_OPTIONS) return feedbacks
    return feedbacks.filter(f => f.status === filter)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbacks.filter(f => f.status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <StarIconSolid className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbacks.filter(f => f.rating).length > 0 
                  ? Math.round(feedbacks.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length * 10) / 10
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="input-field max-w-xs"
      >
        <option value="all">All Feedback</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {/* Feedback List */}
      <div className="space-y-4">
        {getFilteredFeedbacks().length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
          </div>
        ) : (
          getFilteredFeedbacks().map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(feedback.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority}
                  </span>
                  <span className="text-sm text-gray-500">
                    by {feedback.tenant?.name || feedback.tenant?.domain}
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
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <h4 className="font-medium text-blue-900 mb-1">Admin Response:</h4>
                  <p className="text-blue-800 text-sm">{feedback.admin_response}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <select
                  value={feedback.status}
                  onChange={(e) => handleStatusUpdate(feedback.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  onClick={() => {
                    setSelectedFeedback(feedback)
                    setShowResponseModal(true)
                  }}
                  className="btn-primary text-sm"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Respond
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Respond to Feedback</h2>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">{selectedFeedback.subject}</h3>
              <p className="text-gray-600 text-sm">{selectedFeedback.message}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Write your response to this feedback..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleResponseSubmit}
                className="btn-primary"
                disabled={!responseText.trim()}
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
