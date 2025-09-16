
-- This file contains all table definitions, constraints, indexes, and RLS policies

-- DOWN

-- Drop All Tables (REMOVE THIS)
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident('public') || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            trigger_name,
            event_object_table AS table_name
        FROM
            information_schema.triggers
        WHERE
            event_object_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', r.trigger_name, r.table_name);
    END LOOP;
END;
$$;

DELETE FROM auth.users;

-- Drop All Triggers (REMOVE THIS)
DROP TRIGGER IF EXISTS sync_user_tenant_mapping ON auth.users;
DROP TRIGGER IF EXISTS sync_user_tenant_mapping ON auth.users;

-- Drop All Functions (REMOVE THIS)
DROP FUNCTION IF EXISTS public.create_user_tenant_mapping();
DROP FUNCTION IF EXISTS public.get_all_categories();
DROP FUNCTION IF EXISTS public.generate_inventory_aging_report();
DROP FUNCTION IF EXISTS update_received_or_fulfilled_date_on_order_status_update_to_received_or_fulfilled();


-- Enable necessary extensions
-- uuid-ossp for UUIDs
DROP EXTENSION IF EXISTS "uuid-ossp";
CREATE EXTENSION "uuid-ossp" SCHEMA public;

------------------------------------------------------------------------------------
-- UP
------------------------------------------------------------------------------------
-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    price_id TEXT,
    current_payment_expiry_date DATE NOT NULL,
    expected_payment_amount DECIMAL(10,2) NOT NULL CHECK (expected_payment_amount >= 0),
    status VARCHAR(255) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
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

-- STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- PURCHASE_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    po_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'received', 'canceled')),
    expected_date DATE NOT NULL,
    received_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(po_number, tenant_id)
);

-- PURCHASE_ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- SALES_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    so_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'fulfilled', 'canceled')),
    expected_date DATE,
    fulfilled_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(so_number, tenant_id)
);

-- SALES_ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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

-- MANUAL_PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.manual_payments (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    reference_number VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------------------------------------------------------------------------------
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
    INSERT INTO public.tenants (name, domain, current_payment_expiry_date, expected_payment_amount) VALUES (NEW.id, NEW.email, NOW(), 9.99)
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

CREATE OR REPLACE FUNCTION public.sync_transactions_with_purchase_orders()
    RETURNS TRIGGER AS $$
    DECLARE
        currentItemQuantity INTEGER;
        orderStatus VARCHAR;
        orderItem RECORD;
    BEGIN
        FOR orderItem IN (
            SELECT * FROM public.purchase_order_items 
            WHERE status = 'active' AND purchase_order_id = NEW.id
        ) LOOP
            -- Fetch Current Inventory Item Quantity
            SELECT quantity INTO currentItemQuantity 
                FROM public.inventory_items WHERE id = orderItem.inventory_item_id;

            INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id) 
                VALUES ('in', orderItem.store_id, orderItem.inventory_item_id, orderItem.quantity, (currentItemQuantity + orderItem.quantity), orderItem.id);
        END LOOP;
        RETURN NEW;
    END;
    $$ language plpgsql SECURITY DEFINER;

