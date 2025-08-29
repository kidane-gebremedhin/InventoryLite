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
}

export interface Vendor {
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
  inventory_item_id: string
  quantity: number
  unit_price: number
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  item?: InventoryItem
}

export interface SalesOrderItem {
  id?: string
  sales_order_id?: string
  inventory_item_id: string
  quantity: number
  unit_price: number
  tenant_id?: string
  status?: string
  created_at?: string
  updated_at?: string
  item?: InventoryItem
}

export interface PurchaseOrder {
  id?: string
  po_number: string
  vendor_id: string
  order_status?: PurchaseOrderStatus.PENDING
  expected_date?: string
  tenant_id?: string
  status: string
  created_at?: string
  updated_at?: string
  vendor?: Vendor
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
  item_id: string
  quantity: number
  reference_id: string
  status?: string
  tenant_id?: string
  created_at?: string
  updated_at?: string
  item?: InventoryItem
}

// Legacy interfaces for backward compatibility
export interface ReceivableOrderItems {
  id?: string
  purchase_order_id: string
  inventory_item_id: string,
  quantity?: number,
  unit_price: number,
  tenant_id: string,
  created_at: string,
  updated_at: string
}

export interface Receivables {
  id?: string
  po_number: string
  vendor_id: string,
  status?: string,
  expected_date: Date,
  tenant_id: string,
  created_at: string,
  updated_at: string,
  items: ReceivableOrderItems[]
}
