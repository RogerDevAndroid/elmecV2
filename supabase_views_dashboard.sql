-- =============================================================================
-- DASHBOARD VIEWS & FUNCTIONS
-- Vistas optimizadas para el dashboard de métricas y reportes
-- =============================================================================

-- =============================================================================
-- REVENUE & PERFORMANCE VIEWS
-- =============================================================================

-- Vista principal de métricas de ingresos
CREATE OR REPLACE VIEW dashboard_revenue_metrics AS
SELECT 
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(CASE WHEN o.stage = 'closed_won' THEN 1 END) as total_sales,
  COALESCE(SUM(CASE WHEN o.stage = 'closed_won' THEN o.amount END), 0) as total_revenue,
  COUNT(*) as total_opportunities,
  ROUND(
    COUNT(CASE WHEN o.stage = 'closed_won' THEN 1 END)::decimal / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate,
  AVG(o.amount) as avg_deal_size,
  COUNT(DISTINCT l.assigned_agent_id) as active_agents
FROM opportunities o
LEFT JOIN leads l ON o.lead_id = l.id
WHERE o.created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;

-- Vista de rendimiento por agente (para la tabla del dashboard)
CREATE OR REPLACE VIEW dashboard_agent_performance AS
SELECT 
  u.id,
  u.full_name,
  u.category,
  u.avatar_url,
  
  -- Leads metrics
  COUNT(DISTINCT l.id) as leads_total,
  COUNT(DISTINCT CASE WHEN l.status IN ('closed_won', 'conversion_date') THEN l.id END) as leads_converted,
  ROUND(
    COUNT(DISTINCT CASE WHEN l.status IN ('closed_won') THEN l.id END)::decimal /
    NULLIF(COUNT(DISTINCT l.id), 0) * 100, 2
  ) as conversion_rate,
  
  -- Activities
  COUNT(CASE WHEN la.type = 'call' THEN 1 END) as total_calls,
  COUNT(CASE WHEN la.type = 'meeting' AND la.status = 'completed' THEN 1 END) as meetings_completed,
  COUNT(CASE WHEN la.type = 'presentation' THEN 1 END) as presentations_given,
  
  -- Revenue
  COALESCE(SUM(CASE WHEN o.stage = 'closed_won' THEN o.amount END), 0) as total_revenue,
  
  -- Support metrics
  COUNT(DISTINCT sr.id) as support_requests_handled,
  ROUND(AVG(sr.satisfaction_rating), 1) as avg_satisfaction,
  
  -- Response times (in minutes)
  ROUND(
    AVG(EXTRACT(EPOCH FROM (sr.first_response_at - sr.created_at))/60)
  ) as avg_first_response_minutes,
  
  -- Activity score (composite metric)
  ROUND(
    (COUNT(CASE WHEN la.type = 'call' THEN 1 END) * 1.0 +
     COUNT(CASE WHEN la.type = 'meeting' THEN 1 END) * 2.0 +
     COUNT(CASE WHEN la.type = 'presentation' THEN 1 END) * 3.0 +
     COUNT(DISTINCT CASE WHEN l.status = 'closed_won' THEN l.id END) * 5.0) / 100.0, 
    1
  ) as activity_score

FROM users u
LEFT JOIN leads l ON l.assigned_agent_id = u.id 
  AND l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN lead_activities la ON la.agent_id = u.id 
  AND la.created_at >= DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN opportunities o ON o.agent_id = u.id 
  AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN support_requests sr ON sr.agent_id = u.id 
  AND sr.created_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.role IN ('agent', 'broker') 
  AND u.is_active = true
GROUP BY u.id, u.full_name, u.category, u.avatar_url
ORDER BY total_revenue DESC, activity_score DESC;

-- Vista de rendimiento por canal de marketing
CREATE OR REPLACE VIEW dashboard_channel_performance AS
SELECT 
  l.source as channel,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as leads_converted,
  ROUND(
    COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END)::decimal / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as conversion_rate,
  COALESCE(SUM(o.amount), 0) as total_revenue,
  ROUND(AVG(o.amount), 2) as avg_deal_value,
  
  -- ROI calculation (revenue / spend)
  CASE 
    WHEN SUM(c.budget_spent) > 0 THEN 
      ROUND((COALESCE(SUM(o.amount), 0) / SUM(c.budget_spent)) * 100, 0)
    ELSE 0
  END as roi_percentage,
  
  SUM(c.budget_spent) as total_spent

FROM leads l
LEFT JOIN opportunities o ON o.lead_id = l.id AND o.stage = 'closed_won'
LEFT JOIN campaigns c ON c.id = l.campaign_id
WHERE l.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY l.source
ORDER BY total_revenue DESC;

-- =============================================================================
-- ACTIVITY TRACKING VIEWS
-- =============================================================================

-- Vista de actividades recientes para timeline
CREATE OR REPLACE VIEW dashboard_recent_activities AS
SELECT 
  'lead_activity' as activity_type,
  la.id,
  u.full_name as agent_name,
  u.avatar_url,
  la.type as action_type,
  CONCAT(l.first_name, ' ', l.last_name) as target_name,
  la.subject as description,
  la.created_at,
  CASE 
    WHEN la.type = 'call' THEN '📞'
    WHEN la.type = 'email' THEN '📧'
    WHEN la.type = 'meeting' THEN '🤝'
    WHEN la.type = 'presentation' THEN '📊'
    ELSE '📝'
  END as icon

FROM lead_activities la
JOIN users u ON la.agent_id = u.id
JOIN leads l ON la.lead_id = l.id
WHERE la.created_at >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'support_request' as activity_type,
  sr.id,
  CASE 
    WHEN u.full_name IS NOT NULL THEN u.full_name
    ELSE 'Sistema'
  END as agent_name,
  u.avatar_url,
  sr.status as action_type,
  customer.full_name as target_name,
  sr.title as description,
  sr.created_at,
  CASE 
    WHEN sr.priority = 'urgent' THEN '🚨'
    WHEN sr.priority = 'high' THEN '⚡'
    ELSE '🎫'
  END as icon

FROM support_requests sr
LEFT JOIN users u ON sr.agent_id = u.id
JOIN users customer ON sr.customer_id = customer.id
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '7 days'

ORDER BY created_at DESC
LIMIT 50;

-- Vista de llamadas y reuniones (para sección de presentaciones)
CREATE OR REPLACE VIEW dashboard_presentations_meetings AS
SELECT 
  DATE_TRUNC('month', la.created_at) as month,
  
  -- Zoom meetings
  COUNT(CASE 
    WHEN la.type = 'meeting' 
    AND la.metadata->>'platform' = 'zoom' 
    THEN 1 
  END) as zoom_meetings,
  
  -- Presential meetings
  COUNT(CASE 
    WHEN la.type = 'meeting' 
    AND la.metadata->>'platform' = 'presential' 
    THEN 1 
  END) as presential_meetings,
  
  -- Presentations
  COUNT(CASE WHEN la.type = 'presentation' THEN 1 END) as presentations,
  
  -- Calls (VAPI, manual)
  COUNT(CASE 
    WHEN la.type = 'call' 
    AND la.metadata->>'platform' = 'vapi' 
    THEN 1 
  END) as vapi_calls,
  
  COUNT(CASE 
    WHEN la.type = 'call' 
    AND (la.metadata->>'platform' != 'vapi' OR la.metadata->>'platform' IS NULL)
    THEN 1 
  END) as manual_calls,
  
  -- Total duration
  SUM(CASE WHEN la.type IN ('call', 'meeting') THEN la.duration_minutes ELSE 0 END) as total_duration_minutes,
  
  -- Average duration
  ROUND(AVG(CASE WHEN la.type IN ('call', 'meeting') THEN la.duration_minutes END), 1) as avg_duration_minutes

FROM lead_activities la
WHERE la.created_at >= DATE_TRUNC('year', CURRENT_DATE)
  AND la.type IN ('call', 'meeting', 'presentation')
GROUP BY DATE_TRUNC('month', la.created_at)
ORDER BY month DESC;

-- =============================================================================
-- REAL-TIME METRICS VIEWS
-- =============================================================================

-- KPI Cards del dashboard
CREATE OR REPLACE VIEW dashboard_kpi_cards AS
SELECT 
  -- Total revenue this month
  (SELECT COALESCE(SUM(amount), 0) 
   FROM opportunities 
   WHERE stage = 'closed_won' 
     AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as monthly_revenue,
  
  -- Revenue change vs last month
  (SELECT 
    CASE 
      WHEN last_month_revenue > 0 THEN 
        ROUND(((current_month_revenue - last_month_revenue) / last_month_revenue) * 100, 1)
      ELSE 0 
    END
   FROM (
     SELECT 
       COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount END), 0) as current_month_revenue,
       COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                              AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN amount END), 0) as last_month_revenue
     FROM opportunities 
     WHERE stage = 'closed_won'
   ) rev_comparison
  ) as revenue_change_percent,
  
  -- Total sales this month
  (SELECT COUNT(*) 
   FROM opportunities 
   WHERE stage = 'closed_won' 
     AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as monthly_sales,
  
  -- Total leads this month
  (SELECT COUNT(*) 
   FROM leads 
   WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) as monthly_leads,
  
  -- Leads change vs last month
  (SELECT 
    CASE 
      WHEN last_month_leads > 0 THEN 
        ROUND(((current_month_leads - last_month_leads)::decimal / last_month_leads) * 100, 1)
      ELSE 0 
    END
   FROM (
     SELECT 
       COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month_leads,
       COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                        AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as last_month_leads
     FROM leads
   ) leads_comparison
  ) as leads_change_percent,
  
  -- Conversion rate this month
  (SELECT 
    CASE 
      WHEN total_leads > 0 THEN ROUND((converted_leads::decimal / total_leads) * 100, 1)
      ELSE 0 
    END
   FROM (
     SELECT 
       COUNT(*) as total_leads,
       COUNT(CASE WHEN status = 'closed_won' THEN 1 END) as converted_leads
     FROM leads 
     WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
   ) conv_calc
  ) as monthly_conversion_rate;

-- Vista de integraciones y su estado
CREATE OR REPLACE VIEW dashboard_integrations_status AS
SELECT 
  i.name,
  i.type,
  i.status,
  i.last_sync_at,
  i.last_sync_status,
  
  -- Recent sync activity
  (SELECT COUNT(*) 
   FROM integration_sync_logs isl 
   WHERE isl.integration_id = i.id 
     AND isl.started_at >= CURRENT_DATE - INTERVAL '1 day'
  ) as syncs_today,
  
  -- Error count
  (SELECT COUNT(*) 
   FROM integration_sync_logs isl 
   WHERE isl.integration_id = i.id 
     AND isl.status = 'failed'
     AND isl.started_at >= CURRENT_DATE - INTERVAL '7 days'
  ) as errors_last_week,
  
  -- Last successful sync
  (SELECT MAX(completed_at) 
   FROM integration_sync_logs isl 
   WHERE isl.integration_id = i.id 
     AND isl.status = 'completed'
  ) as last_successful_sync,
  
  CASE 
    WHEN i.last_sync_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN '🟢'
    WHEN i.last_sync_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN '🟡'
    WHEN i.last_sync_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN '🟠'
    ELSE '🔴'
  END as status_indicator

FROM integrations i
ORDER BY i.name;

-- =============================================================================
-- TRENDS ANALYSIS VIEWS
-- =============================================================================

-- Vista para gráfico de tendencias de rendimiento
CREATE OR REPLACE VIEW dashboard_performance_trends AS
SELECT 
  DATE_TRUNC('week', DATE_SERIES) as week,
  
  -- Leads metrics
  COUNT(l.id) as leads_created,
  COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END) as leads_converted,
  
  -- Activities
  COUNT(CASE WHEN la.type = 'call' THEN 1 END) as calls_made,
  COUNT(CASE WHEN la.type = 'meeting' AND la.status = 'completed' THEN 1 END) as meetings_held,
  COUNT(CASE WHEN la.type = 'presentation' THEN 1 END) as presentations_given,
  
  -- Revenue
  COALESCE(SUM(CASE WHEN o.stage = 'closed_won' THEN o.amount END), 0) as revenue_generated