-- fetch User's Subscription Info
CREATE OR REPLACE FUNCTION public.fetch_user_subscription_info(
    current_user_id UUID
)
RETURNS TABLE(
    name VARCHAR,
    domain VARCHAR,
    price_id TEXT,
    current_payment_expiry_date DATE,
    expected_payment_amount DECIMAL,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name, 
        t.domain, 
        t.price_id, 
        t.current_payment_expiry_date, 
        t.expected_payment_amount, 
        t.status, 
        t.created_at,
        t.updated_at
    FROM public.tenants t INNER JOIN user_tenant_mappings utm
    ON utm.tenant_id = t.id
    WHERE utm.user_id = current_user_id
    LIMIT 1;
END;
$$;

-- Sync transactions and  purchase_orders tables
CREATE TRIGGER sync_transactions_with_purchase_orders
    AFTER UPDATE OF order_status ON public.purchase_orders
    FOR EACH ROW 
    WHEN (NEW.order_status = 'received')
    EXECUTE FUNCTION public.sync_transactions_with_purchase_orders();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_purchase_orders_to_purchase_order_items()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE public.purchase_order_items SET status = NEW.status WHERE purchase_order_id = NEW.id;
        RETURN NEW;
    END;
    $$ language plpgsql SECURITY DEFINER;

-- Propagate status change in purchase_orders to purchase_order_items
CREATE TRIGGER propagate_status_change_in_purchase_orders_to_purchase_order_items
    AFTER UPDATE OF status ON public.purchase_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.propagate_status_change_in_purchase_orders_to_purchase_order_items();

CREATE OR REPLACE FUNCTION public.sync_transactions_with_sales_orders()
    RETURNS TRIGGER AS $$
    DECLARE
        currentItemQuantity INTEGER;
        orderStatus VARCHAR;
        orderItem RECORD;
    BEGIN
        FOR orderItem IN (
            SELECT * FROM public.sales_order_items 
            WHERE status = 'active' AND sales_order_id = NEW.id
        ) LOOP
            -- Fetch Current Inventory Item Quantity
            SELECT quantity INTO currentItemQuantity FROM public.inventory_items WHERE id = orderItem.inventory_item_id;

            INSERT INTO public.transactions (type, store_id, item_id, quantity, current_item_quantity, reference_id) 
                VALUES ('out', orderItem.store_id, orderItem.inventory_item_id, orderItem.quantity, (currentItemQuantity - orderItem.quantity), orderItem.id);
        END LOOP;
        RETURN NEW;
    END;
    $$ language plpgsql SECURITY DEFINER;

-- Sync transactions and  sales_orders tables
CREATE TRIGGER sync_transactions_with_sales_orders
    AFTER UPDATE OF order_status ON public.sales_orders
    FOR EACH ROW 
    WHEN (NEW.order_status = 'fulfilled')
    EXECUTE FUNCTION public.sync_transactions_with_sales_orders();

CREATE OR REPLACE FUNCTION public.propagate_status_change_in_sales_orders_to_sales_order_items()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE public.sales_order_items SET status = NEW.status WHERE sales_order_id = NEW.id;
        RETURN NEW;
    END;
    $$ language plpgsql SECURITY DEFINER;

-- Propagate status change in sales_orders to sales_order_items
CREATE TRIGGER propagate_status_change_in_sales_orders_to_sales_order_items
    AFTER UPDATE OF status ON public.sales_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.propagate_status_change_in_sales_orders_to_sales_order_items();

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
CREATE INDEX idx_manual_payments_tenant_id ON public.manual_payments(tenant_id);
CREATE INDEX idx_manual_payments_created_at ON public.manual_payments(created_at);
CREATE INDEX idx_manual_payments_updated_at ON public.manual_payments(updated_at);

-- Function to add tenant_id and created_by before saving
CREATE OR REPLACE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record()
    RETURNS TRIGGER AS $$
    DECLARE
        currentTenantId UUID;
    BEGIN
        SELECT tenant_id INTO currentTenantId FROM public.user_tenant_mappings WHERE user_id = auth.uid() LIMIT 1;
        NEW.tenant_id = currentTenantId;
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

-- Triggers to add tenant_id and created_by before saving
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

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_manual_payments
    BEFORE INSERT ON public.manual_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

-- UPDATED_AT and UPDATED_BY TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_and_updated_by_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        NEW.updated_by = auth.uid();
        RETURN NEW;
    END;
    $$ language plpgsql;

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language plpgsql;

-- TRIGGERS FOR UPDATED_AT and UPDATED_BY
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_sales_order_items_updated_at BEFORE UPDATE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_manual_payments_updated_at BEFORE UPDATE ON public.manual_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();


-- Function to update received_date/fulfilled_date on order_status = received/fulfilled update
CREATE OR REPLACE FUNCTION public.update_received_or_fulfilled_date_on_order_status_update_to_received_or_fulfilled()
    RETURNS TRIGGER AS $$
    BEGIN
         -- Only update when order status is 'received' or 'fulfilled'
        IF NEW.order_status = 'received' THEN
            NEW.received_date = NOW();
        ELSIF NEW.order_status = 'fulfilled' THEN
            NEW.fulfilled_date = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ language plpgsql;

-- Update received_date when order_status is set to received
CREATE TRIGGER update_received_date_on_order_status_update_to_received
    BEFORE UPDATE OF order_status ON public.purchase_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_received_or_fulfilled_date_on_order_status_update_to_received_or_fulfilled();

-- Update fulfilled_date when order_status is set to fulfilled
CREATE TRIGGER update_fulfilled_date_on_order_status_update_to_fulfilled
    BEFORE UPDATE OF order_status ON public.sales_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_received_or_fulfilled_date_on_order_status_update_to_received_or_fulfilled();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_mappings ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- TENANTS POLICIES
CREATE POLICY "Tenants are viewable by authenticated users" ON public.tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tenants are insertable by authenticated users" ON public.tenants
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Tenants are updatable by authenticated users" ON public.tenants
    FOR UPDATE USING (auth.role() = 'authenticated');

-- USER_TTENANT_MAPPING POLICIES
CREATE POLICY "user_tenant_mappings are viewable by authenticated users" ON public.user_tenant_mappings
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()
    );

