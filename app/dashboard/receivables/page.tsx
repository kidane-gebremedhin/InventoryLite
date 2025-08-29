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
import PurchaseOrderModal from '@/components/receivables/PurchaseOrderModal'
import OrderDetailsModal from '@/components/receivables/OrderDetailsModal'
import { supabase } from '@/lib/supabase'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { PurchaseOrderStatus, RecordStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_DROPDOWN_TEXT_LENGTH, PURCHASE_ORDER_STATUSES, RECORD_STATUSES, RECORDS_PER_PAGE, RECORDS_PER_PAGE_OPTIONS, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { canShowLoadingScreen, convertToUTC, getRecordStatusColor, setEarliestTimeOfDay, shortenText, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/Pagination'
import Loading from '@/components/helpers/Loading'
import { PurchaseOrder, Vendor } from '@/lib/types/Models'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ActionsMenu from '@/components/helpers/ActionsMenu'
import { useUserContext } from '@/components/contextApis/UserProvider'

export default function ReceivablePage() {
  const router = useRouter()
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPurchaseOrder, setEditingReceivable] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorId, setSelectedVendor] = useState(ALL_OPTIONS)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const {currentUser, setCurrentUser} = useUserContext()

  const TABLE_NAME = 'purchase_orders'

  useEffect(() => {
    const loadVendors = async () => {
      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('status', RecordStatus.ACTIVE)
          .order('created_at', { ascending: false })

        if (error) {
          showErrorToast()
        }

        const selectableVendors: Vendor[] = [{id: ALL_OPTIONS, name: ''}, ...data!]
        setVendors(selectableVendors)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadVendors()
  }, [])

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadPurchaseOrders()
  }, [searchTerm, selectedVendorId, selectedOrderStatus, selectedStatus, startDate, endDate, recordsPerPage, currentPage])

  const loadPurchaseOrders = async () => {
    setLoading(canShowLoadingScreen(startDate, endDate))

    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(TABLE_NAME).select(`
          *,
          vendor:vendors(*),
          order_items:purchase_order_items(
          *,
          item:inventory_items(*)
          )`,
          {count: 'exact', head: false})
      if (selectedOrderStatus !== ALL_OPTIONS) {
        query = query.eq('order_status', selectedOrderStatus)
      }
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
      }
      if (selectedVendorId !== ALL_OPTIONS) {
        query = query.eq('vendor_id', selectedVendorId);
      }
      if (searchTerm) {
        query = query.or(`po_number.ilike.%${searchTerm}%`)
      }
      if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('expected_date', startDateUTC.toUTCString())
      }
      if (endDate) {
        const endDateUTC = convertToUTC(setEarliestTimeOfDay(endDate))
        query = query.lte('expected_date', endDateUTC.toUTCString())
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showErrorToast()
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
    setEditingReceivable(null)
    setIsModalOpen(true)
  }

  const handleEdit = (id: string) => {
    const order = purchaseOrders.find(order => order.id === id)
    setEditingReceivable(order!)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to cancel this purchase order?')) {
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
          setPurchaseOrders(purchaseOrders.filter(purchaseOrder => purchaseOrder.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this purchase order?')) {
    if (!supabase || !await authorseDBAction(currentUser)) return
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({status: RecordStatus.ACTIVE})
          .eq('id', id)

        if (error) {
          showErrorToast()
        } else {
          showSuccessToast(`Record Restored.`)
          setPurchaseOrders(purchaseOrders.filter(purchaseOrder => purchaseOrder.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCreate = async (purchaseOrder: PurchaseOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {id, order_items, ...purchaseOrderWithNoId} = purchaseOrder

    try {
      const { data: savedPurchaseOrder, error: poError } = await supabase
        .from(TABLE_NAME)
        .insert(purchaseOrderWithNoId)
        .select()
        .single()

      if (poError) {
        showErrorToast()
      } else {
        // Insert order items
        const orderItems = purchaseOrder.order_items!.map(item => {
          item.purchase_order_id = savedPurchaseOrder.id
          return item
        })
        const { error: orderItemsError } = await supabase.from('purchase_order_items').insert(orderItems)

        if (orderItemsError) {
          showErrorToast()
        } else {
          showSuccessToast('Record Created.')
          loadPurchaseOrders()
        }
      }
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (purchaseOrder: PurchaseOrder) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    // Exclude id field while creating new record 
    const {order_items, ...purchaseOrderWithNoId} = purchaseOrder

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(purchaseOrderWithNoId)
        .eq('id', purchaseOrder.id)

      if (error) {
        showErrorToast()
        return
      }

      // First remove the existing order items of this order
      const { error: orderItemsDeletionError } = await supabase.from('purchase_order_items').delete().eq('purchase_order_id', purchaseOrder.id)
      if (orderItemsDeletionError) {
        showErrorToast()
        return
      }

      const { error: orderItemsError } = await supabase.from('purchase_order_items').insert(purchaseOrder.order_items)
      if (orderItemsError) {
        showErrorToast()
        return
      }

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
    setSearchTerm(searchTermTemp)
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
      case PurchaseOrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleOrderStatusChange = async (id: string, status?: string) => {
    if (!status || !supabase) return

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
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

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receivable Management</h1>
          <p className="text-gray-600">Manage your purchase orders from your supplier vendors</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Receivable
        </button>
      </div>

      {/* Receivable Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Order Number
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Date
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
                    value={selectedVendorId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedVendor(e.target.value)
                    }}
                    className="input-field"
                  >
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.id === ALL_OPTIONS ? 'All Vendors' : shortenText(vendor.name, MAX_DROPDOWN_TEXT_LENGTH)}
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.po_number}(<i className="text-sm text-gray-500">{order.order_items?.length} items</i>)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.vendor?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getTotalOrderPrice(order)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status!)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.expected_date ? new Date(order.expected_date).toUTCString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(order.status!)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="relative px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2">                        
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
                            status: PurchaseOrderStatus.PENDING,
                            hideOption: ![PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <BackwardIcon className="h-4 w-4" />,
                            label: 'Return to Pending',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: handleOrderStatusChange
                          },
                          {
                            id: order.id!,
                            status: PurchaseOrderStatus.RECEIVED,
                            hideOption: ![PurchaseOrderStatus.PENDING, PurchaseOrderStatus.CANCELLED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <CheckIcon className="h-4 w-4" />,
                            label: 'Mark as Received',
                            class: "w-full text-green-600 hover:text-green-900",
                            listener: handleOrderStatusChange
                          },
                          {
                            id: order.id!,
                            hideOption: selectedStatus === RecordStatus.ARCHIVED,
                            icon: <PencilIcon className="h-4 w-4" />,
                            label: 'Edit',
                            class: "w-full text-primary-600 hover:text-primary-900",
                            listener: handleEdit
                          },
                          {
                            id: order.id!,
                            status: PurchaseOrderStatus.CANCELLED,
                            hideOption: ![PurchaseOrderStatus.PENDING, PurchaseOrderStatus.RECEIVED].includes(order.order_status!) || selectedStatus === RecordStatus.ARCHIVED,
                            icon: <XMarkIcon className="h-4 w-4" />,
                            label: 'Cancel Order',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: handleOrderStatusChange
                          },
                          {
                            id: order.id!,
                            hideOption: selectedStatus !== RecordStatus.ACTIVE,
                            icon: <TrashIcon className="h-4 w-4" />,
                            label: 'Archieve',
                            class: "w-full text-red-600 hover:text-red-900",
                            listener: handleArchive
                          },
                          {
                            id: order.id!,
                            hideOption: selectedStatus === RecordStatus.ACTIVE,
                            icon: <ArrowUpOnSquareIcon className="h-4 w-4" />,
                            label: 'Restore',
                            class: "w-full text-yellow-600 hover:text-yellow-900",
                            listener: handleRestore
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
            currentPage = {currentPage}
            recordsPerPage = {recordsPerPage}
            totalRecordsCount = {totalRecordsCount}
            setCurrentPage = {setCurrentPage}
            setRecordsPerPage = {setRecordsPerPage}
          />
        </div>

        {purchaseOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No purchase orders found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Receivable Modal */}
      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={editingPurchaseOrder}
        onSave={(order) => {
          if (editingPurchaseOrder) {
            handleUpdate(order)
          } else {
            handleCreate(order)
          }
          setIsModalOpen(false)
        }}
      />
      
      <OrderDetailsModal
        isOpen={showDetailsModal && selectedOrder !== null}
        onClose={() => setShowDetailsModal(false)}
        order={selectedOrder!}
      />
    </div>
  )
}
