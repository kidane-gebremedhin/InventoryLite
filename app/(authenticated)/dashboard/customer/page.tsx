'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpOnSquareIcon
} from '@heroicons/react/24/outline'

import { Customer } from '@/lib/types/Models'
import { RecordStatus, DATABASE_TABLE } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_TABLE_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { calculateStartAndEndIndex, getDateWithoutTime, getRecordStatusColor, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import CustomerModal from '@/components/sales_orders/CustomerModal'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { fetchCustomers, saveCustomer, updateCustomer, updateCustomerRecordStatus } from '@/lib/server_actions/customer'
import { useAuthContext } from '@/components/providers/AuthProvider'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function CustomerPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
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

  const reportHeaders = {name: 'Customer Name', email: 'Email', phone: 'Phone Number', address: 'Address', created_at: 'Date Created'}

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadCustomers()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadCustomers = async () => {
    const {startIndex, endIndex} = calculateStartAndEndIndex({currentPage, recordsPerPage});
    
    try {
      setLoading(true)

      const { data, count, error } = await fetchCustomers({ selectedStatus, searchTerm, startIndex, endIndex });
      
      if (error) {
        showServerErrorToast(error.message)
      }
      setCustomers(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const customer = customers.find(customer => customer.id === id)
    setEditingCustomer(customer!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    try {
      const { error } = await updateCustomerRecordStatus(id, {status: RecordStatus.ARCHIVED})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = customers.filter(customer => customer.id !== id)
        setCustomers(remainingRecords)
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
      const { error } = await updateCustomerRecordStatus(id, {status: RecordStatus.ACTIVE})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Restored.')
        const remainingRecords = customers.filter(customer => customer.id !== id)
        setCustomers(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (customer: Customer) => {
      // Exclude id field while creating new record 
      const {id, ...customerWithNoId} = customer
      try {
        const { error } = await saveCustomer(customerWithNoId)

        if (error) {
          handleServerError(error)
          return
        }

        setIsModalOpen(false)
        showSuccessToast('Record Created.')
        loadCustomers()
      } catch (error: any) {
        showErrorToast()
      } finally {
        setLoading(false)
      }
  }

  const handleUpdate = async (customer: Customer) => {
    try {
      const { error } = await updateCustomer(customer.id, customer)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      loadCustomers()
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
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.customer.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage your customers of items</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <div className="w-full text-right items-right mb-4">
            <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters);} }>
              <b>Show Filters</b>
            </button>
            <span className="px-1"></span>
            <ExportExcel reportName="Customers" records={[reportHeaders, ...customers].map((customer, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, created_at: getDateWithoutTime(customer.created_at)}
            })} />
            <span className="px-1"></span>
            <ExportPDF reportName="Customers" records={[reportHeaders, ...customers].map((customer, idx) => {
              return {row_no: idx > 0 ? idx : 'Row No.', name: customer.name, email: customer.email, phone: customer.phone, address: customer.address, created_at: getDateWithoutTime(customer.created_at)}
            })} />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                  Record Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              {showFilters && (
              <tr>
                <th colSpan={4} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email/phone/address... and press ENTER key"
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.phone}</div>
                    </div>
                  </td>
                  <td style={{maxWidth: 200}} className="px-6 py-4 text-sm text-gray-900 o">
                    {canSeeMore ? shortenText(customer.address, MAX_TABLE_TEXT_LENGTH) : customer.address}
                    {customer.address && customer.address.length > MAX_TABLE_TEXT_LENGTH && (
                      <span onClick={() => setCanSeeMore(!canSeeMore)} className='text-blue-300'>{canSeeMore ? 'more' : '  less...'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(customer.status!)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2 items-center">                        
                      <ActionsMenu
                        actions={[
                          {
                            id: customer.id!,
                            hideOption: selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: customer.id!,
                            hideOption: selectedStatus !== RecordStatus.ACTIVE,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Archive',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: () => {
                              setCurrentActiveId(customer.id!)
                              setIsArchiveConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: customer.id!,
                            hideOption: selectedStatus === RecordStatus.ACTIVE,
                            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                            label: 'Restore',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(customer.id!)
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
        onSave={(customer) => {
          setLoading(true)
          if (editingCustomer) {
            handleUpdate(customer)
          } else {
            handleCreate(customer)
          }
        }}
      />
      
      {/* Confirmation Modal for Archive */}
      <ConfirmationModal
        isOpen={isArchiveConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to archive this customer?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this customer?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}