CREATE POLICY "user_tenant_mappings are insertable by authenticated users" ON public.user_tenant_mappings
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()
    );

CREATE POLICY "user_tenant_mappings are updatable by authenticated users" ON public.user_tenant_mappings
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()
    );

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

-- MANUAL_PAYMENTS POLICIES
CREATE POLICY "Users can view their own manual_payments" ON public.manual_payments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert manual_payments in their tenant" ON public.manual_payments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid() AND
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update their own manual_payments" ON public.manual_payments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND created_by = auth.uid()
    );

CREATE POLICY "Admins can update any manual_payments in their tenant" ON public.manual_payments
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

-- Function to sync inventory quantity to transactions
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE public.inventory_items 
        SET quantity = NEW.current_item_quantity
        WHERE id = NEW.item_id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory when transactions are created
CREATE TRIGGER trigger_update_inventory_on_transaction
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_on_transaction();

-- Function to validate inventory quantity before transaction
CREATE OR REPLACE FUNCTION public.validate_inventory_transaction()
    RETURNS TRIGGER AS $$
    DECLARE
        currentQuantity INTEGER;
        inventoryItemName VARCHAR;
    BEGIN
        IF NEW.type = 'out' THEN
            SELECT quantity, name INTO currentQuantity, inventoryItemName 
            FROM public.inventory_items 
            WHERE id = NEW.item_id;
            
            IF currentQuantity < NEW.quantity THEN
                RAISE EXCEPTION 'Insufficient inventory for %. Available: %, Requested: %', inventoryItemName, currentQuantity, NEW.quantity;
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



-- TRANSACTIONS

-- Function to create/update purchase_order and purchase_order_items in single transaction
CREATE OR REPLACE FUNCTION public.purchase_order_transaction(
    purchase_order_data JSONB,
    purchase_order_items_data JSONB,
    is_for_update BOOLEAN DEFAULT FALSE
)
RETURNS VARCHAR AS $$
DECLARE
    poNumber VARCHAR := (purchase_order_data ->> 'po_number')::VARCHAR;
    supplierId UUID := (purchase_order_data ->> 'supplier_id')::UUID;
    expectedDate DATE := (purchase_order_data ->> 'expected_date')::DATE;
    orderId UUID;
    orderStatus VARCHAR;
