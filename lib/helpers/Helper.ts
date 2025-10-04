import toast from "react-hot-toast"
import { PaymentStatus, PurchaseOrderStatus, RecordStatus, RPC_FUNCTION, SalesOrderStatus, TransactionDirection } from "../Enums"
import { PurchaseOrderItem, SalesOrderItem, ServerActionsHeader, User, UserSubscriptionInfo } from "../types/Models"
import { CUSTOM_SERVER_ERRORS, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from "../Constants"
import { createClient } from "@/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { fetchReport } from "../server_actions/report"

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

export const showServerErrorToast = (message: string) => {
    if(isCustomServerError(message)) {
      toast.error(message)
      return
    }
    
    showErrorToast()
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

export const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case PaymentStatus.APPROVED:
        return 'bg-green-100 text-green-800'
      case PaymentStatus.DECLINED:
        return 'bg-red-100 text-red-800'
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
      case PurchaseOrderStatus.CANCELED:
      case SalesOrderStatus.CANCELED:
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

export const canShowLoadingScreen = (startDateSet: Date | null, endDateSet: Date | null, receivedDateStart: Date | null, receivedDateEnd: Date | null): boolean => {
  /**
   * Only show the loading screen on the following conditions not to close the datepicker when user is trying to set endEdate 
   * 1. both dates are null (user cleared the field)
   * 2. if startDate is set, check if endDate is also set
   */ 
  return (startDateSet == null || endDateSet !== null) && (receivedDateStart == null || receivedDateEnd !== null)
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


export const formatDateToUTC = (dateStr?: string): string => {
  if (!dateStr) return ''


  return new Date(dateStr).toUTCString()
}

export const formatDateToYYMMDD = (date: Date | null): string => {
  if (!date) return ''

  const utcDate = new Date(date.toUTCString())
  return `${utcDate.getDate()}-${utcDate.getMonth()}-${utcDate.getFullYear()}`
}

export const getCurrentDateTimeUTC = (date?: Date): Date => {
  const dateTmp = date ? date : new Date()
  return new Date(dateTmp.toUTCString())
}

export const getCurrentDateUTC = (): String => {
  const dateTime = getCurrentDateTimeUTC();
  return dateTime.getDate()+"-"+dateTime.getMonth()+"-"+dateTime.getFullYear();
}

export const getDateWithoutTime = (dateStr?: string): string => {
  if (!dateStr) return ''

  if (dateStr.includes('T')) return dateStr.split('T')[0];
  if (dateStr.includes(' ')) return `${dateStr.split(' ').slice(0, 4).join(' ').toString()} ${dateStr.split(' ').reverse()[0]}`;
  
  return dateStr;
}

export const capitalizeFirstLetter = (input: string): string => {
  return input.charAt(0).toUpperCase() + input.slice(1);
}


export const getFeedbackCategoryLabel = (category: string) => {
  return FEEDBACK_CATEGORIES.find(c => c.value === category)?.label || category
}

export const getFeedbackCategoryColor = (category: string) => {
  return FEEDBACK_CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800'
}

export const getFeedbackPriorityColor = (priority: string) => {
  return FEEDBACK_PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800'
}

export const getFeedbackStatusColor = (status: string) => {
  return FEEDBACK_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800'
}

export const isCustomServerError = (message: string): boolean => {
  for (const customError of CUSTOM_SERVER_ERRORS) {
    if (message.includes(customError)) return true
  }
  return false
}

export const fetchUserProfile = async (user: SupabaseUser): Promise<User> => {
  if (!user) return null;

  const userData: User = {
    id: user.id,
    fullName: user.user_metadata.full_name,
    email: user.email!,
    picturePicture: user.user_metadata.picture,
    subscriptionInfo: await fetchUserSubscriptionInfo(user)
  };

  return userData;
}

export const fetchUserSubscriptionInfo = async (user: SupabaseUser): Promise<UserSubscriptionInfo> => {
  // RPC call to fetch subscription info
  const searchParams = { current_user_id: user.id }
  const { data, error } = await fetchReport(RPC_FUNCTION.FETCH_USER_SUBSCRIPTION_INFO, searchParams)
  if (error) {
    return null;
  }

  return data.length > 0 ? data[0] : null;
}
  
