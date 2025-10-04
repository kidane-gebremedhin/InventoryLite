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
import SalesOrderModal from '@/components/sales_orders/SalesOrderModal'
import OrderDetailsModal from '@/components/sales_orders/OrderDetailsModal'

import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { SalesOrderStatus, RecordStatus, RPC_FUNCTION, DATABASE_TABLE } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_DROPDOWN_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, RECORDS_PER_PAGE_OPTIONS, SALES_ORDER_STATUSES, TEXT_SEARCH_TRIGGER_KEY, VALIDATION_ERRORS_MAPPING } from '@/lib/Constants'
import { canShowLoadingScreen, convertToUTC, formatDateToUTC, getCurrentDateTimeUTC, getDateWithoutTime, getOrderStatusColor, getRecordStatusColor, isCustomServerError, setEarliestTimeOfDay, setLatestTimeOfDay, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import { SalesOrder, Customer } from '@/lib/types/Models'
// DatePicker both are required
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import ActionsMenu from '@/components/helpers/ActionsMenu'
import { ConfirmationModal } from '@/components/helpers/ConfirmationModal'
import { PostgrestError } from '@supabase/supabase-js'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { saveSalesOrder, updateSalesOrder, updateSalesOrderRecordStatus, updateSalesOrderStatus } from '@/lib/server_actions/sales_order'

import { useAuthContext } from '@/components/providers/AuthProvider'
import ExportExcel from '@/components/file_import_export/ExportExcel'
import ExportPDF from '@/components/file_import_export/ExportPDF'

export default function SalesOrderPage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomer] = useState(ALL_OPTIONS)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [fulfilledDateStart, setFulfilledDateStart] = useState<Date | null>(null)
  const [fulfilledDateEnd, setFulfilledDateEnd] = useState<Date | null>(null)
  // Record Actions
  const [currentActiveId, setCurrentActiveId] = useState<string>('')
  const [isArchiveConfirmationModalOpen, setIsArchiveConfirmationModalOpen] = useState(false)
  const [isRestoreConfirmationModalOpen, setIsRestoreConfirmationModalOpen] = useState(false)
  const [isMoveToPendingConfirmationModalOpen, setIsMoveToPendingConfirmationModalOpen] = useState(false)
  const [isMoveToFulfilledConfirmationModalOpen, setIsMoveToFulfilledConfirmationModalOpen] = useState(false)
  const [isMoveToCanceledConfirmationModalOpen, setIsMoveToCanceledConfirmationModalOpen] = useState(false)
  // Global States
  const {loading, setLoading} = useLoadingContext()
  const { currentUser, supabase } = useAuthContext();

  const reportHeaders = {
    row_no: 'Row No.',
    so_number: 'SO Number', 
    supplier: 'customer Name', 
    order_status: 'Order Status',
    expected_date: 'Expected Date', 
    fulfilled_date: 'Fulfilled Date', 
    created_at: 'Ordered Date',
    store: 'Store',
    item_name: 'Item',
    item_sku: 'SKU Code',
    quantity: 'Quantity',
    unit_price: 'Unit Price',
    order_items: []
  }

  useEffect(() => {
    const loadCustomers = async () => {
      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const { data, error } = await supabase
          .from(DATABASE_TABLE.customers)
          .select('*')
          .eq('status', RecordStatus.ACTIVE)
          .order('name')

        if (error) {
          showServerErrorToast(error.message)
        }

        const selectableCustomers: Customer[] = [{id: ALL_OPTIONS, name: ''}, ...data!]
        setCustomers(selectableCustomers)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadSalesOrders()
  }, [searchTerm, selectedCustomerId, selectedOrderStatus, selectedStatus, startDate, endDate, fulfilledDateStart, fulfilledDateEnd, recordsPerPage, currentPage])

  const loadSalesOrders = async () => {
    setLoading(canShowLoadingScreen(startDate, endDate, fulfilledDateStart, fulfilledDateEnd))

    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(DATABASE_TABLE.sales_orders).select(`
          *,
          customer:customers(*),
          order_items:sales_order_items(
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
      if (selectedCustomerId !== ALL_OPTIONS) {
        query = query.eq('customer_id', selectedCustomerId);
      }
      if (searchTerm) {
        query = query.or(`so_number.ilike.%${searchTerm}%`)
      }
      if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('expected_date', startDateUTC.toUTCString())
      }
      if (endDate) {
        const endDateUTC = convertToUTC(setLatestTimeOfDay(endDate))
        query = query.lte('expected_date', endDateUTC.toUTCString())
      }
      if (fulfilledDateStart) {
        const fulfilledDateStartUTC = convertToUTC(setEarliestTimeOfDay(fulfilledDateStart))
        query = query.gte('fulfilled_date', fulfilledDateStartUTC.toUTCString())
      }
      if (fulfilledDateEnd) {
        const fulfilledDateEndUTC = convertToUTC(setLatestTimeOfDay(fulfilledDateEnd))
        query = query.lte('fulfilled_date', fulfilledDateEndUTC.toUTCString())
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showServerErrorToast(error.message)
      }

      setSalesOrders(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingSalesOrder(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const order = salesOrders.find(order => order.id === id)
    setEditingSalesOrder(order!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    resetModalState()

    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await updateSalesOrderRecordStatus(id, {status: RecordStatus.ARCHIVED})

      if (error) {
        showServerErrorToast(error.message)
      } else {
        showSuccessToast('Record Archived.')
        const remainingRecords = salesOrders.filter(salesOrder => salesOrder.id !== id)
        setSalesOrders(remainingRecords)
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
      const { error } = await updateSalesOrderRecordStatus(id, {status: RecordStatus.ACTIVE})

      if (error) {
        showErrorToast(error.name)
      } else {
        showSuccessToast(`Record Restored.`)
        setSalesOrders(salesOrders.filter(salesOrder => salesOrder.id !== id))
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (salesOrder: SalesOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {id, order_items, ...salesOrderWithNoId} = salesOrder

    try {
      const payload = {
          sales_order_data: salesOrderWithNoId,
          sales_order_items_data: salesOrder.order_items,
        };
      const { data, error } = await saveSalesOrder(payload)
      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Sales Order Created.')
      loadSalesOrders()
    } catch (err: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (salesOrder: SalesOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {order_items, ...salesOrderWithNoOrderItems} = salesOrder

    try {
      const payload = {
        sales_order_data: salesOrderWithNoOrderItems,
        sales_order_items_data: salesOrder.order_items,
        is_for_update: true
      };
      const { data, error } = await updateSalesOrder(payload)
      if (error) {
        handleServerError(error)
        return
      }

      setIsModalOpen(false)
      showSuccessToast('Sales Order Updated.')
      loadSalesOrders()
    } catch (err: any) {
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
    const order = salesOrders.find(order => order.id === id)
    setSelectedOrder(order!)
    setShowDetailsModal(true)
  }

  const handleOrderStatusChange = async (id: string, status?: SalesOrderStatus) => {
    resetModalState()

    if (!status || !supabase) return

    try {
      const { error } = await updateSalesOrderStatus(id, { order_status: status })

      if (error) {
        setLoading(false)
        showServerErrorToast(error.message)
        return
      }

      showSuccessToast(`Order status updated to ${status}`)
      loadSalesOrders()
    } catch (error: any) {
      setLoading(false)
      showErrorToast()
    }
  }

  const getSalesOrderStatusOptions = () => [ALL_OPTIONS, ...SALES_ORDER_STATUSES!]

  const getTotalOrderPrice = (order?: SalesOrder): number => {
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

  const onFulfilledDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setFulfilledDateStart(start);
    setFulfilledDateEnd(end);
  }

  const resetModalState = () => {
    setCurrentActiveId('')
    setIsArchiveConfirmationModalOpen(false)
    setIsRestoreConfirmationModalOpen(false)
    setIsMoveToPendingConfirmationModalOpen(false)
    setIsMoveToFulfilledConfirmationModalOpen(false)
    setIsMoveToCanceledConfirmationModalOpen(false)
  }

  const handleServerError = (error: PostgrestError) => {
    if (error.message.includes(VALIDATION_ERRORS_MAPPING.serverError)) {
      showErrorToast(VALIDATION_ERRORS_MAPPING.entities.sales_order.fields.name.displayError)
    } else {
      showServerErrorToast(error.message)
    }
  }

  const getReportFields = (salesOrder: any, idx: number) => {
    return salesOrder.order_items?.map((orderItem, innerIdx) => {
        // Show row number for SalesOrders not Items
        const showRowNo = innerIdx === 0;

        return {
          row_no: showRowNo ? idx + 1 : '', 
          // Order Details
          so_number: showRowNo ? salesOrder.so_number : '', 
          supplier: showRowNo ? salesOrder.customer?.name : '', 
          order_status: showRowNo ? salesOrder.order_status : '',
          expected_date: showRowNo ? salesOrder.expected_date : '', 
          fulfilled_date: showRowNo ? getDateWithoutTime(salesOrder.fulfilled_date) : '', 
          created_at: showRowNo ? getDateWithoutTime(salesOrder.created_at) : '',
          // Order Item Details
          store: orderItem.store.name,
          item_name: orderItem.item.name,
          item_sku: orderItem.item.sku,
          quantity: orderItem.quantity,
          unit_price: orderItem.unit_price,
        }
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Order Management</h1>
          <p className="text-gray-600">Manage your sales orders from your supplier customers</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sales Order
        </button>
      </div>

      {/* Sales Order Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <div className="w-full text-right items-right mb-4">
            <button className="bg-gray-600 px-4 py-1 text-sm h-7 text-white rounded items-center" onClick={() => { setShowFilters(!showFilters);} }>
              <b>Show Filters</b>
            </button>
            <span className="px-1"></span>
            <ExportExcel reportName="Sales Orders" records={[reportHeaders, ...salesOrders.map((salesOrder, idx) => getReportFields(salesOrder, idx)).flat()]} />
            <span className="px-1"></span>
            <ExportPDF reportName="Sales Orders" records={[reportHeaders, ...salesOrders.map((salesOrder, idx) => getReportFields(salesOrder, idx)).flat()]} />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Order Number
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
                  Fulfilled Date
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record Status
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
              {showFilters && (
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
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedCustomer(e.target.value)
                    }}
                    className="input-field"
                  >
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.id === ALL_OPTIONS ? 'All Customers' : shortenText(customer.name, MAX_DROPDOWN_TEXT_LENGTH)}
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
                        {getSalesOrderStatusOptions().map(status => (
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
                    selected={fulfilledDateStart}
                    onChange={onFulfilledDateRangeChange}
                    startDate={fulfilledDateStart}
                    endDate={fulfilledDateEnd}
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
              )}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.so_number}(<i className="text-sm text-gray-500">{order.order_items?.length} items</i>)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getTotalOrderPrice(order)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.order_status!)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getDateWithoutTime(formatDateToUTC(order.expected_date))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDateToUTC(order.fulfilled_date)}
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
                            hideOption: ![SalesOrderStatus.CANCELED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
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
                            hideOption: ![SalesOrderStatus.PENDING, SalesOrderStatus.CANCELED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <CheckIcon className="h-4 w-4" />,
                            label: 'Mark as Fulfilled',
                            class: "w-full text-green-600 hover:text-green-900",
                            listener: () => {
                              setCurrentActiveId(order.id!)
                              setIsMoveToFulfilledConfirmationModalOpen(true)
                            }
                          },
                          {
                            id: order.id!,
                            hideOption: [SalesOrderStatus.FULFILLED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: order.id!,
                            hideOption: ![SalesOrderStatus.PENDING].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
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
                            hideOption: [SalesOrderStatus.FULFILLED].includes(order.order_status!) || selectedStatus !== RecordStatus.ACTIVE,
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

      {/* SalesOrder Modal */}
      <SalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={editingSalesOrder}
        onSave={(order) => {
          setLoading(true)
          if (editingSalesOrder) {
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
        message="Are you sure you want to archive this sales order?"
        onConfirmationSuccess={handleArchive}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmationModalOpen}
        id={currentActiveId}
        message="Are you sure you want to restore this sales order?"
        onConfirmationSuccess={handleRestore}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to pending */}
      <ConfirmationModal
        isOpen={isMoveToPendingConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={SalesOrderStatus.PENDING}
        message="Are you sure you want to move this order status to pending?"
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to fulfilled */}
      <ConfirmationModal
        isOpen={isMoveToFulfilledConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={SalesOrderStatus.FULFILLED}
        message="Are you sure you want to move this order status to fulfilled? No edits are permitted after submission."
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
      
      {/* Confirmation Modal to move order to canceled */}
      <ConfirmationModal
        isOpen={isMoveToCanceledConfirmationModalOpen}
        id={currentActiveId}
        orderStatus={SalesOrderStatus.CANCELED}
        message="Are you sure you want to move this order status to canceled?"
        onConfirmationSuccess={handleOrderStatusChange}
        onConfirmationFailure={resetModalState}
      />
    </div>
  )
}

