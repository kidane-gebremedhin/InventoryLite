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
import { InventoryItemModal } from '@/components/inventory/InventoryItemModal'
import { supabase } from '@/lib/supabase'
import { Category, InventoryItem } from '@/lib/types/Models';
import { authorseDBAction } from '@/lib/db_queries/DBQuery'
import { RecordStatus } from '@/lib/Enums'
import { ALL_OPTIONS, FIRST_PAGE_NUMBER, MAX_DROPDOWN_TEXT_LENGTH, RECORD_STATUSES, RECORDS_PER_PAGE, TEXT_SEARCH_TRIGGER_KEY } from '@/lib/Constants'
import { getRecordStatusColor, shortenText, showErrorToast, showSuccessToast } from '@/lib/helpers/Helper'
import Tooltip from '@/components/helpers/ToolTip'
import Pagination from '@/components/Pagination'
import Loading from '@/components/helpers/Loading'
import { useUserContext } from '@/components/contextApis/UserProvider'

// Constants
const TABLE_NAME = 'inventory_items'

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchTermTemp, setSearchTermTemp] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategory] = useState(ALL_OPTIONS)
  const [selectedStatus, setSelectedStatus] = useState(RecordStatus.ACTIVE.toString())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [recordsPerPage, setRecordsPerPage] = useState(RECORDS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(FIRST_PAGE_NUMBER)
  const [totalRecordsCount, setTotalRecordsCount] = useState(0)
  const {currentUser, setCurrentUser} = useUserContext()

  useEffect(() => {
    const loadCategories = async () => {
      if (!supabase || !await authorseDBAction(currentUser)) return

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('status', RecordStatus.ACTIVE)
          .order('created_at', { ascending: false })

        if (error) {
          showErrorToast()
        }

        setCategories(data || [])
      } catch (error: any) {
          showErrorToast()
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    // reset pagination
    router.push(`?page=${currentPage}`)
    loadInventoryItems()
  }, [searchTerm, selectedCategoryId, selectedStatus, recordsPerPage, currentPage])

  const loadInventoryItems = async () => {
    setLoading(true)
    if (!supabase || !await authorseDBAction(currentUser)) return

    
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = currentPage * recordsPerPage - 1

    try {
      let query = supabase.from(TABLE_NAME).select('*, categories(name)', {count: 'exact', head: false})
      if (selectedStatus !== ALL_OPTIONS) {
        query = query.eq('status', selectedStatus);
      }
      if (selectedCategoryId !== ALL_OPTIONS) {
        query = query.eq('category_id', selectedCategoryId);
      }
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%, sku.ilike.%${searchTerm}%`);
      }
      const { data, count, error } = await query.order('created_at', { ascending: false })
      .range(startIndex, endIndex)

      if (error) {
        showErrorToast()
      }
      setItems(data || [])
      setTotalRecordsCount(count || 0)
    } catch (error: any) {
        showErrorToast()
    } finally {
      setLoading(false)
    }
  }
  
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(category => category.id === categoryId)
    return category?.name
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this item?')) {
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
          setItems(items.filter(item => item.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      }
    }
  }

  const handleRestore = async (id: string) => {
    if (confirm('Are you sure you want to restore this item?')) {
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
          setItems(items.filter(item => item.id !== id))
        }
      } catch (error: any) {
        showErrorToast()
      }
    }
  }

  const handleCreate = async (inventoryItem: InventoryItem) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      // Exclude id when creating new records
      const {id, ...inventoryItemWithNoId} = inventoryItem
      const { error } = await supabase
        .from(TABLE_NAME)
        .insert(inventoryItemWithNoId)

      if (error) {
        showErrorToast()
      } else {
        showSuccessToast('Record Created.')
        loadInventoryItems()
      }
    } catch (error: any) {
      showErrorToast()
    }
  }

  const handleUpdate = async (inventoryItem: InventoryItem) => {
    if (!supabase || !await authorseDBAction(currentUser)) return

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(inventoryItem)
        .eq('id', inventoryItem.id)

      if (error) {
        showErrorToast()
      } else {
        showSuccessToast('Record Updated.')
        loadInventoryItems()
      }
    } catch (error: any) {
      showErrorToast()
    }
  }

  const handleTextSearch = () => {
    setCurrentPage(FIRST_PAGE_NUMBER)
    setSearchTerm(searchTermTemp)
  }

  // const categories = [ALL_CATEGORIES, ...Array.from(new Set(items.map(item => item.category)))]

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Items Management</h1>
          <p className="text-gray-600">Manage your inventory items and stock levels</p>
        </div>
        <button
          onClick={handleAddItem}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: 150}}>
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
              <tr className='card'>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setCurrentPage(FIRST_PAGE_NUMBER)
                      setSelectedCategory(e.target.value)
                    }}
                    className="input-field"
                  >
                    {[{id: ALL_OPTIONS, name: ''}, ...categories!].map(category => (
                      <option key={category.id} value={category.id}>
                        {category.id === ALL_OPTIONS ? 'All Categories' : shortenText(category.name, MAX_DROPDOWN_TEXT_LENGTH)}
                      </option>
                    ))}
                  </select>
                </th>
                <th></th>
                <th></th>
                <th></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getCategoryName(item.category_id)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                    {item.quantity <= item.min_quantity && (
                      <div className="text-xs text-red-600">Low stock</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.min_quantity}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(item.status!)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      {selectedStatus === RecordStatus.ACTIVE ? (
                        <>
                        <Tooltip text="Edit?">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip text="Archive?">
                          <button
                            onClick={() => handleArchive(item.id!)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        </>
                      ) : (
                        <Tooltip text="Restore?">
                          <button
                            onClick={() => handleRestore(item.id!)}
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

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Inventory Item Modal */}
      <InventoryItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        categories={categories}
        onSave={(item) => {
          if (editingItem) {
            handleUpdate(item)
          } else {
            handleCreate(item)
          }
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