BEGIN
    -- 2. Handle purchase_orders: insert/update
    IF is_for_update THEN
        orderId = (purchase_order_data ->> 'id')::UUID;

        -- Do not update 'received' orders
        SELECT order_status INTO orderStatus 
            FROM public.purchase_orders WHERE id = orderId;
        IF orderStatus = 'received' THEN
            RETURN 'Can not update received orders';
        END IF;

        UPDATE public.purchase_orders
        SET
            po_number = poNumber,
            supplier_id = supplierId,
            expected_date = expectedDate
        WHERE id = orderId;
    ELSE
        INSERT INTO public.purchase_orders (po_number, supplier_id, expected_date)
        VALUES (poNumber, supplierId, expectedDate) 
        RETURNING id INTO orderId;
    END IF;

    -- 2. Handle purchase_order_items: deletes/updates/inserts.
    IF is_for_update THEN
        -- Delete items that are in the database but not in the new purchase_order_items_data
        DELETE FROM public.purchase_order_items
        WHERE purchase_order_id = orderId
            AND NOT (
                id IN (
                    SELECT COALESCE((value ->> 'id')::UUID, '00000000-0000-0000-0000-000000000000') 
                    FROM jsonb_array_elements(purchase_order_items_data)
                )
            );
    END IF;
    -- Loop through the `purchase_order_items_data` array provided in the request.
    FOR i IN 0..jsonb_array_length(purchase_order_items_data) - 1 LOOP
        DECLARE
            itemObj JSONB := purchase_order_items_data -> i;
            storeId UUID := (itemObj ->> 'store_id')::UUID;
            inventoryItemId UUID := (itemObj ->> 'inventory_item_id')::UUID;
            itemQuantity INTEGER := (itemObj ->> 'quantity')::INTEGER;
            unitPrice DECIMAL := (itemObj ->> 'unit_price')::DECIMAL;
            itemId UUID := (itemObj ->> 'id')::UUID;
        BEGIN
            -- 3. Check if the item already exists by its ID.
            -- If it exists, perform an update.
            IF is_for_update AND (SELECT EXISTS (SELECT 1 FROM public.purchase_order_items WHERE id = itemId)) THEN
                UPDATE public.purchase_order_items
                SET
                    store_id = storeId,
                    inventory_item_id = inventoryItemId,
                    quantity = itemQuantity,
                    unit_price = unitPrice
                WHERE id = itemId;
            ELSE
                -- 4. If the item does not exist, insert it as a new record.
                INSERT INTO public.purchase_order_items (purchase_order_id, store_id, inventory_item_id, quantity, unit_price)
                VALUES (orderId, storeId, inventoryItemId, itemQuantity, unitPrice);
            END IF;
        END;
    END LOOP;

    RETURN 'Update successful.';
END;
$$ LANGUAGE plpgsql;

-- Function to create/update sales_order and sales_order_items in single transaction
CREATE OR REPLACE FUNCTION public.sales_order_transaction(
    sales_order_data JSONB,
    sales_order_items_data JSONB,
    is_for_update BOOLEAN DEFAULT FALSE
)
RETURNS VARCHAR AS $$
DECLARE
    soNumber VARCHAR := (sales_order_data ->> 'so_number')::VARCHAR;
    customerId UUID := (sales_order_data ->> 'customer_id')::UUID;
    expectedDate DATE := (sales_order_data ->> 'expected_date')::DATE;
    orderId UUID;
    orderStatus VARCHAR;
