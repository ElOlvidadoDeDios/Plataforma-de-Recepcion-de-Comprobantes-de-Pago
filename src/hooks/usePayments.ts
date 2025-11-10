import { useState, useCallback, useRef } from 'react';
import { fetchPayments, fetchPaymentsByStatus } from '../api/paymentsApi';
import { PaymentRecord } from '../types';
import { APIError } from '../utils/error';
import { SessionManager } from '../utils/sessionManager';
import toast from 'react-hot-toast';

interface PaymentFilters {
  fechaInicio?: string;
  fechaFin?: string;
  dni?: string;
  estado?: 'pendiente' | 'parcial' | 'atendido';
}

export const usePayments = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
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
        SessionManager.removeItem('token');
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

  // Cargar pagos con paginación
  const loadPayments = useCallback(async (
    filters: PaymentFilters,
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
        setPayments([]); // Limpiar datos previos
      } else if (append) {
        setLoadingMore(true);
      }

      let response;

      // Determinar qué endpoint usar
      if (filters.estado) {
        // Usar endpoint por estado
        response = await fetchPaymentsByStatus(
          filters.estado,
          page,
          12, // límite fijo
          'fecha',
          'desc'
        );
        // Mapear respuesta al formato esperado
        response = {
          ...response,
          comprobantes: response.comprobantes || []
        };
      } else {
        // Usar endpoint general
        response = await fetchPayments({
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
          dni: filters.dni || undefined,
          estado: undefined, // No filtrar por estado en endpoint general
          page,
          limit: 12,
          sortBy: 'fecha',
          sortOrder: 'desc'
        });
      }

      const newPayments = response.comprobantes || [];

      if (append && page > 1) {
        setPayments(prev => {
          // Evitar duplicados usando dni + fecha + hora como identificador único
          const existingIds = new Set(
            prev.map(payment => `${payment.dni}-${payment.fecha}-${payment.hora}`)
          );
          const filteredNewPayments = newPayments.filter(
            payment => !existingIds.has(`${payment.dni}-${payment.fecha}-${payment.hora}`)
          );
          return [...prev, ...filteredNewPayments];
        });
      } else {
        setPayments(newPayments);
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
  const loadMoreData = useCallback(async (filters: PaymentFilters) => {
    if (pagination.hasNext && !loadingMore && !loading) {
      const nextPage = pagination.page + 1;
      await loadPayments(filters, nextPage, true);
    }
  }, [pagination.hasNext, pagination.page, loadingMore, loading, loadPayments]);

  // Función para resetear datos
  const resetData = useCallback(() => {
    setPayments([]);
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

  // Función para actualizar un pago específico (después de cambios de estado)
  const updatePayment = useCallback((updatedPayment: PaymentRecord) => {
    setPayments(prev => 
      prev.map(payment => 
        payment.dni === updatedPayment.dni && 
        payment.fecha === updatedPayment.fecha && 
        payment.hora === updatedPayment.hora
          ? updatedPayment
          : payment
      )
    );
  }, []);

  return {
    payments,
    loading,
    error,
    loadingMore,
    pagination,
    loadPayments,
    loadMoreData,
    resetData,
    updatePayment
  };
};
