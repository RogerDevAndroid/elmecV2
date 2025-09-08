-- =============================================================================
-- SUPABASE SCHEMA FOR ELMEC V2 + DASHBOARD
-- Arquitectura escalable para app móvil + dashboard administrativo
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'agent', 'broker', 'admin', 'super_admin');
CREATE TYPE user_category AS ENUM ('Agentes de venta', 'Servicio al Cliente', 'Soporte', 'Brokers');
CREATE TYPE campaign_type AS ENUM ('facebook_ads', 'google_ads', 'instagram', 'whatsapp', 'referral', 'organic', 'events', 'cold_calling');
CREATE TYPE campaign_status AS ENUM ('active', 'paused', 'completed', 'draft');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurturing');
CREATE TYPE lead_activity_type AS ENUM ('call', 'email', 'meeting', 'presentation', 'proposal', 'follow_up', 'note', 'task');
CREATE TYPE lead_activity_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE opportunity_stage AS ENUM ('prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE support_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE support_status AS ENUM ('new', 'assigned', 'in_progress', 'pending_customer', 'resolved', 'closed');
CREATE TYPE chat_room_type AS ENUM ('support', 'sales', 'general', 'group');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'audio', 'video', 'system');
CREATE TYPE notification_type AS ENUM ('request_update', 'new_message', 'assignment', 'reminder', 'system', 'marketing');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending');
CREATE TYPE sync_status AS ENUM ('running', 'completed', 'failed');

-- =============================================================================
-- CORE TABLES (App Mobile + Dashboard)
-- =============================================================================

-- Companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  phone text,
  email text,
  website text,
  industry text,
  settings jsonb DEFAULT '{
    "business_hours": {
      "monday": {"start": "09:00", "end": "18:00", "active": true},
      "tuesday": {"start": "09:00", "end": "18:00", "active": true},
      "wednesday": {"start": "09:00", "end": "18:00", "active": true},
      "thursday": {"start": "09:00", "end": "18:00", "active": true},
      "friday": {"start": "09:00", "end": "18:00", "active": true},
      "saturday": {"start": "09:00", "end": "14:00", "active": false},
      "sunday": {"start": "09:00", "end": "14:00", "active": false}
    },
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "auto_assignment": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Users table (Unified for mobile app + dashboard)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text,
  
  -- Personal info
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  full_name text GENERATED ALWAYS AS (
    CASE 
      WHEN middle_name IS NOT NULL THEN first_name || ' ' || last_name || ' ' || middle_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  
  -- Contact info
  phone text,
  mobile text,
  city text,
  state text,
  country text DEFAULT 'México',
  timezone text DEFAULT 'America/Mexico_City',
  
  -- System info
  role text CHECK (role IN ('customer', 'agent', 'broker', 'admin', 'super_admin')) DEFAULT 'customer',
  category text CHECK (category IN ('Agentes de venta', 'Servicio al Cliente', 'Soporte', 'Brokers')),
  role user_role DEFAULT 'customer',
  category user_category,
  zone text,
  employee_id text UNIQUE,
  department text,
  
  -- Status
  is_active boolean DEFAULT true,
  is_online boolean DEFAULT false,
  last_seen timestamptz,
  last_login timestamptz,
  
  -- Media
  avatar_url text,
  
  -- Notifications
  fcm_tokens jsonb DEFAULT '[]'::jsonb,
  push_settings jsonb DEFAULT '{
    "enabled": true,
    "new_messages": true,
    "new_requests": true,
    "assignments": true,
    "updates": true
  }'::jsonb,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================================================
-- LEADS & MARKETING (Dashboard)
-- =============================================================================

-- Marketing campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('facebook_ads', 'google_ads', 'instagram', 'whatsapp', 'referral', 'organic', 'events', 'cold_calling')),
  status text CHECK (status IN ('active', 'paused', 'completed', 'draft')) DEFAULT 'active',
  type campaign_type,
  status campaign_status DEFAULT 'active',
  budget_total decimal(12,2),
  budget_spent decimal(12,2) DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  assigned_agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Lead info
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  company_name text,
  
  -- Lead source and tracking
  source text NOT NULL, -- 'facebook_ads', 'google_ads', etc.
  source_details jsonb DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  
  -- Lead status
  status text CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurturing')) DEFAULT 'new',
  status lead_status DEFAULT 'new',
  quality_score integer CHECK (quality_score BETWEEN 0 AND 100),
  
  -- Financial
  estimated_value decimal(12,2),
  probability integer CHECK (probability BETWEEN 0 AND 100) DEFAULT 0,
  
  -- Dates
  last_contact_date timestamptz,
  next_follow_up timestamptz,
  conversion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  CONSTRAINT email_or_phone_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Lead interactions/activities
