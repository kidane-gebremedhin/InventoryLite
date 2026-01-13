-- Enable necessary extensions
-- uuid-ossp for UUIDs
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pg_cron" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA public;

------------------------------------------------------------------------------------
-- UP
------------------------------------------------------------------------------------
-- FIXED OPTIONS(ENUMS)
DROP TYPE IF EXISTS USER_ROLE CASCADE;
DROP TYPE IF EXISTS RECORD_STATUS CASCADE;
DROP TYPE IF EXISTS PAYMENT_METHOD CASCADE;
DROP TYPE IF EXISTS CURRENCY_TYPE CASCADE;
DROP TYPE IF EXISTS SUBSCRIPTION_STATUS CASCADE;
DROP TYPE IF EXISTS BILLING_CYCLE CASCADE;
DROP TYPE IF EXISTS SUBSCRIPTION_TIER CASCADE;
DROP TYPE IF EXISTS TRANSACTION_DIRECTION CASCADE;
DROP TYPE IF EXISTS FEEDBACK_CATEGORY CASCADE;
DROP TYPE IF EXISTS FEEDBACK_STATUS CASCADE;
DROP TYPE IF EXISTS FEEDBACK_PRIORITY CASCADE;
DROP TYPE IF EXISTS MANUAL_PAYMENT_STATUS CASCADE;
DROP TYPE IF EXISTS PURCHASE_ORDER_STATUS CASCADE;
DROP TYPE IF EXISTS SALES_ORDER_STATUS CASCADE;
DROP TYPE IF EXISTS COMMISSION_TYPE CASCADE;
--
CREATE TYPE USER_ROLE AS ENUM('USER', 'TENANT_ADMIN', 'SUPER_ADMIN');
CREATE TYPE RECORD_STATUS AS ENUM('active', 'archived');
CREATE TYPE PAYMENT_METHOD AS ENUM('bank_transfer', 'payment_gateway');
CREATE TYPE CURRENCY_TYPE AS ENUM('ETB', 'USD');
CREATE TYPE SUBSCRIPTION_STATUS AS ENUM('free_trial', 'subscribed', 'unsubscribed', 'expired', 'terminated');
CREATE TYPE BILLING_CYCLE AS ENUM('monthly', 'yearly');
CREATE TYPE SUBSCRIPTION_TIER AS ENUM('standard');
CREATE TYPE PURCHASE_ORDER_STATUS AS ENUM('pending', 'received', 'canceled');
CREATE TYPE SALES_ORDER_STATUS AS ENUM('pending', 'fulfilled', 'canceled');
CREATE TYPE TRANSACTION_DIRECTION AS ENUM('in', 'out');
CREATE TYPE FEEDBACK_CATEGORY AS ENUM('bug', 'feature', 'improvement', 'general');
CREATE TYPE FEEDBACK_STATUS AS ENUM('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE FEEDBACK_PRIORITY AS ENUM('low', 'medium', 'high', 'urgent');
CREATE TYPE MANUAL_PAYMENT_STATUS AS ENUM('pending', 'approved', 'declined');
CREATE TYPE INVITATION_STATUS AS ENUM('open', 'accepted', 'expired');
CREATE TYPE COMMISSION_TYPE AS ENUM('percentage', 'fixed');

-- DOMAINS TABLE
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, status)
);

-- AFFILIATE_PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_partners (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    commission_type COMMISSION_TYPE NOT NULL,
    commission_value DECIMAL(10,2) NOT NULL,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, status)
);

-- Create a separate table to store tenant mappings that is exempt from RLS check to avoid recursive checks
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    billing_cycle BILLING_CYCLE NOT NULL DEFAULT 'monthly',
    subscription_tier SUBSCRIPTION_TIER NOT NULL DEFAULT 'standard',
    currency_type CURRENCY_TYPE NOT NULL DEFAULT 'USD',
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(billing_cycle, subscription_tier, currency_type, status)
);

-- TENANTS TABLE
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    price_id TEXT,
    payment_method PAYMENT_METHOD NOT NULL DEFAULT 'payment_gateway',
    current_payment_expiry_date TIMESTAMP NOT NULL,
    subscription_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    subscription_status SUBSCRIPTION_STATUS NOT NULL DEFAULT 'free_trial',
    profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    affiliate_partner_id UUID REFERENCES public.affiliate_partners(id) ON DELETE NO ACTION,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, status),
    UNIQUE(email, status)
);

-- Create a separate table to store tenant mappings that is exempt from RLS check to avoid recursive checks
CREATE TABLE IF NOT EXISTS public.user_tenant_mappings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE NO ACTION,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role USER_ROLE NOT NULL DEFAULT 'USER',
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a separate table to tenant user invites that is exempt from RLS check to avoid recursive checks
CREATE TABLE IF NOT EXISTS public.tenant_user_invites (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    status INVITATION_STATUS NOT NULL DEFAULT 'open',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, tenant_id, status)
);

-- STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status)
);

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status)
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
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status),
    UNIQUE(sku, tenant_id, status)
);

-- VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.variants (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status)
);

-- VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_item_variants (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE NO ACTION,
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE NO ACTION,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(inventory_item_id, variant_id, tenant_id, status)
);

-- SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status)
);

-- PURCHASE_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    po_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    order_status PURCHASE_ORDER_STATUS NOT NULL DEFAULT 'pending',
    expected_date DATE NOT NULL,
    received_date TIMESTAMP,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(po_number, tenant_id, status)
);

-- PURCHASE_ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
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
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id, status)
);

