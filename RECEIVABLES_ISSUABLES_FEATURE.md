# Purchase Orders and Sales Orders Management Features

This document describes the complete purchase_orders and sales_orders management features implemented in InventoryLite.

## Overview

The purchase_orders and sales_orders features provide comprehensive order management capabilities for purchase orders (purchase_orders) and sales orders (sales_orders). These features integrate with the existing inventory system and provide full CRUD operations for managing orders.

## Features

### Purchase Orders (Purchase Orders)

#### Core Functionality
- **Create Purchase Orders**: Add new purchase orders with multiple items
- **Edit Purchase Orders**: Modify existing purchase orders and their items
- **View Order Details**: Detailed view of purchase orders with supplier information
- **Status Management**: Update order status (pending, received, canceled)
- **Supplier Management**: Create and manage suppliers
- **Real-time Data**: All data is fetched from and saved to the database

#### Components
- `PurchaseOrderModal`: Modal for creating/editing purchase orders
- `OrderDetailsModal`: Modal for viewing order details
- `SupplierModal`: Modal for managing suppliers
- Updated `purchase_orders/page.tsx`: Main page with table view and actions

#### Database Tables Used
- `purchase_orders`: Main purchase order records
- `purchase_order_items`: Individual items in purchase orders
- `suppliers`: Supplier information
- `inventory_items`: Available inventory items

### Sales Orders (Sales Orders)

#### Core Functionality
- **Create Sales Orders**: Add new sales orders with multiple items
- **Edit Sales Orders**: Modify existing sales orders and their items
- **View Order Details**: Detailed view of sales orders with customer information
- **Status Management**: Update order status (pending, fulfilled, canceled)
- **Customer Management**: Create and manage customers
- **Inventory Validation**: Check stock availability before creating orders
- **Real-time Data**: All data is fetched from and saved to the database

#### Components
- `SalesOrderModal`: Modal for creating/editing sales orders
- `OrderDetailsModal`: Modal for viewing order details (shared with purchase_orders)
- `CustomerModal`: Modal for managing customers
- Updated `sales_orders/page.tsx`: Main page with table view and actions

#### Database Tables Used
- `sales_orders`: Main sales order records
- `sales_order_items`: Individual items in sales orders
- `customers`: Customer information
- `inventory_items`: Available inventory items

## Key Features

### 1. Order Management
- **Multi-item Orders**: Each order can contain multiple inventory items
- **Automatic Calculations**: Total amounts are calculated automatically
- **Status Tracking**: Track order progress through different statuses
- **Date Management**: Expected delivery dates for planning

### 2. Inventory Integration
- **Stock Validation**: Sales orders validate available inventory
- **Item Selection**: Dropdown lists with current inventory items
- **Price Management**: Unit prices are auto-filled but can be modified
- **Quantity Tracking**: Track quantities ordered vs available

### 3. Supplier/Customer Management
- **Contact Information**: Store supplier and customer details
- **Quick Creation**: Create suppliers/customers on-the-fly
- **Search and Filter**: Find suppliers/customers easily

### 4. User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Modal-based Forms**: Clean, focused interfaces for data entry
- **Real-time Updates**: Immediate feedback on actions
- **Search and Filter**: Find orders quickly
- **Status Indicators**: Visual status badges with color coding

### 5. Data Validation
- **Required Fields**: Essential information is validated
- **Stock Validation**: Prevent overselling
- **Duplicate Prevention**: Unique order numbers
- **Data Integrity**: Proper foreign key relationships

## Database Schema

### Purchase Orders
```sql
purchase_orders (
  id UUID PRIMARY KEY,
  po_number VARCHAR(100) UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  status VARCHAR(20) DEFAULT 'pending',
  expected_date DATE,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Purchase Order Items
```sql
purchase_order_items (
  id UUID PRIMARY KEY,
  purchase_order_id UUID REFERENCES purchase_orders(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Sales Orders
```sql
sales_orders (
  id UUID PRIMARY KEY,
  so_number VARCHAR(100) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(20) DEFAULT 'pending',
  expected_date DATE,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Sales Order Items
```sql
sales_order_items (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## API Functions

### Database Queries (lib/db_queries/DBQuery.ts)
- `fetchPurchaseOrders()`: Get all purchase orders with supplier info
- `fetchPurchaseOrderDetails(orderId)`: Get detailed purchase order data
- `fetchSalesOrders()`: Get all sales orders with customer info
- `fetchSalesOrderDetails(orderId)`: Get detailed sales order data
- `fetchSuppliers()`: Get all suppliers
- `fetchCustomers()`: Get all customers
- `fetchInventoryItems()`: Get active inventory items
- `updatePurchaseOrderStatus(orderId, status)`: Update PO status
- `updateSalesOrderStatus(orderId, status)`: Update SO status

## Usage Examples

### Creating a Purchase Order
1. Navigate to PurchaseOrders page
2. Click "New Purchase Order"
3. Fill in PO number, select supplier, set expected date
4. Add items with quantities and prices
5. Review total and save

### Creating a Sales Order
1. Navigate to Sales Orders page
2. Click "New Sales Order"
3. Fill in SO number, select customer, set expected date
4. Add items (system validates stock availability)
5. Review total and save

### Managing Order Status
1. View orders in the table
2. Use action buttons to update status:
   - ✅ Mark as Received/Fulfilled
   - ❌ Cancel Order
   - 👁️ View Details
   - ✏️ Edit Order

## Security Features

- **Row Level Security (RLS)**: All data is tenant-isolated
- **Authentication Required**: Users must be logged in
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: Using Supabase's parameterized queries

## Future Enhancements

1. **Email Notifications**: Send order confirmations and status updates
2. **PDF Generation**: Generate order documents
3. **Bulk Operations**: Import/export orders
4. **Advanced Reporting**: Order analytics and trends
5. **Integration**: Connect with accounting systems
6. **Mobile App**: Native mobile application
7. **Barcode Scanning**: Scan items for quick order entry

## Technical Notes

- Built with Next.js 14 and TypeScript
- Uses Supabase for database and authentication
- Tailwind CSS for styling
- React Hook Form for form management
- Toast notifications for user feedback
- Responsive design for all screen sizes
