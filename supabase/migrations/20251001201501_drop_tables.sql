
-- This file contains all table definitions, constraints, indexes, and RLS policies
CREATE EXTENSION IF NOT EXISTS "pg_cron" SCHEMA public;

-- DOWN

-- Drop All Triggers (REMOVE THIS)
DROP TRIGGER IF EXISTS sync_user_tenant_mapping ON auth.users;
DROP TRIGGER IF EXISTS trigger_delete_user_account ON auth.users;
-- DROP TRIGGER IF EXISTS update_received_date_on_order_status_update_to_received ON public.purchase_orders;
-- DROP TRIGGER IF EXISTS sync_transactions_with_purchase_orders ON public.purchase_orders;

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

DROP VIEW IF EXISTS public.inventory_items_view;
DELETE FROM auth.users;

-- Drop All Functions (REMOVE THIS)
DROP FUNCTION IF EXISTS public.create_user_tenant_mapping();
DROP FUNCTION IF EXISTS public.get_all_categories();
DROP FUNCTION IF EXISTS public.generate_inventory_aging_report();
DROP FUNCTION IF EXISTS public.update_received_or_fulfilled_date_on_order_status_update_to_received_or_fulfilled();
DROP FUNCTION IF EXISTS public.generate_unreceived_purchase_orders_report(purchase_order_status,integer,uuid,timestamp without time zone,timestamp without time zone);
DROP FUNCTION IF EXISTS public.generate_unfulfilled_sales_orders_report(sales_order_status,integer,uuid,timestamp without time zone,timestamp without time zone);
DROP FUNCTION IF EXISTS purchase_order_transaction();
DROP FUNCTION IF EXISTS update_received_date_on_order_status_update_to_received(); 
DROP FUNCTION IF EXISTS fetch_user_subscription_info(uuid);
DROP FUNCTION IF EXISTS delete_user_account(uuid);

-- Drop All Types
DROP TYPE IF EXISTS USER_ROLE;
DROP TYPE IF EXISTS RECORD_STATUS;
DROP TYPE IF EXISTS PAYMENT_METHOD;
DROP TYPE IF EXISTS CURRENCY_TYPE;
DROP TYPE IF EXISTS SUBSCRIPTION_STATUS;
DROP TYPE IF EXISTS TRANSACTION_DIRECTION;
DROP TYPE IF EXISTS FEEDBACK_CATEGORY;
DROP TYPE IF EXISTS FEEDBACK_STATUS;
DROP TYPE IF EXISTS FEEDBACK_PRIORITY;
DROP TYPE IF EXISTS MANUAL_PAYMENT_STATUS;
DROP TYPE IF EXISTS PURCHASE_ORDER_STATUS;
DROP TYPE IF EXISTS SALES_ORDER_STATUS;
DROP TYPE IF EXISTS INVITATION_STATUS;

-- Drop Cron Jobs
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid
  FROM cron.job
  WHERE jobname = 'expire-unpaid-accounts'
  LIMIT 1;

  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END;
$$ LANGUAGE plpgsql;
