import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = 'https://aoghysichevnuaddsocl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2h5c2ljaGV2bnVhZGRzb2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjQ5NjEsImV4cCI6MjA3MjgwMDk2MX0.SJE9eh1uQSXmYEXe2S6d9QZYta8V6AGkP1huj72DgrI'

// Storage adapter for React Native
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          phone: string | null
          email: string | null
          website: string | null
          industry: string | null
          settings: any
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          industry?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          industry?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          email: string
          password_hash: string | null
          first_name: string
          last_name: string
          middle_name: string | null
          full_name: string
          phone: string | null
          mobile: string | null
          city: string | null
          state: string | null
          country: string | null
          timezone: string | null
          role: 'customer' | 'agent' | 'broker' | 'admin' | 'super_admin'
          category: 'Agentes de venta' | 'Servicio al Cliente' | 'Soporte' | 'Brokers' | null
          zone: string | null
          employee_id: string | null
          department: string | null
          is_active: boolean
          is_online: boolean
          last_seen: string | null
          last_login: string | null
          avatar_url: string | null
          fcm_tokens: any
          push_settings: any
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          email: string
          password_hash?: string | null
          first_name: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          mobile?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          role?: 'customer' | 'agent' | 'broker' | 'admin' | 'super_admin'
          category?: 'Agentes de venta' | 'Servicio al Cliente' | 'Soporte' | 'Brokers' | null
          zone?: string | null
          employee_id?: string | null
          department?: string | null
          is_active?: boolean
          is_online?: boolean
          last_seen?: string | null
          last_login?: string | null
          avatar_url?: string | null
          fcm_tokens?: any
          push_settings?: any
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          email?: string
          password_hash?: string | null
          first_name?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          mobile?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          role?: 'customer' | 'agent' | 'broker' | 'admin' | 'super_admin'
          category?: 'Agentes de venta' | 'Servicio al Cliente' | 'Soporte' | 'Brokers' | null
          zone?: string | null
          employee_id?: string | null
          department?: string | null
          is_active?: boolean
          is_online?: boolean
          last_seen?: string | null
          last_login?: string | null
          avatar_url?: string | null
          fcm_tokens?: any
          push_settings?: any
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      // Add more table types as needed...
    }
    Views: {
      dashboard_kpi_cards: {
        Row: {
          monthly_revenue: number
          revenue_change_percent: number
          monthly_sales: number
          monthly_leads: number
          leads_change_percent: number
          monthly_conversion_rate: number
        }
      }
      dashboard_agent_performance: {
        Row: {
          id: string
          full_name: string
          category: string | null
          avatar_url: string | null
          leads_total: number
          leads_converted: number
          conversion_rate: number
          total_calls: number
          meetings_completed: number
          presentations_given: number
          total_revenue: number
          support_requests_handled: number
          avg_satisfaction: number
          avg_first_response_minutes: number
          activity_score: number
        }
      }
      // Add more view types as needed...
    }
    Functions: {
      get_goal_progress: {
        Args: {
          p_agent_id: string
          p_metric_type: string
          p_target_value: number
          p_period?: string
        }
        Returns: {
          current_value: number
          target_value: number
          progress_percentage: number
          remaining_days: number
          daily_pace_needed: number
          on_track: boolean
        }[]
      }
    }
  }
}

export default supabase