-- SALES_ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    so_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_status SALES_ORDER_STATUS NOT NULL DEFAULT 'pending',
    expected_date DATE,
    fulfilled_date TIMESTAMP,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(so_number, tenant_id, status)
);

-- SALES_ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    direction TRANSACTION_DIRECTION NOT NULL,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    current_item_quantity INTEGER NOT NULL CHECK (current_item_quantity >= 0),
    reference_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status RECORD_STATUS NOT NULL DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category FEEDBACK_CATEGORY NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status FEEDBACK_STATUS NOT NULL DEFAULT 'open',
    priority FEEDBACK_PRIORITY NOT NULL DEFAULT 'medium',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    admin_response TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MANUAL_PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.manual_payments (
    id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    reference_number VARCHAR(255) UNIQUE NOT NULL,
    status MANUAL_PAYMENT_STATUS NOT NULL DEFAULT 'pending',
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE NO ACTION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIEWS
CREATE VIEW public.inventory_items_view
WITH (security_invoker = true)
AS
SELECT *,
       quantity <= min_quantity AND quantity > 0 AS is_low_stock,
       quantity > min_quantity AS is_in_stock
FROM public.inventory_items;

------------------------------------------------------------------------------------------
-- Helper function to get user's tenant without RLS recursion
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID STABLE AS $$
    SELECT tenant_id 
    FROM public.user_tenant_mappings 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

------------------------------------------------------------------------------------------
-- Helper function to get user's tenant by user_id
CREATE OR REPLACE FUNCTION public.tenant_id_by_user_id(user_id UUID)
RETURNS UUID STABLE AS $$
    SELECT tenant_id 
    FROM public.user_tenant_mappings 
    WHERE user_id = user_id
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get invitations's tenant without RLS recursion
CREATE OR REPLACE FUNCTION public.invited_tenant_id_by_email(invited_email VARCHAR)
RETURNS UUID AS $$
    SELECT tenant_id FROM public.tenant_user_invites WHERE status = 'open' AND email = invited_email LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Trigger to automatically populate user_tenant_mappings when new users are created
CREATE OR REPLACE FUNCTION public.create_user_tenant_mapping()
RETURNS TRIGGER AS $$
DECLARE
    userRole public.USER_ROLE := 'USER';
    user_tenant_id UUID;
    subscriptionPlanId UUID;
BEGIN
     -- First check if user is tenant admin or staff
     user_tenant_id := public.invited_tenant_id_by_email(NEW.email);
    IF user_tenant_id IS NULL THEN
        -- Create a new tenant record
        INSERT INTO public.tenants (email, name, current_payment_expiry_date, subscription_plan_id) VALUES (NEW.email, NEW.email, NOW() + INTERVAL '1 month', subscriptionPlanId)
        RETURNING id INTO user_tenant_id;
        -- Set user role as 'TENANT_ADMIN'
        userRole := 'TENANT_ADMIN';
    ELSE
        UPDATE public.tenant_user_invites SET status = 'accepted' WHERE email = NEW.email;
    END IF;

    -- Create user-ternant mapping
    INSERT INTO public.user_tenant_mappings (user_id, tenant_id, role) VALUES (NEW.id, user_tenant_id, userRole);
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
        orderStatus PURCHASE_ORDER_STATUS;
        orderItem RECORD;
    BEGIN
        FOR orderItem IN (
            SELECT * FROM public.purchase_order_items 
            WHERE status = 'active' AND purchase_order_id = NEW.id
        ) LOOP
            -- Fetch Current Inventory Item Quantity
            SELECT quantity INTO currentItemQuantity 
                FROM public.inventory_items WHERE id = orderItem.inventory_item_id;

            INSERT INTO public.transactions (direction, store_id, item_id, quantity, current_item_quantity, reference_id) 
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
    tenant_id UUID,
    name VARCHAR,
    email VARCHAR,
    domain_id UUID,
    price_id TEXT,
    payment_method PAYMENT_METHOD,
    billing_cycle BILLING_CYCLE,
    subscription_tier SUBSCRIPTION_TIER,
    expected_payment_amount DECIMAL,
    currency_type CURRENCY_TYPE,
    subscription_status SUBSCRIPTION_STATUS,
    current_payment_expiry_date TIMESTAMP,
    profile_complete BOOLEAN,
    description TEXT,
    status RECORD_STATUS,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    role USER_ROLE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tenant_id, 
        t.name, 
        t.email, 
        t.domain_id, 
        t.price_id, 
        t.payment_method,
        sp.billing_cycle,
        sp.subscription_tier,
        sp.payment_amount as expected_payment_amount, 
        sp.currency_type,
        t.subscription_status,
        t.current_payment_expiry_date, 
        t.profile_complete, 
        t.description, 
        utm.status, 
        t.created_at,
        t.updated_at,
        utm.role
    FROM public.tenants t INNER JOIN public.user_tenant_mappings utm
    ON utm.tenant_id = t.id
    LEFT JOIN public.subscription_plans sp
    ON t.subscription_plan_id = sp.id
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
        orderStatus SALES_ORDER_STATUS;
        orderItem RECORD;
    BEGIN
        FOR orderItem IN (
            SELECT * FROM public.sales_order_items 
            WHERE status = 'active' AND sales_order_id = NEW.id
        ) LOOP
            -- Fetch Current Inventory Item Quantity
            SELECT quantity INTO currentItemQuantity FROM public.inventory_items WHERE id = orderItem.inventory_item_id;

            INSERT INTO public.transactions (direction, store_id, item_id, quantity, current_item_quantity, reference_id) 
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

-- INDEXES FOR READ PERFORMANCE
CREATE INDEX idx_tenants_email ON public.tenants(email);
CREATE INDEX idx_tenants_name ON public.tenants(name);
CREATE INDEX idx_tenants_domain_id ON public.tenants(domain_id);
CREATE INDEX idx_tenants_price_id ON public.tenants(price_id);
CREATE INDEX idx_tenants_subscription_plan_id ON public.tenants(subscription_plan_id);
CREATE INDEX idx_tenants_payment_method ON public.tenants(payment_method);
CREATE INDEX idx_tenants_current_payment_expiry_date ON public.tenants(current_payment_expiry_date);
CREATE INDEX idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX idx_tenants_profile_complete ON public.tenants(profile_complete);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at);
CREATE INDEX idx_tenants_updated_at ON public.tenants(updated_at);
CREATE INDEX idx_subscription_plans_billing_cycle ON public.subscription_plans(billing_cycle);
CREATE INDEX idx_subscription_plans_subscription_tier ON public.subscription_plans(subscription_tier);
CREATE INDEX idx_subscription_plans_currency_type ON public.subscription_plans(currency_type);
CREATE INDEX idx_subscription_plans_status ON public.subscription_plans(status);
CREATE INDEX idx_categories_tenant_id ON public.categories(tenant_id);
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_status ON public.categories(status);
CREATE INDEX idx_stores_tenant_id ON public.stores(tenant_id);
CREATE INDEX idx_stores_name ON public.stores(name);
CREATE INDEX idx_stores_status ON public.stores(status);
CREATE INDEX idx_suppliers_tenant_id ON public.suppliers(tenant_id);
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_inventory_items_tenant_id ON public.inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_items_category_id ON public.inventory_items(category_id);
CREATE INDEX idx_inventory_items_quantity ON public.inventory_items(quantity);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_purchase_orders_tenant_id ON public.purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_sales_orders_tenant_id ON public.sales_orders(tenant_id);
CREATE INDEX idx_sales_orders_customer_id ON public.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_inventory_item_id ON public.purchase_order_items(inventory_item_id);
CREATE INDEX idx_purchase_order_items_variant_id ON public.purchase_order_items(variant_id);
CREATE INDEX idx_purchase_order_items_inventory_quantity ON public.purchase_order_items(quantity);
CREATE INDEX idx_sales_order_items_sales_order_id ON public.sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_inventory_item_id ON public.sales_order_items(inventory_item_id);
CREATE INDEX idx_sales_order_items_variant_id ON public.sales_order_items(variant_id);
CREATE INDEX idx_sales_order_items_inventory_quantity ON public.sales_order_items(quantity);
CREATE INDEX idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_item_id ON public.transactions(item_id);
CREATE INDEX idx_transactions_reference_id ON public.transactions(reference_id);
CREATE INDEX idx_transactions_quantity ON public.transactions(quantity);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_feedback_tenant_id ON public.feedback(tenant_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_category ON public.feedback(category);
CREATE INDEX idx_feedback_subject ON public.feedback(subject);
CREATE INDEX idx_feedback_priority ON public.feedback(priority);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX idx_feedback_updated_at ON public.feedback(updated_at);
CREATE INDEX idx_feedback_created_by ON public.feedback(created_by);
CREATE INDEX idx_feedback_updated_by ON public.feedback(updated_by);
CREATE INDEX idx_manual_payments_tenant_id ON public.manual_payments(tenant_id);
CREATE INDEX idx_manual_payments_amount ON public.manual_payments(amount);
CREATE INDEX ix_manual_payments_reference_number ON public.manual_payments(reference_number);
CREATE INDEX idx_manual_payments_created_at ON public.manual_payments(created_at);
CREATE INDEX idx_manual_payments_updated_at ON public.manual_payments(updated_at);
CREATE INDEX idx_manual_payments_created_by ON public.manual_payments(created_by);
CREATE INDEX idx_manual_payments_updated_by ON public.manual_payments(updated_by);
CREATE INDEX idx_domains_name ON public.domains(name);
CREATE INDEX idx_domains_status ON public.domains(status);
CREATE INDEX idx_tenant_user_invites_tenant_id ON public.tenant_user_invites(tenant_id);
CREATE INDEX idx_tenant_user_invites_email ON public.tenant_user_invites(email);
CREATE INDEX idx_tenant_user_invites_status ON public.tenant_user_invites(status);
CREATE INDEX idx_variants_tenant_id ON public.variants(tenant_id);
CREATE INDEX idx_variants_name ON public.variants(name);
CREATE INDEX idx_variants_status ON public.variants(status);
CREATE INDEX idx_inventory_item_variants_tenant_id ON public.inventory_item_variants(tenant_id);
CREATE INDEX idx_inventory_item_variants_inventory_item_id ON public.inventory_item_variants(inventory_item_id);
CREATE INDEX idx_inventory_item_variants_variant_id ON public.inventory_item_variants(variant_id);
CREATE INDEX idx_inventory_item_variants_status ON public.inventory_item_variants(status);
CREATE INDEX idx_affiliate_partners_name ON public.affiliate_partners(name);
CREATE INDEX idx_affiliate_partners_status ON public.affiliate_partners(status);
CREATE INDEX idx_affiliate_partners_commission_type ON public.affiliate_partners(commission_type);

-- Function to renew tenant subscription after saving manual payments
CREATE OR REPLACE FUNCTION renew_tenant_subscription_on_manual_payments()
    RETURNS TRIGGER AS $$
    DECLARE
        subscriptionPlanId UUID;
        billingCycle VARCHAR;
        subscriptionTier VARCHAR;
        paymentAmount DECIMAL;
        currentPaymentExpiryDate TIMESTAMP;
        nextPaymentExpiryDate TIMESTAMP;
        interval INTERVAL;
    BEGIN
        SELECT subscription_plan_id, current_payment_expiry_date INTO subscriptionPlanId, currentPaymentExpiryDate FROM public.tenants WHERE id = NEW.tenant_id LIMIT 1;

        SELECT billing_cycle, subscription_tier, payment_amount INTO billingCycle, subscriptionTier, paymentAmount FROM public.subscription_plans WHERE id = subscriptionPlanId LIMIT 1;

        IF billingCycle = 'monthly' THEN
            interval = '1 month';
        ELSIF billingCycle = 'yearly' THEN
            interval = '1 year';
        ELSE
            RAISE EXCEPTION 'Invalid billing_cycle: %s. Failed to renew tenant subscription on manual payment, tenantId=%', billingCycle, NEW.tenant_id;
            RETURN NEW;
        END IF;

        --- Renewal logic
        IF currentPaymentExpiryDate > NOW() THEN
            nextPaymentExpiryDate = currentPaymentExpiryDate + interval;
        ELSE
            nextPaymentExpiryDate = NOW() + interval;
        END IF;

        UPDATE public.tenants SET 
            subscription_status = 'subscribed',
            current_payment_expiry_date = nextPaymentExpiryDate
        WHERE id = NEW.tenant_id;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

-- Function to add tenant_id and created_by before saving
CREATE OR REPLACE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record()
    RETURNS TRIGGER AS $$
    DECLARE
        currentTenantId UUID;
        column_exists BOOLEAN;
    BEGIN
        SELECT tenant_id INTO currentTenantId FROM public.user_tenant_mappings WHERE user_id = auth.uid() LIMIT 1;
        -- Check if table contains tenant_id column
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
            AND table_name = TG_TABLE_NAME
            AND column_name = 'tenant_id'
        ) INTO column_exists;

        IF column_exists THEN
            NEW.tenant_id = currentTenantId;
        END IF;

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

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_subscription_plans
    BEFORE INSERT ON public.subscription_plans
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

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_variants
    BEFORE INSERT ON public.variants
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_inventory_item_variants
    BEFORE INSERT ON public.inventory_item_variants
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

