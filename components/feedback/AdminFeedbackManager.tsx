'use client'

import { useState, useEffect } from 'react'

import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { ALL_OPTIONS, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES, FIRST_PAGE_NUMBER, RATING_STARS, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { FeedbackStatus, FeedbackPriority } from '@/lib/Enums'
import { calculateStartAndEndIndex, formatDateToLocalDate, getDateWithoutTime, getFeedbackCategoryColor, getFeedbackCategoryLabel, getFeedbackPriorityColor, getFeedbackStatusColor, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import { useAuthContext } from '../providers/AuthProvider'
import { UserFeedback } from '@/lib/types/Models'
import { fetchUserFeedbacks, manageUserFeedbacks, saveFeedbackAdminResponse, updateFeedbackStatus } from '@/lib/server_actions/feedback'
import ExportExcel from '../file_import_export/ExportExcel'
import ExportPDF from '../file_import_export/ExportPDF'
import { useLoadingContext } from '../context_apis/LoadingProvider'

export function AdminFeedbackManager() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [selectedFeedbackRating, setSelectedFeedbackRating] = useState(0)
  const [selectedFeedbackCategory, setSelectedFeedbackCategory] = useState('')
  const [selectedFeedbackPriority, setSelectedFeedbackPriority] = useState('')
  const [selectedFeedbackStatus, setSelectedFeedbackStatus] = useState('')
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  // Global States
  const { loading, setLoading } = useLoadingContext()
  const { currentUser } = useAuthContext()

  const reportHeaders = { subject: 'Subject', rating: 'rating', category: 'category', priority: 'Priority', status: 'Status', created_at: 'Date', admin_response: 'Admin Response' }

  useEffect(() => {
    loadFeedbacks()
  }, [searchTerm, selectedFeedbackCategory, selectedFeedbackPriority, selectedFeedbackRating, selectedFeedbackStatus, recordsPerPage, currentPage])

  const loadFeedbacks = async () => {
    const { startIndex, endIndex } = calculateStartAndEndIndex({ currentPage, recordsPerPage });

    try {
      const { data, count, error } = await fetchUserFeedbacks(
        {
          selectedStatus: selectedFeedbackStatus,
          selectedCategory: selectedFeedbackCategory,
          selectedPriority: selectedFeedbackPriority,
          selectedRating: selectedFeedbackRating,
          searchTerm: searchTerm,
          startIndex: startIndex,
          endIndex: endIndex
        }
      );

      if (error) throw error

      setFeedbacks(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await updateFeedbackStatus({ feedbackId, newStatus })

      if (error) throw error

      showSuccessToast('Status updated successfully')
      loadFeedbacks()
    } catch (error: any) {
      showErrorToast('Failed to update status')
    }
  }

  const handleResponseSubmit = async () => {
    if (!selectedFeedback) return

    try {
      const response = {
        feedbackId: selectedFeedback.id,
        responseText: responseText,
        status: FeedbackStatus.RESOLVED
      }

      const { error } = await saveFeedbackAdminResponse(response)

      if (error) throw error

      showSuccessToast('Response submitted successfully')
      setShowResponseModal(false)
      setResponseText('')
      setSelectedFeedback(null)
      loadFeedbacks()
    } catch (error: any) {
      showErrorToast('Failed to submit response')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case FeedbackStatus.OPEN:
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      case FeedbackStatus.IN_PROGRESS:
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case FeedbackStatus.RESOLVED:
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case FeedbackPriority.URGENT:
        return 'bg-red-100 text-red-800'
      case FeedbackPriority.HIGH:
        return 'bg-orange-100 text-orange-800'
      case FeedbackPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTextSearch = () => {
    setCurrentPage(FIRST_PAGE_NUMBER)
    setSearchTerm(searchTermTemp.trim())
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
                {feedbacks.filter(f => f.status === FeedbackStatus.OPEN).length}
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
      <div>
        <div className="w-full text-right items-right mb-4">
          <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters); }}>
            <b>Show Filters</b>
          </button>
          <span className="px-1"></span>
          <ExportExcel reportName="Feedbacks" records={[reportHeaders, ...feedbacks].map((feedback, idx) => {
            return { row_no: idx > 0 ? idx : 'Row No.', subject: feedback.subject, rating: feedback.rating, category: feedback.category, priority: feedback.priority, status: feedback.status, created_at: getDateWithoutTime(feedback.created_at), admin_response: feedback.admin_response }
          })} />
          <span className="px-1"></span>
          <ExportPDF reportName="Feedbacks" records={[reportHeaders, ...feedbacks].map((feedback, idx) => {
            return { row_no: idx > 0 ? idx : 'Row No.', subject: feedback.subject, rating: feedback.rating, category: feedback.category, priority: feedback.priority, status: feedback.status, created_at: getDateWithoutTime(feedback.created_at), admin_response: feedback.admin_response }
          })} />
        </div>
      </div>
      {showFilters && (
        <div className='w-full flex'>
          <div className='w-1/4 flex'>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject or message... and press ENTER key"
                value={searchTermTemp}
                onChange={(e) => {
                  setSearchTermTemp(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === TEXT_SEARCH_TRIGGER_KEY) {
                    handleTextSearch();
                  }
                }}
                onBlur={handleTextSearch}
                className="input-field pl-10 mr-4"
              />
            </div>
          </div>
          <div className='w-1/6 flex'>
            <select
              value={selectedFeedbackRating}
              onChange={(e) => {
                setCurrentPage(FIRST_PAGE_NUMBER)
                setSelectedFeedbackRating(parseInt(e.target.value))
              }}
              className="input-field mx-2"
            >
              <option value="">All Ratings</option>
              {RATING_STARS.map(feedbackStar => (
                <option key={feedbackStar} value={feedbackStar}>
                  {feedbackStar}
                </option>
              ))}
            </select>
          </div>
          <div className='w-1/6 flex'>
            <select
              value={selectedFeedbackCategory}
              onChange={(e) => {
                setCurrentPage(FIRST_PAGE_NUMBER)
                setSelectedFeedbackCategory(e.target.value)
              }}
              className="input-field mx-2"
            >
              <option value="">All Categories</option>
              {FEEDBACK_CATEGORIES.map(feedbackCategory => (
                <option key={feedbackCategory.value} value={feedbackCategory.value}>
                  {feedbackCategory.label}
                </option>
              ))}
            </select>
          </div>
          <div className='w-1/6 flex'>
            <select
              value={selectedFeedbackPriority}
              onChange={(e) => {
                setCurrentPage(FIRST_PAGE_NUMBER)
                setSelectedFeedbackPriority(e.target.value)
              }}
              className="input-field mx-2"
            >
              <option value="">All Priorities</option>
              {FEEDBACK_PRIORITIES.map(feedbackPriority => (
                <option key={feedbackPriority.value} value={feedbackPriority.value}>
                  {feedbackPriority.label}
                </option>
              ))}
            </select>
          </div>
          <div className='w-1/6 flex'>
            <select
              value={selectedFeedbackStatus}
              onChange={(e) => {
                setCurrentPage(FIRST_PAGE_NUMBER)
                setSelectedFeedbackStatus(e.target.value)
              }}
              className="input-field mx-2"
            >
              <option value="">All Statuses</option>
              {FEEDBACK_STATUSES.map(feedbackStatus => (
                <option key={feedbackStatus.value} value={feedbackStatus.value}>
                  {feedbackStatus.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-lg shadow border p-6">
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
                    {RATING_STARS.map((star) => (
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
                  {FEEDBACK_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSelectedFeedback(feedback)
                    setShowResponseModal(true)
                  }}
                  className="btn-primary text-sm flex"
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
