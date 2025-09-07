#!/bin/bash

# =============================================================================
# SECURITY SETUP - ROW LEVEL SECURITY (RLS)
# Configures security policies for ElmecV2
# =============================================================================

SUPABASE_URL="https://aoghysichevnuaddsocl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2h5c2ljaGV2bnVhZGRzb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNDk2MSwiZXhwIjoyMDcyODAwOTYxfQ.PQXrCUjQvwefcl_Gie27sABN2iq2Q9D2RSFGV-hJCiM"

echo "🔐 Setting up Row Level Security..."
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

# Step 1: Enable RLS on all tables
echo "🛡️ Enabling Row Level Security..."
execute_sql "
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
" "Enabling RLS on all tables"

# Step 2: Helper functions
echo "🔧 Creating helper functions..."
execute_sql "
-- Function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid AS \$\$
BEGIN
  RETURN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()
  );
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS boolean AS \$\$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;
" "Creating security helper functions"

# Step 3: Users policies
echo "👥 Setting up users policies..."
execute_sql "
-- Users can see their own profile
CREATE POLICY \"Users see own profile\" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users in same company can see each other
CREATE POLICY \"Same company users visibility\" ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id = get_user_company_id()
    AND is_active = true
  );

-- Users can update their own profile
CREATE POLICY \"Users update own profile\" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());
" "Creating users policies"

# Step 4: Companies policies
echo "🏢 Setting up companies policies..."
execute_sql "
-- Users can see their own company
CREATE POLICY \"Users see own company\" ON companies
  FOR SELECT
  TO authenticated
  USING (
    id = get_user_company_id()
  );

-- Company admins can update their company
CREATE POLICY \"Company admins update own company\" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id = get_user_company_id()
    AND is_company_admin()
  );
" "Creating companies policies"

# Step 5: Support requests policies
echo "🎫 Setting up support requests policies..."
execute_sql "
-- Customers can see their own requests
CREATE POLICY \"Customers see own requests\" ON support_requests
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Agents can see assigned requests and company requests
CREATE POLICY \"Agents see company requests\" ON support_requests
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR 
    (company_id = get_user_company_id() 
     AND EXISTS (
       SELECT 1 FROM users 
       WHERE id = auth.uid() 
         AND role IN ('agent', 'admin', 'super_admin')
         AND is_active = true
     ))
  );

-- Customers can create requests
CREATE POLICY \"Customers create requests\" ON support_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND company_id = get_user_company_id()
  );

-- Agents can update assigned requests
CREATE POLICY \"Agents update assigned requests\" ON support_requests
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR 
    (company_id = get_user_company_id() AND is_company_admin())
  );
" "Creating support requests policies"

# Step 6: Chat rooms policies
echo "💬 Setting up chat rooms policies..."
execute_sql "
-- Users can see chat rooms they participate in
CREATE POLICY \"Participants see chat rooms\" ON chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(participants)
    OR 
    (company_id = get_user_company_id() AND is_company_admin())
  );

-- Users can create chat rooms
CREATE POLICY \"Users create chat rooms\" ON chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND company_id = get_user_company_id()
    AND auth.uid() = ANY(participants)
  );

-- Participants can update chat rooms
CREATE POLICY \"Participants update chat rooms\" ON chat_rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(participants));
" "Creating chat rooms policies"

# Step 7: Messages policies
echo "📨 Setting up messages policies..."
execute_sql "
-- Users can see messages from accessible chat rooms
CREATE POLICY \"Participants see messages\" ON messages
  FOR SELECT
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT id FROM chat_rooms 
      WHERE auth.uid() = ANY(participants)
    )
  );

-- Users can send messages to accessible chat rooms
CREATE POLICY \"Participants send messages\" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND chat_room_id IN (
      SELECT id FROM chat_rooms 
      WHERE auth.uid() = ANY(participants)
        AND is_active = true
    )
  );

-- Users can update their own messages
CREATE POLICY \"Users edit own messages\" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
  );
" "Creating messages policies"

# Step 8: Notifications policies
echo "🔔 Setting up notifications policies..."
execute_sql "
-- Users can see their own notifications
CREATE POLICY \"Users see own notifications\" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY \"System create notifications\" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY \"Users update own notifications\" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
" "Creating notifications policies"

# Step 9: Enable realtime
echo "⚡ Enabling real-time subscriptions..."
execute_sql "
-- Enable real-time for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE support_requests;
" "Enabling real-time subscriptions"

echo ""
echo "🎉 Security setup completed!"
echo ""
echo "🔐 Security Features Enabled:"
echo "• Row Level Security on all tables"
echo "• Company-based data isolation"
echo "• Role-based access control"
echo "• Real-time subscriptions with security"
echo ""
echo "📋 Next steps:"
echo "1. Test authentication in your app"
echo "2. Verify data isolation works correctly"
echo "3. Test real-time features"
echo ""