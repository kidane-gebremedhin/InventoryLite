'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { RecordStatus, TABLE, TransactionDirection } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_DROPDOWN_TEXT_LENGTH, RECORDS_PER_PAGE, TRANSACTION_DIRECTIONS } from '@/lib/Constants'
import { canShowLoadingScreen, convertToUTC, formatDateToUTC, getTransactionDirectionColor, setEarliestTimeOfDay, shortenText, showErrorToast, showServerErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Pagination from '@/components/helpers/Pagination'
import { InventoryItem, Store, Transaction } from '@/lib/types/Models'
// DatePicker both are required
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useUserContext } from '@/components/context_apis/UserProvider'
import { useLoadingContext } from '@/components/context_apis/LoadingProvider'

export default function SalesOrderPage() {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  // Pagination
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  
  const [stores, setStores] = useState<Store[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [inventoryItems, setInventoryItems] = useState<Partial<InventoryItem>[]>([])
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>(ALL_OPTIONS)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(ALL_OPTIONS)
  const [selectedDirection, setSelectedDirection] = useState<string>(ALL_OPTIONS)
  // Global States
  const {loading, setLoading} = useLoadingContext()
  const {currentUser, setCurrentUser} = useUserContext()

  const loadInventoryItems = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from(TABLE.inventory_items)
        .select('id, sku, name, unit_price, quantity')
        .eq('status', RecordStatus.ACTIVE)
        .order('name')


      if (error) throw error

      const selectableInventoryItems: Partial<InventoryItem>[] = [{id: ALL_OPTIONS, name: ''}, ...data!]
      setInventoryItems(selectableInventoryItems)
    } catch (error: any) {
      showErrorToast()
    }
  }

  const loadStores = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from(TABLE.stores)
        .select('id, name, description')
        .eq('status', RecordStatus.ACTIVE)
        .order('name')

      if (error) throw error

      const selectableStores: Store[] = [{id: ALL_OPTIONS, name: '',description: ''}, ...(data || [])]
      setStores(selectableStores)
    } catch (error: any) {
      showErrorToast()
    }
  }

  useEffect(() => {
    loadStores()
    loadInventoryItems()
  }, [])

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadTransactions()
  }, [selectedStoreId, selectedInventoryItemId, selectedDirection, selectedStatus, startDate, endDate, recordsPerPage, currentPage])

  const loadTransactions = async () => {
    setLoading(canShowLoadingScreen(startDate, endDate, null, null))

    if (!supabase || !await authorseDBAction(currentUser)) return

    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(TABLE.transactions).select(`
        *,
        item:inventory_items(*),
        store:stores(*)
        `, {count: 'exact', head: false})
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus)
      }
      if (selectedDirection !== ALL_OPTIONS) {
        query = query.eq('type', selectedDirection);
      }
      if (selectedStoreId !== ALL_OPTIONS) {
        query = query.eq('store_id', selectedStoreId);
      }
      if (selectedInventoryItemId !== ALL_OPTIONS) {
        query = query.eq('item_id', selectedInventoryItemId);
      }
      if (startDate) {
        const startDateUTC = convertToUTC(setEarliestTimeOfDay(startDate))
        query = query.gte('created_at', startDateUTC.toUTCString())
      }
      if (endDate) {
        const endDateUTC = convertToUTC(setEarliestTimeOfDay(endDate))
        query = query.lte('created_at', endDateUTC.toUTCString())
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showServerErrorToast(error.message)
      }

      setTransactions(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
      showErrorToast()
    } finally {
      setLoading(false)
    }
  }

  const onDateRangeChange = (dates: any) => {
    const [start, end] = dates;

    setStartDate(start);
    setEndDate(end);
  }

  return (
    <div className="space-y-6">
      {/* SalesOrder Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Txn Quantity
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From/To Store
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Create/Updated
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Quantity
                </th>
              </tr>
              <tr className="card">
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <select
                    value={selectedDirection}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedDirection(e.target.value)
                    }}
                    className="input-field"
                  >
                    {TRANSACTION_DIRECTIONS.map(direction => (
                      <option key={direction} value={direction}>
                        {direction === ALL_OPTIONS ? 'All' : direction}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <select
                    value={selectedInventoryItemId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedInventoryItemId(e.target.value)
                    }}
                    className="input-field"
                  >
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.id === ALL_OPTIONS ? 'All Items' : shortenText(item.name, MAX_DROPDOWN_TEXT_LENGTH)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <select
                    value={selectedStoreId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedStoreId(e.target.value)
                    }}
                    className="input-field"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.id === ALL_OPTIONS ? 'All Stores' : shortenText(store.name, MAX_DROPDOWN_TEXT_LENGTH)}
                      </option>
                    ))}
                  </select>
                </th>
                <th style={{maxWidth: 30}} className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-1 py-4 text-sm text-gray-900 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionDirectionColor(transaction.type)}`}>
                      {transaction.type} 
                    </span>
                  </td>
                  <td className="text-sm font-medium text-gray-900 text-center px-1 py-4">
                    {transaction.item?.name}
                  </td>
                  <td className="px-1 py-4 text-sm text-gray-900 text-center">
                    {transaction.type === TransactionDirection.IN ? '+' : '-'}{transaction.quantity}
                  </td>
                  <td className="px-1 py-4 text-sm text-gray-900 text-center">
                    {transaction.store?.name} 
                  </td>
                  <td className="px-1 py-4 text-sm text-gray-900 text-center">
                    {formatDateToUTC(transaction.created_at!)}
                  </td>
                  <td className="px-1 py-4 text-sm text-gray-900 text-center">
                    <b>{transaction.current_item_quantity}</b>
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
    </div>
  )
}
