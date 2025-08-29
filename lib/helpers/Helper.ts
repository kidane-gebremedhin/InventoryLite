import toast from "react-hot-toast"
import { PurchaseOrderStatus, RecordStatus, SalesOrderStatus, TransactionDirection } from "../Enums"
import { PurchaseOrderItem, SalesOrderItem } from "../types/Models"

export const shortenText = (input: string | undefined | null, targetLength: number): string => {
    if (!input) return ''

    return input.length <= targetLength ? input : `${input.substring(0, targetLength)}...`
}

export const showSuccessToast = (message: string) => {
    toast.success(message)
}

export const showErrorToast = (message?: string) => {
    toast.error(message ? message: 'Oops, Something went wrong.')
}

export const getRecordStatusColor = (status: string): string => {
    switch (status) {
      case RecordStatus.ACTIVE:
        return 'bg-green-100 text-green-800'
      case RecordStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
}

export const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
      case SalesOrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case PurchaseOrderStatus.RECEIVED:
      case SalesOrderStatus.FULFILLED:
        return 'bg-green-100 text-green-800'
      case PurchaseOrderStatus.CANCELLED:
      case SalesOrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
}

export const getTransactionDirectionColor = (status: string): string => {
    switch (status) {
      case TransactionDirection.IN:
        return 'bg-green-100 text-green-800'
      case TransactionDirection.OUT:
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
}

export const calculateOrderTotalProce = (orderItems: PurchaseOrderItem[] | SalesOrderItem[]) => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
}


export const canShowLoadingScreen = (startDateSet: Date | null, endDateSet: Date | null): boolean => {
  /**
   * Only show the loading screen on the following conditions not to close the datepicker when user is trying to set endEdate 
   * 1. both dates are null (user cleared the field)
   * 2. if startDate is set, check if endDate is also set
   */ 
  return !(startDateSet  && !endDateSet)
}

export const setEarliestTimeOfDay = (date: Date): Date => {
  // Start date should use earliest time of a day
  if (date) {
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
  }
  return date
}

export const setLatestTimeOfDay = (date: Date): Date => {
  // End date should use latest time of a day
  if (date) {
    date.setHours(23)
    date.setMinutes(59)
    date.setSeconds(59)
    date.setMilliseconds(999)
  }
  return date
}
export const convertToUTC = (date: Date) => {
  if (!date) return date

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
}

export const dateFormat = (dateStr: string): string => {
  return new Date(dateStr).toUTCString()
}
