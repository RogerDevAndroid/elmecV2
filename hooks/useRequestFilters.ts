import { useState, useMemo, useCallback } from 'react';
import type { Request } from '@/types/firebase';
import type { RequestFilters } from '@/components/RequestFilters';

export interface UseRequestFiltersReturn {
  filters: RequestFilters;
  filteredRequests: Request[];
  totalCount: number;
  filteredCount: number;
  activeFiltersCount: number;
  updateFilters: (newFilters: RequestFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function useRequestFilters(requests: Request[]): UseRequestFiltersReturn {
  const [filters, setFilters] = useState<RequestFilters>({});

  const filteredRequests = useMemo(() => {
    if (!requests.length) return [];

    return requests.filter(request => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const titleMatch = request.titulo?.toLowerCase().includes(searchLower);
        const messageMatch = request.mensaje?.toLowerCase().includes(searchLower);
        const descriptionMatch = request.descripcion?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !messageMatch && !descriptionMatch) {
          return false;
        }
      }

      // Status filter
      if (filters.status?.length && !filters.status.includes(request.estado)) {
        return false;
      }

      // Type filter
      if (filters.types?.length && !filters.types.includes(request.tipo)) {
        return false;
      }

      // Agent filter
      if (filters.agents?.length) {
        const assignedAgent = request.agenteAsignado;
        if (!assignedAgent || !filters.agents.includes(assignedAgent)) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority?.length && !filters.priority.includes(request.prioridad)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const requestDate = new Date(request.fechaCreacion);
        
        if (filters.dateRange.start && requestDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && requestDate > filters.dateRange.end) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags?.length) {
        const requestTags = request.etiquetas || [];
        const hasMatchingTag = filters.tags.some(tag => requestTags.includes(tag));
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Urgent filter
      if (filters.isUrgent !== undefined) {
        const isUrgent = request.prioridad === 'urgente' || request.esUrgente;
        if (filters.isUrgent !== isUrgent) {
          return false;
        }
      }

      // VIP filter
      if (filters.isVIP !== undefined) {
        const isVIP = request.clienteVIP || request.usuario?.esVIP;
        if (filters.isVIP !== isVIP) {
          return false;
        }
      }

      // Has response filter
      if (filters.hasResponse !== undefined) {
        const hasResponse = request.respuestas && request.respuestas.length > 0;
        if (filters.hasResponse !== hasResponse) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filters]);

  const activeFiltersCount = useMemo(() => {
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
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0;
  }, [activeFiltersCount]);

  const updateFilters = useCallback((newFilters: RequestFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    filteredRequests,
    totalCount: requests.length,
    filteredCount: filteredRequests.length,
    activeFiltersCount,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}

// Helper function to get filter summary text
export function getFilterSummaryText(filters: RequestFilters): string {
  const parts: string[] = [];

  if (filters.status?.length) {
    parts.push(`Estado: ${filters.status.join(', ')}`);
  }

  if (filters.types?.length) {
    const typeLabels = filters.types.map(type => {
      switch (type) {
        case 1: return 'Soporte Técnico';
        case 2: return 'Consulta de Facturación';
        case 3: return 'Información de Producto';
        case 4: return 'Queja';
        case 5: return 'Sugerencia';
        default: return `Tipo ${type}`;
      }
    });
    parts.push(`Tipo: ${typeLabels.join(', ')}`);
  }

  if (filters.priority?.length) {
    parts.push(`Prioridad: ${filters.priority.join(', ')}`);
  }

  if (filters.agents?.length) {
    parts.push(`Agentes: ${filters.agents.length} seleccionados`);
  }

  if (filters.dateRange?.start || filters.dateRange?.end) {
    const start = filters.dateRange.start?.toLocaleDateString('es-ES');
    const end = filters.dateRange.end?.toLocaleDateString('es-ES');
    if (start && end) {
      parts.push(`Fecha: ${start} - ${end}`);
    } else if (start) {
      parts.push(`Desde: ${start}`);
    } else if (end) {
      parts.push(`Hasta: ${end}`);
    }
  }

  if (filters.searchText) {
    parts.push(`Búsqueda: "${filters.searchText}"`);
  }

  if (filters.isUrgent) {
    parts.push('Solo urgentes');
  }

  if (filters.isVIP) {
    parts.push('Solo VIP');
  }

  if (filters.hasResponse) {
    parts.push('Con respuesta');
  }

  return parts.join(' • ');
}

// Helper function to export filters as URL params
export function filtersToUrlParams(filters: RequestFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status?.length) {
    params.set('status', filters.status.join(','));
  }

  if (filters.types?.length) {
    params.set('types', filters.types.join(','));
  }

  if (filters.agents?.length) {
    params.set('agents', filters.agents.join(','));
  }

  if (filters.priority?.length) {
    params.set('priority', filters.priority.join(','));
  }

  if (filters.dateRange?.start) {
    params.set('dateStart', filters.dateRange.start.toISOString());
  }

  if (filters.dateRange?.end) {
    params.set('dateEnd', filters.dateRange.end.toISOString());
  }

  if (filters.searchText) {
    params.set('search', filters.searchText);
  }

  if (filters.tags?.length) {
    params.set('tags', filters.tags.join(','));
  }

  if (filters.isUrgent !== undefined) {
    params.set('urgent', filters.isUrgent.toString());
  }

  if (filters.isVIP !== undefined) {
    params.set('vip', filters.isVIP.toString());
  }

  if (filters.hasResponse !== undefined) {
    params.set('hasResponse', filters.hasResponse.toString());
  }

  return params;
}

// Helper function to import filters from URL params
export function urlParamsToFilters(params: URLSearchParams): RequestFilters {
  const filters: RequestFilters = {};

  const status = params.get('status');
  if (status) {
    filters.status = status.split(',');
  }

  const types = params.get('types');
  if (types) {
    filters.types = types.split(',').map(Number);
  }

  const agents = params.get('agents');
  if (agents) {
    filters.agents = agents.split(',');
  }

  const priority = params.get('priority');
  if (priority) {
    filters.priority = priority.split(',');
  }

  const dateStart = params.get('dateStart');
  const dateEnd = params.get('dateEnd');
  if (dateStart || dateEnd) {
    filters.dateRange = {};
    if (dateStart) {
      filters.dateRange.start = new Date(dateStart);
    }
    if (dateEnd) {
      filters.dateRange.end = new Date(dateEnd);
    }
  }

  const search = params.get('search');
  if (search) {
    filters.searchText = search;
  }

  const tags = params.get('tags');
  if (tags) {
    filters.tags = tags.split(',');
  }

  const urgent = params.get('urgent');
  if (urgent !== null) {
    filters.isUrgent = urgent === 'true';
  }

  const vip = params.get('vip');
  if (vip !== null) {
    filters.isVIP = vip === 'true';
  }

  const hasResponse = params.get('hasResponse');
  if (hasResponse !== null) {
    filters.hasResponse = hasResponse === 'true';
  }

  return filters;
}