import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Types
interface UserProfile {
  id: string;
  company_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  full_name: string;
  phone: string | null;
  mobile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  role: 'customer' | 'agent' | 'broker' | 'admin' | 'super_admin';
  category: 'Agentes de venta' | 'Servicio al Cliente' | 'Soporte' | 'Brokers' | null;
  zone: string | null;
  employee_id: string | null;
  department: string | null;
  is_active: boolean;
  is_online: boolean;
  last_seen: string | null;
  avatar_url: string | null;
  fcm_tokens: string[];
  push_settings: {
    enabled: boolean;
    new_messages: boolean;
    new_requests: boolean;
    assignments: boolean;
    updates: boolean;
  };
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  city?: string;
  state?: string;
  role?: 'customer' | 'agent';
  category?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

// For backward compatibility with existing code
export const useFirebaseAuth = useSupabaseAuth;

interface AuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
          
          // Update online status
          await updateOnlineStatus(session.user.id, true);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          ...(isOnline && { last_login: new Date().toISOString() })
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    // Profile will be loaded automatically by auth state change listener
  };

  const register = async (userData: RegisterData) => {
    // Get default company (for demo purposes)
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    const defaultCompanyId = companies?.[0]?.id || '550e8400-e29b-41d4-a716-446655440000';

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        company_id: defaultCompanyId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        middle_name: userData.middleName,
        phone: userData.phone,
        city: userData.city,
        state: userData.state,
        role: userData.role || 'customer',
        category: userData.category,
        is_active: true
      });

    if (profileError) {
      // If profile creation fails, clean up auth user
      await supabase.auth.signOut();
      throw new Error('Error creating user profile: ' + profileError.message);
    }

    // Send welcome notification
    await supabase
      .from('notifications')
      .insert({
        company_id: defaultCompanyId,
        user_id: authData.user.id,
        title: 'Bienvenido a ElmecV2',
        body: 'Tu cuenta ha sido creada exitosamente. ¡Explora todas las funcionalidades!',
        type: 'system',
        priority: 'medium'
      });
  };

  const logout = async () => {
    if (user) {
      // Update online status before logout
      await updateOnlineStatus(user.id, false);
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      throw new Error('Error updating profile: ' + error.message);
    }

    // Refresh profile
    await loadUserProfile(user.id);
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadUserProfile(user.id);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// For backward compatibility
export const FirebaseAuthProvider = SupabaseAuthProvider;

export default SupabaseAuthProvider;