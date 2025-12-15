'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Domain } from '@/lib/types/Models';
import { showErrorToast } from '@/lib/helpers/Helper';

interface DomainModalProps {
  isOpen: boolean
  onClose: () => void
  domain: Domain | null
  onSave: (domain: Domain) => void
}

const emptyEntry: Domain = {
  name: '',
  description: ''
}

export function DomainModal({ isOpen, onClose, domain, onSave }: DomainModalProps) {
  const [formData, setFormData] = useState<Partial<Domain>>(emptyEntry)

  useEffect(() => {
    if (domain) {
      setFormData(domain)
    } else {
      setFormData(emptyEntry)
    }
  }, [isOpen, domain])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      showErrorToast('Please fill in all required fields.')
      return
    }

    const newDomain: Domain = {
      id: domain?.id,
      name: formData.name,
      description: formData.description || ''
    }

    onSave(newDomain)
  }

  const handleInputChange = (field: keyof Domain, value: any) => {
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
            {domain ? 'Edit' : 'Add New'}
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
              {domain ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