BEGIN
    -- 2. Handle sales_orders: insert/update
    IF is_for_update THEN
        orderId = (sales_order_data ->> 'id')::UUID;
        -- Do not update 'fulfilled' orders
        SELECT order_status INTO orderStatus 
            FROM public.sales_orders WHERE id = orderId;
        IF orderStatus = 'fulfilled' THEN
            RETURN 'Can not update fulfilled orders';
        END IF;

        UPDATE public.sales_orders
        SET
            so_number = soNumber,
            customer_id = customerId,
            expected_date = expectedDate
        WHERE id = orderId;
    ELSE
        INSERT INTO public.sales_orders (so_number, customer_id, expected_date)
        VALUES (soNumber, customerId, expectedDate) 
        RETURNING id INTO orderId;
    END IF;

    -- 2. Handle sales_order_items: deletes/updates/inserts.
    IF is_for_update THEN
        -- Delete items that are in the database but not in the new sales_order_items_data.
        DELETE FROM public.sales_order_items
        WHERE sales_order_id = orderId
            AND NOT (
                id IN (
                    SELECT COALESCE((value ->> 'id')::UUID, '00000000-0000-0000-0000-000000000000') 
                    FROM jsonb_array_elements(sales_order_items_data)
                )
            );
    END IF;
    -- Loop through the `sales_order_items_data` array provided in the request.
    FOR i IN 0..jsonb_array_length(sales_order_items_data) - 1 LOOP
        DECLARE
            itemObj JSONB := sales_order_items_data -> i;
            storeId UUID := (itemObj ->> 'store_id')::UUID;
            inventoryItemId UUID := (itemObj ->> 'inventory_item_id')::UUID;
            itemQuantity INTEGER := (itemObj ->> 'quantity')::INTEGER;
            unitPrice DECIMAL := (itemObj ->> 'unit_price')::DECIMAL;
            itemId UUID := (itemObj ->> 'id')::UUID;
        BEGIN
            -- 3. Check if the item already exists by its ID.
            -- If it exists, perform an update.
            IF is_for_update AND (SELECT EXISTS (SELECT 1 FROM public.sales_order_items WHERE id = itemId)) THEN
                UPDATE public.sales_order_items
                SET
                    store_id = storeId,
                    inventory_item_id = inventoryItemId,
                    quantity = itemQuantity,
                    unit_price = unitPrice
                WHERE id = itemId;
            ELSE
                -- 4. If the item does not exist, insert it as a new record.
                INSERT INTO public.sales_order_items (sales_order_id, store_id, inventory_item_id, quantity, unit_price)
                VALUES (orderId, storeId, inventoryItemId, itemQuantity, unitPrice);
            END IF;
        END;
    END LOOP;

    RETURN 'Update successful.';
END;
$$ LANGUAGE plpgsql;


-- REPORTS

-- Inventory Turnover Report
CREATE OR REPLACE FUNCTION public.generate_inventory_turnover_report(
        records_per_page INTEGER,
        selected_item_id UUID DEFAULT NULL, 
        fulfilled_date_start TIMESTAMP DEFAULT NULL,
        fulfilled_date_end TIMESTAMP DEFAULT NULL
    )
    RETURNS TABLE(
        item_id UUID, 
        item_name VARCHAR, 
        sold_quantity BIGINT
    ) AS $$
    BEGIN
        RETURN QUERY 
        
            SELECT 
                item.id, 
                item.name,
                sales_order_item.sold_quantity
            FROM (
                SELECT id, name FROM public.inventory_items 
                WHERE status = 'active' AND (selected_item_id IS NULL OR id = selected_item_id)
            ) AS item
            INNER JOIN (
                SELECT inventory_item_id, COALESCE(SUM(quantity), 0) as sold_quantity 
                FROM public.sales_order_items
                WHERE sales_order_id IN (
                    SELECT id FROM public.sales_orders 
                        WHERE status = 'active' AND order_status = 'fulfilled' 
                        AND (fulfilled_date_start IS NULL OR fulfilled_date >= fulfilled_date_start)
                        AND (fulfilled_date_end IS NULL OR fulfilled_date <= fulfilled_date_end)
                )
                GROUP BY inventory_item_id
            ) sales_order_item 
            ON sales_order_item.inventory_item_id = item.id
            ORDER BY sales_order_item.sold_quantity DESC
            LIMIT records_per_page;
    END;
    $$ LANGUAGE plpgsql;

