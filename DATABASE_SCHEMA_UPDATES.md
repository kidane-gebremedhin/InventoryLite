# Database Schema Updates

## Overview
The database schema has been updated to reflect the current models used in the InventoryLite application. This document outlines the key changes made to align the database structure with the application's data models.

## Key Changes Made

### 1. Inventory Items Table
**Changes:**
- Changed `category_id` (UUID foreign key) to `category` (VARCHAR string)
- Changed `archived` (BOOLEAN) to `status` (VARCHAR with 'active' | 'archived' values)
- Updated indexes to reflect the new field structure

**Reason:** The application uses category names as strings rather than foreign key references, and uses a status field for active/archived state.

### 2. Purchase Orders Table
**Changes:**
- Added `expected_date` (DATE) field
- Updated indexes and RLS policies

**Reason:** The application models include expected delivery dates for purchase orders.

### 3. Sales Orders Table
**Changes:**
- Added `expected_date` (DATE) field
- Updated indexes and RLS policies

**Reason:** The application models include expected fulfillment dates for sales orders.

### 4. New Tables Added

#### Purchase Order Items Table
```sql
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Sales Order Items Table
```sql
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Updated Indexes
- Added indexes for new fields (`category`, `status`, `expected_date`)
- Added indexes for new order items tables
- Updated existing indexes to reflect field changes

### 6. Updated Row Level Security (RLS)
- Added RLS policies for new order items tables
- Updated existing policies to work with new field structures

### 7. Updated TypeScript Types
The `lib/supabase.ts` file has been updated to include:
- Updated `inventory_items` types with `category` and `status` fields
- Updated `purchase_orders` and `sales_orders` types with `expected_date` field
- New types for `purchase_order_items` and `sales_order_items` tables

## Application Model Alignment

The updated schema now properly supports the following application models:

### InventoryItem Interface
```typescript
interface InventoryItem {
  id: string
  sku: string
  name: string
  description: string
  category: string  // ✅ Now matches database
  quantity: number
  min_quantity: number
  unit_price: number
  status: 'active' | 'archived'  // ✅ Now matches database
  created_at: string
}
```

### SalesOrder Interface
```typescript
interface SalesOrder {
  id: string
  so_number: string
  customer_name: string
  customer_email: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  created_at: string
  expected_date: string  // ✅ Now matches database
}
```

### PurchaseOrder Interface
```typescript
interface PurchaseOrder {
  id: string
  po_number: string
  vendor_name: string
  vendor_email: string
  status: 'pending' | 'received' | 'cancelled'
  created_at: string
  expected_date: string  // ✅ Now matches database
}
```

## Migration Notes

### For Existing Databases
If you have an existing database, you'll need to run the following migration steps:

1. **Update inventory_items table:**
   ```sql
   -- Add new fields
   ALTER TABLE inventory_items ADD COLUMN category VARCHAR(255);
   ALTER TABLE inventory_items ADD COLUMN status VARCHAR(20) DEFAULT 'active';
   
   -- Migrate existing data (if you have category_id data)
   -- UPDATE inventory_items SET category = (SELECT name FROM categories WHERE id = inventory_items.category_id);
   
   -- Remove old fields
   ALTER TABLE inventory_items DROP COLUMN category_id;
   ALTER TABLE inventory_items DROP COLUMN archived;
   ```

2. **Add expected_date to orders:**
   ```sql
   ALTER TABLE purchase_orders ADD COLUMN expected_date DATE;
   ALTER TABLE sales_orders ADD COLUMN expected_date DATE;
   ```

3. **Create new order items tables:**
   ```sql
   -- Run the CREATE TABLE statements for purchase_order_items and sales_order_items
   ```

4. **Update indexes and RLS policies:**
   ```sql
   -- Run the new index creation statements
   -- Run the new RLS policy statements
   ```

### For New Databases
Simply run the updated `database_schema.sql` file to create the database with the correct structure.

## Benefits of These Changes

1. **Better Data Integrity:** Order items are now properly tracked with their own tables
2. **Improved Performance:** Proper indexing on frequently queried fields
3. **Enhanced Flexibility:** Category names can be managed as strings without foreign key constraints
4. **Better User Experience:** Expected dates provide better order tracking
5. **Type Safety:** Updated TypeScript types ensure compile-time safety

## Future Considerations

1. **Category Management:** Consider adding a categories table back if you need centralized category management
3. **Vendor/Customer Names:** Consider if you want to store vendor/customer names directly in orders or always join with the vendors/customers tables
4. **Audit Trail:** Consider adding audit tables for tracking changes to critical data
