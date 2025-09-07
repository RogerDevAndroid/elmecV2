# 🚀 Guía de Migración ElmecV2 - Firebase a Supabase

## 📋 **Plan de Migración Completo**

### **Fase 1: Setup de Supabase (1-2 días)**

#### **1.1 Crear Proyecto Supabase**
```bash
# 1. Ir a https://app.supabase.com
# 2. Create New Project
# 3. Configurar:
#    - Name: elmec-v2-production
#    - Database Password: [generar password seguro]
#    - Region: South America (São Paulo) - más cercano a México
```

#### **1.2 Ejecutar Schema**
```sql
-- En Supabase SQL Editor, ejecutar en orden:
-- 1. supabase_schema.sql (tablas principales)
-- 2. supabase_views_dashboard.sql (vistas para dashboard)  
-- 3. supabase_security_rls.sql (políticas de seguridad)
```

#### **1.3 Configurar Variables de Entorno**
```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// Para React Native (.env)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Fase 2: Configurar Supabase Client (0.5 días)**

#### **2.1 Instalar Dependencias**
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react
npm install @supabase/auth-helpers-nextjs # Si usas Next.js para dashboard
```

#### **2.2 Crear Cliente Supabase**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Storage adapter para React Native
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
})
```

### **Fase 3: Migrar Autenticación (1 día)**

#### **3.1 Actualizar AuthContext**
```typescript
// contexts/SupabaseAuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, AuthChangeEvent } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUserProfile(profile)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const register = async (userData: RegisterData) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.correoElectronico,
      password: userData.password,
    })
    
    if (authError) throw authError

    // 2. Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.correoElectronico,
          first_name: userData.nombre,
          last_name: userData.apellidoPaterno,
          middle_name: userData.apellidoMaterno,
          phone: userData.celular,
          city: userData.ciudad,
          state: userData.estado,
          // ... otros campos
        })
        
      if (profileError) throw profileError
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### **Fase 4: Migrar Sistema de Chat (2-3 días)**

#### **4.1 Chat Service con Supabase**
```typescript
// services/chatService.ts
import { supabase } from '@/lib/supabase'

export class ChatService {
  // Crear sala de chat
  static async createChatRoom(participants: string[], type: string = 'support') {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        type,
        participants,
        creator_id: supabase.auth.user()?.id,
        company_id: await this.getUserCompanyId()
      })
      .select()
      .single()
      
    if (error) throw error
    return data
  }

  // Enviar mensaje
  static async sendMessage(chatRoomId: string, content: string, messageType = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_id: supabase.auth.user()?.id,
        content,
        message_type: messageType
      })
      .select()
      .single()
      
    if (error) throw error
    return data
  }

  // Suscribirse a mensajes en tiempo real
  static subscribeToMessages(chatRoomId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${chatRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${chatRoomId}`
      }, callback)
      .subscribe()
  }

  // Marcar mensajes como leídos
  static async markMessagesAsRead(chatRoomId: string) {
    const userId = supabase.auth.user()?.id
    const { error } = await supabase.rpc('mark_messages_as_read', {
      p_chat_room_id: chatRoomId,
      p_user_id: userId
    })
    
    if (error) throw error
  }
}
```

#### **4.2 Chat Context con Real-time**
```typescript
// contexts/ChatContext.tsx
export const ChatProvider = ({ children }) => {
  const [chatRooms, setChatRooms] = useState([])
  const [messages, setMessages] = useState({})
  const [activeSubscriptions, setActiveSubscriptions] = useState({})

  const subscribeToRoom = useCallback((roomId: string) => {
    if (activeSubscriptions[roomId]) return

    const subscription = ChatService.subscribeToMessages(roomId, (payload) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), payload.new]
      }))
    })

    setActiveSubscriptions(prev => ({
      ...prev,
      [roomId]: subscription
    }))
  }, [activeSubscriptions])

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      Object.values(activeSubscriptions).forEach(sub => sub?.unsubscribe())
    }
  }, [])

  return (
    <ChatContext.Provider value={{
      chatRooms,
      messages,
      subscribeToRoom,
      sendMessage: ChatService.sendMessage,
      createChatRoom: ChatService.createChatRoom
    }}>
      {children}
    </ChatContext.Provider>
  )
}
```

### **Fase 5: Migrar Gestión de Solicitudes (1-2 días)**

#### **5.1 Support Requests Service**
```typescript
// services/supportService.ts
export class SupportService {
  static async createRequest(requestData: CreateRequestData) {
    const { data, error } = await supabase
      .from('support_requests')
      .insert({
        title: requestData.titulo,
        description: requestData.mensaje,
        customer_id: supabase.auth.user()?.id,
        agent_id: requestData.agenteId,
        priority: requestData.prioridad,
        company_id: await this.getUserCompanyId()
      })
      .select()
      .single()
      
    if (error) throw error
    
    // Crear notificación para el agente
    await this.createNotification({
      user_id: requestData.agenteId,
      title: 'Nueva solicitud asignada',
      body: `Se te ha asignado: ${requestData.titulo}`,
      type: 'assignment'
    })
    
    return data
  }

