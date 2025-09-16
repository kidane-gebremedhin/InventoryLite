import { createClient } from '@supabase/supabase-js'
import { PurchaseOrderStatus } from '../lib/Enums'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create the client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          domain: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          sku: string
          name: string
          description: string
          category: string
          quantity: number
          min_quantity: number
          unit_price: number
          status: 'active' | 'archived'
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string
          category: string
          quantity?: number
          min_quantity?: number
          unit_price: number
          status?: 'active' | 'archived'
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string
          category?: string
          quantity?: number
          min_quantity?: number
          unit_price?: number
          status?: 'active' | 'archived'
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string
          address?: string
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string
          address?: string
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          supplier_id: string
          status: PurchaseOrderStatus.PENDING
          expected_date: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          po_number: string
          supplier_id: string
          status?: PurchaseOrderStatus.PENDING
          expected_date?: string | null
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          po_number?: string
          supplier_id?: string
          status?: PurchaseOrderStatus.PENDING
          expected_date?: string | null
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales_orders: {
        Row: {
          id: string
          so_number: string
          customer_id: string
          status: 'pending' | 'fulfilled' | 'canceled'
          expected_date: string | null
          tenant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          so_number: string
          customer_id: string
          status?: 'pending' | 'fulfilled' | 'canceled'
          expected_date?: string | null
          tenant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          so_number?: string
          customer_id?: string
          status?: 'pending' | 'fulfilled' | 'canceled'
          expected_date?: string | null
          tenant_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          inventory_item_id: string
          quantity: number
          unit_price: number
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          purchase_order_id: string
          inventory_item_id: string
          quantity: number
          unit_price: number
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          purchase_order_id?: string
          inventory_item_id?: string
          quantity?: number
          unit_price?: number
          tenant_id?: string
          created_at?: string
        }
      }
      sales_order_items: {
        Row: {
          id: string
          sales_order_id: string
          inventory_item_id: string
          quantity: number
          unit_price: number
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          sales_order_id: string
          inventory_item_id: string
          quantity: number
          unit_price: number
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          sales_order_id?: string
          inventory_item_id?: string
          quantity?: number
          unit_price?: number
          tenant_id?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          type: 'in' | 'out'
          item_id: string
          quantity: number
          reference_id: string
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          type: 'in' | 'out'
          item_id: string
          quantity: number
          reference_id: string
          tenant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'in' | 'out'
          item_id?: string
          quantity?: number
          reference_id?: string
          tenant_id?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          category: 'bug' | 'feature' | 'improvement' | 'general'
          subject: string
          message: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          rating: number | null
          admin_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          category: 'bug' | 'feature' | 'improvement' | 'general'
          subject: string
          message: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          rating?: number | null
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          category?: 'bug' | 'feature' | 'improvement' | 'general'
          subject?: string
          message?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          rating?: number | null
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