CREATE TABLE lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  type text CHECK (type IN ('call', 'email', 'meeting', 'presentation', 'proposal', 'follow_up', 'note', 'task')) NOT NULL,
  type lead_activity_type NOT NULL,
  subject text,
  description text,
  outcome text,
  
  -- Call/Meeting specific
  duration_minutes integer,
  scheduled_at timestamptz,
  completed_at timestamptz,
  
  -- Status
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'completed',
  status lead_activity_status DEFAULT 'completed',
  
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Sales pipeline
CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  name text NOT NULL,
  stage text CHECK (stage IN ('prospect', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) DEFAULT 'prospect',
  stage opportunity_stage DEFAULT 'prospect',
  amount decimal(12,2) NOT NULL,
  probability integer CHECK (probability BETWEEN 0 AND 100) DEFAULT 0,
  close_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  
  metadata jsonb DEFAULT '{}'::jsonb
);

-- =============================================================================
-- SUPPORT SYSTEM (Mobile App)
-- =============================================================================

-- Support requests/tickets
CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  title text NOT NULL,
  description text NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status text CHECK (status IN ('new', 'assigned', 'in_progress', 'pending_customer', 'resolved', 'closed')) DEFAULT 'new',
  priority support_priority DEFAULT 'medium',
  status support_status DEFAULT 'new',
  category text,
  
  -- SLA tracking
  created_at timestamptz DEFAULT now(),
  assigned_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  due_date timestamptz,
  
  -- Satisfaction
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback text,
  
  -- Metadata
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{
    "source": "mobile",
    "urgency": false,
    "vip_customer": false
  }'::jsonb,
  
  updated_at timestamptz DEFAULT now()
);

-- Request status history
CREATE TABLE request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES support_requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  from_status text,
  to_status text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CHAT SYSTEM (Mobile App)
-- =============================================================================

-- Chat rooms
CREATE TABLE chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  type text CHECK (type IN ('support', 'sales', 'general', 'group')) DEFAULT 'support',
  type chat_room_type DEFAULT 'support',
  name text,
  participants uuid[] NOT NULL,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Related entities
  support_request_id uuid REFERENCES support_requests(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Last message cache
  last_message_id uuid,
  last_message_text text,
  last_message_at timestamptz,
  
  -- Unread counts (jsonb for performance)
  unread_counts jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  metadata jsonb DEFAULT '{
    "priority": "medium",
    "auto_close_hours": 24
  }'::jsonb
);

-- Messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- Message content
  content text NOT NULL,
  message_type text CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video', 'system')) DEFAULT 'text',
  message_type message_type DEFAULT 'text',
  
  -- File attachments
  file_url text,
  file_name text,
  file_size bigint,
  file_type text,
  
  -- Audio/Video specific
  duration_seconds integer,
  
  -- Message features
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  
  -- Read receipts (jsonb for performance)
  read_by jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  
  -- Reactions
  reactions jsonb DEFAULT '{}'::jsonb
);

-- =============================================================================
-- NOTIFICATIONS SYSTEM
-- =============================================================================

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  title text NOT NULL,
  body text NOT NULL,
  type text CHECK (type IN ('request_update', 'new_message', 'assignment', 'reminder', 'system', 'marketing')) NOT NULL,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  
  -- Related entities
  related_entity_type text,
  related_entity_id uuid,
  
  -- Delivery
  channels text[] DEFAULT ARRAY['push'], -- push, email, sms
  delivered_at timestamptz,
  read_at timestamptz,
  
  -- Status
  is_read boolean DEFAULT false,
  is_delivered boolean DEFAULT false,
  
  -- Expiration
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- =============================================================================
-- ANALYTICS & REPORTING (Dashboard)
-- =============================================================================

-- Events tracking
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id text,
  
  event_name text NOT NULL,
  event_category text,
  
  -- Event data
  properties jsonb DEFAULT '{}'::jsonb,
  
  -- Context
  page_url text,
  user_agent text,
  ip_address inet,
  device_type text,
  platform text,
  
  created_at timestamptz DEFAULT now()
);

