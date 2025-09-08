import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import {
  Filter,
  X,
  Calendar,
  User,
  Tag,
  AlertCircle,
  ChevronDown,
  Search,
  RotateCcw
} from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { REQUEST_STATUS, REQUEST_TYPES } from '@/constants/commons';
import type { User as FirebaseUser } from '@/types/firebase';

export interface RequestFilters {
  status?: string[];
  types?: number[];
  agents?: string[];
  priority?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  searchText?: string;
  tags?: string[];
  isUrgent?: boolean;
  isVIP?: boolean;
  hasResponse?: boolean;
}

interface RequestFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: RequestFilters) => void;
  agents: FirebaseUser[];
  currentFilters: RequestFilters;
  totalRequests: number;
  filteredCount: number;
}

const PRIORITY_OPTIONS = [
  { value: 'baja', label: 'Baja', color: '#10b981' },
  { value: 'media', label: 'Media', color: '#f59e0b' },
  { value: 'alta', label: 'Alta', color: '#f97316' },
  { value: 'urgente', label: 'Urgente', color: '#ef4444' }
];

const STATUS_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo', color: '#6b7280' },
  { value: 'asignado', label: 'Asignado', color: '#3b82f6' },
  { value: 'en_proceso', label: 'En Proceso', color: '#8b5cf6' },
  { value: 'pausado', label: 'Pausado', color: '#f59e0b' },
  { value: 'resuelto', label: 'Resuelto', color: '#10b981' },
  { value: 'cerrado', label: 'Cerrado', color: '#6b7280' }
];

const TYPE_OPTIONS = [
  { value: 1, label: 'Soporte Técnico' },
  { value: 2, label: 'Consulta de Facturación' },
  { value: 3, label: 'Información de Producto' },
  { value: 4, label: 'Queja' },
  { value: 5, label: 'Sugerencia' }
];

