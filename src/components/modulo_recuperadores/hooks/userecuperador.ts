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
  getGestionesXEstadosGeneral
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
    user?.role === UserRole.JEFE_RECUPERACIONES ;

  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [selectedAdmin, setSelectedAdmin] = useState<recuperador | null>(null);
  const [selectedAnalista, setSelectedAnalista] = useState<Analista | null>(null);
  const [miAnalistaPropio, setMiAnalistaPropio] = useState<Analista | null>(null);

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
      // Si es recuperador, guardar como su analista propio
      if (isRecuperador) {
        setMiAnalistaPropio(miAnalista);
      }
    }
  }, [isAnalista, isRecuperador, user]);

  // Si es admin o recuperador, configurar automáticamente su agencia
  useEffect(() => {
    if ((isAdmin || isRecuperador) && user) {
      setSelectedAdmin({
        NUM: 1, // Valor por defecto
        NOM_ADMI: user.razon || '',
        ID_ANA: user.id_ana || '',
        CARGO: user.cargo || '',
        AGENCIA: user.id_age || '',
        COD_AGE: user.id_age || '',
      });
    }
  }, [isAdmin, isRecuperador, user]);

  // Cuando se selecciona un recuperador, automáticamente cargar su gestión de mora
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
  // Recuperadores (para SUPER_ADMIN, JEFE_RECUPERACIONES 
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

  // Asegurar que analistas siempre sea un array
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

//   // Gestiones x estados (solo super/gerente/admin)
//   const { data: gestionesXEstados } = useQuery({
//     queryKey: ['gestiones-estados', selectedAdmin?.AGENCIA],
//     queryFn: () => getGestionesXEstados(selectedAdmin?.AGENCIA || user?.id_age || ''),
//     enabled: isSuperOrGerente && (!!selectedAdmin || !!user?.id_age),
//   });

//   // Guardar gestión
//   const saveMutation = useMutation({
//     mutationFn: (dto: SaveGestionDto) => saveGestion(dto),
//     onSuccess: () => {
//       toast.success('Gestión registrada correctamente');
//       queryClient.invalidateQueries({ queryKey: ['socios-mora'] });
//     },
//     onError: () => toast.error('Error al registrar gestión'),
//   });

  // Gestiones por estados - condicional:
  // - Para SUPER_ADMIN y JEFE_RECUPERACIONES sin seleccionar recuperador: reporte general
  // - Para otros casos o cuando ya seleccionaron recuperador: reporte por agencia
  const shouldUseGeneralReport = (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.JEFE_RECUPERACIONES || user?.role === UserRole.GERENTE_GENERAL) && !selectedAdmin;
  
  const { data: gestionesXEstados } = useQuery({
    queryKey: shouldUseGeneralReport ? ['gestiones-estados-general'] : ['gestiones-estados', selectedAdmin?.AGENCIA],
    queryFn: shouldUseGeneralReport
      ? () => getGestionesXEstadosGeneral()
      : () => getReporteMora(selectedAdmin?.AGENCIA || user?.id_age || ''),
    enabled: (isSuperOrGerente || isRecuperador) && (shouldUseGeneralReport || !!selectedAdmin || !!user?.id_age),
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
  };
};