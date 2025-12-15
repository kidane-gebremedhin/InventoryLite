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

import { Supplier } from '@/lib/types/Models'
import { RecordStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_TABLE_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, RECORDS_PER_PAGE_OPTIONS, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { calculateStartAndEndIndex, getDateWithoutTime, getRecordStatusColor, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import SupplierModal from '@/components/supplier/SupplierModal'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { fetchSuppliers, saveSupplier, updateSupplier, updateSupplierRecordStatus } from '@/lib/server_actions/supplier'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function SupplierPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
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
  const { loading, setLoading } = useLoadingContext()

  const reportHeaders = { name: 'Supplier Name', email: 'Email', phone: 'Phone Number', address: 'Address', created_at: 'Date Created' }

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadSuppliers()
  }, [searchTerm, selectedStatus, recordsPerPage, currentPage])

  const loadSuppliers = async () => {
    const { startIndex, endIndex } = calculateStartAndEndIndex({ currentPage, recordsPerPage });

    try {
      setLoading(true)

      const { data, count, error } = await fetchSuppliers({ selectedStatus, searchTerm, startIndex, endIndex });

      if (error) {
        showServerErrorToast(error.message)
      }
      setSuppliers(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const supplier = suppliers.find(supplier => supplier.id === id)
    setEditingSupplier(supplier!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    try {
      const { error } = await updateSupplierRecordStatus(id, { status: RecordStatus.ARCHIVED })

      if (error) {
        showServerErrorToast(error.message)
        return
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = suppliers.filter(supplier => supplier.id !== id)
        setSuppliers(remainingRecords)
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
      const { error } = await updateSupplierRecordStatus(id, { status: RecordStatus.ACTIVE })

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Restored.')
        const remainingRecords = suppliers.filter(supplier => supplier.id !== id)
        setSuppliers(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (supplier: Supplier) => {
    // Exclude id field while creating new record 
    const { id, ...supplierWithNoId } = supplier
    try {
      const { data, error } = await saveSupplier(supplierWithNoId)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Created.')
      setSuppliers(prev => [...data, ...prev])
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (supplier: Supplier) => {
    try {
      const { data, error } = await updateSupplier(supplier.id, supplier)

      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      setSuppliers(prev => prev.map(elem => elem.id === supplier.id ? data[0] : elem))
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
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.supplier.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="w-full md:w-5/6">
        <div className="md:flex md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
            <p className="text-gray-600">Manage your suppliers of items</p>
          </div>
          <button
            onClick={handleAdd}
            className="w-full md:w-1/5 btn-primary flex justify-center items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="card">
        <div className="w-full overflow-x-scroll p-4">
          <div className="w-[1000px]">
            <div className="w-full md:text-right md:items-right mb-4">
              <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters); }}>
                <b>Show Filters</b>
              </button>
              <span className="px-1"></span>
              <ExportExcel reportName="Supplieers" records={[reportHeaders, ...suppliers].map((supplier, idx) => {
                return { row_no: idx > 0 ? idx : 'Row No.', name: supplier.name, email: supplier.email, phone: supplier.phone, address: supplier.address, created_at: getDateWithoutTime(supplier.created_at) }
              })} />
              <span className="px-1"></span>
              <ExportPDF reportName="Supplieers" records={[reportHeaders, ...suppliers].map((supplier, idx) => {
                return { row_no: idx > 0 ? idx : 'Row No.', name: supplier.name, email: supplier.email, phone: supplier.phone, address: supplier.address, created_at: getDateWithoutTime(supplier.created_at) }
              })} />
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: 150 }}>
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
                    <th className="px-6 py-3 text-right text-xs items-center font-medium text-gray-500 uppercase tracking-wider">
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
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.email}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.phone}
                    </td>
                    <td style={{ maxWidth: 200 }} className="px-6 py-4 text-sm text-gray-900 o">
                      {canSeeMore ? shortenText(supplier.address, MAX_TABLE_TEXT_LENGTH) : supplier.address}
                      {supplier.address && supplier.address.length > MAX_TABLE_TEXT_LENGTH && (
                        <span onClick={() => setCanSeeMore(!canSeeMore)} className='text-blue-300'>{canSeeMore ? 'more' : '  less...'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(supplier.status!)}`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-center space-x-2 items-center">
                        <ActionsMenu
                          actions={[
                            {
                              id: supplier.id!,
                              hideOption: selectedStatus === RecordStatus.ARCHIVED,
                              icon: <PencilIcon className="h-4 w-4" />,
                              label: 'Edit',
                              class: "w-full text-primary-600 hover:text-primary-900",
                              listener: handleEdit
                            },
                            {
                              id: supplier.id!,
                              hideOption: selectedStatus !== RecordStatus.ACTIVE,
                              icon: <TrashIcon className="h-4 w-4" />,
                              label: 'Archive',
                              class: "w-full text-red-600 hover:text-red-900",
                              listener: () => {
                                setCurrentActiveId(supplier.id!)
                                setIsArchiveConfirmationModalOpen(true)
                              }
                            },
                            {
                              id: supplier.id!,
                              hideOption: selectedStatus === RecordStatus.ACTIVE,
                              icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                              label: 'Restore',
                              class: "w-full text-yellow-600 hover:text-yellow-900",
                              listener: () => {
                                setCurrentActiveId(supplier.id!)
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
            <Pagination
              currentPage={currentPage}
              recordsPerPage={recordsPerPage}
              totalRecordsCount={totalRecordsCount}
              setCurrentPage={setCurrentPage}
              setRecordsPerPage={setRecordsPerPage}
            />
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={editingSupplier}
        onSave={(supplier) => {
          setLoading(true)
          if (editingSupplier) {
            handleUpdate(supplier)
          } else {
            handleCreate(supplier)
          }
        }}
      />

      {/* Confirmation Modal for Archive */}
      <ConfirmationModal
        isOpen={isArchiveConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to archive this supplier?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />

      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this supplier?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}
