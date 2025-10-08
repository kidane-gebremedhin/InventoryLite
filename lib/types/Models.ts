import { PurchaseOrderStatus, SalesOrderStatus, TransactionDirection } from "../Enums"

export interface Domain {
  id?: string
  name: string
  description: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface Category {
  id?: string
  name: string
  description: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}


export interface Store {
  id?: string
  name: string
  description: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface InventoryItem {
  id?: string
  sku: string
  name: string
  description?: string
  category_id: string
  quantity: number
  min_quantity: number
  unit_price: number
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  category?: Category
  purchase_order_items?: PurchaseOrderItem[]
  sales_order_items?: SalesOrderItem[]
}

export interface Supplier {
  id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface Customer {
  id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface PurchaseOrderItem {
  id?: string
  purchase_order_id?: string
  store_id: string
  inventory_item_id: string
  quantity: number
  unit_price: number
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  item?: InventoryItem
  store?: Store
}

export interface SalesOrderItem {
  id?: string
  sales_order_id?: string
  store_id: string
  inventory_item_id: string
  quantity: number
  unit_price: number
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  item?: InventoryItem
  store?: Store
}

export interface PurchaseOrder {
  id?: string
  po_number: string
  supplier_id: string
  order_status?: PurchaseOrderStatus.PENDING
  expected_date?: string
  received_date?: string
  status: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  supplier?: Supplier
  order_items?: PurchaseOrderItem[]
}

export interface SalesOrder {
  id?: string
  so_number: string
  customer_id: string
  order_status?: SalesOrderStatus.PENDING
  expected_date?: string
  fulfilled_date?: string
  status: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  customer?: Customer
  order_items?: SalesOrderItem[]
}

export interface Transaction {
  id?: string
  type: TransactionDirection.IN | TransactionDirection.OUT
  store_id: string
  item_id: string
  quantity: number
  current_item_quantity?: number
  reference_id: string
  status?: string
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  item?: InventoryItem
  store?: Store
}

// Legacy interfaces for backward compatibility
export interface PurchaseOrderOrderItems {
  id?: string
  purchase_order_id: string
  inventory_item_id: string
  quantity?: number
  unit_price: number
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface FeedbackStatus {
    key: string
    label: string
}

export interface InventoryTurnoverReport {
  item_id: string
  item_name: string
  sold_quantity: number
}

export interface PendingOrdersReport {
  item_id: string
  item_name: string
  total_ordered_quantity: number
  order_status: string
}

export interface InventoryAgingReport {
  item_id: string
  item_name: string
  item_quantity: number
  order_id: string
  order_number: string
  order_received_date: string
  days_in_stock: number
}

export interface PurchaseOrderMonthlyTrendsData {
  month_name: string
  ordered_quantity: number
  canceled_quantity: number
  received_quantity: number
}

export interface SalesOrderMonthlyTrendsData {
  month_name: string
  ordered_quantity: number
  canceled_quantity: number
  fulfilled_quantity: number
}

export interface ManualPayment {
  id?: string
  amount: number
  reference_number: string
  status: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface RecordStatusPayload {
  status: string
}

export interface ServerActionsHeader {
  authorizationToken: string
}

export interface ServerActionsResponse {
  error: any
  data: any,
  count?: number
}

export interface PurchaseOrderData {
  purchase_order_data: any
  purchase_order_items_data: any
  is_for_update?: boolean
}

export interface SalesOrderData {
  sales_order_data: any
  sales_order_items_data: any
  is_for_update?: boolean
}

export interface PurchaseOrderStatusPayload {
  order_status: PurchaseOrderStatus
}

export interface SalesOrderStatusPayload {
  order_status: SalesOrderStatus
}

export interface UserSubscriptionInfo {
  email: string
  name: string
  domain_id: string
  price_id: string
  payment_type: string
  currency_type: string
  subscription_status: string
  current_payment_expiry_date?: Date
  expected_payment_amount: number
  profile_complete: boolean
  description?: string
  status: string
  created_at: Date
  updated_at: Date
  role: string
}

export interface User {
    id: string
    fullName: string
    email: string
    picturePicture: string
    subscriptionInfo: UserSubscriptionInfo
}
