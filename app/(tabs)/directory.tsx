import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { FirebaseService } from '@/services/firebaseService';
import { User as FirebaseUser } from '@/types/firebase';
import { Search, Filter, Phone, Mail, MessageCircle, Send, MapPin } from 'lucide-react-native';

type PersonnelMember = FirebaseUser;

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedZone, setSelectedZone] = useState<string>('Todas');
  const [showFilters, setShowFilters] = useState(false);
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { createChatRoom } = useChat();
  const { sendDemoNotification } = useNotifications();
  const { user } = useFirebaseAuth();
  const router = useRouter();

  const categories = ['Todos', 'Agentes de venta', 'Servicio al Cliente', 'Soporte'];
  const zones = ['Todas', 'Norte', 'Sur', 'Centro', 'Este', 'Oeste'];

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      setLoading(true);
      const users = await FirebaseService.getDirectoryUsers();
      setPersonnel(users.filter(u => u.activo));
    } catch (error) {
      console.error('Error loading personnel:', error);
      Alert.alert('Error', 'No se pudo cargar el directorio');
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = person.nombreCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.idCorto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || person.categoria === selectedCategory;
    const matchesZone = selectedZone === 'Todas' || person.zona === selectedZone;
    return matchesSearch && matchesCategory && matchesZone;
  });

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl).then(supported => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'No se puede realizar la llamada');
      }
    });
  };

  const handleEmail = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el cliente de correo');
      }
    });
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp no está instalado');
      }
    });
  };

  const handleStartChat = async (person: PersonnelMember) => {
    try {
      const roomId = await createChatRoom(person.id, person.nombreCompleto);
      router.push(`/chat/${roomId}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el chat');
    }
  };

  const handleSendRequest = (person: PersonnelMember) => {
    Alert.alert(
      'Enviar Solicitud',
      `¿Deseas enviar una solicitud a ${person.nombreCompleto}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar', 
          onPress: async () => {
            if (!user) {
              Alert.alert('Error', 'Debes estar autenticado para enviar solicitudes');
              return;
            }
            
            try {
              await FirebaseService.createRequest({
                titulo: `Solicitud para ${person.nombreCompleto}`,
                descripcion: `Solicitud enviada desde el directorio`,
                categoria: 'General',
                prioridad: 'Media',
                usuarioId: user.uid,
                agenteAsignado: person.id,
                estado: 'Pendiente'
              });
              
              await sendDemoNotification(
                'Solicitud enviada',
                `Solicitud enviada a ${person.nombreCompleto}`,
                'success'
              );
              Alert.alert('Éxito', 'Solicitud enviada correctamente');
            } catch (error) {
              console.error('Error sending request:', error);
              Alert.alert('Error', 'No se pudo enviar la solicitud');
            }
          }
        }
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Agentes de venta':
        return '#3b82f6';
      case 'Servicio al Cliente':
        return '#10b981';
      case 'Soporte':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Directorio</Text>
        <Text style={styles.subtitle}>Personal disponible</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o ID..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#1e40af" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Categoría:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Zona:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {zones.map((zone) => (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.filterChip,
                    selectedZone === zone && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedZone(zone)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedZone === zone && styles.filterChipTextActive
                  ]}>
                    {zone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>Cargando directorio...</Text>
          </View>
        ) : filteredPersonnel.map((person) => (
          <View key={person.id} style={styles.personCard}>
            <View style={styles.personHeader}>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.nombreCompleto}</Text>
                <Text style={styles.personId}>ID: {person.idCorto}</Text>
                <View style={styles.personMeta}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(person.categoria)}15` }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(person.categoria) }]}>
                      {person.categoria}
                    </Text>
                  </View>
                  <View style={styles.zoneBadge}>
                    <MapPin size={12} color="#6b7280" />
                    <Text style={styles.zoneText}>{person.zona}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>{person.correoElectronico}</Text>
              <Text style={styles.contactText}>{person.telefono}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(person.telefono)}
              >
                <Phone size={16} color="#1e40af" />
                <Text style={styles.actionButtonText}>Llamar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleWhatsApp(person.telefono)}
              >
                <MessageCircle size={16} color="#10b981" />
                <Text style={styles.actionButtonText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEmail(person.correoElectronico)}
              >
                <Mail size={16} color="#f59e0b" />
                <Text style={styles.actionButtonText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.chatButton]}
                onPress={() => handleStartChat(person)}
              >
                <MessageCircle size={16} color="#8b5cf6" />
                <Text style={styles.actionButtonText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSendRequest(person)}
              >
                <Send size={16} color="#ef4444" />
                <Text style={styles.actionButtonText}>Solicitud</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!loading && filteredPersonnel.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No se encontró personal con los filtros seleccionados</Text>
          </View>
        )}
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
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  personCard: {
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
  personHeader: {
    marginBottom: 12,
  },
  personInfo: {
    gap: 8,
  },
  personName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  personId: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  personMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  contactInfo: {
    gap: 4,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    gap: 6,
    minWidth: '30%',
  },
  chatButton: {
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
});