import { useUserContext } from '@/components/contextApis/UserProvider'
import { supabase } from '@/lib/supabase'
import { showErrorToast } from '../helpers/Helper'
import { User } from '../types/Models'

export const fetchCurrentTenantId = async () => {
    if (!supabase) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // First try to get existing user profile
    const { data: currentTenant } = await supabase
      .from('user_tenant_mappings')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    return currentTenant?.tenant_id
}

export const currentUserRole = (): string => {
      // 'user', 'admin'
      return 'admin'
}

export const authorseDBAction = async (user: User): Promise<User | undefined> => {
  if (!supabase) return

  //const { data: { user } } = await supabase.auth.getUser()
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
        vendor:vendors(name, email),
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
        vendor:vendors(name, email),
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

// Vendor and Customer Queries
export const fetchVendors = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, email')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
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