-- Inventory Aging Report

CREATE OR REPLACE FUNCTION public.isItemProcessed(
        processed_items JSONB[],
        target_item UUID
    )
    RETURNS BOOLEAN AS $$
    DECLARE
        processed BOOLEAN := FALSE;
    BEGIN
        SELECT TRUE INTO processed
        FROM (SELECT unnest(processed_items)) AS elem(item) WHERE elem.item @> jsonb_build_object(
    'item_id', target_item) LIMIT 1;

        RETURN processed;
    END;
    $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sortByDaysInStock(
        jsonb_array JSONB[]
    )
    RETURNS JSONB[] AS $$
    DECLARE
        sorted_array JSONB[];
    BEGIN
        SELECT array_agg(elements ORDER BY (elements->>'days_in_stock') DESC)
        INTO sorted_array
        FROM unnest(jsonb_array) AS elements;

        RETURN sorted_array;
    END;
    $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_inventory_aging_report(
    records_per_page INTEGER,
    selected_item_id UUID DEFAULT NULL, 
    selected_order_number VARCHAR DEFAULT NULL, 
    received_date_start TIMESTAMP DEFAULT NULL,
    received_date_end TIMESTAMP DEFAULT NULL
)
RETURNS JSONB[] AS $$
DECLARE
agedQuantity INTEGER := 0;
item RECORD;
purchaseOrder RECORD;
result JSONB[];
count INTEGER := 0;
BEGIN
    FOR item IN (
        SELECT 
            i.id, 
            i.name, 
            i.quantity, 
            po.received_date, 
            po.po_number, 
            EXTRACT(DAY FROM AGE(CURRENT_DATE, po.received_date))::integer as days_in_stock 
        FROM public.inventory_items i INNER JOIN public.purchase_order_items poi ON i.id = poi.inventory_item_id
         INNER JOIN public.purchase_orders po ON po.id = poi.purchase_order_id
        WHERE 
            i.status = 'active'
            AND po.status = 'active'
            AND poi.status = 'active'
            AND i.quantity > 0  
            AND (selected_item_id IS NULL OR i.id = selected_item_id)
            AND (selected_order_number IS NULL OR po.po_number ILIKE ('%' || selected_order_number || '%'))
            AND (received_date_start IS NULL OR po.received_date >= received_date_start)
            AND (received_date_end IS NULL OR po.received_date <= received_date_end)
        GROUP BY i.id, i.name, i.quantity, po.received_date, po.po_number, days_in_stock
        ORDER BY days_in_stock DESC
        LIMIT records_per_page
    ) LOOP
      -- SKIP processed items 
      IF public.isItemProcessed(result, item.id) THEN
        CONTINUE;
      END IF;
      
      agedQuantity = item.quantity;
      FOR purchaseOrder IN (
        SELECT 
            po.id as id, 
            po.po_number as po_number, 
            po.received_date as received_date, 
            poi.quantity as quantity, 
            EXTRACT(DAY FROM AGE(CURRENT_DATE, po.received_date))::integer as days_in_stock 
        FROM public.purchase_orders po INNER JOIN public.purchase_order_items poi 
        ON po.id = poi.purchase_order_id
        WHERE poi.inventory_item_id = item.id AND po.order_status = 'received' 
        ORDER BY po.received_date DESC
      ) LOOP
      count = count + 1;
      IF agedQuantity - purchaseOrder.quantity > 0 THEN
        agedQuantity = agedQuantity - purchaseOrder.quantity;
        result := array_append(result, jsonb_build_object('count', count, 'item_id', item.id, 'item_name', item.name, 'item_quantity', purchaseOrder.quantity, 'order_id', purchaseOrder.id, 'order_number', purchaseOrder.po_number, 'order_received_date', purchaseOrder.received_date, 'days_in_stock', purchaseOrder.days_in_stock));
      ELSE
        result := array_append(result, jsonb_build_object('count', count, 'item_id', item.id, 'item_name', item.name, 'item_quantity', agedQuantity, 'order_id', purchaseOrder.id, 'order_number', purchaseOrder.po_number, 'order_received_date', purchaseOrder.received_date, 'days_in_stock', purchaseOrder.days_in_stock));
        EXIT; -- Break the loop since no aged quantity remaining 
      END IF;

      END LOOP;
    END LOOP;    
    -- COALESCE to convert NULL/empty response to [] when no records found
    RETURN COALESCE(public.sortByDaysInStock(result), '{}'::JSONB[]);