FROM generate_series(
  DATE_TRUNC('week', CURRENT_DATE - INTERVAL '12 weeks'),
  DATE_TRUNC('week', CURRENT_DATE),
  '1 week'::interval
) as DATE_SERIES
LEFT JOIN leads l ON DATE_TRUNC('week', l.created_at) = DATE_SERIES
LEFT JOIN lead_activities la ON DATE_TRUNC('week', la.created_at) = DATE_SERIES
LEFT JOIN opportunities o ON DATE_TRUNC('week', o.created_at) = DATE_SERIES
GROUP BY DATE_SERIES
ORDER BY week;

-- =============================================================================
-- SUPPORT METRICS VIEWS
-- =============================================================================

-- Vista de métricas de soporte para dashboard
CREATE OR REPLACE VIEW dashboard_support_metrics AS
SELECT 
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status IN ('new', 'assigned') THEN 1 END) as open_requests,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_requests,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_requests,
  
  -- Response times
  ROUND(AVG(
    CASE 
      WHEN first_response_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (first_response_at - created_at))/3600 
    END
  ), 1) as avg_first_response_hours,
  
  ROUND(AVG(
    CASE 
      WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
    END
  ), 1) as avg_resolution_hours,
  
  -- Satisfaction
  ROUND(AVG(satisfaction_rating), 1) as avg_satisfaction,
  COUNT(CASE WHEN satisfaction_rating >= 4 THEN 1 END) as satisfied_customers,
  
  -- Priority breakdown
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_requests,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_requests,
  
  -- Overdue requests (no response in 24 hours for high priority)
  COUNT(CASE 
    WHEN priority IN ('urgent', 'high') 
      AND first_response_at IS NULL 
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    THEN 1 
  END) as overdue_requests