CREATE TRIGGER trigger_renew_tenant_subscription_on_manual_payments
    AFTER UPDATE OF status ON public.manual_payments
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.renew_tenant_subscription_on_manual_payments();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_domains
    BEFORE INSERT ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_tenant_user_invites
    BEFORE INSERT ON public.tenant_user_invites
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

CREATE TRIGGER trigger_add_tenant_id_and_created_by_info_to_affiliate_partners
    BEFORE INSERT ON public.affiliate_partners
    FOR EACH ROW
    EXECUTE FUNCTION public.add_tenant_id_and_created_by_info_to_new_record();

-- UPDATED_AT and UPDATED_BY TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_and_updated_by_column()
    RETURNS TRIGGER AS $$
    DECLARE
        column_exists BOOLEAN;
    BEGIN
        NEW.updated_at = NOW();
        -- Check if table contains updated_by column
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
            AND table_name = TG_TABLE_NAME
            AND column_name = 'updated_by'
        ) INTO column_exists;

        IF column_exists THEN
            NEW.updated_by = auth.uid();
        END IF;

        RETURN NEW;
    END;
    $$ language plpgsql;

-- TRIGGERS FOR UPDATED_AT and UPDATED_BY
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON public.variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_inventory_item_variants_updated_at BEFORE UPDATE ON public.inventory_item_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON public.purchase_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_sales_order_items_updated_at BEFORE UPDATE ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_manual_payments_updated_at BEFORE UPDATE ON public.manual_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();
CREATE TRIGGER update_affiliate_partners_updated_at BEFORE UPDATE ON public.affiliate_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_and_updated_by_column();


