'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { ManualPaymentModal } from '@/components/manual_payment/ManualPaymentModal'
import { ManualPayment } from '@/lib/types/Models'
import { DATABASE_TABLE, PaymentStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, PAYMENT_STATUSES, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { calculateStartAndEndIndex, formatDateToLocalDate, getDateWithoutTime, getPaymentStatusColor, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { CheckmarkIcon } from 'react-hot-toast'
import { approveManualPayment, declineManualPayment, fetchManualPayments, saveManualPayment, updateManualPayment } from '@/lib/server_actions/manual_payment'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function ManualPaymentPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingManualPayment, setEditingManualPayment] = useState<ManualPayment | null>(null)
  const [selectedStatus, setSelectedStatus] = useState(ALL_OPTIONS)
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  // Record Actions
  const [currentActiveId, setCurrentActiveId] = useState<string>('')
  const [isApprovePaymentConfirmationModalOpen, setIsApprovePaymentConfirmationModalOpen] = useState(false)
  const [isDeclinePaymentConfirmationModalOpen, setIsDeclinePaymentConfirmationModalOpen] = useState(false)
  // Global States
  const {loading, setLoading} = useLoadingContext()

  const reportHeaders = {amount: 'Paid Amount', reference_number: 'Reference Number', created_at: 'Paymment Date'}

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadManualPayments()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadManualPayments = async () => {
    const {startIndex, endIndex} = calculateStartAndEndIndex({currentPage, recordsPerPage});

    try {
      setLoading(true)
      
      const { data, count, error } = await fetchManualPayments({ selectedStatus, searchTerm, startIndex, endIndex });

      if (error) {
        showServerErrorToast(error.message)
      }
      setManualPayments(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingManualPayment(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const manualPayment = manualPayments.find(manualPayment => manualPayment.id === id)
    setEditingManualPayment(manualPayment!)
    setIsModalOpen(true)
  }

  const handleApprovePayment = async (id: string) => {
    resetModalState()
    
    try {
      const { data, error } = await approveManualPayment(id)
      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Payment Approved.')
        const updatedRecords = manualPayments
        .map(manualPayment => {
            return manualPayment.id !== id ?
              manualPayment
              : {
              ...manualPayment,
              status: PaymentStatus.APPROVED
            }
        });
        
        setManualPayments(updatedRecords)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleDeclinePayment = async (id: string) => {
    resetModalState()

    try {
      const { error } = await declineManualPayment(id)

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Declined.')
        const updatedRecords = manualPayments
        .map(manualPayment => {
            return manualPayment.id !== id ?
              manualPayment
              : {
              ...manualPayment,
              status: PaymentStatus.DECLINED
            }
        });
        
        setManualPayments(updatedRecords)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (manualPayment: ManualPayment) => {
      // Exclude id field while creating new record 
      const {id, ...manualPaymentWithNoId} = manualPayment
    try {
      const { error } = await saveManualPayment(manualPaymentWithNoId)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Created.')
      loadManualPayments()
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (manualPayment: ManualPayment) => {
    try {
      const { error } = await updateManualPayment(manualPayment.id, manualPayment)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      loadManualPayments()
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
    setIsApprovePaymentConfirmationModalOpen(false)
    setIsDeclinePaymentConfirmationModalOpen(false)
  }

  const handleServerError = (error: PostgrestError) => {
    if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.manualPayment.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Your payments</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Payment
        </button>
      </div>

      {/* ManualPayment Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <div className="w-full text-right items-right mb-4">
            <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters);} }>
              <b>Show Filters</b>
            </button>
            <span className="px-1"></span>
            <ExportExcel reportName="Manual Payments" records={[reportHeaders, ...manualPayments].map((manualPayment, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', amount: manualPayment.amount, reference_number: manualPayment.reference_number, created_at: getDateWithoutTime(manualPayment.created_at)}
            })} />
            <span className="px-1"></span>
            <ExportPDF reportName="Manual Payments" records={[reportHeaders, ...manualPayments].map((manualPayment, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', amount: manualPayment.amount, reference_number: manualPayment.reference_number, created_at: getDateWithoutTime(manualPayment.created_at)}
            })} />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                  Payment Status
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
                      placeholder="Search payment by reference number... and press ENTER key"
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
                        {PAYMENT_STATUSES.map(status => (
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
              {manualPayments.map((manualPayment) => (
                <tr key={manualPayment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{manualPayment.reference_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(manualPayment.status!)}`}>
                      {manualPayment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {formatDateToLocalDate(manualPayment.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2 items-center">                        
                      <ActionsMenu
                        actions={[
                          {
                            id: manualPayment.id!,
                            hideOption: manualPayment.status !== PaymentStatus.PENDING,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit Details',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: manualPayment.id!,
                            hideOption: manualPayment.status === PaymentStatus.APPROVED || false/*'user' !== 'admin'*/,
                            icon: <CheckmarkIcon className="h-4 w-4" />,
                            label: 'Approve Payment',
                            class: "w-full text-green-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(manualPayment.id!)
                              setIsApprovePaymentConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: manualPayment.id!,
                            hideOption: manualPayment.status === PaymentStatus.DECLINED || false/*'user' !== 'admin'*/,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Decline Payment',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: () => {
                              setCurrentActiveId(manualPayment.id!)
                              setIsDeclinePaymentConfirmationModalOpen(true)
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

      {/* ManualPayment Modal */}
      <ManualPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        manualPayment={editingManualPayment}
        onSave={(manualPayment) => {
          setLoading(true)
          if (editingManualPayment) {
            handleUpdate(manualPayment)
          } else {
            handleCreate(manualPayment)
          }
        }}
      />

      {/* Confirmation Modal for approve manual payment */}
      <ConfirmationModal
        isOpen={isApprovePaymentConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to approve this payment?"
        onConfirmationSuccess={handleApprovePayment}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for decline manual payment */}
      <ConfirmationModal
        isOpen={isDeclinePaymentConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to decline this payment?"
        onConfirmationSuccess={handleDeclinePayment}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}


