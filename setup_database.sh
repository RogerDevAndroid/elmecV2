#!/bin/bash

# =============================================================================
# SUPABASE DATABASE SETUP SCRIPT
# Executes the complete schema for ElmecV2 + Dashboard
# =============================================================================

SUPABASE_URL="https://aoghysichevnuaddsocl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2h5c2ljaGV2bnVhZGRzb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNDk2MSwiZXhwIjoyMDcyODAwOTYxfQ.PQXrCUjQvwefcl_Gie27sABN2iq2Q9D2RSFGV-hJCiM"

echo "🎯 Starting ElmecV2 Database Setup..."
echo ""

# Function to execute SQL
execute_sql() {
  local sql="$1"
  local description="$2"
  
  echo "🚀 $description..."
  
  response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(echo "$sql" | jq -Rs .)}")
  
  if echo "$response" | grep -q "error\|Error"; then
    echo "❌ Error: $description"
    echo "$response"
    return 1
  else
    echo "✅ Success: $description"
    return 0
  fi
}

# Step 1: Create exec_sql function first
echo "📝 Setting up SQL execution function..."

curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql": "CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; RETURN '\''OK'\''; END; $$;"}' >/dev/null

# Step 2: Create extensions
echo "🔧 Creating extensions..."
execute_sql "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"; CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" "Creating extensions"

# Step 3: Create companies table
echo "🏢 Creating companies table..."
execute_sql "
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  phone text,
  email text,
  website text,
  industry text,
  settings jsonb DEFAULT '{
    \"business_hours\": {
      \"monday\": {\"start\": \"09:00\", \"end\": \"18:00\", \"active\": true},
      \"tuesday\": {\"start\": \"09:00\", \"end\": \"18:00\", \"active\": true},
      \"wednesday\": {\"start\": \"09:00\", \"end\": \"18:00\", \"active\": true},
      \"thursday\": {\"start\": \"09:00\", \"end\": \"18:00\", \"active\": true},
      \"friday\": {\"start\": \"09:00\", \"end\": \"18:00\", \"active\": true},
      \"saturday\": {\"start\": \"09:00\", \"end\": \"14:00\", \"active\": false},
      \"sunday\": {\"start\": \"09:00\", \"end\": \"14:00\", \"active\": false}
    },
    \"notifications\": {\"email\": true, \"sms\": false, \"push\": true},
    \"auto_assignment\": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);" "Creating companies table"

# Step 4: Create users table
echo "👥 Creating users table..."
execute_sql "
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  full_name text GENERATED ALWAYS AS (
    CASE 
      WHEN middle_name IS NOT NULL THEN first_name || ' ' || last_name || ' ' || middle_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  phone text,
  mobile text,
  city text,
  state text,
  country text DEFAULT 'México',
  timezone text DEFAULT 'America/Mexico_City',
  role text CHECK (role IN ('customer', 'agent', 'broker', 'admin', 'super_admin')) DEFAULT 'customer',
  category text CHECK (category IN ('Agentes de venta', 'Servicio al Cliente', 'Soporte', 'Brokers')),
  zone text,
  employee_id text UNIQUE,
  department text,
  is_active boolean DEFAULT true,
  is_online boolean DEFAULT false,
  last_seen timestamptz,
  last_login timestamptz,
  avatar_url text,
  fcm_tokens jsonb DEFAULT '[]'::jsonb,
  push_settings jsonb DEFAULT '{
    \"enabled\": true,
    \"new_messages\": true,
    \"new_requests\": true,
    \"assignments\": true,
    \"updates\": true
  }'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\.[A-Za-z]{2,}\$')
);" "Creating users table"

# Step 5: Create support_requests table
echo "🎫 Creating support_requests table..."
execute_sql "
CREATE TABLE IF NOT EXISTS support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status text CHECK (status IN ('new', 'assigned', 'in_progress', 'pending_customer', 'resolved', 'closed')) DEFAULT 'new',
  category text,
  created_at timestamptz DEFAULT now(),
  assigned_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  due_date timestamptz,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{
    \"source\": \"mobile\",
    \"urgency\": false,
    \"vip_customer\": false
  }'::jsonb,
  updated_at timestamptz DEFAULT now()
);" "Creating support_requests table"

# Step 6: Create chat_rooms table
echo "💬 Creating chat_rooms table..."
execute_sql "
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  type text CHECK (type IN ('support', 'sales', 'general', 'group')) DEFAULT 'support',
  name text,
  participants uuid[] NOT NULL,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  support_request_id uuid REFERENCES support_requests(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  last_message_id uuid,
  last_message_text text,
  last_message_at timestamptz,
  unread_counts jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{
    \"priority\": \"medium\",
    \"auto_close_hours\": 24
  }'::jsonb
);" "Creating chat_rooms table"

# Step 7: Create messages table
echo "📨 Creating messages table..."
execute_sql "
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text NOT NULL,
  message_type text CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video', 'system')) DEFAULT 'text',
  file_url text,
  file_name text,
  file_size bigint,
  file_type text,
  duration_seconds integer,
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  read_by jsonb DEFAULT '{}'::jsonb,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  reactions jsonb DEFAULT '{}'::jsonb
);" "Creating messages table"

# Step 8: Create notifications table
echo "🔔 Creating notifications table..."
execute_sql "
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text CHECK (type IN ('request_update', 'new_message', 'assignment', 'reminder', 'system', 'marketing')) NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  related_entity_type text,
  related_entity_id uuid,
  channels text[] DEFAULT ARRAY['push'],
  delivered_at timestamptz,
  read_at timestamptz,
  is_read boolean DEFAULT false,
  is_delivered boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);" "Creating notifications table"

# Step 9: Create indexes
echo "🔍 Creating performance indexes..."
execute_sql "
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_support_requests_customer_id ON support_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_agent_id ON support_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
" "Creating performance indexes"

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check your Supabase dashboard: https://app.supabase.com/project/aoghysichevnuaddsocl"
echo "2. Verify tables were created in the Table Editor"
echo "3. Run sample data insert script"
echo "4. Configure Row Level Security policies"
echo ""
echo "🔧 If you see any errors above, you can:"
echo "1. Go to SQL Editor in Supabase Dashboard"
echo "2. Copy/paste the SQL files manually"
echo "3. Execute them step by step"
echo ""