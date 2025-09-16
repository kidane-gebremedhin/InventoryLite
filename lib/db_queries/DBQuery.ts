import { supabase } from '@/supabase/supabase'
import { getCurrentDateTimeUTC, showErrorToast } from '../helpers/Helper'
import { User } from '../types/Models'
import { DATABASE_TABLE, PurchaseOrderStatus, SalesOrderStatus, UserRole } from '../Enums'

export const getCurrentUserRole = (user: User): string => {
  return user.email === 'kidane10g.edu@gmail.com' ? UserRole.ADMIN : UserRole.USER
}

export const authorseDBAction = async (user: User): Promise<User | undefined> => {
  if (!supabase) return

  if (!user) {
    showErrorToast('Unauthorised attempt.')
    return
  }

  return user
}

// Purchase Order Queries
export const fetchPurchaseOrders = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name, email),
        items:purchase_order_items(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error)
    throw error
  }
}

export const fetchPurchaseOrderDetails = async (orderId: string) => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name, email),
        items:purchase_order_items(
          *,
          item:inventory_items(sku, name, unit_price)
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Error fetching purchase order details:', error)
    throw error
  }
}

// Sales Order Queries
export const fetchSalesOrders = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(name, email),
        items:sales_order_items(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error: any) {
    console.error('Error fetching sales orders:', error)
    throw error
  }
}

export const fetchSalesOrderDetails = async (orderId: string) => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(name, email),
        items:sales_order_items(
          *,
          item:inventory_items(sku, name, unit_price, quantity)
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Error fetching sales order details:', error)
    throw error
  }
}

// Supplier and Customer Queries
export const fetchSuppliers = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, email')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
    throw error
  }
}

export const fetchCustomers = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching customers:', error)
    throw error
  }
}

// Inventory Queries
export const fetchInventoryItems = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, sku, name, unit_price, quantity')
      .eq('status', 'active')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching inventory items:', error)
    throw error
  }
}

// Order Status Update Queries
export const updatePurchaseOrderStatus = async (orderId: string, status: string) => {
  if (!supabase) return

  try {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
  } catch (error: any) {
    console.error('Error updating purchase order status:', error)
    throw error
  }
}

export const updateSalesOrderStatus = async (orderId: string, status: string) => {
  if (!supabase) return

  try {
    const { error } = await supabase
      .from('sales_orders')
      .update({ status })
      .eq('id', orderId)

    if (error) throw error
  } catch (error: any) {
    console.error('Error updating sales order status:', error)
    throw error
  }
}

export const insertSeedData = async () => {
  if (!supabase) return

  try {
    const { data: storeData, error: storeError } = await supabase
      .from(DATABASE_TABLE.stores)
      .insert({ name: 'Main Store', description: 'The main store' })
      .select()
      .single()
    if (storeError) {
      showErrorToast('stores err')
      console.log(storeError)
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from(DATABASE_TABLE.categories)
      .insert({ name: 'Electronics', description: 'Electronic devices' })
      .select()
      .single()
    if (categoryError) {
      showErrorToast('categories err')
      console.log(categoryError)
      return
    }

    const { data: inventoryItemData, error: inventoryItemError } = await supabase
      .from(DATABASE_TABLE.inventory_items)
      .insert({ name: 'Samsung S-16 Ultra', sku: 'S-123456', category_id: categoryData.id, unit_price: 20 })
      .select()
      .single()
    if (inventoryItemError) {
      showErrorToast('inventory_items err')
      console.log(inventoryItemError)
      return
    }

    const { data: supplierData, error: supplierError } = await supabase
      .from(DATABASE_TABLE.suppliers)
      .insert({ name: 'Main Suppier', email: 'supplier@gmail.com', phone: '+12324665748', address: 'The main supplier address' })
      .select()
      .single()
    if (supplierError) {
      showErrorToast('suppliers err')
      console.log(supplierError)
      return
    }

    const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
      .from(DATABASE_TABLE.purchase_orders)
      .insert({ po_number: 'PO-12346456', supplier_id: supplierData.id, expected_date: getCurrentDateTimeUTC(), order_status: PurchaseOrderStatus.PENDING, received_date: getCurrentDateTimeUTC() })
      .select()
      .single()
    if (purchaseOrderError) {
      showErrorToast('purchase_orders err')
      console.log(purchaseOrderError)
      return
    }

    const { data: purchaseOrderItemData, error: purchaseOrderItemError } = await supabase
      .from(DATABASE_TABLE.purchase_order_items)
      .insert({ purchase_order_id: purchaseOrderData.id, store_id: storeData.id, inventory_item_id: inventoryItemData.id, quantity: 12, unit_price: inventoryItemData.unit_price })
      .select()
      .single()
    if (purchaseOrderItemError) {
      showErrorToast('purchase_order_items err')
      console.log(purchaseOrderItemError)
      return
    }

    const { data: customerData, error: customerError } = await supabase
      .from(DATABASE_TABLE.customers)
      .insert({ name: 'Main Customer', email: 'custome@gmail.com', phone: '+346465675675', address: 'The main customer address' })
      .select()
      .single()
    if (customerError) {
      showErrorToast('customers err')
      console.log(customerError)
      return
    }

    const { data: salesOrderData, error: salesOrderError } = await supabase
      .from(DATABASE_TABLE.sales_orders)
      .insert({ so_number: 'SO-1354354', customer_id: customerData.id, expected_date: getCurrentDateTimeUTC(), order_status: SalesOrderStatus.PENDING, fulfilled_date: getCurrentDateTimeUTC() })
      .select()
      .single()
    if (salesOrderError) {
      showErrorToast('sales_orders err')
      console.log(salesOrderError)
      return
    }

    const { data: salesOrderItemsData, error: salesOrderItemsError } = await supabase
      .from(DATABASE_TABLE.sales_order_items)
      .insert({ sales_order_id: salesOrderData.id, store_id: storeData.id, inventory_item_id: inventoryItemData.id, quantity: 2, unit_price: inventoryItemData.unit_price })
      .select()
      .single()
    if (salesOrderItemsError) {
      showErrorToast('sales_order_items err')
      console.log(salesOrderItemsError)
      return
    }

  } catch (error: any) {
    console.error('Error inserting seed data:', error)
    showErrorToast('Error inserting seed data')
  }
}
