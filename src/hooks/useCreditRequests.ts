import { useState, useCallback, useEffect } from 'react';
import { creditRequestApi } from '../api';
import { CreditRequest, CreditRequestStatus, AttentionStatus } from '../types/creditRequest';
import { useAuth } from './useAuth';
import { APIError } from '../utils/error';
import toast from 'react-hot-toast';

export const useCreditRequests = () => {
    const [requests, setRequests] = useState<CreditRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

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

    // Cargar todas las solicitudes
    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { solicitudes } = await creditRequestApi.getAll();
            setRequests(solicitudes);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

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

    // Cargar solicitudes por estado
    const loadRequestsByStatus = useCallback(async (status: CreditRequestStatus) => {
        try {
            setLoading(true);
            setError(null);
            const { solicitudes } = await creditRequestApi.getByStatus(status);
            setRequests(solicitudes);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [handleError]);

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

    // Cargar solicitudes al montar el componente
    useEffect(() => {
        if (isAuthenticated) {
            loadRequests();
        }
    }, [isAuthenticated, loadRequests]);

    return {
        requests,
        loading,
        error,
        loadRequests,
        loadRequestsByDni,
        loadRequestsByStatus,
        updateAttentionStatus
    };
};