END;
$$ LANGUAGE plpgsql;


-- Unreceived(Pending/Canceled) Orders Report
CREATE OR REPLACE FUNCTION public.generate_unreceived_purchase_orders_report(
        target_order_status VARCHAR,
        records_per_page INTEGER,
        selected_item_id UUID DEFAULT NULL, 
        expected_date_start TIMESTAMP DEFAULT NULL,
        expected_date_end TIMESTAMP DEFAULT NULL
    )
    RETURNS TABLE(
        item_id UUID, 
        item_name VARCHAR, 
        total_ordered_quantity BIGINT,
        order_status VARCHAR
    ) AS $$
    BEGIN
        RETURN QUERY 
        
            SELECT 
                item.id as item_id, 
                item.name,
                purchase_order_data.total_ordered_quantity,
                purchase_order_data.order_status
            FROM (
                SELECT id, name FROM public.inventory_items 
                WHERE status = 'active' AND (selected_item_id IS NULL OR id = selected_item_id)
            ) AS item
            INNER JOIN (
                SELECT inventory_item_id, COALESCE(SUM(quantity), 0) as total_ordered_quantity, po.order_status
                FROM public.purchase_orders po
                INNER JOIN public.purchase_order_items poi
                ON poi.purchase_order_id = po.id
                WHERE po.status = 'active' 
                    AND poi.status = 'active' 
                    AND po.order_status = target_order_status
                    AND (expected_date_start IS NULL OR po.expected_date >= expected_date_start)
                    AND (expected_date_end IS NULL OR po.expected_date <= expected_date_end)
                GROUP BY poi.inventory_item_id, po.order_status
            ) purchase_order_data 
            ON purchase_order_data.inventory_item_id = item.id
            ORDER BY purchase_order_data.total_ordered_quantity DESC
            LIMIT records_per_page;
    END;
    $$ LANGUAGE plpgsql;

-- Unfulfilled(Pending/Canceled) Orders Report
CREATE OR REPLACE FUNCTION public.generate_unfulfilled_sales_orders_report(
        target_order_status VARCHAR,
        records_per_page INTEGER,
        selected_item_id UUID DEFAULT NULL, 
        expected_date_start TIMESTAMP DEFAULT NULL,
        expected_date_end TIMESTAMP DEFAULT NULL
    )
    RETURNS TABLE(
        item_id UUID, 
        item_name VARCHAR, 
        total_ordered_quantity BIGINT,
        order_status VARCHAR
    ) AS $$
    BEGIN
        RETURN QUERY 
        
            SELECT 
                item.id as item_id, 
                item.name,
                sales_order_data.total_ordered_quantity,
                sales_order_data.order_status
            FROM (
                SELECT id, name FROM public.inventory_items 
                WHERE status = 'active' AND (selected_item_id IS NULL OR id = selected_item_id)
            ) AS item
            INNER JOIN (
                SELECT inventory_item_id, COALESCE(SUM(quantity), 0) as total_ordered_quantity, so.order_status
                FROM public.sales_orders so
                INNER JOIN public.sales_order_items soi
                ON soi.sales_order_id = so.id
                WHERE so.status = 'active' 
                    AND soi.status = 'active' 
                    AND so.order_status = target_order_status
                    AND (expected_date_start IS NULL OR so.expected_date >= expected_date_start)
                    AND (expected_date_end IS NULL OR so.expected_date <= expected_date_end)
                GROUP BY soi.inventory_item_id, so.order_status
            ) sales_order_data 
            ON sales_order_data.inventory_item_id = item.id
            ORDER BY sales_order_data.total_ordered_quantity DESC
            LIMIT records_per_page;
    END;
    $$ LANGUAGE plpgsql;



