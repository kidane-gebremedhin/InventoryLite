
-- This file contains all table definitions, constraints, indexes, and RLS policies

-- Enable necessary extensions
-- uuid-ossp for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a separate table to store tenant mappings that is exempt from RLS check to avoid recursive checks
CREATE TABLE IF NOT EXISTS public.user_tenant_mappings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- INVENTORY_ITEMS TABLE (Updated to match application model)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id),
    UNIQUE(sku, tenant_id)
);

-- 7. PURCHASE_ORDERS TABLE (Updated to match application model)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'received', 'cancelled')),
    expected_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(po_number, tenant_id)
);

-- 8. SALES_ORDERS TABLE (Updated to match application model)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    so_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'fulfilled', 'cancelled')),
    expected_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(so_number, tenant_id)
);

-- PURCHASE_ORDER_ITEMS TABLE (New table for order items)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SALES_ORDER_ITEMS TABLE (New table for order items)
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    current_item_quantity INTEGER NOT NULL CHECK (current_item_quantity >= 0),
    reference_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'general')),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    admin_response TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper function to get user's tenant without RLS recursion
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID STABLE AS $$
    SELECT tenant_id 
    FROM public.user_tenant_mappings 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Trigger to automatically populate user_tenant_mappings when new users are created
CREATE OR REPLACE FUNCTION public.create_user_tenant_mapping()
RETURNS TRIGGER AS $$
DECLARE
    newTenantId UUID;
BEGIN
    -- Create tenant record first
    INSERT INTO public.tenants (name, domain) VALUES (NEW.id, NEW.email)
    RETURNING id INTO newTenantId;
    -- Create user-ternant mapping
    INSERT INTO public.user_tenant_mappings (user_id, tenant_id) VALUES (NEW.id, newTenantId);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Create a record in tenants and user_tenant_mappings table for new users
CREATE TRIGGER sync_user_tenant_mapping
AFTER INSERT ON auth.users
FOR EACH ROW 
EXECUTE FUNCTION public.create_user_tenant_mapping();

-- Create a record in transactions table for each insertion in purchase_order_items table
-- NB(TECH_DEBT): This happens on creating new purchase orders
-- since we delete and create the purchase_order_items (ATM not handling single order item update)
-- we need to carefully create ON UPDATE trigger to handle such a case
CREATE OR REPLACE FUNCTION public.sync_transactions_with_purchase_order_items()
RETURNS TRIGGER AS $$
DECLARE
    currentItemQuantity INTEGER;
BEGIN
    -- Fetch Current Inventory Item Quantity
    SELECT quantity INTO currentItemQuantity 
        FROM public.inventory_items WHERE id = NEW.inventory_item_id;

    INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id) 
        VALUES ('in', NEW.store_id, NEW.inventory_item_id, NEW.quantity, (currentItemQuantity + NEW.quantity), NEW.id);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Sync transactions and  purchase_order_items tables
CREATE TRIGGER sync_transactions_with_purchase_order_items
AFTER INSERT ON public.purchase_order_items
FOR EACH ROW 
EXECUTE FUNCTION public.sync_transactions_with_purchase_order_items();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_purchase_orders_to_purchase_order_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Used for status update only, see TECH_DEBT
    UPDATE public.purchase_order_items SET status = NEW.status WHERE purchase_order_id = NEW.id;
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Propagate status change in purchase_orders to purchase_order_items
CREATE TRIGGER propagate_status_change_in_purchase_orders_to_purchase_order_items
AFTER UPDATE ON public.purchase_orders
FOR EACH ROW 
EXECUTE FUNCTION public.propagate_status_change_in_purchase_orders_to_purchase_order_items();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_purchase_order_items_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
    direction VARCHAR;
    currentItemQuantity INTEGER;
BEGIN
    -- Fetch Current Inventory Item Quantity
    SELECT quantity INTO currentItemQuantity 
    FROM public.inventory_items WHERE id = NEW.inventory_item_id;

    IF NEW.status = 'active' THEN 
        direction = 'in';
        currentItemQuantity = currentItemQuantity + NEW.quantity;
    ELSE 
        direction = 'out';
        currentItemQuantity = currentItemQuantity - NEW.quantity;
    END IF;

    -- Record OUT transaction on record archiving and IN on restoring 
    INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id)
        VALUES (direction, NEW.store_id, NEW.inventory_item_id, NEW.quantity, currentItemQuantity, NEW.id);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Propagate status change in purchase_order_items to transactions
CREATE TRIGGER propagate_status_change_in_purchase_order_items_to_transactions
AFTER UPDATE ON public.purchase_order_items
FOR EACH ROW 
EXECUTE FUNCTION public.propagate_status_change_in_purchase_order_items_to_transactions();

