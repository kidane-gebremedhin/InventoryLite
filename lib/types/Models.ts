import { PurchaseOrderStatus, SalesOrderStatus } from "../Enums"

export interface User {
    id: string
    fullName: string
    email: string,
    picturePicture: string
}

export interface Category {
  id?: string
  name: string
  description: string,
  status?: string
}


export interface Store {
  id?: string
  name: string
  description: string,
  status?: string
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
  updated_at?: string
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
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface Customer {
  id?: string
  name: string
  email?: string
  phone?: string
  address?: string
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface PurchaseOrderItem {
  id?: string
  purchase_order_id?: string
  store_id: string
  inventory_item_id: string
  quantity: number
  unit_price: number
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
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
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  item?: InventoryItem
  store?: Store
}

export interface PurchaseOrder {
  id?: string
  po_number: string
  supplier_id: string
  order_status?: PurchaseOrderStatus.PENDING
  expected_date?: string
  tenant_id?: string
  status: string
  created_at?: string
  updated_at?: string
  supplier?: Supplier
  order_items?: PurchaseOrderItem[]
}

export interface SalesOrder {
  id?: string
  so_number: string
  customer_id: string
  order_status?: SalesOrderStatus.PENDING
  expected_date?: string
  tenant_id?: string
  status: string
  created_at?: string
  updated_at?: string
  customer?: Customer
  order_items?: SalesOrderItem[]
}

export interface Transaction {
  id?: string
  type: 'in' | 'out'
  store_id: string
  item_id: string
  quantity: number
  current_item_quantity?: number
  reference_id: string
  status?: string
  tenant_id?: string
  created_at?: string
  updated_at?: string
  item?: InventoryItem
  store?: Store
}

// Legacy interfaces for backward compatibility
export interface PurchaseOrderOrderItems {
  id?: string
  purchase_order_id: string
  inventory_item_id: string,
  quantity?: number,
  unit_price: number,
  tenant_id: string,
  created_at: string,
  updated_at: string
}

export interface PurchaseOrders {
  id?: string
  po_number: string
  supplier_id: string,
  status?: string,
  expected_date: Date,
  tenant_id: string,
  created_at: string,
  updated_at: string,
  items: PurchaseOrderOrderItems[]
}


export interface FeedbackStatus {
    key: string
    label: string
}
