import { useState, useCallback, useRef } from 'react';
import { fetchPaymentHistory, PaymentHistoryRecord } from '../api/paymentsApi';
import { APIError } from '../utils/error';
import toast from 'react-hot-toast';

// Tipos de pago válidos por defecto (solo pagos aplicados)
const TIPOS_PAGO_APLICADOS = ['pago_normal', 'pago_liquida'];

interface PaymentHistoryFilters {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  tipoPago?: 'pago_normal' | 'pago_liquida' | 'rechazo_total' | 'rechazo_parcial' | '';
  usuarioFiltro?: string; // 🆕 Filtro por DNI del usuario que procesó
  mostrarSoloPagosAplicados?: boolean; // 🆕 Para filtrar solo pagos aplicados
}

export const usePaymentHistory = () => {
  const [records, setRecords] = useState<PaymentHistoryRecord[]>([]);
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

  // Cargar historial con paginación
  const loadHistory = useCallback(async (
    filters: PaymentHistoryFilters,
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      // Cancelar solicitud anterior si existe
      if (abortController.current) {
        abortController.current.abort();
      }
      
      if (page === 1) {
        setLoading(true);
        setError(null);
        setRecords([]); // Limpiar datos previos
      } else if (append) {
        setLoadingMore(true);
      }

      const response = await fetchPaymentHistory({
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        dni: filters.dni || undefined,
        usuarioFiltro: filters.usuarioFiltro, // 🆕 Pasar filtro de usuario
        page,
        limit: 12, // 🔧 TEMPORAL: Para testear mejor el infinite scroll (cambiar a 20 después)
        sortBy: 'fecha_modi',
        sortOrder: 'desc'
      });

      // Filtrar en el frontend según los criterios
      let filteredData = response.data;
      
      // 🚨 FILTRO CRÍTICO: Si mostrarSoloPagosAplicados está activo, filtrar solo pagos aplicados
      if (filters.mostrarSoloPagosAplicados) {
        filteredData = filteredData.filter(record => TIPOS_PAGO_APLICADOS.includes(record.tipo_pago));
      }
      
      // Filtrar por tipo de pago específico (si se especifica)
      if (filters.tipoPago) {
        filteredData = filteredData.filter(record => record.tipo_pago === filters.tipoPago);
      }

      if (append && page > 1) {
        setRecords(prev => {
          // Evitar duplicados usando fecha_pago + hora_pago + dni como identificador único
          const existingIds = new Set(
            prev.map(record => `${record.fecha_pago}-${record.hora_pago}-${record.comprobante.dni}`)
          );
          const newRecords = filteredData.filter(
            record => !existingIds.has(`${record.fecha_pago}-${record.hora_pago}-${record.comprobante.dni}`)
          );
          return [...prev, ...newRecords];
        });
      } else {
        setRecords(filteredData);
      }

      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev
      });

    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        handleError(err);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [handleError]); // 🔧 FIX: Quitar pagination.limit de las dependencias

  // Función para cargar más datos (infinite scroll)
  const loadMoreData = useCallback(async (filters: PaymentHistoryFilters) => {
    if (pagination.hasNext && !loadingMore && !loading) {
      const nextPage = pagination.page + 1;
      await loadHistory(filters, nextPage, true);
    }
  }, [pagination.hasNext, pagination.page, loadingMore, loading, loadHistory]);

  // Función para resetear datos
  const resetData = useCallback(() => {
    setRecords([]);
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
    records,
    loading,
    error,
    loadingMore,
    pagination,
    loadHistory,
    loadMoreData,
    resetData
  };
};