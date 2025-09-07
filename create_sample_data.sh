#!/bin/bash

# =============================================================================
# SAMPLE DATA FOR ELMEC V2
# Creates demo company, users, and sample data for testing
# =============================================================================

SUPABASE_URL="https://aoghysichevnuaddsocl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2h5c2ljaGV2bnVhZGRzb2NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIyNDk2MSwiZXhwIjoyMDcyODAwOTYxfQ.PQXrCUjQvwefcl_Gie27sABN2iq2Q9D2RSFGV-hJCiM"

echo "🎯 Creating Sample Data for ElmecV2..."
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

# Step 1: Create demo company
echo "🏢 Creating demo company..."
execute_sql "
INSERT INTO companies (id, name, slug, email, phone, industry) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'ELMEC Soluciones',
  'elmec-soluciones',
  'info@elmec.com',
  '+52 555 123 4567',
  'Tecnología'
) ON CONFLICT (slug) DO NOTHING;
" "Creating ELMEC company"

# Step 2: Create demo users
echo "👥 Creating demo users..."

# Admin user
execute_sql "
INSERT INTO users (
  id, company_id, email, first_name, last_name, role, category, 
  zone, employee_id, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@elmec.com',
  'Admin',
  'Sistema',
  'admin',
  'Soporte',
  'Centro',
  'ADMIN001',
  true
) ON CONFLICT (email) DO NOTHING;
" "Creating admin user"

# Test customer
execute_sql "
INSERT INTO users (
  id, company_id, email, first_name, last_name, phone, city, state, role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'test@elmec.com',
  'Usuario',
  'Prueba',
  '+52 555 987 6543',
  'Ciudad de México',
  'CDMX',
  'customer'
) ON CONFLICT (email) DO NOTHING;
" "Creating test customer"

# Support agent
execute_sql "
INSERT INTO users (
  id, company_id, email, first_name, last_name, role, category,
  zone, employee_id, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'soporte@elmec.com',
  'María',
  'González',
  'agent',
  'Soporte',
  'Centro',
  'SUP001',
  true
) ON CONFLICT (email) DO NOTHING;
" "Creating support agent"

# Sales agent
execute_sql "
INSERT INTO users (
  id, company_id, email, first_name, last_name, role, category,
  zone, employee_id, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  'ventas@elmec.com',
  'Carlos',
  'Rodríguez',
  'agent',
  'Agentes de venta',
  'Norte',
  'VEN001',
  true
) ON CONFLICT (email) DO NOTHING;
" "Creating sales agent"

# Broker
execute_sql "
INSERT INTO users (
  id, company_id, email, first_name, last_name, role, category,
  zone, employee_id, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  'broker@elmec.com',
  'Ana',
  'López',
  'broker',
  'Brokers',
  'Sur',
  'BRK001',
  true
) ON CONFLICT (email) DO NOTHING;
" "Creating broker"

# Step 3: Create sample support requests
echo "🎫 Creating sample support requests..."
execute_sql "
INSERT INTO support_requests (
  id, company_id, customer_id, agent_id, title, description, priority, status
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  'Problema con la calculadora',
  'La calculadora de barrenado no está mostrando resultados correctos.',
  'medium',
  'assigned'
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  'Error de conexión',
  'No puedo conectarme al chat desde la aplicación móvil.',
  'high',
  'new'
) ON CONFLICT DO NOTHING;
" "Creating sample support requests"

# Step 4: Create sample chat room
echo "💬 Creating sample chat room..."
execute_sql "
INSERT INTO chat_rooms (
  id, company_id, type, participants, creator_id, support_request_id, name
) VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'support',
  ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'],
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440001',
  'Soporte - Problema con calculadora'
) ON CONFLICT DO NOTHING;
" "Creating sample chat room"

# Step 5: Create sample messages
echo "📨 Creating sample messages..."
execute_sql "
INSERT INTO messages (
  id, chat_room_id, sender_id, content, message_type
) VALUES (
  '880e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'Hola, tengo un problema con la calculadora de barrenado.',
  'text'
),
(
  '880e8400-e29b-41d4-a716-446655440002',
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440003',
  'Hola! Te ayudo con eso. ¿Podrías describir exactamente qué está pasando?',
  'text'
),
(
  '880e8400-e29b-41d4-a716-446655440003',
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'Cuando ingreso los valores para el cálculo, no aparecen los resultados.',
  'text'
) ON CONFLICT DO NOTHING;
" "Creating sample messages"

# Step 6: Create sample notifications
echo "🔔 Creating sample notifications..."
execute_sql "
INSERT INTO notifications (
  company_id, user_id, title, body, type, priority
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440002',
  'Bienvenido a ElmecV2',
  'Gracias por registrarte. Explora todas las funcionalidades disponibles.',
  'system',
  'medium'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440003',
  'Nueva solicitud asignada',
  'Se te ha asignado una nueva solicitud de soporte.',
  'assignment',
  'high'
) ON CONFLICT DO NOTHING;
" "Creating sample notifications"

echo ""
echo "🎉 Sample data created successfully!"
echo ""
echo "📊 Demo Data Summary:"
echo "• Company: ELMEC Soluciones"
echo "• Users: 5 (Admin, Customer, Support Agent, Sales Agent, Broker)"
echo "• Support Requests: 2"
echo "• Chat Room: 1 with 3 messages"
echo "• Notifications: 2"
echo ""
echo "🔐 Test Login Credentials:"
echo "• Admin: admin@elmec.com"
echo "• Customer: test@elmec.com"
echo "• Support: soporte@elmec.com"
echo "• Sales: ventas@elmec.com"
echo "• Broker: broker@elmec.com"
echo ""
echo "🚨 Important: Set up authentication passwords in Supabase Auth section"
echo ""