FROM support_requests
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- =============================================================================
-- CHAT METRICS VIEWS
-- =============================================================================

-- Vista de métricas de chat
CREATE OR REPLACE VIEW dashboard_chat_metrics AS
SELECT 
  COUNT(DISTINCT cr.id) as total_chat_rooms,
  COUNT(DISTINCT CASE WHEN cr.is_active THEN cr.id END) as active_chats,
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT m.sender_id) as active_users,
  
  -- Message types
  COUNT(CASE WHEN m.message_type = 'text' THEN 1 END) as text_messages,
  COUNT(CASE WHEN m.message_type = 'image' THEN 1 END) as image_messages,
  COUNT(CASE WHEN m.message_type = 'file' THEN 1 END) as file_messages,
  COUNT(CASE WHEN m.message_type = 'audio' THEN 1 END) as audio_messages,
  
  -- Average response time (time between customer message and agent response)
  ROUND(AVG(
    CASE 
      WHEN lag(m.sender_id) OVER (PARTITION BY cr.id ORDER BY m.created_at) != m.sender_id
      THEN EXTRACT(EPOCH FROM (
        m.created_at - lag(m.created_at) OVER (PARTITION BY cr.id ORDER BY m.created_at)
      ))/60
    END
  ), 1) as avg_response_time_minutes

