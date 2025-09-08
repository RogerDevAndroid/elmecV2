import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'expo-router';
import { User, Building, Mail, Phone, MapPin, Settings, LogOut, Bell, Shield, CircleHelp as HelpCircle, Trash2 } from 'lucide-react-native';

export default function Profile() {
  const { user, logout } = useFirebaseAuth();
  const { 
    inAppNotifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllAsRead, 
    clearNotifications,
    sendDemoNotification 
  } = useNotifications();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      title: 'Configuración',
      subtitle: 'Preferencias de la aplicación',
      icon: Settings,
      color: '#6b7280',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
    },
    {
      title: 'Notificaciones',
      subtitle: 'Gestionar alertas y avisos',
      icon: Bell,
      color: '#f59e0b',
      onPress: () => {
        // Show notification management options
        Alert.alert(
          'Gestionar Notificaciones',
          `Tienes ${unreadCount} notificaciones sin leer`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Marcar todas como leídas', 
              onPress: markAllAsRead 
            },
            { 
              text: 'Limpiar todas', 
              style: 'destructive',
              onPress: clearNotifications 
            },
          ]
        );
      },
    },
    {
      title: 'Privacidad y Seguridad',
      subtitle: 'Controla tu información',
      icon: Shield,
      color: '#10b981',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
    },
    {
      title: 'Ayuda y Soporte',
      subtitle: 'Centro de ayuda y FAQ',
      icon: HelpCircle,
      color: '#3b82f6',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nombre?.charAt(0)}{user?.apellidoPaterno?.charAt(0)}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.nombre} {user?.apellidoPaterno} {user?.apellidoMaterno}
          </Text>
          <Text style={styles.userEmail}>{user?.correoElectronico}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Building size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Empresa</Text>
                  <Text style={styles.infoValue}>{user?.empresa}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Mail size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Correo Electrónico</Text>
                  <Text style={styles.infoValue}>{user?.correoElectronico}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Phone size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{user?.celular}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <MapPin size={20} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>{user?.ciudad}, {user?.estado}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Demo Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notificaciones ({unreadCount})</Text>
            
            {/* Demo Notification Buttons */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo de Notificaciones</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity 
                  style={[styles.demoButton, { backgroundColor: '#eff6ff' }]}
                  onPress={() => sendDemoNotification('Información', 'Esta es una notificación de información', 'info')}
                >
                  <Text style={[styles.demoButtonText, { color: '#3b82f6' }]}>Info</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.demoButton, { backgroundColor: '#ecfdf5' }]}
                  onPress={() => sendDemoNotification('Éxito', 'Operación completada correctamente', 'success')}
                >
                  <Text style={[styles.demoButtonText, { color: '#10b981' }]}>Éxito</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.demoButton, { backgroundColor: '#fffbeb' }]}
                  onPress={() => sendDemoNotification('Advertencia', 'Esto requiere tu atención', 'warning')}
                >
                  <Text style={[styles.demoButtonText, { color: '#f59e0b' }]}>Advertencia</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.demoButton, { backgroundColor: '#fef2f2' }]}
                  onPress={() => sendDemoNotification('Error', 'Ha ocurrido un problema', 'error')}
                >
                  <Text style={[styles.demoButtonText, { color: '#ef4444' }]}>Error</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification List */}
            <View style={styles.notificationList}>
              {inAppNotifications.slice(0, 5).map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => markNotificationAsRead(notification.id)}
                >
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationBody}>{notification.body}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.timestamp).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))}
              
              {inAppNotifications.length === 0 && (
                <View style={styles.emptyNotifications}>
                  <Bell size={48} color="#d1d5db" />
                  <Text style={styles.emptyText}>No hay notificaciones</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración</Text>
            <View style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index < menuItems.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>ELMEC Mobile App</Text>
            <Text style={styles.footerVersion}>Versión 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  demoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  demoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  notificationList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#fef9e7',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    marginTop: 12,
  },
});