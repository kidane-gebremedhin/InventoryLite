'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ManualPayment } from '@/lib/types/Models';
import { showErrorToast } from '@/lib/helpers/Helper';
import { useAuthContext } from '../providers/AuthProvider';

interface ManualPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  manualPayment: ManualPayment | null
  subscriptionMessage: string
  onSave: (manualPayment: ManualPayment) => void
}

export function ManualPaymentModal({ isOpen, onClose, manualPayment, subscriptionMessage, onSave }: ManualPaymentModalProps) {
  const { currentUser } = useAuthContext()
  const emptyEntry: Partial<ManualPayment> = {
    reference_number: '',
    amount: 0,
    description: '',
  }

  const [formData, setFormData] = useState<Partial<ManualPayment>>(emptyEntry)

  useEffect(() => {
    if (manualPayment) {
      setFormData(manualPayment)
    } else {
      setFormData(emptyEntry)
    }
  }, [isOpen, manualPayment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.reference_number) {
      showErrorToast('Please fill in all required fields.')
      return
    }

    const newManualPayment: ManualPayment = {
      id: manualPayment?.id,
      reference_number: formData.reference_number,
      amount: currentUser?.subscriptionInfo?.expected_payment_amount,
      status: manualPayment?.status,
      description: manualPayment?.description
    }

    onSave(newManualPayment)
  }

  const handleInputChange = (field: keyof ManualPayment, value: any) => {
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
            {manualPayment ? 'Edit' : 'Make Payment'}
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
            <h3>Enter reference number for {currentUser?.subscriptionInfo?.currency_type}{currentUser?.subscriptionInfo?.expected_payment_amount} payment</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference number *
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              className="input-field"
              required
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
              {manualPayment ? 'Update' : 'Make Payment'}
            </button>
          </div>
          <div className="w-full bg-white rounded-lg shadow border p-6">
            <p>{subscriptionMessage}</p>
          </div>
        </form>
      </div>
    </div>
  )
}
