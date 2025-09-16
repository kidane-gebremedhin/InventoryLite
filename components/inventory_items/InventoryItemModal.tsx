'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Category, InventoryItem } from '@/lib/types/Models';
import { showErrorToast } from '@/lib/helpers/Helper';
import { DECIMAL_REGEX } from '@/lib/Constants';

interface InventoryItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  categories: Category[]
  onSave: (item: InventoryItem) => void
}

const emptyEntry: InventoryItem = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  quantity: 0,
  min_quantity: 0,
  unit_price: 0
}

export function InventoryItemModal({ isOpen, onClose, item, categories, onSave }: InventoryItemModalProps) {
  // When single option, select it by default
  if (categories.length == 1) {
    emptyEntry.category_id = categories[0].id!
  }
  const [formData, setFormData] = useState<Partial<InventoryItem>>(emptyEntry)

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      setFormData(emptyEntry)
    }
  }, [isOpen, item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.sku || !formData.name || !formData.category_id) {
      showErrorToast('Please fill in all required fields.')
      return
    }

    const newItem: InventoryItem = {
      id: item?.id,
      sku: formData.sku,
      name: formData.name,
      description: formData.description || '',
      category_id: formData.category_id,
      quantity: item?.quantity || 0,
      min_quantity: formData.min_quantity || 0,
      unit_price: formData.unit_price || 0,
      status: item?.status,
      created_at: item?.created_at

    }

    onSave(newItem)
  }

  const handleInputChange = (field: keyof InventoryItem, value: any) => {
    if (value && field === 'unit_price' && !DECIMAL_REGEX.test(value)) {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit Item' : 'Add New Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className='w-full flex'>
              <div className='w-1/2'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.unit_price! > 0 ? formData.unit_price : ''}
                    onChange={(e) => handleInputChange('unit_price', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className='w-1/2 pl-2'>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Quantity
                </label>
                <input
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => handleInputChange('min_quantity', parseInt(e.target.value))}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