-- Function to update received_date when order_status = received
CREATE OR REPLACE FUNCTION public.update_received_date_on_order_status_update_to_received()
    RETURNS TRIGGER AS $$
    BEGIN
         -- Only update when order status is 'received'
        IF NEW.order_status = 'received' THEN
            NEW.received_date = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ language plpgsql;

-- Function to update fulfilled_date when order_status = fulfilled
CREATE OR REPLACE FUNCTION public.update_fulfilled_date_on_order_status_update_to_fulfilled()
    RETURNS TRIGGER AS $$
    BEGIN
         -- Only update when order status is 'fulfilled'
        IF NEW.order_status = 'fulfilled' THEN
            NEW.fulfilled_date = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ language plpgsql;

-- Update received_date when order_status is set to received
CREATE TRIGGER update_received_date_on_order_status_update_to_received
    BEFORE UPDATE OF order_status ON public.purchase_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_received_date_on_order_status_update_to_received();

-- Update fulfilled_date when order_status is set to fulfilled
CREATE TRIGGER update_fulfilled_date_on_order_status_update_to_fulfilled
    BEFORE UPDATE OF order_status ON public.sales_orders
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_fulfilled_date_on_order_status_update_to_fulfilled();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;


-- REALTIME UPDATE
ALTER publication supabase_realtime add table public.tenants;
ALTER publication supabase_realtime add table public.user_tenant_mappings;
ALTER publication supabase_realtime add table public.categories;
ALTER publication supabase_realtime add table public.subscription_plans;
ALTER publication supabase_realtime add table public.stores;
ALTER publication supabase_realtime add table public.suppliers;
ALTER publication supabase_realtime add table public.customers;
ALTER publication supabase_realtime add table public.inventory_items;
ALTER publication supabase_realtime add table public.variants;
ALTER publication supabase_realtime add table public.inventory_item_variants;
ALTER publication supabase_realtime add table public.purchase_orders;
ALTER publication supabase_realtime add table public.sales_orders;
ALTER publication supabase_realtime add table public.purchase_order_items;
ALTER publication supabase_realtime add table public.sales_order_items;
ALTER publication supabase_realtime add table public.transactions;
ALTER publication supabase_realtime add table public.feedback;
ALTER publication supabase_realtime add table public.manual_payments;
ALTER publication supabase_realtime add table public.domains;
ALTER publication supabase_realtime add table public.tenant_user_invites;
ALTER publication supabase_realtime add table public.affiliate_partners;

