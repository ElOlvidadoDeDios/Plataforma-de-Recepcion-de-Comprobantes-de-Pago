import { useCallback, useEffect, useMemo, useState } from 'react';
import { PolizaPorAplicar } from '../AplicacionPolizas.types';
import { obtenerPolizasPorAplicar } from '../service/aplicacionPolizas.Service';

export interface UseAplicacionPolizasReturn {
  polizas: PolizaPorAplicar[];
  cantidad: number;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  busqueda: string;
  setBusqueda: (val: string) => void;
  agenciaSeleccionada: string;
  setAgenciaSeleccionada: (val: string) => void;
  listaAgencias: string[];
  polizasFiltradas: PolizaPorAplicar[];
  polizasPorAgencia: Record<string, PolizaPorAplicar[]>;
  totalMonto: number;
}

export function useAplicacionPolizas(): UseAplicacionPolizasReturn {
  const [polizas, setPolizas] = useState<PolizaPorAplicar[]>([]);
  const [cantidad, setCantidad] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState<string>('');
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<string>('TODAS');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await obtenerPolizasPorAplicar();
      setPolizas(respuesta.data || []);
      setCantidad(respuesta.cantidad || (respuesta.data ? respuesta.data.length : 0));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar las pólizas pendientes de aplicación'
      );
      setPolizas([]);
      setCantidad(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Lista única de agencias disponibles
  const listaAgencias = useMemo(() => {
    const agenciasSet = new Set<string>();
    polizas.forEach((p) => {
      if (p.agencia_nom && p.agencia_nom.trim()) {
        agenciasSet.add(p.agencia_nom.trim().toUpperCase());
      }
    });
    return Array.from(agenciasSet).sort();
  }, [polizas]);

  // Filtrar pólizas por búsqueda (nombre, DNI, etc.) y por agencia
  const polizasFiltradas = useMemo(() => {
    return polizas.filter((p) => {
      // Filtro de agencia
      if (
        agenciaSeleccionada !== 'TODAS' &&
        p.agencia_nom?.trim().toUpperCase() !== agenciaSeleccionada
      ) {
        return false;
      }

      // Filtro de texto / búsqueda
      if (!busqueda.trim()) return true;

      const q = busqueda.trim().toLowerCase();
      const titular = p.titular;
      const nombreCompleto = `${titular?.nombres || ''} ${titular?.apellido_paterno || ''} ${
        titular?.apellido_materno || ''
      }`.toLowerCase();
      const dni = (titular?.nro_documento || '').toLowerCase();
      const correo = (titular?.correo || '').toLowerCase();
      const celular = (titular?.celular || '').toLowerCase();
      const agencia = (p.agencia_nom || '').toLowerCase();
      const usuario = (p.user || '').toLowerCase();

      return (
        nombreCompleto.includes(q) ||
        dni.includes(q) ||
        correo.includes(q) ||
        celular.includes(q) ||
        agencia.includes(q) ||
        usuario.includes(q)
      );
    });
  }, [polizas, busqueda, agenciaSeleccionada]);

  // Agrupación por agencia
  const polizasPorAgencia = useMemo(() => {
    const grupos: Record<string, PolizaPorAplicar[]> = {};
    polizasFiltradas.forEach((p) => {
      const ag = p.agencia_nom ? p.agencia_nom.trim().toUpperCase() : 'SIN AGENCIA';
      if (!grupos[ag]) {
        grupos[ag] = [];
      }
      grupos[ag].push(p);
    });
    return grupos;
  }, [polizasFiltradas]);

  // Monto total acumulado
  const totalMonto = useMemo(() => {
    return polizasFiltradas.reduce((acc, p) => acc + (p.titular?.costo || 0), 0);
  }, [polizasFiltradas]);

  return {
    polizas,
    cantidad,
    cargando,
    error,
    recargar: cargarDatos,
    busqueda,
    setBusqueda,
    agenciaSeleccionada,
    setAgenciaSeleccionada,
    listaAgencias,
    polizasFiltradas,
    polizasPorAgencia,
    totalMonto,
  };
}
