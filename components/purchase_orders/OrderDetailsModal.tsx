'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { PurchaseOrder, SalesOrder } from '@/lib/types/Models'
import { calculateOrderTotalProce, formatDateToUTC, getDateWithoutTime, getOrderStatusColor } from '@/lib/helpers/Helper'

interface OrderItem {
  id: string
  inventory_item_id: string
  quantity: number
  unit_price: number
  item: {
    sku: string
    name: string
  }
}

interface orderModalProps {
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrder
}

export default function orderModal({ isOpen, onClose, order }: orderModalProps) {

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Purchase Order Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Order Number:</span>
                  <span className="ml-2 font-medium">{order.po_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Order Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                    {order.order_status}
                  </span>
                </div>
                {order.expected_date && (
                  <div>
                    <span className="text-gray-600">Expected Date:</span>
                    <span className="ml-2">{getDateWithoutTime(formatDateToUTC(order.expected_date))}</span>
                  </div>
                )}
                {order.received_date && (
                  <div>
                    <span className="text-gray-600">Received Date:</span>
                    <span className="ml-2">{formatDateToUTC(order.received_date)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2">{formatDateToUTC(order.created_at!)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>
                  <span className="ml-2">{formatDateToUTC(order.updated_at!)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">
                Supplier Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{order.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{order.supplier?.email}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">Financial Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="ml-2 font-medium text-lg">{calculateOrderTotalProce(order.order_items!)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Items Count:</span>
                  <span className="ml-2">{order.order_items!.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.order_items!.map((orderItem) => (
                    <tr key={orderItem.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {orderItem.item?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {orderItem.item?.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {orderItem.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {orderItem.unit_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {(orderItem.quantity * orderItem.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {orderItem.store?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right">
              <p className="text-lg font-medium">
                Total: {calculateOrderTotalProce(order.order_items!)}
              </p>
            </div>
          </div>
        </div>
      
        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