-- CHECK IF SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.isSuperAdmin()
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1 FROM public.user_tenant_mappings 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN')
        );
    END;
    $$ LANGUAGE plpgsql;

-- CHECK IF TENANT_ADMIN
CREATE OR REPLACE FUNCTION public.isTenantAdmin()
    RETURNS BOOLEAN AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1 FROM public.user_tenant_mappings 
            WHERE user_id = auth.uid() 
            AND role IN ('TENANT_ADMIN')
        );
    END;
    $$ LANGUAGE plpgsql;

-- DOMAINS POLICIES
CREATE POLICY "Domains are viewable by authenticated users" ON public.domains
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Domains are insertable by superadmin users" ON public.domains
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND public.isSuperAdmin()
    );

CREATE POLICY "Domains are updatable by superadmin users" ON public.domains
    FOR UPDATE USING (auth.role() = 'authenticated' AND public.isSuperAdmin());

-- TENANTS POLICIES
CREATE POLICY "Tenants are viewable by tenant users or superadmin users" ON public.tenants
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (id = public.user_tenant_id() OR public.isSuperAdmin())
    );

CREATE POLICY "Tenants are insertable by authenticated users" ON public.tenants
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Tenants are updatable by tenant users or superadmin users" ON public.tenants
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        (id = public.user_tenant_id() OR public.isSuperAdmin())
    );

-- USER_TENANT_MAPPING POLICIES
CREATE POLICY "user_tenant_mappings are viewable by tenant users" ON public.user_tenant_mappings
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- SUBSCRIPTION_PLANS POLICIES
CREATE POLICY "subscription_plans are viewable by authenticated users" ON public.subscription_plans
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "subscription_plans are insertable by super_admin" ON public.subscription_plans
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        public.isSuperAdmin()
    );

CREATE POLICY "subscription_plans are updatable by super_admin" ON public.subscription_plans
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        public.isSuperAdmin()
    );

-- AFFILIATE_PARTNERS POLICIES
CREATE POLICY "affiliate_partners are viewable by super_admin" ON public.affiliate_partners
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        public.isSuperAdmin()
    );

CREATE POLICY "affiliate_partners are insertable by super_admin" ON public.affiliate_partners
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        public.isSuperAdmin()
    );

CREATE POLICY "affiliate_partners are updatable by super_admin" ON public.affiliate_partners
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        public.isSuperAdmin()
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
CREATE POLICY "Users can view inventory items in their tenant" ON inventory_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert inventory items in their tenant" ON inventory_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update inventory items in their tenant" ON inventory_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete inventory items in their tenant" ON inventory_items
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- VARIANTS POLICIES
CREATE POLICY "Users can view variants in their tenant" ON public.variants
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert variants in their tenant" ON public.variants
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update variants in their tenant" ON public.variants
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete variants in their tenant" ON public.variants
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

-- INVENTORY_ITEM_VARIANTS POLICIES
CREATE POLICY "Users can view inventory_item_variants in their tenant" ON public.inventory_item_variants
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can insert inventory_item_variants in their tenant" ON public.inventory_item_variants
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update inventory_item_variants in their tenant" ON public.inventory_item_variants
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can delete inventory_item_variants in their tenant" ON public.inventory_item_variants
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
CREATE POLICY "Users can view their tenant feedback" ON public.feedback
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (tenant_id = public.user_tenant_id() OR public.isSuperAdmin())
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
        (created_by = auth.uid() OR public.isSuperAdmin())
    );

-- MANUAL_PAYMENTS POLICIES
CREATE POLICY "Users can view their own manual_payments" ON public.manual_payments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (tenant_id = public.user_tenant_id() OR public.isSuperAdmin())
    );

CREATE POLICY "Users can insert manual_payments in their tenant" ON public.manual_payments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid() AND
        tenant_id = public.user_tenant_id()
    );

CREATE POLICY "Users can update their own manual_payments" ON public.manual_payments
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND (tenant_id = public.user_tenant_id() OR public.isSuperAdmin())
    );

-- USER INVITES POLICIES
CREATE POLICY "User invites are viewable by authenticated users" ON public.tenant_user_invites
    FOR SELECT USING (auth.role() = 'authenticated' AND tenant_id = public.user_tenant_id());

CREATE POLICY "User invites are insertable by superadmin users" ON public.tenant_user_invites
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND tenant_id = public.user_tenant_id()
    );

CREATE POLICY "User invites are updatable by superadmin users" ON public.tenant_user_invites
    FOR UPDATE USING (auth.role() = 'authenticated' AND tenant_id = public.user_tenant_id());