-- Create a record in transactions table for each insertion in sales_order_items table
-- NB(TECH_DEBT): This happens on creating new sales orders
-- since we delete and create the sales_order_items (ATM not handling single order item update)
-- we need to carefully create ON UPDATE trigger to handle such a case
CREATE OR REPLACE FUNCTION public.sync_transactions_with_sales_order_items()
RETURNS TRIGGER AS $$
DECLARE
    currentItemQuantity INTEGER;
BEGIN
    -- Fetch Current Inventory Item Quantity
    SELECT quantity INTO currentItemQuantity 
    FROM public.inventory_items WHERE id = NEW.inventory_item_id;

    INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id) 
        VALUES ('out', NEW.store_id, NEW.inventory_item_id, NEW.quantity, (currentItemQuantity - NEW.quantity), NEW.id);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Sync transactions and  sales_order_items tables
CREATE TRIGGER sync_transactions_with_sales_order_items
AFTER INSERT ON public.sales_order_items
FOR EACH ROW 
EXECUTE FUNCTION public.sync_transactions_with_sales_order_items();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_sales_orders_to_sales_order_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Used for status update only, see TECH_DEBT
    UPDATE public.sales_order_items SET status = NEW.status WHERE sales_order_id = NEW.id;
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Propagate status change in sales_orders to sales_order_items
CREATE TRIGGER propagate_status_change_in_sales_orders_to_sales_order_items
AFTER UPDATE ON public.sales_orders
FOR EACH ROW 
EXECUTE FUNCTION public.propagate_status_change_in_sales_orders_to_sales_order_items();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_sales_order_items_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
    direction VARCHAR;
    currentItemQuantity INTEGER;
BEGIN
    -- Fetch Current Inventory Item Quantity
    SELECT quantity INTO currentItemQuantity 
    FROM public.inventory_items WHERE id = NEW.inventory_item_id;

    IF NEW.status = 'active' THEN 
        direction = 'out';
        currentItemQuantity = currentItemQuantity - NEW.quantity;
    ELSE 
        direction = 'in';
        currentItemQuantity = currentItemQuantity + NEW.quantity;
    END IF;

    -- Record IN transaction on record archiving and OUT on restoring 
    INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id)
        VALUES (direction, NEW.store_id, NEW.inventory_item_id, NEW.quantity, currentItemQuantity, NEW.id);
    RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Propagate status change in sales_order_items to transactions
CREATE TRIGGER propagate_status_change_in_sales_order_items_to_transactions
AFTER UPDATE ON public.sales_order_items
FOR EACH ROW 
EXECUTE FUNCTION public.propagate_status_change_in_sales_order_items_to_transactions();


-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX idx_stores_tenant_id ON public.stores(tenant_id);
CREATE INDEX idx_suppliers_tenant_id ON public.suppliers(tenant_id);
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_inventory_items_tenant_id ON public.inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_items_category_id ON public.inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_sales_orders_tenant_id ON public.sales_orders(tenant_id);
CREATE INDEX idx_sales_orders_customer_id ON public.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_inventory_item_id ON public.purchase_order_items(inventory_item_id);
CREATE INDEX idx_sales_order_items_sales_order_id ON public.sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_inventory_item_id ON public.sales_order_items(inventory_item_id);
CREATE INDEX idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX idx_transactions_reference_id ON public.transactions(reference_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_feedback_tenant_id ON public.feedback(tenant_id);
CREATE INDEX idx_feedback_created_by ON public.feedback(created_by);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_category ON public.feedback(category);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables except user_tenant_mappings
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- TENANTS POLICIES
CREATE POLICY "Tenants are viewable by authenticated users" ON public.tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tenants are insertable by authenticated users" ON public.tenants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Tenants are updatable by authenticated users" ON public.tenants
    FOR UPDATE USING (auth.role() = 'authenticated');

-- CATEGORIES POLICIES
CREATE POLICY "Users can view categories in their tenant" ON public.categories
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert categories in their tenant" ON public.categories
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update categories in their tenant" ON public.categories
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete categories in their tenant" ON public.categories
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- STORES POLICIES
CREATE POLICY "Users can view stores in their tenant" ON public.stores
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert stores in their tenant" ON public.stores
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update stores in their tenant" ON public.stores
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete stores in their tenant" ON public.stores
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- SUPPLIERS POLICIES
CREATE POLICY "Users can view suppliers in their tenant" ON public.suppliers
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert suppliers in their tenant" ON public.suppliers
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update suppliers in their tenant" ON public.suppliers
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete suppliers in their tenant" ON public.suppliers
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- CUSTOMERS POLICIES
CREATE POLICY "Users can view customers in their tenant" ON public.customers
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert customers in their tenant" ON public.customers
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update customers in their tenant" ON public.customers
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete customers in their tenant" ON public.customers
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- INVENTORY_ITEMS POLICIES
CREATE POLICY "Users can view inventory items in their tenant" ON public.inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert inventory items in their tenant" ON public.inventory_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update inventory items in their tenant" ON public.inventory_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete inventory items in their tenant" ON public.inventory_items
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- PURCHASE_ORDERS POLICIES
CREATE POLICY "Users can view purchase orders in their tenant" ON public.purchase_orders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert purchase orders in their tenant" ON public.purchase_orders
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update purchase orders in their tenant" ON public.purchase_orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete purchase orders in their tenant" ON public.purchase_orders
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- SALES_ORDERS POLICIES
CREATE POLICY "Users can view sales orders in their tenant" ON public.sales_orders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert sales orders in their tenant" ON public.sales_orders
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update sales orders in their tenant" ON public.sales_orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete sales orders in their tenant" ON public.sales_orders
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- PURCHASE_ORDER_ITEMS POLICIES
CREATE POLICY "Users can view purchase order items in their tenant" ON public.purchase_order_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert purchase order items in their tenant" ON public.purchase_order_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update purchase order items in their tenant" ON public.purchase_order_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete purchase order items in their tenant" ON public.purchase_order_items
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- SALES_ORDER_ITEMS POLICIES
CREATE POLICY "Users can view sales order items in their tenant" ON public.sales_order_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert sales order items in their tenant" ON public.sales_order_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update sales order items in their tenant" ON public.sales_order_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete sales order items in their tenant" ON public.sales_order_items
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- TRANSACTIONS POLICIES
CREATE POLICY "Users can view transactions in their tenant" ON public.transactions
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert transactions in their tenant" ON public.transactions
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update transactions in their tenant" ON public.transactions
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete transactions in their tenant" ON public.transactions
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- FEEDBACK POLICIES
CREATE POLICY "Users can view their own feedback" ON public.feedback
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert feedback in their tenant" ON public.feedback
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid() AND
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update their own feedback" ON public.feedback
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid()
    );

