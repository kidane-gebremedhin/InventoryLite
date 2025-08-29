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
import { supabase } from '@/lib/supabase'
import { Customer } from '@/lib/types/Models'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { RecordStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_TABLE_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, RECORDS_PER_PAGE_OPTIONS, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { getRecordStatusColor, shortenText, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Tooltip from '@/components/helpers/ToolTip'
import Pagination from '@/components/Pagination'
import Loading from '@/components/helpers/Loading'
import { useUserContext } from '@/components/contextApis/UserProvider'
import CustomerModal from '@/components/issuables/CustomerModal'

export default function CustomerPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [canSeeMore, setCanSeeMore] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  const {currentUser, setCurrentUser} = useUserContext()

  const TABLE_NAME = 'customers'

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadCustomers()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadCustomers = async () => {
    setLoading(true)

    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(TABLE_NAME).select('*', {count: 'exact', head: false})
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
      }
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%, address.ilike.%${searchTerm}%`)
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showErrorToast()
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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this customer?')) {
    if (!supabase || !await authorseDBAction(currentUser)) return
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({status: RecordStatus.ARCHIVED})
          .eq('id', id)

        if (error) {
          showErrorToast()
        } else {
          showSuccessToast('Record Archived.')
          setCustomers(customers.filter(customer => customer.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this customer?')) {
    if (!supabase || !await authorseDBAction(currentUser)) return
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({status: RecordStatus.ACTIVE})
          .eq('id', id)

        if (error) {
          showErrorToast()
        } else {
          showSuccessToast('Record Restored.')
          setCustomers(customers.filter(customer => customer.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCreate = async (customer: Customer) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

      // Exclude id field while creating new record 
      const {id, ...customerWithNoId} = customer
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .insert(customerWithNoId)

      if (error) {
        showErrorToast()
      } else {
        showSuccessToast('Record Created.')
        loadCustomers()
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (customer: Customer) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(customer)
        .eq('id', customer.id)

      if (error) {
        showErrorToast()
      } else {
        showSuccessToast('Record Updated.')
        loadCustomers()
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleTextSearch = () => {
    setCurrentPage(FIRST_PAGE_NUMBER)
    setSearchTerm(searchTermTemp)
  }

  if (loading) {
    return <Loading />
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

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or address/email/phone... and press ENTER key"
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
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.email} {customer.phone}</div>
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
                    <div className="flex justify-center space-x-2">
                      {selectedStatus === RecordStatus.ACTIVE ? (
                        <>
                        <Tooltip text="Edit?">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip text="Archive?">
                          <button
                            onClick={() => handleArchive(customer.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        </>
                      ) : (
                        <Tooltip text="Restore?">
                          <button
                            onClick={() => handleRestore(customer.id!)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <ArrowUpOnSquareIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage = {currentPage}
            recordsPerPage = {recordsPerPage}
            totalRecordsCount = {totalRecordsCount}
            setCurrentPage = {setCurrentPage}
            setRecordsPerPage = {setRecordsPerPage}
          />
        </div>

        {customers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
        onSave={(customer) => {
          if (editingCustomer) {
            handleUpdate(customer)
          } else {
            handleCreate(customer)
          }
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