-- FUNCTIONS & TRIGGERS

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
        IF NEW.direction = 'out' THEN
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

-- GDPR delete account
CREATE OR REPLACE FUNCTION public.delete_user_account()
    RETURNS TRIGGER AS $$
    DECLARE
        user_tenant_id UUID;
    BEGIN
        user_tenant_id := public.tenant_id_by_user_id(NEW.id);
        DELETE FROM public.transactions WHERE tenant_id = user_tenant_id;
        DELETE FROM public.purchase_order_items WHERE tenant_id = user_tenant_id;
        DELETE FROM public.purchase_orders WHERE tenant_id = user_tenant_id;
        DELETE FROM public.sales_order_items WHERE tenant_id = user_tenant_id;
        DELETE FROM public.sales_orders WHERE tenant_id = user_tenant_id;
        DELETE FROM public.manual_payments WHERE tenant_id = user_tenant_id;
        DELETE FROM public.tenant_user_invites WHERE tenant_id = user_tenant_id;
        DELETE FROM public.feedback WHERE tenant_id = user_tenant_id;
        DELETE FROM public.inventory_items WHERE tenant_id = user_tenant_id;
        DELETE FROM public.variants WHERE tenant_id = user_tenant_id;
        DELETE FROM public.inventory_item_variants WHERE tenant_id = user_tenant_id;
        DELETE FROM public.stores WHERE tenant_id = user_tenant_id;
        DELETE FROM public.categories WHERE tenant_id = user_tenant_id;
        DELETE FROM public.suppliers WHERE tenant_id = user_tenant_id;
        DELETE FROM public.customers WHERE tenant_id = user_tenant_id;
        DELETE FROM public.user_tenant_mappings WHERE tenant_id = user_tenant_id;
        DELETE FROM public.tenants WHERE id = user_tenant_id;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate inventory before transaction
CREATE TRIGGER trigger_delete_user_account
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_user_account();


-- TRANSACTIONS

