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
import { StoreModal } from '@/components/store/StoreModal'

import { Store } from '@/lib/types/Models'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { RecordStatus, DATABASE_TABLE } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_TABLE_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { getDateWithoutTime, getRecordStatusColor, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { saveStore, updateStore, updateStoreRecordStatus } from '@/lib/server_actions/store'

import { useAuthContext } from '@/components/providers/AuthProvider'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function StorePage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [stores, setStores] = useState<Store[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
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
  const { currentUser, supabase } = useAuthContext();

  const reportHeaders = {name: 'Store Name', description: 'Description', created_at: 'Date Created'}

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadStores()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadStores = async () => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      setLoading(true)
      let query = supabase.from(DATABASE_TABLE.stores).select('*', {count: 'exact', head: false})
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
      }
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showServerErrorToast(error.message)
      }
      setStores(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingStore(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const store = stores.find(store => store.id === id)
    setEditingStore(store!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await updateStoreRecordStatus(id, {status: RecordStatus.ARCHIVED})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = stores.filter(store => store.id !== id)
        setStores(remainingRecords)
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

    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await updateStoreRecordStatus(id, {status: RecordStatus.ACTIVE})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Restored.')
        const remainingRecords = stores.filter(store => store.id !== id)
        setStores(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (store: Store) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

      // Exclude id field while creating new record 
      const {id, ...storeWithNoId} = store
    try {
      const { error } = await saveStore(storeWithNoId)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Created.')
      loadStores()
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (store: Store) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await updateStore(store.id, store)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      loadStores()
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
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.store.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600">Manage your stores of items</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Store
        </button>
      </div>

      {/* Store Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <div className="w-full text-right items-right mb-4">
            <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters);} }>
              <b>Show Filters</b>
            </button>
            <span className="px-1"></span>
            <ExportExcel reportName="Stores" records={[reportHeaders, ...stores].map((store, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: store.name, description: store.description, created_at: getDateWithoutTime(store.created_at)}
            })} />
            <span className="px-1"></span>
            <ExportPDF reportName="Stores" records={[reportHeaders, ...stores].map((store, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: store.name, description: store.description, created_at: getDateWithoutTime(store.created_at)}
            })} />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
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
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                    </div>
                  </td>
                  <td style={{maxWidth: 200}} className="px-6 py-4 text-sm text-gray-900 o">
                    {canSeeMore ? shortenText(store.description, MAX_TABLE_TEXT_LENGTH) : store.description}
                    {store.description.length > MAX_TABLE_TEXT_LENGTH && (
                      <span onClick={() => setCanSeeMore(!canSeeMore)} className='text-blue-300'>{canSeeMore ? 'more' : '  less...'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(store.status!)}`}>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2 items-center">                        
                      <ActionsMenu
                        actions={[
                          {
                            id: store.id!,
                            hideOption: selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: store.id!,
                            hideOption: selectedStatus !== RecordStatus.ACTIVE,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Archive',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: () => {
                              setCurrentActiveId(store.id!)
                              setIsArchiveConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: store.id!,
                            hideOption: selectedStatus === RecordStatus.ACTIVE,
                            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                            label: 'Restore',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(store.id!)
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

      {/* Store Modal */}
      <StoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        store={editingStore}
        onSave={(store) => {
          setLoading(true)
          if (editingStore) {
            handleUpdate(store)
          } else {
            handleCreate(store)
          }
        }}
      />

      {/* Confirmation Modal for Archive */}
      <ConfirmationModal
        isOpen={isArchiveConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to archive this store?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this store?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}


