'use client'

import { useLoadingContext } from '@/components/context_apis/LoadingProvider'
import { useUserContext } from '@/components/context_apis/UserProvider'
import RecordsPerPage from '@/components/helpers/RecordsPerPage'
import { ALL_OPTIONS, MAX_DROPDOWN_TEXT_LENGTH, REPORTS_PER_PAGE_OPTIONS, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { OrderStatus, RecordStatus, ReportType, RPC_FUNCTION, SalesOrderStatus, TABLE } from '@/lib/Enums'
import { canShowLoadingScreen, convertToUTC, formatDateToUTC, formatDateToYYMMDD, getCurrentDateTimeUTC, setEarliestTimeOfDay, setLatestTimeOfDay, shortenText, showErrorToast, showServerErrorToast } from '@/lib/helpers/Helper'
import { supabase } from '@/lib/supabase'
import { InventoryAgingReport, PendingOrdersReport, InventoryItem, InventoryTurnoverReport } from '@/lib/types/Models'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
// DatePicker both are required
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// === Main App Component ===
export default function App() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(ReportType.INVENTORY_TURNOVER)
  const [inventoryTurnoverReport, setInventoryTurnoverReport] = useState<InventoryTurnoverReport[]>([])
  const [pendingOrdersReport, setPendingOrdersReport] = useState<PendingOrdersReport[]>([])
  const [inventoryAgingReport, setInventoryAgingReport] = useState<InventoryAgingReport[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedInventoryItemId, setSelectedInventoryItem] = useState(ALL_OPTIONS)
  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberTmp, setOrderNumberTmp] = useState('')
  const [fulfilledDateStart, setFulfilledDateStart] = useState<Date | null>(getCurrentDateTimeUTC())
  const [fulfilledDateEnd, setFulfilledDateEnd] = useState<Date | null>(getCurrentDateTimeUTC())
  const [expectedDateStart, setExpectedDateStart] = useState<Date | null>(null)
  const [expectedDateEnd, setExpectedDateEnd] = useState<Date | null>(null)
  const [receivedDateStart, setReceivedDateStart] = useState<Date | null>(getCurrentDateTimeUTC())
  const [receivedDateEnd, setReceivedDateEnd] = useState<Date | null>(getCurrentDateTimeUTC())
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(REPORTS_PER_PAGE_OPTIONS[0])
  // Global States
  const {loading, setLoading} = useLoadingContext()
  const {currentUser, setCurrentUser} = useUserContext()

  const reportTypes = [
    { name: 'Inventory Turnover', type: ReportType.INVENTORY_TURNOVER },
    { name: 'Unfulfilled Demand', type: ReportType.PENDING_SALES_ORDERS },
    { name: 'Canceled Sales Orders', type: ReportType.CANCELED_SALES_ORDERS },
    { name: 'Unreceived Purchase Orders', type: ReportType.PENDING_PURCHASE_ORDERS },
    { name: 'Canceled Purchase Orders', type: ReportType.CANCELED_PURCHASE_ORDERS },
    { name: 'Inventory Aging Report', type: ReportType.INVENTORY_AGING }
  ]
  
  useEffect(() => {
    if (selectedReport !== ReportType.INVENTORY_TURNOVER) {
      return
    }

    const loadInventoryTurnoverReport = async () => {
      setLoading(canShowLoadingScreen(null, null, fulfilledDateStart, fulfilledDateEnd))

      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const searchParams = {
          records_per_page: recordsPerPage,
          ...selectedInventoryItemId && {selected_item_id: selectedInventoryItemId},
          ...fulfilledDateStart && {fulfilled_date_start: convertToUTC(setEarliestTimeOfDay(fulfilledDateStart))},
          ...fulfilledDateEnd && {fulfilled_date_end: convertToUTC(setLatestTimeOfDay(fulfilledDateEnd))}
        }
        // RPC call
        const { data, error } = await supabase
          .rpc(RPC_FUNCTION.INVENTORY_TURNOVER, searchParams)
        if (error) {
          showServerErrorToast(error.message)
          return;
        }
        setInventoryTurnoverReport(data)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadInventoryTurnoverReport()
  }, [selectedReport, selectedInventoryItemId, fulfilledDateStart, fulfilledDateEnd, recordsPerPage])

  useEffect(() => {
    const outstandingOrderPeports = [
      ReportType.PENDING_SALES_ORDERS, 
      ReportType.CANCELED_SALES_ORDERS,
      ReportType.PENDING_PURCHASE_ORDERS, 
      ReportType.CANCELED_PURCHASE_ORDERS
    ]
    if (!outstandingOrderPeports.includes(selectedReport)) {
      return
    }

    const orderStatus = [ReportType.PENDING_SALES_ORDERS, ReportType.PENDING_PURCHASE_ORDERS].includes(selectedReport) ? OrderStatus.PENDING : OrderStatus.CANCELED;
    const rpcFunctionName = [ReportType.PENDING_SALES_ORDERS, ReportType.CANCELED_SALES_ORDERS]
      .includes(selectedReport) ? RPC_FUNCTION.UNFULFILLED_SALES_ORDERS : RPC_FUNCTION.UNRECEIVED_PURCHASE_ORDERS

    const loadOutstandingOrdersReport = async () => {
      setLoading(canShowLoadingScreen(expectedDateStart, expectedDateEnd, null, null))

      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const searchParams = {
          target_order_status: orderStatus,
          records_per_page: recordsPerPage,
          ...selectedInventoryItemId && {selected_item_id: selectedInventoryItemId},
          ...expectedDateStart && {expected_date_start: convertToUTC(setEarliestTimeOfDay(expectedDateStart))},
          ...expectedDateEnd && {expected_date_end: convertToUTC(setLatestTimeOfDay(expectedDateEnd))}
        }
        // RPC call
        const { data, error } = await supabase
          .rpc(rpcFunctionName, searchParams)
        if (error) {
          showErrorToast()
          return;
        }
        setPendingOrdersReport(data)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadOutstandingOrdersReport()
  }, [selectedReport, selectedInventoryItemId, expectedDateStart, expectedDateEnd, recordsPerPage])

  useEffect(() => {
    if (selectedReport !== ReportType.INVENTORY_AGING) {
      return
    }

    const loadInventoryAgingReport = async () => {
      setLoading(canShowLoadingScreen(null, null, receivedDateStart, receivedDateEnd))

      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const searchParams = {
          records_per_page: recordsPerPage,
          ...selectedInventoryItemId && {selected_item_id: selectedInventoryItemId},
          ...orderNumber && {selected_order_number: orderNumber},
          ...receivedDateStart && {received_date_start: convertToUTC(setEarliestTimeOfDay(receivedDateStart))},
          ...receivedDateEnd && {received_date_end: convertToUTC(setLatestTimeOfDay(receivedDateEnd))}
        }
        // RPC call
        const { data, error } = await supabase
          .rpc(RPC_FUNCTION.INVENTORY_AGING, searchParams)
        if (error) {
          showErrorToast()
          return;
        }
        setInventoryAgingReport(data)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadInventoryAgingReport()
  }, [selectedReport, selectedInventoryItemId, orderNumber, receivedDateStart, receivedDateEnd, recordsPerPage])

  useEffect(() => {
    const loadInventoryItems = async () => {
      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const { data, error } = await supabase
          .from(TABLE.inventory_items)
          .select('*')
          .eq('status', RecordStatus.ACTIVE)
          .order('name')

        if (error) {
          showServerErrorToast(error.message)
        }

        const selectableInventoryItems: InventoryItem[] = [{id: ALL_OPTIONS, name: ''}, ...data!]
        setInventoryItems(selectableInventoryItems)
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadInventoryItems()
  }, [])

  const onFulfilledDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setFulfilledDateStart(start);
    setFulfilledDateEnd(end);
  }

  const onExpectedDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setExpectedDateStart(start);
    setExpectedDateEnd(end);
  }

  const onReceivedDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setReceivedDateStart(start);
    setReceivedDateEnd(end);
  }

  const handleTextSearch = () => {
    setOrderNumber(orderNumberTmp.trim())
  }

  const getReportComponent = () => {
    switch (selectedReport) {
      case ReportType.INVENTORY_TURNOVER:
        return (
          <div>
            <div className="overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventory Turnover Report</h2>
              <p className="mb-6 text-gray-600">Items sorted by sale frequency (highest first). {fulfilledDateStart && (<span><b>Date:</b> <u>{formatDateToYYMMDD(fulfilledDateStart)}</u></span>)} {fulfilledDateEnd && (<span><b>to</b> <u>{formatDateToYYMMDD(fulfilledDateEnd)}</u></span>)}</p>
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Frequency/Fulfilled Date</th>
                  </tr>
                  <tr className="card">
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <select
                        value={selectedInventoryItemId}
                        onChange={(e) => {
                          setSelectedInventoryItem(e.target.value)
                        }}
                        className="input-field"
                      >
                        {inventoryItems.map(inventoryItem => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>
                            {inventoryItem.id === ALL_OPTIONS ? 'All Items' : shortenText(inventoryItem.name, MAX_DROPDOWN_TEXT_LENGTH)}
                          </option>
                        ))}
                      </select>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryTurnoverReport.map((report, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.item_name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900`}>{report.sold_quantity}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <RecordsPerPage  actualRecords={inventoryTurnoverReport.length} recordsPerPage = {recordsPerPage} setRecordsPerPage={setRecordsPerPage} />
          </div>
        )
      case ReportType.PENDING_SALES_ORDERS:
      case ReportType.CANCELED_SALES_ORDERS:
      case ReportType.PENDING_PURCHASE_ORDERS:
      case ReportType.CANCELED_PURCHASE_ORDERS:
        return (
          <div>
            <div className="overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {reportTypes.find(reportType => reportType.type.toString() === selectedReport)?.name}
              </h2>
              <p className="mb-6 text-gray-600">Items sorted by {selectedReport === ReportType.PENDING_SALES_ORDERS ? 'demand' : ''} quantity (highest first). {expectedDateStart && (<span><b>Date:</b> <u>{formatDateToYYMMDD(expectedDateStart)}</u></span>)} {expectedDateEnd && (<span><b>to</b> <u>{formatDateToYYMMDD(expectedDateEnd)}</u></span>)}</p>
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Date</th>
                  </tr>
                  <tr className="card">
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <select
                        value={selectedInventoryItemId}
                        onChange={(e) => {
                          setSelectedInventoryItem(e.target.value)
                        }}
                        className="input-field"
                      >
                        {inventoryItems.map(inventoryItem => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>
                            {inventoryItem.id === ALL_OPTIONS ? 'All Items' : shortenText(inventoryItem.name, MAX_DROPDOWN_TEXT_LENGTH)}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th colSpan={2} className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <DatePicker
                        selected={expectedDateStart}
                        onChange={onExpectedDateRangeChange}
                        startDate={expectedDateStart}
                        endDate={expectedDateEnd}
                        selectsRange
                        monthsShown={2}
                        placeholderText="Select date range"
                        isClearable={true}
                        className="input-field"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingOrdersReport.map((report, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.total_ordered_quantity}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900`}>{report.order_status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <RecordsPerPage actualRecords={pendingOrdersReport.length} recordsPerPage = {recordsPerPage} setRecordsPerPage={setRecordsPerPage} />
          </div>
        )
      case ReportType.INVENTORY_AGING:
        return (
          <div>
            <div className="overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Inventory Aging Report</h2>
              <p className="mb-6 text-gray-600">Items sorted by days in stock (oldest first). {receivedDateStart && (<span><b>Date:</b> <u>{formatDateToYYMMDD(receivedDateStart)}</u></span>)} {receivedDateEnd && (<span><b>to</b> <u>{formatDateToYYMMDD(receivedDateEnd)}</u></span>)}</p>
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days in Stock</th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Date</th>
                  </tr>
                  <tr className="card">
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <select
                        value={selectedInventoryItemId}
                        onChange={(e) => {
                          setSelectedInventoryItem(e.target.value)
                        }}
                        className="input-field"
                      >
                        {inventoryItems.map(inventoryItem => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>
                            {inventoryItem.id === ALL_OPTIONS ? 'All Items' : shortenText(inventoryItem.name, MAX_DROPDOWN_TEXT_LENGTH)}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search & Press ENTER"
                          value={orderNumberTmp}
                          onChange={(e) => {
                            setOrderNumberTmp(e.target.value)
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
                    </th>
                    <th className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    </th>
                    <th style={{maxWidth: 300}} className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryAgingReport.map((report, index) => {
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.order_number}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900`}>{report.item_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full  bg-yellow-100 text-gray-600">
                            {report.days_in_stock}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateToUTC(report.order_received_date)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <RecordsPerPage actualRecords={inventoryAgingReport.length} recordsPerPage = {recordsPerPage} setRecordsPerPage={setRecordsPerPage} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="md:flex min-h-screen bg-white-900 text-gray-900">
      {/* Sidebar */}
      <div className='w-full md:w-1/5'>
        <div className="w-full text-6xl text-center pt-5 font-serif">
          KPI's
        </div>
        <nav className="flex-1 space-y-1 px-0 pt-6">
            {reportTypes.map((report) => {
              const isActive = selectedReport === report.type
              return (
                <Link
                  key={report.name}
                  className={clsx(
                    'sidebar-link',
                    isActive && 'bg-primary-100 text-primary-700 border-primary-500'
                  )}
                  onClick={() => setSelectedReport(report.type)} href={''}                >
                  {report.name}
                </Link>
              )
            })}
          </nav>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-2">
        <div>
          {getReportComponent()}
        </div>
      </main>
    </div>
  )
}

