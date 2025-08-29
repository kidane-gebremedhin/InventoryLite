'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PurchaseOrder } from '@/lib/types/Models'
import { PurchaseOrderStatus, RecordStatus } from '@/lib/Enums'
import { calculateOrderTotalProce, showErrorToast } from '@/lib/helpers/Helper'

interface Vendor {
  id: string
  name: string
  email: string
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  unit_price: number
  quantity: number
}

interface PurchaseOrderItem {
  inventory_item_id: string
  quantity: number
  unit_price: number
}

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrder | null
  onSave: (order: PurchaseOrder) => void
}

const emptyEntry: PurchaseOrder = {
  po_number: '',
  vendor_id: '',
  order_status: PurchaseOrderStatus.PENDING,
  expected_date: '',
  tenant_id: '',
  status: RecordStatus.ACTIVE,
  created_at: '',
  updated_at: '',
  order_items: [],
}

export default function PurchaseOrderModal({ isOpen, onClose, order, onSave }: PurchaseOrderModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>(emptyEntry)
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<PurchaseOrderItem[]>([])

  useEffect(() => {
    if (isOpen) {
      loadVendors()
      loadInventoryItems()
      if (order) {
        setFormData({
          po_number: order.po_number || '',
          vendor_id: order.vendor_id || '',
          expected_date: order.expected_date ? new Date(order.expected_date).toISOString().split('T')[0] : '',
          order_status: order.order_status || PurchaseOrderStatus.PENDING
        })
        setPurchaseOrderItems(order.order_items || [])
      } else {
        resetForm()
      }
    }
  }, [isOpen, order])

  const loadVendors = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, email')
        .order('name')

      if (error) throw error
      setVendors(data || [])
    } catch (error: any) {
      showErrorToast()
    }
  }

  const loadInventoryItems = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, sku, name, unit_price, quantity')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setInventoryItems(data || [])
    } catch (error: any) {
      showErrorToast()
    }
  }

  const resetForm = () => {
    setFormData({
      po_number: '',
      vendor_id: '',
      expected_date: '',
      order_status: PurchaseOrderStatus.PENDING
    })
    setPurchaseOrderItems([])
  }

  const addItem = () => {
    setPurchaseOrderItems([...purchaseOrderItems, { inventory_item_id: '', quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index: number) => {
    setPurchaseOrderItems(purchaseOrderItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const preSelectedItem = purchaseOrderItems.find(item => item.inventory_item_id === value)
    if (preSelectedItem) {
        alert('item already selected')
        return
    }
    const newItems = [...purchaseOrderItems]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill unit price when item is selected
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find(item => item.id === value)
      if (selectedItem) {
        newItems[index].unit_price = selectedItem.unit_price
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
        purchase_order_id: order?.id || '',
        inventory_item_id: item.inventory_item_id || '',
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
      }))

      const newPurchaseOrder: PurchaseOrder = {
        id: order?.id || '',
        po_number: formData.po_number || '',
        vendor_id: formData.vendor_id || '',
        order_status: formData.order_status,
        status: order?.status || RecordStatus.ACTIVE,
        expected_date: formData.expected_date,
        order_items: itemsToInsert
      }
  
      // Clear input values
      setFormData(emptyEntry)
  
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Number *
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
                Vendor *
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
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
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
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
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item *
                      </label>
                      <select
                        value={item.inventory_item_id}
                        onChange={(e) => updateItem(index, 'inventory_item_id', e.target.value)}
                        className={order?.id !== undefined ? 'btn-secondary' : 'input-field'}
                        required
                        disabled={order?.id !== undefined}
                      >
                        <option value="">Select Item</option>
                        {inventoryItems.map(invItem => (
                          <option key={invItem.id} value={invItem.id}>
                            {invItem.sku} - {invItem.name} (${invItem.unit_price})
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
                        min={order?.id ? 0 : 1}
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
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn-danger flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className="text-right">
                  <p className="text-lg font-medium">
                    Total: ${calculateOrderTotalProce(purchaseOrderItems).toFixed(2)}
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
