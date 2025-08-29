import { PurchaseOrderStatus, RecordStatus, SalesOrderStatus, TransactionDirection } from "./Enums"

export const APP_NAME = 'InventoryLite'
export const APP_MOTO = 'Simplified Inventory Management Software for Modern Businesses'
export const CONTACT_EMAIL = 'info@ethiotechsolutions.com'

export const ALL_OPTIONS = ''
export const TEXT_SEARCH_TRIGGER_KEY = 'Enter'

// Auth constants
export const SIGNED_OUT = 'SIGNED_OUT'

export const MAX_TABLE_TEXT_LENGTH = 50
export const MAX_DROPDOWN_TEXT_LENGTH = 25
export const RECORDS_PER_PAGE = 10
export const FIRST_PAGE_NUMBER = 1

export const RECORD_STATUSES: string[] = [
    RecordStatus.ACTIVE,
    RecordStatus.ARCHIVED
]

export const PURCHASE_ORDER_STATUSES: string[] = [
    PurchaseOrderStatus.PENDING,
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED
]

export const SALES_ORDER_STATUSES: string[] = [
    SalesOrderStatus.PENDING,
    SalesOrderStatus.FULFILLED,
    SalesOrderStatus.CANCELLED
]

export const TRANSACTION_DIRECTIONS: string[] = [
    ALL_OPTIONS,
    TransactionDirection.IN,
    TransactionDirection.OUT
]

export const RECORDS_PER_PAGE_OPTIONS = [2, 5, 10, 25, 50, 100]