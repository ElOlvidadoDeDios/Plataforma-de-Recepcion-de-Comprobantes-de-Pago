import { useCallback, useEffect, useState } from 'react';
import { RegistroAseguramiento } from '../Aseguramiento.types';
import { obtenerAseguramientos } from '../service/Aseguramientolist.Service';


interface UseListadoAseguramientosReturn {
  registros: RegistroAseguramiento[];
  cantidad: number;
  cargando: boolean;
  errorGeneral: string | null;
  recargar: () => void;
}

export function useListadoAseguramientos(): UseListadoAseguramientosReturn {
  const [registros, setRegistros] = useState<RegistroAseguramiento[]>([]);
  const [cantidad, setCantidad] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cargarRegistros = useCallback(async () => {
    setCargando(true);
    setErrorGeneral(null);
    try {
      const respuesta = await obtenerAseguramientos();
      setRegistros(respuesta.data);
      setCantidad(respuesta.cantidad);
    } catch (error) {
      setErrorGeneral(
        error instanceof Error ? error.message : 'Ocurrió un error al cargar los registros'
      );
      setRegistros([]);
      setCantidad(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  return {
    registros,
    cantidad,
    cargando,
    errorGeneral,
    recargar: cargarRegistros,
  };
}