FROM chat_rooms cr
LEFT JOIN messages m ON m.chat_room_id = cr.id
WHERE cr.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND m.created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- =============================================================================
-- FUNCTIONS FOR DASHBOARD
-- =============================================================================

-- Function to get goal progress
CREATE OR REPLACE FUNCTION get_goal_progress(
  p_agent_id uuid,
  p_metric_type text, -- 'revenue', 'leads', 'calls', 'meetings'
  p_target_value decimal,
  p_period text DEFAULT 'month' -- 'month', 'quarter', 'year'
)
RETURNS TABLE(
  current_value decimal,
  target_value decimal,
  progress_percentage decimal,
  remaining_days integer,
  daily_pace_needed decimal,
  on_track boolean
) AS $$
DECLARE
  start_date timestamptz;
  end_date timestamptz;
  total_days integer;
  elapsed_days integer;
BEGIN
  -- Calculate period dates
  CASE p_period
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', CURRENT_DATE);
      end_date := start_date + INTERVAL '1 month' - INTERVAL '1 day';
    WHEN 'quarter' THEN
      start_date := DATE_TRUNC('quarter', CURRENT_DATE);
      end_date := start_date + INTERVAL '3 months' - INTERVAL '1 day';
    WHEN 'year' THEN
      start_date := DATE_TRUNC('year', CURRENT_DATE);
      end_date := start_date + INTERVAL '1 year' - INTERVAL '1 day';
  END CASE;
  
  total_days := (end_date - start_date)::integer + 1;
  elapsed_days := (CURRENT_DATE - start_date::date)::integer + 1;
  
  RETURN QUERY
  SELECT 
    CASE p_metric_type
      WHEN 'revenue' THEN 
        COALESCE((SELECT SUM(amount) FROM opportunities o 
                  WHERE o.agent_id = p_agent_id 
                    AND o.stage = 'closed_won' 
                    AND o.created_at >= start_date), 0)
      WHEN 'leads' THEN 
        COALESCE((SELECT COUNT(*)::decimal FROM leads l 
                  WHERE l.assigned_agent_id = p_agent_id 
                    AND l.created_at >= start_date), 0)
      WHEN 'calls' THEN 
        COALESCE((SELECT COUNT(*)::decimal FROM lead_activities la 
                  WHERE la.agent_id = p_agent_id 
                    AND la.type = 'call' 
                    AND la.created_at >= start_date), 0)
      WHEN 'meetings' THEN 
        COALESCE((SELECT COUNT(*)::decimal FROM lead_activities la 
                  WHERE la.agent_id = p_agent_id 
                    AND la.type = 'meeting' 
                    AND la.status = 'completed'
                    AND la.created_at >= start_date), 0)
      ELSE 0
    END as current_value,
    
    p_target_value as target_value,
    
    CASE 
      WHEN p_target_value > 0 THEN 
        ROUND((current_value / p_target_value) * 100, 1)
      ELSE 0 
    END as progress_percentage,
    
    (end_date::date - CURRENT_DATE)::integer as remaining_days,
    
    CASE 
      WHEN (end_date::date - CURRENT_DATE)::integer > 0 THEN
        ROUND((p_target_value - current_value) / (end_date::date - CURRENT_DATE)::integer, 2)
      ELSE 0
    END as daily_pace_needed,
    
    CASE 
      WHEN elapsed_days > 0 AND total_days > 0 THEN
        (current_value / p_target_value) >= (elapsed_days::decimal / total_days)
      ELSE false
    END as on_track
    
  FROM (
    SELECT 1 -- dummy for FROM clause
  ) dummy;
END;
$$ LANGUAGE plpgsql;