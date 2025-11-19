'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { FeedbackRating } from '@/components/feedback/FeedbackRating'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { calculateStartAndEndIndex, formatDateToLocalDate, getDateWithoutTime, getFeedbackCategoryColor, getFeedbackCategoryLabel, getFeedbackPriorityColor, getFeedbackStatusColor, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import { FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES, FIRST_PAGE_NUMBER, RATING_STARS, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { fetchUserFeedbacks, saveUserFeedback } from '@/lib/server_actions/feedback'
import { UserFeedback } from '@/lib/types/Models'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'
import Pagination from '@/components/helpers/Pagination'

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [selectedFeedbackRating, setSelectedFeedbackRating] = useState(0)
  const [selectedFeedbackCategory, setSelectedFeedbackCategory] = useState('')
  const [selectedFeedbackPriority, setSelectedFeedbackPriority] = useState('')
  const [selectedFeedbackStatus, setSelectedFeedbackStatus] = useState('')

  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: '',
    rating: 0
  })
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  // Global States
  const { loading, setLoading } = useLoadingContext()

  const reportHeaders = { subject: 'Subject', rating: 'rating', category: 'category', priority: 'Priority', status: 'Status', created_at: 'Date', admin_response: 'Admin Response' }

  useEffect(() => {
    loadFeedbacks()
  }, [searchTerm, selectedFeedbackCategory, selectedFeedbackPriority, selectedFeedbackRating, selectedFeedbackStatus, recordsPerPage, currentPage])

  const loadFeedbacks = async () => {
    const { startIndex, endIndex } = calculateStartAndEndIndex({ currentPage, recordsPerPage });

    try {
      setLoading(true)
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

  const handleTextSearch = () => {
    setCurrentPage(FIRST_PAGE_NUMBER)
    setSearchTerm(searchTermTemp.trim())
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
                  <option key='' value=''></option>
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
                  {RATING_STARS.map((star) => (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Be the first to submit feedback and help us improve!
            </p>
          </div>
        ) : (
          <>
            {
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
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">Admin Response:</h4>
                      <p className="text-gray-600 text-sm">{feedback.admin_response}</p>
                    </div>
                  )}
                </div>
              ))
            }

            <Pagination
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              totalRecordsCount={totalRecordsCount}
              setCurrentPage={setCurrentPage}
              setRecordsPerPage={setRecordsPerPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
