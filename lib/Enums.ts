export enum SubscriptionStatus {
    FREE_TRIAL = 'free_trial',
    SUBSCRIBED = 'subscribed',
    UNSUBSCRIBED = 'unsubscribed',
    EXPIRED = 'expired',
    TERMINATED = 'terminated'
}

export enum SubscriptionPaymentType {
    BANK_TRANSFER = 'bank_transfer',
    PAYMENT_GATEWAY = 'payment_gateway'
}

export enum CurrencyType {
    ETB = 'ETB',
    USD = 'USD'
}

export enum RecordStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

export enum OrderStatus {
    PENDING = 'pending',
    RECEIVED = 'received',
    FULFILLED = 'fulfilled',
    CANCELED = 'canceled',
}

export enum PurchaseOrderStatus {
    PENDING = OrderStatus.PENDING,
    RECEIVED = OrderStatus.RECEIVED,
    CANCELED = OrderStatus.CANCELED
}

export enum SalesOrderStatus {
    PENDING = OrderStatus.PENDING,
    FULFILLED = OrderStatus.FULFILLED,
    CANCELED = OrderStatus.CANCELED
}

export enum TransactionDirection {
    IN = 'in',
    OUT = 'out'
}

export enum FeedbackCategory {
    BUG = 'bug',
    FEATURE = 'feature',
    IMPROVEMENT = 'improvement',
    GENERAL = 'general'
}

export enum FeedbackStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

export enum PaymentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DECLINED = 'declined'
}

export enum FeedbackPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

export enum DATABASE_TABLE {
    tenants = 'tenants',
    categories = 'categories',
    customers = 'customers',
    inventory_items = 'inventory_items',
    purchase_orders = 'purchase_orders',
    purchase_order_items = 'purchase_order_items',
    sales_orders = 'sales_orders',
    sales_order_items = 'sales_order_items',
    stores = 'stores',
    suppliers = 'suppliers',
    transactions = 'transactions',
    feedback = 'feedback',
    manual_payments = 'manual_payments',
    domains = 'domains',
}

export enum ReportType {
    INVENTORY_AGING = 'inventory_aging',
    INVENTORY_TURNOVER = 'inventory_turnover',
    PENDING_SALES_ORDERS = 'pending_sales_orders',
    CANCELED_SALES_ORDERS = 'canceled_sales_orders',
    PENDING_PURCHASE_ORDERS = 'pending_purchase_orders',
    CANCELED_PURCHASE_ORDERS = 'canceled_purchase_orders'
}

export enum RPC_FUNCTION {
    TRANSACTION_PURCHASE_ORDER_HANDLER = 'purchase_order_transaction',
    TRANSACTION_SALES_ORDER_HANDLER = 'sales_order_transaction',
    INVENTORY_AGING = 'generate_inventory_aging_report',
    INVENTORY_TURNOVER = 'generate_inventory_turnover_report',
    UNFULFILLED_SALES_ORDERS = 'generate_unfulfilled_sales_orders_report',
    UNRECEIVED_PURCHASE_ORDERS = 'generate_unreceived_purchase_orders_report',
    DASHBOARD_STATS = 'build_dashboard_stats',
    PURCHASE_ORDER_MONTHLY_TRENDS = 'purchase_order_monthly_trends',
    SALES_ORDER_MONTHLY_TRENDS = 'sales_order_monthly_trends',
    FETCH_USER_SUBSCRIPTION_INFO = 'fetch_user_subscription_info'
}

export enum STRIPE_PAYMENT_EVENT {
    CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
    CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted'
}

export enum ROUTE_PATH {
    // Public routes
    LANDING_PAGE = '/',
    SIGNIN = '/auth/signin',
    PRICING_PLAN = '/pricing-plan',
    PRIVACY_POLICY = '/privacy-policy',
    PRODUCT_DEMO = '/product-demo',
    TERMS_OF_SERVICE = '/terms-of-service',
    OAUTH_GOOGLE_WEBHOOK = '/api/oauth/google',
    // Authenticated routes
    DASHBOARD = '/dashboard',
    CATEGORY = '/dashboard/category',
    COMPLETE_PROFILE = '/dashboard/complete-profile',
    CUSTOMER = '/dashboard/customer',
    DOMAIN = '/dashboard/domain',
    FEEDBACK = '/dashboard/feedback',
    FEEDBACK_MANAGEMENT = '/dashboard/feedback-management',
    INVENTORY_ITEM = '/dashboard/inventory-item',
    MANUAL_PAYMENT = '/dashboard/manual-payment',
    PURCHASE_ORDER = '/dashboard/purchase-order',
    REPORT = '/dashboard/report',
    SALES_ORDER = '/dashboard/sales-order',
    SETTING = '/dashboard/setting',
    STORE = '/dashboard/store',
    SUPPLIER = '/dashboard/supplier',
    TRANSACTION = '/dashboard/transaction'
}