  static async getUserRequests(userId: string) {
    const { data, error } = await supabase
      .from('support_requests')
      .select(`
        *,
        customer:users!customer_id(first_name, last_name),
        agent:users!agent_id(first_name, last_name)
      `)
      .or(`customer_id.eq.${userId},agent_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data
  }

  static async updateRequestStatus(requestId: string, status: string) {
    const { data, error } = await supabase
      .from('support_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single()
      
    if (error) throw error
    return data
  }
}
```

### **Fase 6: Configurar Push Notifications (1-2 días)**

#### **6.1 Expo Notifications Setup**
```typescript
// services/notificationService.ts
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'

export class NotificationService {
  static async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') return null

    const token = (await Notifications.getExpoPushTokenAsync()).data
    
    // Save token to user profile
    await supabase
      .from('users')
      .update({
        fcm_tokens: supabase.rpc('array_append', {
          array_col: 'fcm_tokens',
          new_element: token
        })
      })
      .eq('id', supabase.auth.user()?.id)
      
    return token
  }

  static async sendPushNotification(userId: string, title: string, body: string) {
    // Get user's tokens
    const { data: user } = await supabase
      .from('users')
      .select('fcm_tokens')
      .eq('id', userId)
      .single()
      
    if (!user?.fcm_tokens?.length) return

    // Send via Expo Push API
    const messages = user.fcm_tokens.map(token => ({
      to: token,
      title,
      body,
    }))

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  }
}
```

#### **6.2 Database Triggers para Notificaciones**
```sql
-- En Supabase SQL Editor
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into notifications table
  INSERT INTO notifications (
    user_id, 
    title, 
    body, 
    type,
    related_entity_type,
    related_entity_id,
    company_id
  ) VALUES (
    CASE 
      WHEN TG_TABLE_NAME = 'messages' THEN
        (SELECT unnest(participants) FROM chat_rooms WHERE id = NEW.chat_room_id AND unnest(participants) != NEW.sender_id LIMIT 1)
      WHEN TG_TABLE_NAME = 'support_requests' AND NEW.agent_id IS NOT NULL THEN
        NEW.agent_id
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'messages' THEN 'Nuevo mensaje'
      WHEN TG_TABLE_NAME = 'support_requests' THEN 'Nueva solicitud asignada'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'messages' THEN NEW.content
      WHEN TG_TABLE_NAME = 'support_requests' THEN NEW.title
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'messages' THEN 'new_message'
      WHEN TG_TABLE_NAME = 'support_requests' THEN 'assignment'
    END,
    TG_TABLE_NAME,
    NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'messages' THEN 
        (SELECT company_id FROM chat_rooms WHERE id = NEW.chat_room_id)
      WHEN TG_TABLE_NAME = 'support_requests' THEN 
        NEW.company_id
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification();

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON support_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification();
```

### **Fase 7: Dashboard Integration (2-3 días)**

#### **7.1 Dashboard API Routes (Next.js)**
```typescript
// pages/api/dashboard/metrics.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para bypass RLS
)

export default async function handler(req, res) {
  try {
    // KPI Cards
    const { data: kpis } = await supabase
      .from('dashboard_kpi_cards')
      .select('*')
      .single()
    
    // Agent Performance
    const { data: agents } = await supabase
      .from('dashboard_agent_performance')
      .select('*')
      .limit(10)
    
    // Channel Performance
    const { data: channels } = await supabase
      .from('dashboard_channel_performance')
      .select('*')
    
    res.json({
      kpis,
      agents,
      channels
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

#### **7.2 Real-time Dashboard Updates**
```typescript
// Dashboard component with real-time updates
export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null)
  
  useEffect(() => {
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_metrics'
      }, () => {
        // Refresh dashboard data
        fetchMetrics()
      })
      .subscribe()
      
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    // Dashboard UI components
  )
}
```

### **Fase 8: Testing y Deployment (1-2 días)**

#### **8.1 Testing Checklist**
```bash
# Functional Tests
- [ ] User registration/login
- [ ] Chat real-time messaging
- [ ] Support request creation/management
- [ ] Push notifications delivery
- [ ] Dashboard metrics accuracy
- [ ] File uploads
- [ ] Real-time presence

