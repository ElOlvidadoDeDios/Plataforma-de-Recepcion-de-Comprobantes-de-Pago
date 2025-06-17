import { useState, useCallback, useEffect, useRef } from 'react';
import { creditRequestApi } from '../api';
import { CreditRequest, CreditRequestStatus, AttentionStatus } from '../types/creditRequest';
import { useAuth } from './useAuth';
import { APIError } from '../utils/error';
import toast from 'react-hot-toast';

export const useCreditRequests = () => {
    const [requests, setRequests] = useState<CreditRequest[]>([]);
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

    // Cargar todas las solicitudes con paginación
    const loadRequests = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            // Cancelar solicitud anterior si existe
            if (abortController.current) {
                abortController.current.abort();
            }
            
            if (page === 1) {
                setLoading(true);
                setError(null);
                setRequests([]); // Limpiar datos previos
            } else if (append) {
                setLoadingMore(true);
            }
            
            const response = await creditRequestApi.getAll(page, pagination.limit);
            
            if (append && page > 1) {
                setRequests(prev => {
                    // Evitar duplicados usando el _id
                    const existingIds = new Set(prev.map(req => req._id));
                    const newRequests = response.solicitudes.filter(req => !existingIds.has(req._id));
                    return [...prev, ...newRequests];
                });
            } else {
                setRequests(response.solicitudes);
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
    }, [handleError, pagination.limit]);

    // Cargar solicitudes por DNI
    const loadRequestsByDni = useCallback(async (dni: string) => {
        try {
            setLoading(true);
            setError(null);
            const { solicitudes } = await creditRequestApi.getByDni(dni);
            setRequests(solicitudes);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

    // Cargar solicitudes por estado con paginación
    const loadRequestsByStatus = useCallback(async (status: CreditRequestStatus, page: number = 1, append: boolean = false) => {
        try {
            // Cancelar solicitud anterior si existe
            if (abortController.current) {
                abortController.current.abort();
            }
            
            if (page === 1) {
                setLoading(true);
                setError(null);
                setRequests([]); // Limpiar datos previos
            } else if (append) {
                setLoadingMore(true);
            }
            
            const response = await creditRequestApi.getByStatus(status, page, pagination.limit);
            
            if (append && page > 1) {
                setRequests(prev => {
                    // Evitar duplicados usando el _id
                    const existingIds = new Set(prev.map(req => req._id));
                    const newRequests = response.solicitudes.filter(req => !existingIds.has(req._id));
                    return [...prev, ...newRequests];
                });
            } else {
                setRequests(response.solicitudes);
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
    }, [handleError, pagination.limit]);

    // Actualizar estado de atención
    const updateAttentionStatus = useCallback(async (id: string, newStatus: AttentionStatus) => {
        try {
            setError(null);
            const updatedRequest = await creditRequestApi.updateAttentionStatus(id, newStatus);
            setRequests(prev => prev.map(req => 
                req._id === id ? updatedRequest : req
            ));
            toast.success('Estado de atención actualizado correctamente');
            return true;
        } catch (err) {
            handleError(err);
            return false;
        }
    }, [handleError]);

    // Función para cargar más datos (infinite scroll)
    const loadMoreData = useCallback(async (currentStatus?: CreditRequestStatus) => {
        if (pagination.hasNext && !loadingMore && !loading) {
            const nextPage = pagination.page + 1;
            if (currentStatus) {
                await loadRequestsByStatus(currentStatus, nextPage, true);
            } else {
                await loadRequests(nextPage, true);
            }
        }
    }, [pagination.hasNext, pagination.page, loadingMore, loading, loadRequests, loadRequestsByStatus]);

    // Función para resetear datos
    const resetData = useCallback(() => {
        setRequests([]);
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

    // Cargar solicitudes al montar el componente
    useEffect(() => {
        if (isAuthenticated) {
            loadRequests(1, false);
        }
    }, [isAuthenticated, loadRequests]);

    return {
        requests,
        loading,
        error,
        loadingMore,
        pagination,
        loadRequests,
        loadRequestsByDni,
        loadRequestsByStatus,
        loadMoreData,
        updateAttentionStatus,
        resetData
    };
};