-- Dashboard Stats
CREATE OR REPLACE FUNCTION public.build_dashboard_stats()
    RETURNS JSONB AS $$
    DECLARE
        totalItems INTEGER; 
        lowStockItems INTEGER; 
        pendingPurchaseOrders INTEGER;
        receivedPurchaseOrders INTEGER;
        pendingSalesOrders INTEGER;
        fulfilledSalesOrders INTEGER;
        result JSONB;
    BEGIN
        SELECT count(*) INTO totalItems FROM public.inventory_items
        WHERE status = 'active';

        SELECT count(*) INTO lowStockItems FROM public.inventory_items
        WHERE status = 'active' 
        AND quantity <= min_quantity;

        SELECT count(*) INTO pendingPurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.order_status = 'pending';
            
        SELECT count(*) INTO receivedPurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.order_status = 'received';

        SELECT count(*) INTO pendingSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND so.order_status = 'pending';

        SELECT count(*) INTO fulfilledSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND so.order_status = 'fulfilled';
        
        result = jsonb_build_object(
                    'totalItems', totalItems, 
                    'lowStockItems', lowStockItems, 
                    'pendingPurchaseOrders', pendingPurchaseOrders, 
                    'receivedPurchaseOrders', receivedPurchaseOrders, 
                    'pendingSalesOrders', pendingSalesOrders, 
                    'fulfilledSalesOrders', fulfilledSalesOrders
                );

        RETURN result;
    END;
    $$ LANGUAGE plpgsql;


-- Purchase Order monthly trends
CREATE OR REPLACE FUNCTION public.purchase_order_monthly_trends()
RETURNS TABLE(
    month_name TEXT,
    ordered_quantity BIGINT,
    canceled_quantity BIGINT,
    received_quantity BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(DATE_TRUNC('month', po.created_at), 'YYYY-MM') AS month_name,
        COALESCE(SUM(poi.quantity), 0) AS ordered_quantity,
        COALESCE(SUM(poi.quantity) FILTER (WHERE po.order_status = 'canceled'), 0) AS canceled_quantity,
        COALESCE(SUM(poi.quantity) FILTER (WHERE po.order_status = 'received'), 0) AS received_quantity
    FROM public.purchase_orders po
        INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
    GROUP BY
        month_name
    ORDER BY
        month_name;
END;
$$;


-- Sales Order monthly trends
CREATE OR REPLACE FUNCTION public.sales_order_monthly_trends()
RETURNS TABLE(
    month_name TEXT,
    ordered_quantity BIGINT,
    canceled_quantity BIGINT,
    fulfilled_quantity BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(DATE_TRUNC('month', po.created_at), 'YYYY-MM') AS month_name,
        COALESCE(SUM(poi.quantity), 0) AS ordered_quantity,
        COALESCE(SUM(poi.quantity) FILTER (WHERE po.order_status = 'canceled'), 0) AS canceled_quantity,
        COALESCE(SUM(poi.quantity) FILTER (WHERE po.order_status = 'fulfilled'), 0) AS fulfilled_quantity
    FROM public.sales_orders po
        INNER JOIN public.sales_order_items poi
            ON poi.sales_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
    GROUP BY
        month_name
    ORDER BY
        month_name;
END;
$$;