-- Daily metrics aggregations (for dashboard performance)
CREATE TABLE daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  -- Leads metrics
  leads_created integer DEFAULT 0,
  leads_contacted integer DEFAULT 0,
  leads_converted integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  
  -- Activities
  calls_made integer DEFAULT 0,
  calls_duration_minutes integer DEFAULT 0,
  meetings_scheduled integer DEFAULT 0,
  meetings_completed integer DEFAULT 0,
  presentations_given integer DEFAULT 0,
  
  -- Revenue
  revenue_generated decimal(12,2) DEFAULT 0,
  opportunities_created integer DEFAULT 0,
  opportunities_won integer DEFAULT 0,
  
  -- Support metrics
  requests_handled integer DEFAULT 0,
  requests_resolved integer DEFAULT 0,
  avg_response_time_minutes integer DEFAULT 0,
  satisfaction_average decimal(3,2) DEFAULT 0,
  
  -- Chat metrics
  messages_sent integer DEFAULT 0,
  chats_initiated integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(company_id, agent_id, date)
);

-- =============================================================================
-- INTEGRATIONS (Dashboard)
-- =============================================================================

-- External integrations
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  
  name text NOT NULL, -- 'gohighlevel', 'zoom', 'whatsapp', 'vapi', etc.
  type text NOT NULL,
  status text CHECK (status IN ('active', 'inactive', 'error', 'pending')) DEFAULT 'pending',
  status integration_status DEFAULT 'pending',
  
  -- Configuration
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  credentials_encrypted text, -- encrypted credentials
  
  -- Sync status
  last_sync_at timestamptz,
  last_sync_status text,
  sync_errors jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(company_id, name)
);

-- Integration sync logs
CREATE TABLE integration_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  
  sync_type text NOT NULL, -- 'full', 'incremental', 'manual'
  status text CHECK (status IN ('running', 'completed', 'failed')) NOT NULL,
  status sync_status NOT NULL,
  
  records_processed integer DEFAULT 0,
  records_success integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  
  error_message text,
  details jsonb DEFAULT '{}'::jsonb,
  
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- =============================================================================
-- FILES & MEDIA
-- =============================================================================

-- File attachments
CREATE TABLE file_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  
  -- File info
  original_filename text NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  file_hash text, -- for deduplication
  
  -- Related entity
  entity_type text, -- 'message', 'request', 'user', 'company'
  entity_id uuid,
  
  -- Status
  is_public boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_online ON users(is_online);

-- Leads indexes
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up) WHERE next_follow_up IS NOT NULL;

-- Support requests indexes
CREATE INDEX idx_support_requests_company_id ON support_requests(company_id);
CREATE INDEX idx_support_requests_customer_id ON support_requests(customer_id);
CREATE INDEX idx_support_requests_agent_id ON support_requests(agent_id);
CREATE INDEX idx_support_requests_status ON support_requests(status);
CREATE INDEX idx_support_requests_priority ON support_requests(priority);
CREATE INDEX idx_support_requests_created_at ON support_requests(created_at);

-- Chat rooms indexes
CREATE INDEX idx_chat_rooms_company_id ON chat_rooms(company_id);
CREATE INDEX idx_chat_rooms_participants ON chat_rooms USING gin(participants);
CREATE INDEX idx_chat_rooms_support_request_id ON chat_rooms(support_request_id);
CREATE INDEX idx_chat_rooms_is_active ON chat_rooms(is_active);

-- Messages indexes
CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Analytics indexes
CREATE INDEX idx_analytics_events_company_id ON analytics_events(company_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);

-- Daily metrics indexes
CREATE INDEX idx_daily_metrics_company_agent_date ON daily_metrics(company_id, agent_id, date);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_requests_updated_at BEFORE UPDATE ON support_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update chat room last message
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms 
  SET 
    last_message_id = NEW.id,
    last_message_text = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.chat_room_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_room_last_message_trigger 
  AFTER INSERT ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_chat_room_last_message();

-- Function to create status history when request status changes
CREATE OR REPLACE FUNCTION track_request_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Intenta obtener el user_id del usuario autenticado, si no, usa el agent_id como fallback.
    -- Esto requiere que el role de la base de datos tenga acceso a auth.uid().
    DECLARE current_user_id uuid := auth.uid();
    INSERT INTO request_status_history (request_id, user_id, from_status, to_status, created_at)
    VALUES (NEW.id, NEW.agent_id, OLD.status, NEW.status, now());
    VALUES (NEW.id, COALESCE(current_user_id, NEW.agent_id), OLD.status, NEW.status, now());
    
    -- Update specific timestamp fields
    CASE NEW.status
      WHEN 'assigned' THEN
        NEW.assigned_at = now();
      WHEN 'resolved' THEN
        NEW.resolved_at = now();
      WHEN 'closed' THEN
        NEW.closed_at = now();
      ELSE
        -- Do nothing
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_support_request_status_trigger 
  BEFORE UPDATE ON support_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION track_request_status_change();