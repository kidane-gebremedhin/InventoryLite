
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
