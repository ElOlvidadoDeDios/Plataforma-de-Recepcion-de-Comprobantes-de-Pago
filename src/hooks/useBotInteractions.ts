import { useState, useCallback, useRef } from 'react';
import { getBotInteractions, getBotInteractionsByDni, BotInteraction } from '../api/botInteractionsApi';
import { useAuth } from './useAuth';
import { APIError } from '../utils/error';
import toast from 'react-hot-toast';

interface BotInteractionFilters {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  tipo?: string;
  status?: string;
}

export const useBotInteractions = () => {
  const [interactions, setInteractions] = useState<BotInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const { isAuthenticated } = useAuth();
  const abortController = useRef<AbortController | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof APIError) {
      if (err.statusCode === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(err.message);
      toast.error(err.message);
    } else {
      const message = 'Error inesperado al procesar la solicitud';
      setError(message);
      toast.error(message);
    }
  }, []);

  // Cargar interacciones con paginación
  const loadInteractions = useCallback(async (
    filters: BotInteractionFilters,
    page: number = 1,
    append: boolean = false,
    isSearching: boolean = false
  ) => {
    try {
      // Cancelar solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }
      
      if (page === 1) {
        if (!isSearching) {
          setLoading(true);
          setInteractions([]); // Solo limpiar si no es búsqueda
        }
        setError(null);
      } else if (append) {
        setLoadingMore(true);
      }

      const response = await getBotInteractions({
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        dni: filters.dni || undefined,
        tipo: filters.tipo || undefined,
        status: filters.status || undefined,
        page,
        limit: 12, // límite fijo
        sortBy: 'fecha',
        sortOrder: 'desc'
      });

      const newInteractions = response.data || [];

      if (append && page > 1) {
        setInteractions(prev => {
          // Evitar duplicados usando _id como identificador único
          const existingIds = new Set(prev.map(interaction => interaction._id));
          const filteredNewInteractions = newInteractions.filter(
            interaction => !existingIds.has(interaction._id)
          );
          return [...prev, ...filteredNewInteractions];
        });
      } else {
        setInteractions(newInteractions);
      }

      setPagination({
        total: response.total || 0,
        page: response.page || page,
        limit: response.limit || 12,
        totalPages: response.totalPages || 0,
        hasNext: response.hasNext || false,
        hasPrev: response.hasPrev || false
      });

    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        handleError(err);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [handleError]);

  // Función para cargar más datos (infinite scroll)
  const loadMoreData = useCallback(async (filters: BotInteractionFilters) => {
    if (pagination.hasNext && !loadingMore && !loading) {
      const nextPage = pagination.page + 1;
      await loadInteractions(filters, nextPage, true);
    }
  }, [pagination.hasNext, pagination.page, loadingMore, loading, loadInteractions]);

  // Búsqueda específica por DNI (modo independiente)
  const searchByDni = useCallback(async (dni: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getBotInteractionsByDni(dni);
      const searchResults = response?.data || [];
      
      // Ordenar por fecha y hora descendente
      const sortedResults = searchResults.sort((a, b) => {
        const dateA = new Date(`${a.fecha} ${a.hora}`);
        const dateB = new Date(`${b.fecha} ${b.hora}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setInteractions(sortedResults);
      
      // Para búsqueda por DNI no hay paginación
      setPagination({
        total: sortedResults.length,
        page: 1,
        limit: sortedResults.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });

      if (sortedResults.length > 0) {
        toast.success(`Se encontraron ${sortedResults.length} interacciones para el DNI: ${dni}`);
      } else {
        toast(`No se encontraron interacciones para el DNI: ${dni}`, {
          icon: 'ℹ️',
          duration: 3000
        });
      }
      
      return sortedResults;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setInteractions([]);
        setPagination({
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
        toast(`No se encontraron interacciones para el DNI: ${dni}`, {
          icon: 'ℹ️',
          duration: 3000
        });
        return [];
      } else {
        handleError(err);
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Función para resetear datos
  const resetData = useCallback(() => {
    setInteractions([]);
    setPagination({
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
    setError(null);
    setLoadingMore(false);
  }, []);

  return {
    interactions,
    loading,
    error,
    loadingMore,
    pagination,
    loadInteractions,
    loadMoreData,
    searchByDni,
    resetData
  };
};