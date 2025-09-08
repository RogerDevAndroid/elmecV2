-- =============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Seguridad granular para app móvil + dashboard
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- COMPANIES POLICIES
-- =============================================================================

-- Super admins can see all companies
CREATE POLICY "Super admins full access" ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
        AND users.role = 'super_admin'
        AND users.is_active = true
    )
  );

-- Users can only see their own company
CREATE POLICY "Users see own company" ON companies
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Company admins can update their company
CREATE POLICY "Company admins update own company" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can see their own profile
CREATE POLICY "Users see own profile" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users in same company can see each other (for directory, chat, etc.)
CREATE POLICY "Same company users visibility" ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
    AND is_active = true
  );

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Company admins can manage users in their company
CREATE POLICY "Company admins manage users" ON users
  FOR ALL
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- =============================================================================
-- LEADS POLICIES
-- =============================================================================

-- Company users can see leads from their company
CREATE POLICY "Company leads visibility" ON leads
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Agents can see their assigned leads
CREATE POLICY "Agents see assigned leads" ON leads
  FOR SELECT
  TO authenticated
  USING (
    assigned_agent_id = auth.uid()
  );

-- Agents and admins can create leads
CREATE POLICY "Agents create leads" ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('agent', 'broker', 'admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- Agents can update their assigned leads, admins can update all company leads
CREATE POLICY "Agents update assigned leads" ON leads
  FOR UPDATE
  TO authenticated
  USING (
    assigned_agent_id = auth.uid()
    OR 
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- =============================================================================
-- LEAD ACTIVITIES POLICIES
-- =============================================================================

-- Users can see activities for leads they have access to
CREATE POLICY "Lead activities visibility" ON lead_activities
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads 
      WHERE assigned_agent_id = auth.uid()
        OR company_id = (
          SELECT company_id FROM users 
          WHERE users.id = auth.uid()
        )
    )
  );

-- Agents can create activities for their leads
CREATE POLICY "Agents create activities" ON lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid()
    AND lead_id IN (
      SELECT id FROM leads 
      WHERE assigned_agent_id = auth.uid()
        OR company_id = (
          SELECT company_id FROM users 
          WHERE users.id = auth.uid() 
            AND users.role IN ('agent', 'broker', 'admin', 'super_admin')
        )
    )
  );

-- Agents can update their own activities
CREATE POLICY "Agents update own activities" ON lead_activities
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

-- =============================================================================
-- SUPPORT REQUESTS POLICIES
-- =============================================================================

-- Customers can see their own requests
CREATE POLICY "Customers see own requests" ON support_requests
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Agents can see assigned requests and requests from their company
CREATE POLICY "Agents see company requests" ON support_requests
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR 
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('agent', 'admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- Customers can create requests
CREATE POLICY "Customers create requests" ON support_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Customers can update their own requests (limited fields)
CREATE POLICY "Customers update own requests" ON support_requests
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

-- Agents can update assigned requests
CREATE POLICY "Agents update assigned requests" ON support_requests
  FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR 
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- =============================================================================
-- CHAT ROOMS POLICIES
-- =============================================================================

-- Users can see chat rooms they participate in
CREATE POLICY "Participants see chat rooms" ON chat_rooms
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(participants)
    OR 
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- Users can create chat rooms in their company
CREATE POLICY "Users create chat rooms" ON chat_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
    AND auth.uid() = ANY(participants)
  );

-- Participants can update chat room metadata
CREATE POLICY "Participants update chat rooms" ON chat_rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(participants));

-- =============================================================================
-- MESSAGES POLICIES
-- =============================================================================

-- Users can see messages from chat rooms they participate in
CREATE POLICY "Participants see messages" ON messages
  FOR SELECT
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT id FROM chat_rooms 
      WHERE auth.uid() = ANY(participants)
    )
  );

-- Users can send messages to chat rooms they participate in
CREATE POLICY "Participants send messages" ON messages
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

-- Users can update their own messages (for editing)
CREATE POLICY "Users edit own messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
  );

-- Users can "delete" their own messages (soft delete)
CREATE POLICY "Users delete own messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND is_deleted = false
  );

-- =============================================================================
-- NOTIFICATIONS POLICIES
-- =============================================================================

-- Users can see their own notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications for any user (handled by functions)
CREATE POLICY "System create notifications" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic and functions

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- ANALYTICS POLICIES
-- =============================================================================

-- Users can see analytics for their company
CREATE POLICY "Company analytics visibility" ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('agent', 'broker', 'admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- Users can create their own analytics events
CREATE POLICY "Users create analytics" ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- =============================================================================
-- DAILY METRICS POLICIES
-- =============================================================================

-- Agents can see their own metrics
CREATE POLICY "Agents see own metrics" ON daily_metrics
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Company admins can see all company metrics
CREATE POLICY "Admins see company metrics" ON daily_metrics
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- System can insert/update metrics (via functions)
CREATE POLICY "System manage metrics" ON daily_metrics
  FOR ALL
  TO authenticated
  USING (true); -- Controlled by scheduled functions

-- =============================================================================
-- INTEGRATIONS POLICIES
-- =============================================================================

-- Only company admins can manage integrations
CREATE POLICY "Admins manage integrations" ON integrations
  FOR ALL
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'super_admin')
        AND users.is_active = true
    )
  );

-- Company users can view integration status
CREATE POLICY "Users view integrations status" ON integrations
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- =============================================================================
-- FILE ATTACHMENTS POLICIES
-- =============================================================================

-- Users can see files they uploaded
CREATE POLICY "Users see own files" ON file_attachments
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Users can see public files from their company
CREATE POLICY "Company public files" ON file_attachments
  FOR SELECT
  TO authenticated
  USING (
    is_public = true
    AND company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Users can see files related to entities they have access to
CREATE POLICY "Related entity files" ON file_attachments
  FOR SELECT
  TO authenticated
  USING (
    -- Files attached to messages in accessible chat rooms
    (entity_type = 'message' AND entity_id IN (
      SELECT m.id FROM messages m
      JOIN chat_rooms cr ON cr.id = m.chat_room_id
      WHERE auth.uid() = ANY(cr.participants)
    ))
    OR
    -- Files attached to support requests user has access to
    (entity_type = 'request' AND entity_id IN (
      SELECT sr.id FROM support_requests sr
      WHERE sr.customer_id = auth.uid()
        OR sr.agent_id = auth.uid()
        OR sr.company_id = (
          SELECT company_id FROM users 
          WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    ))
  );

-- Users can upload files
CREATE POLICY "Users upload files" ON file_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND company_id = (
      SELECT company_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to check if user has admin role in their company
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a specific lead
CREATE OR REPLACE FUNCTION can_access_lead(lead_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_uuid
      AND (
        l.assigned_agent_id = auth.uid()
        OR l.company_id = get_user_company_id()
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a support request
CREATE OR REPLACE FUNCTION can_access_support_request(request_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM support_requests sr
    WHERE sr.id = request_uuid
      AND (
        sr.customer_id = auth.uid()
        OR sr.agent_id = auth.uid()
        OR (sr.company_id = get_user_company_id() AND is_company_admin())
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REAL-TIME SUBSCRIPTIONS POLICIES
-- =============================================================================

-- Enable real-time for authenticated users on their accessible data
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE support_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- =============================================================================
-- BYPASS RLS FOR FUNCTIONS
-- =============================================================================

-- Grant necessary permissions for system functions to bypass RLS when needed
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create service role for backend operations (bypasses RLS)
-- This would be configured in Supabase dashboard with service_role key