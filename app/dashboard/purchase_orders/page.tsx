'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpOnSquareIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  BackwardIcon,
} from '@heroicons/react/24/outline'
import PurchaseOrderModal from '@/components/purchase_orders/PurchaseOrderModal'
import OrderDetailsModal from '@/components/purchase_orders/OrderDetailsModal'
import { supabase } from '@/lib/supabase'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { PurchaseOrderStatus, RecordStatus, RPC_FUNCTION, TABLE } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_DROPDOWN_TEXT_LENGTH, PURCHASE_ORDER_STATUSES, RECORD_STATUSES, RECORDS_PER_PAGE, RECORDS_PER_PAGE_OPTIONS, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { canShowLoadingScreen, convertToUTC, formatDateToUTC, getCurrentDateTimeUTC, getDateWithoutTime, getRecordStatusColor, isCustomServerError, setEarliestTimeOfDay, setLatestTimeOfDay, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import { PurchaseOrder, Supplier } from '@/lib/types/Models'
// DatePicker both are required
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import ActionsMenu from '@/components/helpers/ActionsMenu'
import { useUserContext } from '@/components/context_apis/UserProvider'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'

export default function PurchaseOrderPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplier] = useState(ALL_OPTIONS)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [receivedDateStart, setReceivedDateStart] = useState<Date | null>(null)
  const [receivedDateEnd, setReceivedDateEnd] = useState<Date | null>(null)
  // Record Actions
  const [currentActiveId, setCurrentActiveId] = useState<string>('')
  const [isArchiveConfirmationModalOpen, setIsArchiveConfirmationModalOpen] = useState(false)
  const [isRestoreConfirmationModalOpen, setIsRestoreConfirmationModalOpen] = useState(false)
  const [isMoveToPendingConfirmationModalOpen, setIsMoveToPendingConfirmationModalOpen] = useState(false)
  const [isMoveToReceivedConfirmationModalOpen, setIsMoveToReceivedConfirmationModalOpen] = useState(false)
  const [isMoveToCanceledConfirmationModalOpen, setIsMoveToCanceledConfirmationModalOpen] = useState(false)
  // Global States
  const {loading, setLoading} = useLoadingContext()
  const {currentUser, setCurrentUser} = useUserContext()

  useEffect(() => {
    const loadSuppliers = async () => {
      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const { data, error } = await supabase
          .from(TABLE.suppliers)
          .select('*')
          .eq('status', RecordStatus.ACTIVE)
          .order('name')

        if (error) {
          showServerErrorToast(error.message)
        }

        const selectableSuppliers: Supplier[] = [{id: ALL_OPTIONS, name: ''}, ...data!]
        setSuppliers(selectableSuppliers)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadSuppliers()
  }, [])

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadPurchaseOrders()
  }, [searchTerm, selectedSupplierId, selectedOrderStatus, selectedStatus, startDate, endDate, receivedDateStart, receivedDateEnd, recordsPerPage, currentPage])

  const loadPurchaseOrders = async () => {
    setLoading(canShowLoadingScreen(startDate, endDate, receivedDateStart, receivedDateEnd))

    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(TABLE.purchase_orders).select(`
          *,
          supplier:suppliers(*),
          order_items:purchase_order_items(
          *,
          item:inventory_items(*),
          store:stores(*)
          )`,
          {count: 'exact', head: false})
      if (selectedOrderStatus !== ALL_OPTIONS) {
        query = query.eq('order_status', selectedOrderStatus)
      }
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
      }
      if (selectedSupplierId !== ALL_OPTIONS) {
        query = query.eq('supplier_id', selectedSupplierId);
      }
      if (searchTerm) {
        query = query.or(`po_number.ilike.%${searchTerm}%`)
      }
      if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('expected_date', startDateUTC.toUTCString())
      }
      if (endDate) {
        const endDateUTC = convertToUTC(setLatestTimeOfDay(endDate))
        query = query.lte('expected_date', endDateUTC.toUTCString())
      }
      if (receivedDateStart) {
        const receivedDateStartUTC = convertToUTC(setEarliestTimeOfDay(receivedDateStart))
        query = query.gte('received_date', receivedDateStartUTC.toUTCString())
      }
      if (receivedDateEnd) {
        const receivedDateEndUTC = convertToUTC(setLatestTimeOfDay(receivedDateEnd))
        query = query.lte('received_date', receivedDateEndUTC.toUTCString())
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showServerErrorToast(error.message)
      }

      setPurchaseOrders(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingPurchaseOrder(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const order = purchaseOrders.find(order => order.id === id)
    setEditingPurchaseOrder(order!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    if (!supabase || !await authorseDBAction(currentUser)) return
    try {
      const { error } = await supabase
        .from(TABLE.purchase_orders)
        .update({status: RecordStatus.ARCHIVED})
        .eq('id', id)

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = purchaseOrders.filter(purchaseOrder => purchaseOrder.id !== id)
        setPurchaseOrders(remainingRecords)
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
      const { error } = await supabase
        .from(TABLE.purchase_orders)
        .update({status: RecordStatus.ACTIVE})
        .eq('id', id)

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast(`Record Restored.`)
        const remainingRecords = purchaseOrders.filter(purchaseOrder => purchaseOrder.id !== id)
        setPurchaseOrders(remainingRecords)
        setTotalRecordsCount(remainingRecords.length)
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (purchaseOrder: PurchaseOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {id, order_items, ...purchaseOrderWithNoId} = purchaseOrder

    try {
      const { data, error: poError } = await supabase
          .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, {
            purchase_order_data: purchaseOrderWithNoId,
            purchase_order_items_data: purchaseOrder.order_items,
          })

      if (poError) {
        handleServerError(poError)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Created.')
      loadPurchaseOrders()
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (purchaseOrder: PurchaseOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {order_items, ...purchaseOrderWithNoOrderItems} = purchaseOrder

    try {
      const { data, error: poError } = await supabase
                .rpc(RPC_FUNCTION.TRANSACTION_PURCHASE_ORDER_HANDLER, {
                  purchase_order_data: purchaseOrderWithNoOrderItems,
                  purchase_order_items_data: purchaseOrder.order_items,
                  is_for_update: true
                })
      if (poError) {
        handleServerError(poError)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Record Updated.')
      loadPurchaseOrders()
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

  const handleViewDetails = (id: string) => {
    const order = purchaseOrders.find(order => order.id === id)
    setSelectedOrder(order!)
    setShowDetailsModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case PurchaseOrderStatus.RECEIVED:
        return 'bg-green-100 text-green-800'
      case PurchaseOrderStatus.CANCELED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleOrderStatusChange = async (id: string, status?: string) => {
    resetModalState()

    if (!status || !supabase) return

    try {
      const { error } = await supabase
        .from(TABLE.purchase_orders)
        .update({ order_status: status })
        .eq('id', id)

      if (error) throw error

      showSuccessToast(`Order status updated to ${status}`)
      loadPurchaseOrders()
    } catch (error: any) {
      showErrorToast()
    }
  }

  const getPurchaseOrderStatusOptions = () => [ALL_OPTIONS, ...PURCHASE_ORDER_STATUSES!]

  const getTotalOrderPrice = (order?: PurchaseOrder): number => {
    if (!order || !order.order_items) return 0

    return order.order_items.reduce((acc, currentOrderItem) => {
      return acc + (currentOrderItem.quantity * currentOrderItem.unit_price)
    }, 0)
  }
  
  const onDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setStartDate(start);
    setEndDate(end);
  }

  const onReceivedDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setReceivedDateStart(start);
    setReceivedDateEnd(end);
  }

  const resetModalState = () => {
    setCurrentActiveId('')
    setIsArchiveConfirmationModalOpen(false)
    setIsRestoreConfirmationModalOpen(false)
    setIsMoveToPendingConfirmationModalOpen(false)
    setIsMoveToReceivedConfirmationModalOpen(false)
    setIsMoveToCanceledConfirmationModalOpen(false)
  }

  const handleServerError = (error: PostgrestError) => {
    if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.purchase_order.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order Management</h1>
          <p className="text-gray-600">Manage your purchase orders from your supplier suppliers</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Purchase Order
        </button>
      </div>

      {/* Purchase Order Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Order Number
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Date
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received Date
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record Status
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              <tr className="card">
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search & Press ENTER"
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
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedSupplier(e.target.value)
                    }}
                    className="input-field"
                  >
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.id === ALL_OPTIONS ? 'All Suppliers' : shortenText(supplier.name, MAX_DROPDOWN_TEXT_LENGTH)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className='w-full'>
                      <select
                      value={selectedOrderStatus}
                      onChange={(e) => { 
                        setCurrentPage(FIRST_PAGE_NUMBER)
                        setSelectedOrderStatus(e.target.value)
                      }}
                      className="input-field"
                    >
                      {getPurchaseOrderStatusOptions().map(status => (
                        <option key={status} value={status}>
                          {status === ALL_OPTIONS ? 'All Statuses' : status}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
                <th style={{maxWidth: 30}} className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <DatePicker
                    selected={startDate}
                    onChange={onDateRangeChange}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    monthsShown={2}
                    placeholderText="Select date range"
                    isClearable={true}
                    className="input-field"
                  />
                </th>
                <th style={{maxWidth: 30}} className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <DatePicker
                    selected={receivedDateStart}
                    onChange={onReceivedDateRangeChange}
                    startDate={receivedDateStart}
                    endDate={receivedDateEnd}
                    selectsRange
                    monthsShown={2}
                    placeholderText="Select date range"
                    isClearable={true}
                    className="input-field"
                  />
                </th>
                <th className="px-1 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        {status === ALL_OPTIONS ? ALL_OPTIONS : status}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.po_number}(<i className="text-sm text-gray-500">{order.order_items?.length} items</i>)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.supplier?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getTotalOrderPrice(order)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status!)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getDateWithoutTime(formatDateToUTC(order.expected_date))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDateToUTC(order.received_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(order.status!)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2 items-center">                      
                      <ActionsMenu
                        actions={[
                          {
                            id: order.id!,
                            hideOption: false,
                            icon: <EyeIcon className="h-4 w-4" />,
                            label: 'View Details',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleViewDetails
                          },
                          {
                            id: order.id!,
                            hideOption: ![PurchaseOrderStatus.CANCELED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <BackwardIcon className="h-4 w-4" />,
                            label: 'Return to Pending',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
                              setIsMoveToPendingConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: order.id!,
                            hideOption: ![PurchaseOrderStatus.PENDING, PurchaseOrderStatus.CANCELED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <CheckIcon className="h-4 w-4" />,
                            label: 'Mark as Received',
                            class: "w-full text-green-600 hover:text-green-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
                              setIsMoveToReceivedConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: order.id!,
                            hideOption: [PurchaseOrderStatus.RECEIVED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: order.id!,
                            hideOption: ![PurchaseOrderStatus.PENDING].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <XMarkIcon className="h-4 w-4" />,
                            label: 'Cancel Order',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
                              setIsMoveToCanceledConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: order.id!,
                            hideOption: [PurchaseOrderStatus.RECEIVED].includes(order.order_status!) || selectedStatus !== RecordStatus.ACTIVE,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Archive',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
                              setIsArchiveConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: order.id!,
                            hideOption: selectedStatus === RecordStatus.ACTIVE,
                            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                            label: 'Restore',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
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

      {/* PurchaseOrder Modal */}
      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={editingPurchaseOrder}
        onSave={(order) => {
          setLoading(true)
          if (editingPurchaseOrder) {
            handleUpdate(order)
          } else {
            handleCreate(order)
          }
        }}
      />
      
      <OrderDetailsModal
        isOpen={showDetailsModal && selectedOrder !== null}
        onClose={() => setShowDetailsModal(false)}
        order={selectedOrder!}
      />

      {/* Confirmation Modal for Archive */}
      <ConfirmationModal
        isOpen={isArchiveConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to archive this purchase order?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this purchase order?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to pending */}
      <ConfirmationModal
        isOpen={isMoveToPendingConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={PurchaseOrderStatus.PENDING}
        message="Are you sure you want to move this order status to pending?"
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to received */}
      <ConfirmationModal
        isOpen={isMoveToReceivedConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={PurchaseOrderStatus.RECEIVED}
        message="Are you sure you want to move this order status to received? No edits are permitted after submission."
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to canceled */}
      <ConfirmationModal
        isOpen={isMoveToCanceledConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={PurchaseOrderStatus.CANCELED}
        message="Are you sure you want to move this order status to canceled?"
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}
