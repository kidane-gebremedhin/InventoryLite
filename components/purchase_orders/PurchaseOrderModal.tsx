'use client'

import { useState, useEffect } from 'react'

import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { InventoryItem, PurchaseOrder, PurchaseOrderItem, Store, Supplier } from '@/lib/types/Models'
import { PurchaseOrderStatus, RecordStatus, DATABASE_TABLE } from '@/lib/Enums'
import { calculateOrderTotalProce, formatDateToLocalDate, showErrorToast } from '@/lib/helpers/Helper'
import Tooltip from '../helpers/ToolTip'
import { DECIMAL_REGEX, PURCHASE_ORDER_STATUSES } from '@/lib/Constants'

import { useAuthContext } from '../providers/AuthProvider'
import { fetchStoreOptions } from '@/lib/server_actions/store'
import { fetchSupplierOptions } from '@/lib/server_actions/supplier'
import { fetchInventoryItemOptions } from '@/lib/server_actions/inventory_item'

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrder | null
  onSave: (order: PurchaseOrder) => void
}

const emptyEntry: PurchaseOrder = {
  po_number: '',
  supplier_id: '',
  order_status: PurchaseOrderStatus.PENDING,
  expected_date: '',
  status: RecordStatus.ACTIVE,
  created_at: '',
  updated_at: '',
  order_items: [],
}

export default function PurchaseOrderModal({ isOpen, onClose, order, onSave }: PurchaseOrderModalProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<Partial<InventoryItem>[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>(emptyEntry)
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<PurchaseOrderItem[]>([])
  const { supabase } = useAuthContext();

  useEffect(() => {
    // reset form
    setFormData(emptyEntry)

    if (isOpen) {
      loadStores()
      loadSuppliers()
      loadInventoryItems()
      if (order) {
        setFormData({
          po_number: order.po_number || '',
          supplier_id: order.supplier_id || '',
          expected_date: order.expected_date ? order.expected_date : '',
          order_status: order.order_status || PurchaseOrderStatus.PENDING
        })
        setPurchaseOrderItems(order.order_items || [])
      } else {
        resetForm()
      }
    }
  }, [isOpen, order])

  const loadStores = async () => {
    if (!supabase) return

    try {
      const { data, error } = await fetchStoreOptions()

      if (error) throw error
      
      setStores(data || [])
    } catch (error: any) {
      showErrorToast()
    }
  }

  const loadSuppliers = async () => {
    if (!supabase) return

    try {
      const { data, error } = await fetchSupplierOptions()

      if (error) throw error
      
      setSuppliers(data || [])
      // When single option, select it by default
      if (!order && data.length == 1) {
        setFormData({...formData, supplier_id: data[0].id})
      }
    } catch (error: any) {
      showErrorToast()
    }
  }

  const loadInventoryItems = async () => {
    if (!supabase) return

    try {
      const { data, error } = await fetchInventoryItemOptions()

      if (error) throw error
      setInventoryItems(data || [])
    } catch (error: any) {
      showErrorToast()
    }
  }

  const resetForm = () => {
    setFormData({
      po_number: '',
      supplier_id: '',
      expected_date: '',
      order_status: PurchaseOrderStatus.PENDING
    })
    setPurchaseOrderItems([])
  }

  const addItem = () => {
    const unitPrice = inventoryItems.length === 1 ? inventoryItems[0].unit_price! : 0
    setPurchaseOrderItems([...purchaseOrderItems, { inventory_item_id: '', quantity: 1, unit_price: unitPrice, store_id: (stores.length === 1 ? stores[0].id! : '') }])
  }

  const removeItem = (index: number) => {
    setPurchaseOrderItems(purchaseOrderItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    if (value && field === 'unit_price' && !DECIMAL_REGEX.test(value)) {
      return
    }
    
    const preSelectedItem = purchaseOrderItems.find(item => item.inventory_item_id === value)
    if (preSelectedItem) {
        showErrorToast('Item already selected.')
        return
    }
    if (preSelectedItem) {
        showErrorToast('Item already selected.')
        return
    }
    const newItems = [...purchaseOrderItems]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill unit price when item is selected
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find(item => item.id === value)
      if (selectedItem) {
        newItems[index].unit_price = selectedItem.unit_price!
      }
    }
    
    setPurchaseOrderItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (purchaseOrderItems.length === 0) {
      showErrorToast('Please add at least one item')
      return
    }

    if (purchaseOrderItems.some(item => !item.inventory_item_id)) {
      showErrorToast('Please select all purchase order items')
      return
    }

    try {
      const itemsToInsert: PurchaseOrderItem[] = purchaseOrderItems.map(item => ({
        ...item.id && {id: item.id},
        store_id: item?.store_id,
        purchase_order_id: order?.id || '',
        inventory_item_id: item.inventory_item_id || '',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
      }))

      const newPurchaseOrder: PurchaseOrder = {
        id: order?.id || '',
        po_number: formData.po_number || '',
        supplier_id: formData.supplier_id || '',
        order_status: formData.order_status,
        status: order?.status || RecordStatus.ACTIVE,
        expected_date: formData.expected_date,
        order_items: itemsToInsert
      }
  
      onSave(newPurchaseOrder)
    } catch (error: any) {
      showErrorToast('Failed to save purchase order')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {order ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number *
              </label>
              <input
                type="text"
                value={formData.po_number}
                onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Date
              </label>
              <input
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          {order && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Status
              </label>
              <select
                value={formData.order_status}
                onChange={(e) => setFormData({ ...formData, order_status: e.target.value as any })}
                className="input-field"
              >
                {PURCHASE_ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {purchaseOrderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No purchase order items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {purchaseOrderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item *
                      </label>
                      <select
                        value={item.inventory_item_id}
                        onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                        className={`input-field ${item?.id !== undefined ? 'btn-secondary' : ''}`}
                        required
                        disabled={item?.id !== undefined}
                      >
                        <option value="">Select Item</option>
                        {inventoryItems.map(invItem => (
                          <option key={invItem.id} value={invItem.id}>
                            {invItem.sku} - {invItem.name} ({invItem.unit_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price *
                      </label>
                      <input
                        type="text"
                        value={item.unit_price > 0 ? item.unit_price : ''}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store *
                      </label>
                      <select
                        value={item.store_id}
                        onChange={(e) => updateItem(index, 'store_id', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Select Store</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="items-center">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        &nbsp;
                      </label>
                      <Tooltip text="Remove">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="mt-3 text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                    </div>
                  </div>
                ))}

                <div className="text-right">
                  <p className="text-lg font-medium">
                    Total: {calculateOrderTotalProce(purchaseOrderItems).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