# Security Tests
- [ ] RLS policies working correctly
- [ ] Users can only access own company data
- [ ] API endpoints properly secured
- [ ] File access permissions
```

#### **8.2 Performance Optimization**
```sql
-- Adicionar indexes si es necesario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_created 
  ON messages(chat_room_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_agent_status 
  ON leads(assigned_agent_id, status) WHERE status != 'closed_lost';
```

### **Fase 9: Data Migration (1 día)**

#### **9.1 Migration Script**
```typescript
// scripts/migrate-firebase-to-supabase.ts
async function migrateUsers() {
  // 1. Export users from Firebase
  const firebaseUsers = await admin.auth().listUsers()
  
  // 2. Import to Supabase
  for (const user of firebaseUsers.users) {
    await supabase.auth.admin.createUser({
      email: user.email,
      password: generateTempPassword(), // Users will reset
      user_metadata: user.customClaims
    })
  }
}

async function migrateChatData() {
  // Similar process for chat rooms and messages
}
```

## 🎯 **Plan de Rollout**

### **Opción A: Migración Gradual (Recomendada)**
1. **Week 1**: Setup Supabase + Autenticación
2. **Week 2**: Chat + Notifications  
3. **Week 3**: Support Requests + Dashboard
4. **Week 4**: Testing + Data Migration + Go Live

### **Opción B: Migración Big Bang**
- Desarrollar todo en paralelo
- 1 día de migración de datos
- Switch completo en fin de semana

## 📊 **Ventajas de la Nueva Arquitectura**

✅ **Menos Complejidad**: 1 servicio vs 5 de Firebase  
✅ **Mejor Performance**: PostgreSQL optimizado para consultas complejas  
✅ **Real-time Nativo**: Sin configuraciones adicionales  
✅ **Costo Predictible**: Sin sorpresas por reads/writes  
✅ **SQL Familiar**: Queries más intuitivas  
✅ **Mejor Debugging**: Logs y queries más claros  

## 🚨 **Riesgos y Mitigaciones**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos en migración | Baja | Alto | Backup completo + testing |
| Downtime prolongado | Media | Alto | Migración gradual + rollback plan |
| Performance issues | Baja | Medio | Load testing + indexes |
| Auth issues | Media | Alto | Mantener Firebase auth hasta confirmar |

## 📞 **Soporte Durante Migración**

- **Testing Environment**: Configurar antes de producción
- **Rollback Plan**: Mantener Firebase activo 1 semana post-migración
- **Documentation**: Actualizar toda la documentación
- **Team Training**: Capacitar en Supabase vs Firebase

¿Quieres que empecemos con alguna fase específica o tienes preguntas sobre algún aspecto de la migración?