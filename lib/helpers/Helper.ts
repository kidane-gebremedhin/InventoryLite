import toast from "react-hot-toast"
import { ConsentCookieStatus, InvitationStatus, PaymentStatus, PurchaseOrderStatus, RecordStatus, SalesOrderStatus, TransactionDirection } from "../Enums"
import { PurchaseOrderItem, SalesOrderItem } from "../types/Models"
import { CONSENT_COOKIE_KEY, CUSTOM_SERVER_ERRORS, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from "../Constants"

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

export const getInvitationStatusColor = (status: string): string => {
    switch (status) {
      case InvitationStatus.OPEN:
        return 'bg-yellow-100 text-yellow-800'
      case InvitationStatus.ACCEPTTED:
        return 'bg-green-100 text-green-800'
      case InvitationStatus.EXPIRED:
        return 'bg-red-100 text-red-800'
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

/**
 * This method helps send UTC date to Supabase
 * @param date Date
 * @returns 
 */
export const convertToUTC = (date: Date) => {
  if (!date) return date

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
}

export const getDateStringForDisplay = (date: Date): string => {
  if (!date) return ''

  return date.toLocaleString()
}

export const formatDateToLocalDate = (dateStr?: string): string => {
  if (!dateStr) return ''

  return getDateStringForDisplay(new Date(dateStr))
}

export const formatDateToYYMMDD = (date: Date | null): string => {
  if (!date) return ''

  const dateWithTimezone = new Date(getDateStringForDisplay(date))
  return `${dateWithTimezone.getDate()}-${dateWithTimezone.getMonth()}-${dateWithTimezone.getFullYear()}`
}

export const getCurrentDateTime = (date?: Date): Date => {
  const dateTmp = date ? date : new Date()
  return new Date(getDateStringForDisplay(dateTmp))
}

export const getCurrentDate = (): String => {
  const dateTime = getCurrentDateTime();
  return dateTime.getDate()+"-"+dateTime.getMonth()+"-"+dateTime.getFullYear();
}

export const getDateWithoutTime = (dateStr?: string): string => {
  if (!dateStr) return ''
  
  // Return as is when non date string is passed
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

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
  
export const calculateStartAndEndIndex = ({currentPage, recordsPerPage}): { startIndex: number, endIndex: number } => {
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = currentPage * recordsPerPage - 1;

  return { startIndex, endIndex }
}

// --- GDPR POPUP LOGIC ---

/**
 * Sets the client-accessible consent cookie.
 */
export function setConsentCookie(value) {
    let expires = "";
    const date = new Date();
    date.setTime(date.getTime() + (ConsentCookieStatus.expireAfterDays * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
    document.cookie = CONSENT_COOKIE_KEY + "=" + (value || "")  + expires + "; path=/; secure; samesite=Lax";
}

/**
 * Get a specific cookie value from document.cookie
 */
export function getClientCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export function acceptCookies() {
   // Set for 1 year
    setConsentCookie(ConsentCookieStatus.accepted.toString());
}

export function consentGiven() {
  return getClientCookie(CONSENT_COOKIE_KEY) === ConsentCookieStatus.accepted.toString();
}

/**
 * Clears the client-accessible consent cookie.
 */
function clearConsentCookie() {
    document.cookie = CONSENT_COOKIE_KEY + "=; path=/;";
}
