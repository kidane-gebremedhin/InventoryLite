
import { getCurrentDateTimeUTC, showErrorToast } from '../helpers/Helper'
import { User } from '../types/Models'
import { DATABASE_TABLE, PurchaseOrderStatus, SalesOrderStatus, UserRole } from '../Enums'


export const getCurrentUserRole = (user: User): string => {
  return user && user.email === 'kidane10g.edu@gmail.com' ? UserRole.ADMIN : UserRole.USER
}

export const authorseDBAction = async (user: User): Promise<User | undefined> => {
  if (!user) {
    //showErrorToast('Unauthorised attempt.')
    console.log('Unauthorised attempt.')
    return
  }

  return user
}

export const insertSeedData = async (supabase) => {
  if (!supabase) return

  try {
    const { data: storeData, error: storeError } = await supabase
      .from(DATABASE_TABLE.stores)
      .insert({ name: 'Main Store', description: 'The main store' })
      .select()
      .single()
    if (storeError) {
      showErrorToast('stores err')
      return
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from(DATABASE_TABLE.categories)
      .insert({ name: 'Electronics', description: 'Electronic devices' })
      .select()
      .single()
    if (categoryError) {
      showErrorToast('categories err')
      return
    }

    const { data: inventoryItemData, error: inventoryItemError } = await supabase
      .from(DATABASE_TABLE.inventory_items)
      .insert({ name: 'Samsung S-16 Ultra', sku: 'S-123456', category_id: categoryData.id, unit_price: 20 })
      .select()
      .single()
    if (inventoryItemError) {
      showErrorToast('inventory_items err')
      return
    }

    const { data: supplierData, error: supplierError } = await supabase
      .from(DATABASE_TABLE.suppliers)
      .insert({ name: 'Main Suppier', email: 'supplier@gmail.com', phone: '+12324665748', address: 'The main supplier address' })
      .select()
      .single()
    if (supplierError) {
      showErrorToast('suppliers err')
      return
    }

    const { data: purchaseOrderData, error: purchaseOrderError } = await supabase
      .from(DATABASE_TABLE.purchase_orders)
      .insert({ po_number: 'PO-12346456', supplier_id: supplierData.id, expected_date: getCurrentDateTimeUTC(), order_status: PurchaseOrderStatus.PENDING, received_date: getCurrentDateTimeUTC() })
      .select()
      .single()
    if (purchaseOrderError) {
      showErrorToast('purchase_orders err')
      return
    }

    const { data: purchaseOrderItemData, error: purchaseOrderItemError } = await supabase
      .from(DATABASE_TABLE.purchase_order_items)
      .insert({ purchase_order_id: purchaseOrderData.id, store_id: storeData.id, inventory_item_id: inventoryItemData.id, quantity: 12, unit_price: inventoryItemData.unit_price })
      .select()
      .single()
    if (purchaseOrderItemError) {
      showErrorToast('purchase_order_items err')
      return
    }

    const { data: customerData, error: customerError } = await supabase
      .from(DATABASE_TABLE.customers)
      .insert({ name: 'Main Customer', email: 'custome@gmail.com', phone: '+346465675675', address: 'The main customer address' })
      .select()
      .single()
    if (customerError) {
      showErrorToast('customers err')
      return
    }

    const { data: salesOrderData, error: salesOrderError } = await supabase
      .from(DATABASE_TABLE.sales_orders)
      .insert({ so_number: 'SO-1354354', customer_id: customerData.id, expected_date: getCurrentDateTimeUTC(), order_status: SalesOrderStatus.PENDING, fulfilled_date: getCurrentDateTimeUTC() })
      .select()
      .single()
    if (salesOrderError) {
      showErrorToast('sales_orders err')
      return
    }

    const { data: salesOrderItemsData, error: salesOrderItemsError } = await supabase
      .from(DATABASE_TABLE.sales_order_items)
      .insert({ sales_order_id: salesOrderData.id, store_id: storeData.id, inventory_item_id: inventoryItemData.id, quantity: 2, unit_price: inventoryItemData.unit_price })
      .select()
      .single()
    if (salesOrderItemsError) {
      showErrorToast('sales_order_items err')
      return
    }

  } catch (error: any) {
    console.error('Error inserting seed data:', error)
    showErrorToast('Error inserting seed data')
  }
}
