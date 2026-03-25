import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '../../../types/permissions';
import { useAuth } from '../../../hooks/useAuth';
import {
  Analista,
  getCurrentPeriodo,
  getSociosMora,
  recuperador,
  getRecuperadores,
  getAnalistasByAgencia,
  getReporteMora,
  getGestionesXEstadosGeneral,
  getGestionesFecha,   // ← nuevo import
} from '../services/gestios_recuperadores.service';


export const useGestionMora = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAnalista = user?.role === UserRole.ANALISTA_CREDITOS_I ||
    user?.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO ||
    user?.role === UserRole.RECUPERADOR;
  const isAdmin = user?.role === UserRole.ADMINISTRADOR;
  const isRecuperador = user?.role === UserRole.RECUPERADOR;
  const isJefeRecuperaciones = user?.role === UserRole.JEFE_RECUPERACIONES;

  const isSuperOrGerente = user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.GERENTE_GENERAL ||
    user?.role === UserRole.ADMINISTRADOR ||
    user?.role === UserRole.JEFE_RECUPERACIONES;
  const canSeeAdministradores = user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.GERENTE_GENERAL ||
    user?.role === UserRole.JEFE_RECUPERACIONES;

  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [selectedAdmin, setSelectedAdmin] = useState<recuperador | null>(null);
  const [selectedAnalista, setSelectedAnalista] = useState<Analista | null>(null);
  const [miAnalistaPropio, setMiAnalistaPropio] = useState<Analista | null>(null);

  // ── Nuevo estado para el filtro de fecha ──
  const [fechaFiltro, setFechaFiltro] = useState<string>('');

  // Si es analista o recuperador, setear directamente sus datos
  useEffect(() => {
    if ((isAnalista || isRecuperador) && user) {
      const miAnalista = {
        ID_ANA: user.id_ana || '',
        CARGO: user.cargo || '',
        ANA_ACTUAL: user.razon || '',
        AGENCIA: user.id_age || '',
      };
      setSelectedAnalista(miAnalista);
      if (isRecuperador) {
        setMiAnalistaPropio(miAnalista);
      }
    }
  }, [isAnalista, isRecuperador, user]);

  // Si es admin o recuperador, configurar automáticamente su agencia
  useEffect(() => {
    if ((isAdmin || isRecuperador) && user) {
      setSelectedAdmin({
        NUM: 1,
        NOM_ADMI: user.razon || '',
        ID_ANA: user.id_ana || '',
        CARGO: user.cargo || '',
        AGENCIA: user.id_age || '',
        COD_AGE: user.id_age || '',
      });
    }
  }, [isAdmin, isRecuperador, user]);

  // Cuando se selecciona un recuperador, cargar su gestión de mora
  useEffect(() => {
    if (selectedAdmin && (isSuperOrGerente || isJefeRecuperaciones || isRecuperador)) {
      setSelectedAnalista({
        ID_ANA: selectedAdmin.ID_ANA,
        CARGO: selectedAdmin.CARGO,
        ANA_ACTUAL: selectedAdmin.NOM_ADMI,
        AGENCIA: selectedAdmin.AGENCIA,
      });
    }
  }, [selectedAdmin, isSuperOrGerente, isJefeRecuperaciones, isRecuperador]);

  // Recuperadores
  const { data: administradores = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['recuperadores'],
    queryFn: getRecuperadores,
    enabled: canSeeAdministradores,
  });

  // Analistas por agencia
  const { data: analistasData = [], isLoading: loadingAnalistas } = useQuery({
    queryKey: ['analistas', selectedAdmin?.AGENCIA, periodo],
    queryFn: () => getAnalistasByAgencia(selectedAdmin!.AGENCIA, periodo),
    enabled: !!selectedAdmin,
  });

  const analistas = Array.isArray(analistasData) ? analistasData : [];

  // Socios en mora
  const { data: sociosMora = [], isLoading: loadingSocios } = useQuery({
    queryKey: ['socios-mora', selectedAnalista, periodo],
    queryFn: () => getSociosMora({
      ID_ANA: selectedAnalista!.ID_ANA,
      CARGO: selectedAnalista!.CARGO,
      AGENCIA: selectedAnalista!.AGENCIA,
      PERIODO: periodo,
    }),
    enabled: !!selectedAnalista,
  });

  const shouldUseGeneralReport =
    (user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.JEFE_RECUPERACIONES ||
      user?.role === UserRole.GERENTE_GENERAL) &&
    !selectedAdmin;

  // ── Query principal de gestiones ──
  // Si hay fechaFiltro → llama getGestionesFecha
  // Si no             → comportamiento original
  const { data: gestionesXEstados, isLoading: loadingGestiones } = useQuery({
    queryKey: fechaFiltro
      ? ['gestiones-fecha', fechaFiltro]
      : shouldUseGeneralReport
        ? ['gestiones-estados-general']
        : ['gestiones-estados', selectedAdmin?.AGENCIA],

    queryFn: fechaFiltro
      ? () => getGestionesFecha(fechaFiltro)
      : shouldUseGeneralReport
        ? () => getGestionesXEstadosGeneral()
        : () => getReporteMora(selectedAdmin?.AGENCIA || user?.id_age || ''),

    enabled: fechaFiltro
      ? true  // siempre activo si hay fecha
      : (isSuperOrGerente || isRecuperador) &&
        (shouldUseGeneralReport || !!selectedAdmin || !!user?.id_age),
  });

  return {
    user,
    isAnalista,
    isAdmin,
    isRecuperador,
    isJefeRecuperaciones,
    isSuperOrGerente,
    periodo,
    setPeriodo,
    administradores,
    loadingAdmins,
    selectedAdmin,
    setSelectedAdmin,
    analistas,
    loadingAnalistas,
    selectedAnalista,
    setSelectedAnalista,
    miAnalistaPropio,
    sociosMora,
    loadingSocios,
    gestionesXEstados,
    loadingGestiones,
    // ── nuevo ──
    fechaFiltro,
    setFechaFiltro,
  };
};