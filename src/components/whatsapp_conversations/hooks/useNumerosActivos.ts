import { useState, useEffect, useCallback } from 'react';
import { 
  getNumerosActivos, 
  getEstadisticasNumero, 
  EstadisticasNumero 
} from '../services/mensajesWhatsappService';

interface UseNumerosActivosReturn {
  numeros: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener y gestionar la lista de números activos
 */
export const useNumerosActivos = (): UseNumerosActivosReturn => {
  const [numeros, setNumeros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNumeros = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNumerosActivos();
      setNumeros(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar números activos');
      console.error('Error en useNumerosActivos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNumeros();
  }, [fetchNumeros]);

  return {
    numeros,
    loading,
    error,
    refetch: fetchNumeros,
  };
};

interface UseEstadisticasNumeroReturn {
  estadisticas: EstadisticasNumero | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener estadísticas de un número específico
 */
export const useEstadisticasNumero = (number: string | null): UseEstadisticasNumeroReturn => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasNumero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = useCallback(async () => {
    if (!number) {
      setEstadisticas(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEstadisticasNumero(number);
      setEstadisticas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
      console.error('Error en useEstadisticasNumero:', err);
    } finally {
      setLoading(false);
    }
  }, [number]);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  };
};
