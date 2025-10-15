'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpOnSquareIcon,
} from '@heroicons/react/24/outline'
import { CategoryModal } from '@/components/category/CategoryModal'

import { Category } from '@/lib/types/Models'
import { RecordStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_TABLE_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { calculateStartAndEndIndex, getDateWithoutTime, getRecordStatusColor, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { fetchCategories, saveCategory, updateCategory, updateCategoryRecordStatus } from '@/lib/server_actions/category'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function CategoryPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [canSeeMore, setCanSeeMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  // Record Actions
  const [currentActiveId, setCurrentActiveId] = useState<string>('')
  const [isArchiveConfirmationModalOpen, setIsArchiveConfirmationModalOpen] = useState(false)
  const [isRestoreConfirmationModalOpen, setIsRestoreConfirmationModalOpen] = useState(false)
  // Global States
  const {loading, setLoading} = useLoadingContext()

  const reportHeaders = {name: 'Category Name', description: 'Description', created_at: 'Date Created'}

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadCategories()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadCategories = async () => {    
    const {startIndex, endIndex} = calculateStartAndEndIndex({currentPage, recordsPerPage});

    try {
      setLoading(true)
  
      const { data, count, error } = await fetchCategories({ selectedStatus, searchTerm, startIndex, endIndex });

      if (error) {
        showServerErrorToast(error.message)
      }

      setCategories(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const category = categories.find(category => category.id === id)
    setEditingCategory(category!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    try {
      const { error } = await updateCategoryRecordStatus(id, {status: RecordStatus.ARCHIVED})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = categories.filter(category => category.id !== id)
        setCategories(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id: string) => {
    resetModalState()

    try {
      const { error } = await updateCategoryRecordStatus(id, {status: RecordStatus.ACTIVE})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Restored.')
        const remainingRecords = categories.filter(category => category.id !== id)
        setCategories(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (category: Category) => {
      // Exclude id field while creating new record 
      const {id, ...categoryWithNoId} = category
    try {
      const { data, error } = await saveCategory(categoryWithNoId)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)

      showSuccessToast('Record Created.')
      setCategories(prev => [...data, ...prev])
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (category: Category) => {
    try {
      const { data, error } = await updateCategory(category.id, category)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      setCategories(prev => prev.map(elem => elem.id === category.id ? data[0] : category))
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleTextSearch = () => {
    setCurrentPage(FIRST_PAGE_NUMBER)
    setSearchTerm(searchTermTemp.trim())
  }

  const resetModalState = () => {
    setCurrentActiveId('')
    setIsArchiveConfirmationModalOpen(false)
    setIsRestoreConfirmationModalOpen(false)
  }

  const handleServerError = (error: PostgrestError) => {
    if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.category.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Manage your categories of items</p>
        </div>
        <div>
          <button
            onClick={handleAdd}
            className="w-full btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Category Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <div className="w-full text-right items-right mb-4">
            <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters);} }>
              <b>Show Filters</b>
            </button>
            <span className="px-1"></span>
            <ExportExcel reportName = "Categories" records={[reportHeaders, ...categories].map((category, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: category.name, description: category.description, created_at: getDateWithoutTime(category.created_at)}
            })} />
            <span className="px-1"></span>
            <ExportPDF reportName = "Categories" records={[reportHeaders, ...categories].map((category, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: category.name, description: category.description, created_at: getDateWithoutTime(category.created_at)}
            })} />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                  Record Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              {showFilters && (
              <tr>
                <th colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or description... and press ENTER key"
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
                      className="input-field pl-10"
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                    <div className='w-full'>
                        <select
                        value={selectedStatus}
                        onChange={(e) => { 
                          setCurrentPage(FIRST_PAGE_NUMBER)
                          setSelectedStatus(e.target.value)
                        }}
                        className="input-field"
                      >
                        {RECORD_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status === ALL_OPTIONS ? 'All Statuses' : status}
                          </option>
                        ))}
                      </select>
                    </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </div>
                  </td>
                  <td style={{maxWidth: 200}} className="px-6 py-4 text-sm text-gray-900 o">
                    {canSeeMore ? shortenText(category.description, MAX_TABLE_TEXT_LENGTH) : category.description}
                    {category.description?.length > MAX_TABLE_TEXT_LENGTH && (
                      <span onClick={() => setCanSeeMore(!canSeeMore)} className='text-blue-300'>{canSeeMore ? 'more' : '  less...'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(category.status!)}`}>
                      {category.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2 items-center">                        
                      <ActionsMenu
                        actions={[
                          {
                            id: category.id!,
                            hideOption: selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: category.id!,
                            hideOption: selectedStatus !== RecordStatus.ACTIVE,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Archive',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: () => {
                              setCurrentActiveId(category.id!)
                              setIsArchiveConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: category.id!,
                            hideOption: selectedStatus === RecordStatus.ACTIVE,
                            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                            label: 'Restore',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(category.id!)
                              setIsRestoreConfirmationModalOpen(true)
                            }
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage = {currentPage}
          recordsPerPage = {recordsPerPage}
          totalRecordsCount = {totalRecordsCount}
          setCurrentPage = {setCurrentPage}
          setRecordsPerPage = {setRecordsPerPage}
        />
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSave={(category) => {
          setLoading(true)
          if (editingCategory) {
            handleUpdate(category)
          } else {
            handleCreate(category)
          }
        }}
      />

      {/* Confirmation Modal for Archive */}
      <ConfirmationModal
        isOpen={isArchiveConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to archive this category?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this category?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}
