import { useState, useCallback } from 'react';
import { creditAttentionApi } from '../api/creditAttentionApi';
import { CreditAttention } from '../types/creditAttention';
import toast from 'react-hot-toast';

export const useCreditAttention = () => {
    const [historialSolicitud, setHistorialSolicitud] = useState<CreditAttention[]>([]);
    const [historialUsuario, setHistorialUsuario] = useState<CreditAttention[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar historial por DNI de la solicitud
    const loadHistorialBySolicitudDni = useCallback(async (dni: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await creditAttentionApi.getHistorialBySolicitudDni(dni);
            setHistorialSolicitud(response.data);
            return response.data;
        } catch (err) {
            const message = 'Error al cargar el historial de la solicitud';
            setError(message);
            toast.error(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar historial por DNI del usuario que atendió
    const loadHistorialByUsuarioDni = useCallback(async (dni: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await creditAttentionApi.getHistorialByUsuarioDni(dni);
            setHistorialUsuario(response.data);
            return response.data;
        } catch (err) {
            const message = 'Error al cargar el historial del usuario';
            setError(message);
            toast.error(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener el último usuario que atendió una solicitud
    const getLastAttentionUser = useCallback(async (dni: string): Promise<{email: string, fecha: string, hora: string} | null> => {
        try {
            const historial = await loadHistorialBySolicitudDni(dni);
            if (historial && historial.length > 0) {
                const lastAttention = historial[0]; // El historial viene ordenado por fecha/hora
                return {
                    email: lastAttention.email,
                    fecha: lastAttention.fecha_atencion,
                    hora: lastAttention.hora_atencion
                };
            }
            return null;
        } catch (err) {
            return null;
        }
    }, [loadHistorialBySolicitudDni]);

    return {
        historialSolicitud,
        historialUsuario,
        loading,
        error,
        loadHistorialBySolicitudDni,
        loadHistorialByUsuarioDni,
        getLastAttentionUser
    };
};