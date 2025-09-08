import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext';
import { FirebaseService } from '@/services/firebaseService';
import { useRequestFilters } from '@/hooks/useRequestFilters';
import { RequestFiltersModal } from '@/components/RequestFiltersModal';
import { Plus, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Send, X, User, Filter, Search } from 'lucide-react-native';
import type { Request as FirebaseRequest, User as FirebaseUser } from '@/types/firebase';

// Using Firebase types
type Request = FirebaseRequest;

// Firebase data will be loaded dynamically

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [agents, setAgents] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    titulo: '',
    mensaje: '',
    agenteDestino: '',
  });
  const { sendLocalNotification } = useNotifications();
  const { sendDemoNotification } = useNotifications();
  const { userProfile: user } = useFirebaseAuth();
  
  // Use the custom hook for filtering
  const {
    filters,
    filteredRequests,
    totalCount,
    filteredCount,
    activeFiltersCount,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useRequestFilters(requests);

  // Load requests and agents from Firebase
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load user's requests
        const userRequests = await FirebaseService.getUserRequests(user.id, user.categoria || 'Cliente');
        setRequests(userRequests);
        
        // Load available agents (users with agent roles)
        const availableAgents = await FirebaseService.getDirectoryUsers('Soporte');
        setAgents(availableAgents);
        
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Listen for real-time request updates
  useEffect(() => {
    if (!user) return;

    // Note: subscribeToUserRequests doesn't exist in FirebaseService
    // We'll implement periodic refresh instead
    const interval = setInterval(async () => {
      try {
        const userRequests = await FirebaseService.getUserRequests(user.id, user.categoria || 'Cliente');
        setRequests(userRequests);
      } catch (error) {
        console.error('Error refreshing requests:', error);
      }
    }, 30000); // Refresh every 30 seconds

    const unsubscribe = () => clearInterval(interval);

    return unsubscribe;
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nuevo':
      case 'asignado':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'en_proceso':
        return <Clock size={16} color="#3b82f6" />;
      case 'pausado':
        return <AlertTriangle size={16} color="#f97316" />;
      case 'resuelto':
      case 'cerrado':
        return <CheckCircle size={16} color="#10b981" />;
      default:
        return <AlertTriangle size={16} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'nuevo':
        return 'Nuevo';
      case 'asignado':
        return 'Asignado';
      case 'en_proceso':
        return 'En proceso';
      case 'pausado':
        return 'Pausado';
      case 'resuelto':
        return 'Resuelto';
      case 'cerrado':
        return 'Cerrado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuevo':
      case 'asignado':
        return '#f59e0b';
      case 'en_proceso':
        return '#3b82f6';
      case 'pausado':
        return '#f97316';
      case 'resuelto':
      case 'cerrado':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateRequest = async () => {
    if (!newRequest.titulo || !newRequest.mensaje || !newRequest.agenteDestino || !user) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      const selectedAgent = agents.find(agent => agent.nombre === newRequest.agenteDestino);
      
      const requestData = {
         titulo: newRequest.titulo,
         mensaje: newRequest.mensaje,
         usuarioId: user.id,
         agenteId: selectedAgent?.id || '',
         tipo: 1, // General request type
         prioridad: 'media' as const,
         estatus: 'nuevo' as const,
         metadata: {
           source: 'mobile' as const,
           urgencia: false,
           cliente_vip: false
         },
         historialEstatus: []
       };

      const createdRequest = await FirebaseService.createRequest(requestData);
      
      // Refresh requests list
      const userRequests = await FirebaseService.getUserRequests(user.id, user.categoria || 'Cliente');
      setRequests(userRequests);
      
      setNewRequest({ titulo: '', mensaje: '', agenteDestino: '' });
      setShowNewRequestModal(false);
      
      // Send notification for new request
      await sendDemoNotification(
        'Solicitud enviada',
        `Tu solicitud "${createdRequest.titulo}" ha sido enviada correctamente`,
        'success',
        { requestId: createdRequest.id }
      );
      
      Alert.alert('Éxito', 'Solicitud enviada correctamente');
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Solicitudes</Text>
            <Text style={styles.subtitle}>
              {hasActiveFilters ? `${filteredCount} de ${totalCount}` : `${totalCount} solicitudes totales`}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive
              ]}
              onPress={() => setShowFiltersModal(true)}
            >
              <Filter size={20} color={hasActiveFilters ? '#ffffff' : '#6b7280'} />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowNewRequestModal(true)}
            >
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredRequests.length === 0 ? (
          hasActiveFilters ? (
            <View style={styles.emptyState}>
              <Search size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No se encontraron solicitudes</Text>
              <Text style={styles.emptySubtext}>
                No hay solicitudes que coincidan con los filtros aplicados
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersButtonEmpty}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersButtonEmptyText}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tienes solicitudes aún</Text>
              <Text style={styles.emptySubtext}>Toca el botón + para crear tu primera solicitud</Text>
            </View>
          )
        ) : (
          filteredRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestStatus}>
                {getStatusIcon(request.estatus)}
                <Text style={[styles.statusText, { color: getStatusColor(request.estatus) }]}>
                  {getStatusText(request.estatus)}
                </Text>
              </View>
              <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
            </View>

            <Text style={styles.requestTitle}>{request.titulo}</Text>
            <Text style={styles.requestMessage}>{request.mensaje}</Text>

            {request.agenteId && (
              <View style={styles.agentInfo}>
                <User size={16} color="#6b7280" />
                <Text style={styles.agentName}>Asignado a: {agents.find(a => a.id === request.agenteId)?.nombre || 'Agente'}</Text>
              </View>
            )}

            {request.feedback && (
               <View style={styles.responseContainer}>
                 <Text style={styles.responseLabel}>Respuesta del agente:</Text>
                 <Text style={styles.responseText}>{request.feedback}</Text>
               </View>
             )}
          </View>
          ))
        )}
      </ScrollView>

      {/* Filters Modal */}
      <RequestFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={updateFilters}
        agents={agents}
        currentFilters={filters}
        totalRequests={totalCount}
        filteredCount={filteredCount}
      />

      <Modal
        visible={showNewRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Solicitud</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNewRequestModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Título</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Describe brevemente tu solicitud"
                placeholderTextColor="#9ca3af"
                value={newRequest.titulo}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, titulo: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Agente Destino</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.agentsScroll}>
                {agents.map((agent) => (
                  <TouchableOpacity
                    key={agent.id}
                    style={[
                      styles.agentChip,
                      newRequest.agenteDestino === agent.nombre && styles.agentChipSelected
                    ]}
                    onPress={() => setNewRequest(prev => ({ ...prev, agenteDestino: agent.nombre }))}
                  >
                    <Text style={[
                      styles.agentChipText,
                      newRequest.agenteDestino === agent.nombre && styles.agentChipTextSelected
                    ]}>
                      {agent.nombre}
                    </Text>
                    <Text style={[
                      styles.agentChipCategory,
                      newRequest.agenteDestino === agent.nombre && styles.agentChipCategorySelected
                    ]}>
                      {agent.categoria || 'Soporte'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mensaje</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Describe tu solicitud en detalle..."
                placeholderTextColor="#9ca3af"
                value={newRequest.mensaje}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, mensaje: text }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateRequest}
            >
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearFiltersButton: {
    marginTop: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3b82f6',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  clearFiltersButtonEmpty: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFiltersButtonEmptyText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
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
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1e40af',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  requestDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  requestTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  requestMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  agentName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  responseContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  responseLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e3a8a',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  agentsScroll: {
    flexGrow: 0,
  },
  agentChip: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
  },
  agentChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  agentChipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  agentChipTextSelected: {
    color: '#1e40af',
  },
  agentChipCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  agentChipCategorySelected: {
    color: '#3b82f6',
  },
  submitButton: {
    backgroundColor: '#1e40af',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});