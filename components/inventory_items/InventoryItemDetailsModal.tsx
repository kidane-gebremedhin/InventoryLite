'use client'

import { formatDateToLocalDate, getRecordStatusColor } from '@/lib/helpers/Helper'
import { InventoryItem } from '@/lib/types/Models'
import { XMarkIcon } from '@heroicons/react/24/outline'
import CloseModal from '../helpers/CloseModal'
import LowStock from '../helpers/LowStock'

interface ItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem
}

export default function ItemModal({ isOpen, onClose, item }: ItemModalProps) {

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Inventory Item Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Item Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">Item Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Item:</span>
                  <span className="ml-2 font-medium">{item.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium">{item.category?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <span className="ml-2 font-medium">{item.sku}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="ml-2 font-medium">{item.unit_price.toFixed(2)}</span>
                </div>
                <div className='flex'>
                  <span className="text-gray-600">Available Quantity:</span>
                  <span className="mx-2 font-medium">{item.quantity}</span>
                  {item.quantity <= item.min_quantity && (
                    <LowStock />
                  )}
                </div>
                <div>
                  <span className="text-gray-600">Min Quantity:</span>
                  <span className="ml-2 font-medium">{item.min_quantity}</span>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <span className="ml-2 font-medium">{item.description}</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Variants
                </h3>
                {item.item_variants?.map(iv => (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {iv.variant?.name}
                  </span>
                ))}
                <div>
                  <span className="text-gray-600">Record Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getRecordStatusColor(item.status!)}`}>
                    {item.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2">{formatDateToLocalDate(item.created_at!)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>
                  <span className="ml-2">{formatDateToLocalDate(item.updated_at!)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">
                Order Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Purchase Orders:</span>
                  <span className="ml-2 font-medium">{item.purchase_order_items?.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sales Orders:</span>
                  <span className="ml-2">{item.sales_order_items?.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CloseModal onClose={onClose} />
      </div>
    </div>
  )
}
