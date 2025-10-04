import { FeedbackCategory, FeedbackPriority, FeedbackStatus, PaymentStatus, PurchaseOrderStatus, RecordStatus, ROUTE_PATH, SalesOrderStatus, TransactionDirection } from "./Enums"

export const ALL_OPTIONS = ''
export const TEXT_SEARCH_TRIGGER_KEY = 'Enter'

// Pricing
export const FREE_PLAN_LABEL = 'Free'
export const FREE_PLAN_DURATION = 'week'
export const PAID_PLAN_DURATION = 'month'

// Auth constants
export const SIGNED_OUT = 'SIGNED_OUT'
export const DEFAULT_USER_ROLE = 'user'

// Currency
export const PAYMENT_CURRENTCY = 'ETB'

// Decimal validation
export const DECIMAL_REGEX = /^\d*\.?\d*$/;

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
    PurchaseOrderStatus.CANCELED
]

export const SALES_ORDER_STATUSES: string[] = [
    SalesOrderStatus.PENDING,
    SalesOrderStatus.FULFILLED,
    SalesOrderStatus.CANCELED
]

export const PAYMENT_STATUSES: string[] = [
    ALL_OPTIONS,
    PaymentStatus.PENDING,
    PaymentStatus.APPROVED,
    PaymentStatus.DECLINED
]

export const TRANSACTION_DIRECTIONS: string[] = [
    ALL_OPTIONS,
    TransactionDirection.IN,
    TransactionDirection.OUT
]

export const FEEDBACK_STATUSES = [
    {value: ALL_OPTIONS, label: 'All Feedback', color: 'bg-gray-100 text-gray-800'},
    {value: FeedbackStatus.OPEN, label: 'Open', color: 'bg-blue-100 text-blue-800'},
    {value: FeedbackStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-yellow-100 text-yellow-800'},
    {value: FeedbackStatus.RESOLVED, label: 'Resolved', color: 'bg-green-100 text-green-800'},
    {value: FeedbackStatus.CLOSED, label: 'Closed', color: 'bg-gray-100 text-gray-800'},
]

export const FEEDBACK_CATEGORIES = [
  { value: FeedbackCategory.BUG, label: 'Bug Report', color: 'bg-red-100 text-red-800' },
  { value: FeedbackCategory.FEATURE, label: 'Feature Request', color: 'bg-blue-100 text-blue-800' },
  { value: FeedbackCategory.IMPROVEMENT, label: 'Improvement', color: 'bg-green-100 text-green-800' },
  { value: FeedbackCategory.GENERAL, label: 'General', color: 'bg-gray-100 text-gray-800' },
]

export const FEEDBACK_PRIORITIES = [
  { value: FeedbackPriority.LOW, label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: FeedbackPriority.MEDIUM, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: FeedbackPriority.HIGH, label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: FeedbackPriority.URGENT, label: 'Urgent', color: 'bg-red-100 text-red-800' },
]

export const PUBLIC_PATHS = [
    ROUTE_PATH.LANDING_PAGE.toString(),
    ROUTE_PATH.SIGNIN.toString(),
    ROUTE_PATH.PRICING_PLAN.toString(),
    ROUTE_PATH.PRIVACY_POLICY.toString(),
    ROUTE_PATH.PRODUCT_DEMO.toString(),
    ROUTE_PATH.TERMS_OF_SERVICE.toString(),
    ROUTE_PATH.OAUTH_GOOGLE_WEBHOOK.toString()
]

export const VALIDATION_ERRORS_MAPPING = {
    serverError: 'violates unique constraint',
    entities: {
        userSubscriptionInfo: {
            fields: {
                name: {displayError: 'Selected name is taken, please select another name.'},
            }
        },
        domain: {
            fields: {
                name: {displayError: 'Domain name already exists.'},
            }
        },
        store: {
            fields: {
                name: {displayError: 'Store name already exists.'},
            }
        },
        category: {
            fields: {
                name: {displayError: 'Category already exists.'},
            }
        },
        customer: {
            fields: {
                name: {displayError: 'Customer already exists.'},
            }
        },
        inventory_item: {
            fields: {
                name: {displayError: 'Item name already exists.'},
                sku: {displayError: 'SKU already exists.'},
            }
        },
        purchase_order: {
            fields: {
                name: {displayError: 'Order number already exists.'},
            }
        },
        sales_order: {
            fields: {
                name: {displayError: 'Order number already exists.'},
            }
        },
        supplier: {
            fields: {
                name: {displayError: 'Supplier name already exists.'},
            }
        },
        manualPayment: {
            fields: {
                name: {displayError: 'invalid payment reference number.'},
            }
        }
    }
}

export const CUSTOM_SERVER_ERRORS = [
    'Insufficient inventory'
]

export const MONTH_NAME_MAPPING = new Map([
    ['01', 'Jan'],
    ['02', 'Feb'],
    ['03', 'Mar'],
    ['04', 'Apr'],
    ['05', 'May'],
    ['06', 'Jun'],
    ['07', 'Jul'],
    ['08', 'Aug'],
    ['09', 'Sep'],
    ['10', 'Oct'],
    ['11', 'Nov'],
    ['12', 'Dec']
])

export const RECORDS_PER_PAGE_OPTIONS = [10, 25, 50, 100]
export const REPORTS_PER_PAGE_OPTIONS = [25, 50, 100, 200, 500, 1000]