-- Function to create/update inventory_item and inventory_item_variants in single transaction
CREATE OR REPLACE FUNCTION public.inventory_item_transaction(
    inventory_item_data JSONB,
    inventory_item_variants_data JSONB,
    is_for_update BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.inventory_items AS $$
DECLARE
    newSku VARCHAR := (inventory_item_data ->> 'sku')::VARCHAR;
    newName VARCHAR := (inventory_item_data ->> 'name')::VARCHAR;
    newDescription VARCHAR := (inventory_item_data ->> 'description')::VARCHAR;
    categoryId UUID := (inventory_item_data ->> 'category_id')::UUID;
    newQuantity INTEGER := (inventory_item_data ->> 'quantity')::INTEGER;
    minQuantity INTEGER := (inventory_item_data ->> 'min_quantity')::INTEGER;
    unitPrice DECIMAL := (inventory_item_data ->> 'unit_price')::DECIMAL;
    inventoryItemId UUID;
BEGIN
    -- 2. Handle inventory_items: insert/update
    IF is_for_update THEN
        inventoryItemId = (inventory_item_data ->> 'id')::UUID;

        UPDATE public.inventory_items
        SET
            sku = newSku,
            name = newName,
            description = newDescription,
            category_id = categoryId,
            quantity = newQuantity,
            min_quantity = minQuantity,
            unit_price = unitPrice
        WHERE id = inventoryItemId;
    ELSE
        INSERT INTO public.inventory_items (sku, name, description, category_id, quantity, min_quantity, unit_price)
        VALUES (newSku, newName, newDescription, categoryId, newQuantity, minQuantity, unitPrice) 
        RETURNING id INTO inventoryItemId;
    END IF;

    -- 2. Handle inventory_item_variants: deletes/updates/inserts.
    IF is_for_update THEN
        -- Delete variants that are in the database but not in the new inventory_item_variants_data
        DELETE FROM public.inventory_item_variants
        WHERE inventory_item_id = inventoryItemId
            AND NOT (
                id IN (
                    SELECT COALESCE((value ->> 'id')::UUID, '00000000-0000-0000-0000-000000000000') 
                    FROM jsonb_array_elements(inventory_item_variants_data)
                )
            );
    END IF;
    -- Loop through the `inventory_item_variants_data` array provided in the request.
    FOR i IN 0..jsonb_array_length(inventory_item_variants_data) - 1 LOOP
        DECLARE
            variantsData JSONB := inventory_item_variants_data -> i;
            variantId UUID := NULLIF(variantsData ->> 'variant_id', '')::UUID;
            inventoryItemVariantId UUID := (variantsData ->> 'id')::UUID;
        BEGIN
            -- 3. Check if the item already exists by its ID.
            -- If it exists, perform an update.
            IF is_for_update AND (SELECT EXISTS (SELECT 1 FROM public.inventory_item_variants WHERE id = inventoryItemVariantId)) THEN
                UPDATE public.inventory_item_variants
                SET
                    inventory_item_id = inventoryItemId,
                    variant_id = variantId
                WHERE id = inventoryItemVariantId;
            ELSE
                -- 4. If the inventory_item_variant does not exist, insert it as a new record.
                INSERT INTO public.inventory_item_variants (inventory_item_id, variant_id)
                VALUES (inventoryItemId, variantId);
            END IF;
        END;
    END LOOP;

    RETURN QUERY SELECT * FROM public.inventory_items WHERE id = inventoryItemId;
END;
$$ LANGUAGE plpgsql;

-- Function to create/update purchase_order and purchase_order_items in single transaction
CREATE OR REPLACE FUNCTION public.purchase_order_transaction(
    purchase_order_data JSONB,
    purchase_order_items_data JSONB,
    is_for_update BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.purchase_orders AS $$
DECLARE
    poNumber VARCHAR := (purchase_order_data ->> 'po_number')::VARCHAR;
    supplierId UUID := (purchase_order_data ->> 'supplier_id')::UUID;
    expectedDate DATE := (purchase_order_data ->> 'expected_date')::DATE;
    orderId UUID;
    orderStatus purchase_ORDER_STATUS;
BEGIN
    -- 2. Handle purchase_orders: insert/update
    IF is_for_update THEN
        orderId = (purchase_order_data ->> 'id')::UUID;
        -- Do not update 'received' orders
        SELECT order_status INTO orderStatus 
            FROM public.purchase_orders WHERE id = orderId;
        IF orderStatus = 'received' THEN
            RAISE NOTICE 'Can not update received orders, orderId=%', orderId;
            RETURN;
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
        -- Delete items that are in the database but not in the new purchase_order_items_data.
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
            variantId UUID := NULLIF(itemObj ->> 'variant_id', '')::UUID;
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
                    variant_id = variantId,
                    quantity = itemQuantity,
                    unit_price = unitPrice
                WHERE id = itemId;
            ELSE
                -- 4. If the item does not exist, insert it as a new record.
                INSERT INTO public.purchase_order_items (purchase_order_id, store_id, inventory_item_id, variant_id, quantity, unit_price)
                VALUES (orderId, storeId, inventoryItemId, variantId, itemQuantity, unitPrice);
            END IF;
        END;
    END LOOP;

    RETURN QUERY SELECT * FROM public.purchase_orders WHERE id = orderId;
END;
$$ LANGUAGE plpgsql;

-- Function to create/update sales_order and sales_order_items in single transaction
CREATE OR REPLACE FUNCTION public.sales_order_transaction(
    sales_order_data JSONB,
    sales_order_items_data JSONB,
    is_for_update BOOLEAN DEFAULT FALSE
)
RETURNS SETOF public.sales_orders AS $$
DECLARE
    soNumber VARCHAR := (sales_order_data ->> 'so_number')::VARCHAR;
    customerId UUID := (sales_order_data ->> 'customer_id')::UUID;
    expectedDate DATE := (sales_order_data ->> 'expected_date')::DATE;
    orderId UUID;
    orderStatus SALES_ORDER_STATUS;
BEGIN
    -- 2. Handle sales_orders: insert/update
    IF is_for_update THEN
        orderId = (sales_order_data ->> 'id')::UUID;
        -- Do not update 'fulfilled' orders
        SELECT order_status INTO orderStatus 
            FROM public.sales_orders WHERE id = orderId;
        IF orderStatus = 'fulfilled' THEN
            RAISE NOTICE 'Can not update fulfilled orders, orderId=%', orderId;
            RETURN;
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
            variantId UUID := NULLIF(itemObj ->> 'variant_id', '')::UUID;
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
                    variant_id = variantId,
                    quantity = itemQuantity,
                    unit_price = unitPrice
                WHERE id = itemId;
            ELSE
                -- 4. If the item does not exist, insert it as a new record.
                INSERT INTO public.sales_order_items (sales_order_id, store_id, inventory_item_id, variant_id, quantity, unit_price)
                VALUES (orderId, storeId, inventoryItemId, variantId, itemQuantity, unitPrice);
            END IF;
        END;
    END LOOP;

    RETURN QUERY SELECT * FROM public.sales_orders WHERE id = orderId;
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
        target_order_status PURCHASE_ORDER_STATUS,
        records_per_page INTEGER,
        selected_item_id UUID DEFAULT NULL, 
        expected_date_start TIMESTAMP DEFAULT NULL,
        expected_date_end TIMESTAMP DEFAULT NULL
    )
    RETURNS TABLE(
        item_id UUID, 
        item_name VARCHAR, 
        total_ordered_quantity BIGINT,
        order_status PURCHASE_ORDER_STATUS
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
        target_order_status SALES_ORDER_STATUS,
        records_per_page INTEGER,
        selected_item_id UUID DEFAULT NULL, 
        expected_date_start TIMESTAMP DEFAULT NULL,
        expected_date_end TIMESTAMP DEFAULT NULL
    )
    RETURNS TABLE(
        item_id UUID, 
        item_name VARCHAR, 
        total_ordered_quantity BIGINT,
        order_status SALES_ORDER_STATUS
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
CREATE OR REPLACE FUNCTION public.build_dashboard_stats(
    report_days_count INTEGER
)
    RETURNS JSONB AS $$
    DECLARE
        totalItems INTEGER; 
        lowStockItems INTEGER; 
        outStockItems INTEGER; 
        totalSuppliers INTEGER; 
        pendingPurchaseOrders INTEGER;
        receivedPurchaseOrders INTEGER;
        canceledPurchaseOrders INTEGER;
        overDuePurchaseOrders INTEGER;
        pendingSalesOrders INTEGER;
        fulfilledSalesOrders INTEGER;
        canceledSalesOrders INTEGER;
        overDueSalesOrders INTEGER;
        result JSONB;
    BEGIN
        SELECT count(DISTINCT id) INTO totalItems FROM public.inventory_items
        WHERE status = 'active';

        SELECT count(DISTINCT id) INTO lowStockItems FROM public.inventory_items
        WHERE status = 'active' 
        AND quantity > 0 AND quantity <= min_quantity;

        SELECT count(DISTINCT id) INTO outStockItems FROM public.inventory_items
        WHERE status = 'active' 
        AND quantity = 0;

        SELECT count(DISTINCT id) INTO totalSuppliers FROM public.suppliers
        WHERE status = 'active';

        SELECT count(DISTINCT po.id) INTO pendingPurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND po.order_status = 'pending';
            
        SELECT count(DISTINCT po.id) INTO receivedPurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND po.order_status = 'received';

        SELECT count(DISTINCT po.id) INTO canceledPurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND po.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND po.order_status = 'canceled';

        SELECT count(DISTINCT po.id) INTO overDuePurchaseOrders FROM public.purchase_orders po
            INNER JOIN public.purchase_order_items poi
            ON poi.purchase_order_id = po.id
            WHERE po.status = 'active' 
            AND poi.status = 'active' 
            AND (po.received_date IS NULL AND NOW() > po.expected_date) OR (po.received_date > po.expected_date)
            AND po.order_status = 'pending';

        SELECT count(DISTINCT so.id) INTO pendingSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND so.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND so.order_status = 'pending';

        SELECT count(DISTINCT so.id) INTO fulfilledSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND so.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND so.order_status = 'fulfilled';
        
        SELECT count(DISTINCT so.id) INTO canceledSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND so.created_at >= NOW() - (report_days_count * INTERVAL '1 day')
            AND so.order_status = 'canceled';

        SELECT count(DISTINCT so.id) INTO overDueSalesOrders FROM public.sales_orders so
            INNER JOIN public.sales_order_items soi
            ON soi.sales_order_id = so.id
            WHERE so.status = 'active' 
            AND soi.status = 'active' 
            AND (so.fulfilled_date IS NULL AND NOW() > so.expected_date) OR (so.fulfilled_date > so.expected_date)
            AND so.order_status = 'pending';

        result = jsonb_build_object(
                    'totalItems', totalItems, 
                    'totalSuppliers', totalSuppliers, 
                    'lowStockItems', lowStockItems, 
                    'outStockItems', outStockItems,
                    'pendingPurchaseOrders', pendingPurchaseOrders, 
                    'receivedPurchaseOrders', receivedPurchaseOrders, 
                    'canceledPurchaseOrders', canceledPurchaseOrders, 
                    'overDuePurchaseOrders', overDuePurchaseOrders, 
                    'pendingSalesOrders', pendingSalesOrders, 
                    'fulfilledSalesOrders', fulfilledSalesOrders,
                    'canceledSalesOrders', canceledSalesOrders,
                    'overDueSalesOrders', overDueSalesOrders
                );

        RETURN result;
    END;
    $$ LANGUAGE plpgsql;


-- Purchase Order monthly trends
CREATE OR REPLACE FUNCTION public.purchase_order_monthly_trends(
    report_days_count INTEGER
)
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
            AND po.created_at >= DATE_TRUNC('month', NOW() - (report_days_count * INTERVAL '1 day'))
    GROUP BY
        month_name
    ORDER BY
        month_name;
END;
$$;

-- Sales Order monthly trends
CREATE OR REPLACE FUNCTION public.sales_order_monthly_trends(
    report_days_count INTEGER
)
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
        AND po.created_at >= DATE_TRUNC('month', NOW() - (report_days_count * INTERVAL '1 day'))
    GROUP BY
        month_name
    ORDER BY
        month_name;
END;
$$;

-- CRON JOBS
SELECT cron.schedule(
  'expire-unpaid-accounts',
  -- Run every day at 2 AM
  '0 2 * * *',
  $$
    UPDATE public.tenants SET subscription_status = 'expired' 
    WHERE current_payment_expiry_date < NOW()
    AND subscription_status IN ('free_trial', 'subscribed');
  $$
);

CREATE OR REPLACE FUNCTION public.run_notify_upcoming_payment_due_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cron_api_key text;
  v_payment_notification_api text;
  v_payload jsonb;
BEGIN
  SELECT decrypted_secret INTO v_cron_api_key FROM vault.decrypted_secrets WHERE name = 'cron_api_key' LIMIT 1;
  SELECT decrypted_secret INTO v_payment_notification_api FROM vault.decrypted_secrets WHERE name = 'payment_notification_api' LIMIT 1;

  -- Use jsonb_agg to create an array of objects
  SELECT jsonb_build_object(
    'timestamp', now(),
    'source', 'supabase_cron',
    'data', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'email', t.email,
          'tenantName', t.name,
          'paymentAmount', sp.payment_amount,
          'currencyType', sp.currency_type,
          'dueDate', t.current_payment_expiry_date
        )
      )
      FROM public.tenants t
      INNER JOIN public.subscription_plans sp
      ON t.subscription_plan_id = sp.id
      WHERE t.current_payment_expiry_date < NOW() + INTERVAL '7 Days'
    )
  ) INTO v_payload;

IF v_payload->>'data' IS NOT NULL THEN
    PERFORM net.http_post(
    url := v_payment_notification_api,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_cron_api_key
      ),
      body := v_payload
    );
  END IF;
END;
$$;

SELECT cron.schedule(
  'notify-upcoming-payment-due',
  '0 0 * * *',
  'SELECT public.run_notify_upcoming_payment_due_cron();'
);


-- GRANT PERMISSIONS TO VIEWS
GRANT SELECT ON public.inventory_items_view TO anon;
GRANT SELECT ON public.inventory_items_view TO authenticated;

ALTER VIEW public.inventory_items_view OWNER TO postgres;

-- FINALLY, REFRESH SCHEMA
NOTIFY pgrst, 'reload schema';