CREATE POLICY "Admins can update any feedback in their tenant" ON public.feedback
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM public.user_tenant_mappings 
            WHERE user_id = auth.uid() 
            AND role IN ('admin')
        )
    );

-- FUNCTIONS FOR AUTOMATIC INVENTORY UPDATES

-- Function to update inventory quantity when transactions are created
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'in' THEN
        UPDATE public.inventory_items 
        SET quantity = quantity + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'out' THEN
        UPDATE public.inventory_items 
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory when transactions are created
CREATE TRIGGER trigger_update_inventory_on_transaction
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_on_transaction();

-- Function to validate inventory quantity before transaction
CREATE OR REPLACE FUNCTION public.validate_inventory_transaction()
RETURNS TRIGGER AS $$
DECLARE
    currentQuantity INTEGER;
BEGIN
    IF NEW.type = 'out' THEN
        SELECT quantity INTO currentQuantity 
        FROM public.inventory_items 
        WHERE id = NEW.item_id;
        
        IF currentQuantity < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', currentQuantity, NEW.quantity;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate inventory before transaction
CREATE TRIGGER trigger_validate_inventory_transaction
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_inventory_transaction();

-- Function to add tenant_id and created_by info to inventory before saving
CREATE OR REPLACE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record()
RETURNS TRIGGER AS $$
DECLARE
    currentTenantId UUID;
    currentUserId UUID;
BEGIN
    SELECT tenant_id, user_id INTO currentTenantId, currentUserId FROM public.user_tenant_mappings WHERE user_id = auth.uid() LIMIT 1;
    NEW.tenant_id = currentTenantId;
    NEW.created_by = currentUserId;
    NEW.updated_by = currentUserId;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add tenant_id and created_by before saving
CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_category
    BEFORE INSERT ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_store
    BEFORE INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_inventory
    BEFORE INSERT ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_customer
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_supplier
    BEFORE INSERT ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_purchase_order
    BEFORE INSERT ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_purchase_order_item
    BEFORE INSERT ON public.purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_sales_order
    BEFORE INSERT ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_sales_order_item
    BEFORE INSERT ON public.sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_transactions
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_feedback
    BEFORE INSERT ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();


-- Function to add tenant_id and created_by info to inventory before saving
CREATE OR REPLACE FUNCTION public.modify_updated_at_before_updating_a_record()
RETURNS TRIGGER AS $$
DECLARE
    currentTenantId UUID;
    currentUserId UUID;
BEGIN
    SELECT tenant_id, user_id INTO currentTenantId, currentUserId FROM public.user_tenant_mappings 
    WHERE user_id = auth.uid() LIMIT 1;
    NEW.tenant_id = currentTenantId;
    NEW.created_by = currentUserId;
    NEW.updated_by = currentUserId;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_by before saving
CREATE TRIGGER trigger_modify_updated_at_before_updating_category
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_store
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_inventory
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_customer
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_supplier
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_purchase_order
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_purchase_order_item
    BEFORE UPDATE ON public.purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_sales_order
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_sales_order_item
    BEFORE UPDATE ON public.sales_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();

CREATE TRIGGER trigger_modify_updated_at_before_updating_feedback
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.modify_updated_at_before_updating_a_record();