export default function RequestFiltersModal({
  visible,
  onClose,
  onApplyFilters,
  agents,
  currentFilters,
  totalRequests,
  filteredCount
}: RequestFiltersProps) {
  const [filters, setFilters] = useState<RequestFilters>(currentFilters);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    types: false,
    agents: false,
    priority: false,
    dates: false,
    advanced: false
  });

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = (key: keyof RequestFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleArrayFilter = (key: 'status' | 'types' | 'agents' | 'priority' | 'tags', value: string | number) => {
    setFilters(prev => {
      const currentArray = (prev[key] as (string | number)[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined
      };
    });
  };

  const clearAllFilters = () => {
    Alert.alert(
      'Limpiar Filtros',
      '¿Estás seguro de que quieres limpiar todos los filtros?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            const emptyFilters: RequestFilters = {};
            setFilters(emptyFilters);
            onApplyFilters(emptyFilters);
          }
        }
      ]
    );
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.types?.length) count++;
    if (filters.agents?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.searchText) count++;
    if (filters.tags?.length) count++;
    if (filters.isUrgent !== undefined) count++;
    if (filters.isVIP !== undefined) count++;
    if (filters.hasResponse !== undefined) count++;
    return count;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate && showDatePicker) {
      updateFilter('dateRange', {
        ...filters.dateRange,
        [showDatePicker]: selectedDate
      });
    }
    setShowDatePicker(null);
  };

  const renderFilterSection = (title: string, sectionKey: keyof typeof expandedSections, children: React.ReactNode) => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <ChevronDown
          size={20}
          color="#6b7280"
          style={[
            styles.chevron,
            expandedSections[sectionKey] && styles.chevronExpanded
          ]}
        />
      </TouchableOpacity>
      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );

  const renderOptionChips = (options: any[], selectedValues: any[], onToggle: (value: any) => void, colorKey?: string) => (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isSelected = selectedValues?.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              colorKey && isSelected && { borderColor: option[colorKey] }
            ]}
            onPress={() => onToggle(option.value)}
          >
            {colorKey && isSelected && (
              <View style={[styles.chipColorIndicator, { backgroundColor: option[colorKey] }]} />
            )}
            <Text style={[
              styles.chipText,
              isSelected && styles.chipTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Filter size={24} color="#1e40af" />
            <View style={styles.headerText}>
              <Text style={styles.title}>Filtros Avanzados</Text>
              <Text style={styles.subtitle}>
                {filteredCount} de {totalRequests} solicitudes
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar en título o mensaje..."
                placeholderTextColor="#9ca3af"
                value={filters.searchText || ''}
                onChangeText={(text) => updateFilter('searchText', text || undefined)}
              />
            </View>
          </View>

          {/* Status Filter */}
          {renderFilterSection('Estado', 'status', 
            renderOptionChips(
              STATUS_OPTIONS,
              filters.status || [],
              (value) => toggleArrayFilter('status', value),
              'color'
            )
          )}

          {/* Priority Filter */}
          {renderFilterSection('Prioridad', 'priority',
            renderOptionChips(
              PRIORITY_OPTIONS,
              filters.priority || [],
              (value) => toggleArrayFilter('priority', value),
              'color'
            )
          )}

          {/* Type Filter */}
          {renderFilterSection('Tipo de Solicitud', 'types',
            renderOptionChips(
              TYPE_OPTIONS,
              filters.types || [],
              (value) => toggleArrayFilter('types', value)
            )
          )}

          {/* Agents Filter */}
          {renderFilterSection('Agentes', 'agents',
            <View style={styles.chipsContainer}>
              {agents.map((agent) => {
                const isSelected = filters.agents?.includes(agent.id);
                return (
                  <TouchableOpacity
                    key={agent.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleArrayFilter('agents', agent.id)}
                  >
                    <Text style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected
                    ]}>
                      {agent.nombre} {agent.apellidoPaterno}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Date Range Filter */}
          {renderFilterSection('Rango de Fechas', 'dates',
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('start')}
              >
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  Desde: {filters.dateRange?.start ? 
                    filters.dateRange.start.toLocaleDateString('es-ES') : 
                    'Seleccionar'
                  }
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker('end')}
              >
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  Hasta: {filters.dateRange?.end ? 
                    filters.dateRange.end.toLocaleDateString('es-ES') : 
                    'Seleccionar'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Advanced Filters */}
          {renderFilterSection('Filtros Avanzados', 'advanced',
            <View style={styles.advancedContainer}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.switchText}>Solo urgentes</Text>
                </View>
                <Switch
                  value={filters.isUrgent || false}
                  onValueChange={(value) => updateFilter('isUrgent', value || undefined)}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={filters.isUrgent ? '#1e40af' : '#f3f4f6'}
                />
              </View>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <User size={16} color="#f59e0b" />
                  <Text style={styles.switchText}>Solo clientes VIP</Text>
                </View>
                <Switch
                  value={filters.isVIP || false}
                  onValueChange={(value) => updateFilter('isVIP', value || undefined)}
                  trackColor={{ false: '#e5e7eb', true: '#fef3c7' }}
                  thumbColor={filters.isVIP ? '#f59e0b' : '#f3f4f6'}
                />
              </View>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchText}>Con respuesta</Text>
                </View>
                <Switch
                  value={filters.hasResponse || false}
                  onValueChange={(value) => updateFilter('hasResponse', value || undefined)}
                  trackColor={{ false: '#e5e7eb', true: '#d1fae5' }}
                  thumbColor={filters.hasResponse ? '#10b981' : '#f3f4f6'}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.activeFiltersText}>
              {getActiveFiltersCount()} filtros activos
            </Text>
          </View>
          
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllFilters}
            >
              <RotateCcw size={16} color="#6b7280" />
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={filters.dateRange?.[showDatePicker] || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  filterSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  sectionContent: {
    paddingTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chipColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#1e40af',
  },
  dateContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginLeft: 8,
  },
  advancedContainer: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerInfo: {
    marginBottom: 16,
  },
  activeFiltersText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  applyButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});