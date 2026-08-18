import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getMensajesConScroll, 
  Mensaje, 
  QueryMensajesParams,
  MensajesResponse 
} from '../services/mensajesWhatsappService';

interface UseConversacionReturn {
  mensajes: Mensaje[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadNewer: () => Promise<void>;
  refetch: () => Promise<void>;
  pagination: {
    total: number;
    count: number;
    oldestTimestamp?: number;
    newestTimestamp?: number;
  };
}

/**
 * Hook para manejar una conversación con scroll infinito
 * Soporta scroll hacia arriba (mensajes antiguos) y hacia abajo (mensajes nuevos)
 */
export const useConversacion = (
  number: string | null,
  initialLimit: number = 50
): UseConversacionReturn => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    count: 0,
    oldestTimestamp: undefined as number | undefined,
    newestTimestamp: undefined as number | undefined,
  });

  const isLoadingRef = useRef(false);

  // Cargar mensajes iniciales
  const fetchInicial = useCallback(async () => {
    if (!number || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const params: QueryMensajesParams = {
        number,
        limit: initialLimit,
      };

      const data: MensajesResponse = await getMensajesConScroll(params);

      // Invertir para que queden [antiguo...reciente]
      setMensajes([...data.data].reverse());
      setHasMore(data.pagination.hasMore);
      setPagination({
        total: data.pagination.total,
        count: data.pagination.count,
        oldestTimestamp: data.pagination.oldestTimestamp,
        newestTimestamp: data.pagination.newestTimestamp,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar mensajes');
      console.error('Error en useConversacion:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [number, initialLimit]);

  // Cargar mensajes más antiguos (scroll hacia arriba)
  const loadMore = useCallback(async () => {
    if (!number || !hasMore || isLoadingRef.current || !pagination.oldestTimestamp) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      const params: QueryMensajesParams = {
        number,
        limit: initialLimit,
        beforeTimestamp: pagination.oldestTimestamp,
      };

      const data: MensajesResponse = await getMensajesConScroll(params);

      // Agregar mensajes antiguos al INICIO del array (están más arriba en el chat)
      setMensajes(prev => [[...data.data].reverse(), ...prev].flat());
      setHasMore(data.pagination.hasMore);
      setPagination(prev => ({
        ...prev,
        count: prev.count + data.pagination.count,
        oldestTimestamp: data.pagination.oldestTimestamp,
      }));
    } catch (err: any) {
      setError(err.message || 'Error al cargar más mensajes');
      console.error('Error en loadMore:', err);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [number, hasMore, pagination.oldestTimestamp, initialLimit]);

  // Cargar mensajes más nuevos (scroll hacia abajo - para actualizaciones)
  const loadNewer = useCallback(async () => {
    if (!number || isLoadingRef.current || !pagination.newestTimestamp) return;

    try {
      isLoadingRef.current = true;

      const params: QueryMensajesParams = {
        number,
        limit: initialLimit,
        afterTimestamp: pagination.newestTimestamp,
      };

      const data: MensajesResponse = await getMensajesConScroll(params);

      if (data.data.length > 0) {
        // Agregar mensajes nuevos al FINAL del array (son más recientes)
        setMensajes(prev => [...prev, ...[...data.data].reverse()]);
        setPagination(prev => ({
          ...prev,
          total: prev.total + data.data.length,
          count: prev.count + data.data.length,
          newestTimestamp: data.pagination.newestTimestamp,
        }));
      }
    } catch (err: any) {
      console.error('Error en loadNewer:', err);
    } finally {
      isLoadingRef.current = false;
    }
  }, [number, pagination.newestTimestamp, initialLimit]);

  // Recargar todo desde cero
  const refetch = useCallback(async () => {
    setMensajes([]);
    setHasMore(true);
    await fetchInicial();
  }, [fetchInicial]);

  useEffect(() => {
    if (number) {
      fetchInicial();
    } else {
      setMensajes([]);
      setHasMore(true);
      setPagination({ total: 0, count: 0, oldestTimestamp: undefined, newestTimestamp: undefined });
    }
  }, [number, fetchInicial]);

  return {
    mensajes,
    loading,
    error,
    hasMore,
    loadMore,
    loadNewer,
    refetch,
    pagination,
  };
};
