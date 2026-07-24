import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import { useNotifications } from '../../../hooks/useNotifications';
import {
  fetchSolicitudesCreditoPendientes,
  fetchDetalleSolicitud,
  aprobarSolicitud,
  denegarSolicitud,
  anularSolicitud,
  SolicitudCredito,
  DetalleSolicitud,
  AprobarSolicitudRequest,
  DenegarSolicitudRequest,
  AnularSolicitudRequest
} from '../../../api/aprobacionCreditosAPI';
import { createOtpCode, validateOtpCode } from '../../../api/otpAPI';
import { creditAttentionApi } from '../../../api/creditAttentionApi';
import { getMisNumerosCelular } from '../../../api/userApi';

export const useAprobacionCreditos = () => {
  const { user } = useAuth();
  const { canViewCreditApproval, canApproveCreditApproval } = useCombinedPermissions();
  const notifications = useNotifications();

  const [solicitudes, setSolicitudes] = useState<SolicitudCredito[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<SolicitudCredito[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgencia, setSelectedAgencia] = useState<string>('TODAS');
  const [agencias, setAgencias] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<(SolicitudCredito & { detalle?: DetalleSolicitud }) | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  

  // Estados para OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isValidatingOtp, setIsValidatingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [generatedOtpCode, setGeneratedOtpCode] = useState<string>(''); // 🔥 TEMPORAL: Guardar OTP generado
  const [pendingApproval, setPendingApproval] = useState<{
    solicitud: SolicitudCredito & { detalle?: DetalleSolicitud };
    glosa: string;
  } | null>(null);

  const hasAccess = user?.role === 'SUPER_ADMIN' || canViewCreditApproval();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // Filtrar solicitudes cuando cambia el término de búsqueda o la agencia seleccionada
  useEffect(() => {
    let filtered = solicitudes;

    if (selectedAgencia !== 'TODAS') {
      filtered = filtered.filter(sol => sol.AGENCIA_NOM === selectedAgencia);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((sol) =>
        sol.NOMBRE.toLowerCase().includes(term) ||
        sol.CUENTA.toLowerCase().includes(term) ||
        sol.NRO_SOL.toLowerCase().includes(term)
      );
    }

    setFilteredSolicitudes(filtered);
  }, [searchTerm, selectedAgencia, solicitudes]);

  const cargarSolicitudes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let agencia = user?.id_age || '';

      const agenciasDigitales = ['06', '07', '10', '11', '12', '13'];
      if (agenciasDigitales.includes(agencia)) {
        agencia = '98';
      }

      const cargo = user?.cargo || '';
      const usuario = user?.user || '';
      const response = await fetchSolicitudesCreditoPendientes(agencia, cargo, usuario);

      if (response.status) {
        setSolicitudes(response.data);
        setFilteredSolicitudes(response.data);

        const agenciasUnicas = Array.from(new Set(response.data.map(sol => sol.AGENCIA_NOM)));
        setAgencias(agenciasUnicas);

        if (agenciasUnicas.length === 1) {
          setSelectedAgencia(agenciasUnicas[0]);
        } else {
          setSelectedAgencia('TODAS');
        }
      } else {
        setError(response.message);
        setSolicitudes([]);
        setFilteredSolicitudes([]);
        setAgencias([]);
      }
    } catch (err) {
      setError('Error al cargar las solicitudes de crédito');
      setSolicitudes([]);
      setFilteredSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerDetalle = async (solicitud: SolicitudCredito) => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await fetchDetalleSolicitud(solicitud.NRO_SOL.trim());

      if (response.status && response.data) {
        setSelectedSolicitud({ ...solicitud, detalle: response.data });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Error al cargar el detalle de la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAprobar = async (
    solicitud: SolicitudCredito & { detalle?: DetalleSolicitud },
    glosa: string
  ) => {
    if (!solicitud.detalle) {
      notifications.warning('No se puede aprobar: faltan datos del detalle de la solicitud');
      return;
    }

    if (!user?.cargo) {
      notifications.error('Error: No se puede determinar el usuario que aprueba');
      return;
    }

    try {
      setIsProcessing(true);

      let numeroCelular: string | null = null;

      try {
        const numerosResponse = await getMisNumerosCelular();

        if (!numerosResponse.success || numerosResponse.data.length === 0) {
          notifications.error('No tienes un número de celular registrado. Por favor, registra tu número en tu perfil antes de aprobar solicitudes.');
          return;
        }

        const numeroPrincipal = numerosResponse.data.find(n => n.tipo === 'principal');
        if (numeroPrincipal) {
          numeroCelular = numeroPrincipal.numero_celular;
        } else if (numerosResponse.data[0]) {
          numeroCelular = numerosResponse.data[0].numero_celular;
        }

        if (!numeroCelular) {
          notifications.error('No se encontró un número de celular válido. Por favor, verifica tu perfil.');
          return;
        }

        if (!numeroCelular.startsWith('51')) {
          numeroCelular = '51' + numeroCelular;
        }
      } catch (error) {
        console.error('Error al obtener número de celular:', error);
        notifications.error('No se pudo obtener tu número de celular. Por favor, verifica tu perfil.');
        return;
      }

      const otpResponse = await createOtpCode({
        entidad_id: solicitud.detalle.NRO_SOL,
        entidad_tipo: 'SOLICITUD_CREDITO',
        tipo_otp: 'APROBACION_CREDITO',
        canal_envio: 'WHATSAPP',
        destino_envio: numeroCelular,
        max_intentos: 3,
        minutos_expiracion: 5,
        creado_por: user.user || '',
        observacion: `Aprobación de solicitud ${solicitud.detalle.NRO_SOL}`
      });

      if (!otpResponse.status) {
        notifications.error(otpResponse.message);
        return;
      }

      // 🔥 TEMPORAL: Guardar el OTP generado para mostrarlo en el modal
      setGeneratedOtpCode(otpResponse.data.codigo);

      const mensaje = `🔐 *Código de Verificación DILE*\n\nTu código OTP para aprobar la solicitud ${solicitud.detalle.NRO_SOL} es:\n\n*${otpResponse.data.codigo}*\n\nEste código expira en 5 minutos.\n\n⚠️ No compartas este código con nadie.`;

      try {
        // Intentar enviar por el servicio OTP (endpoint send-OTP)
        await creditAttentionApi.sendOTPNotification({
          number: numeroCelular,
          message: mensaje,
          mediaUrl: undefined,
          otp: otpResponse.data.codigo
        });
      } catch (otpServiceError) {
        // Fallback: intentar con WhatsApp
        try {
          await creditAttentionApi.sendWhatsAppMessage({
            number: numeroCelular,
            message: mensaje,
            mediaUrl: undefined
          });
        } catch (whatsappError) {
          notifications.warning('OTP generado pero no se pudo enviar. Código: ' + otpResponse.data.codigo);
        }
      }

      setPendingApproval({ solicitud, glosa });
      setShowOtpModal(true);
      notifications.success('Código OTP enviado a tu WhatsApp');
    } catch (error) {
      notifications.error('Error al generar código OTP');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateOtp = async (codigo: string) => {
    if (!pendingApproval) return;

    try {
      setIsValidatingOtp(true);
      setOtpError('');

      const validateResponse = await validateOtpCode({
        entidad_id: pendingApproval.solicitud.detalle!.NRO_SOL,
        entidad_tipo: 'SOLICITUD_CREDITO',
        tipo_otp: 'APROBACION_CREDITO',
        codigo: codigo
      });

      if (!validateResponse.status) {
        setOtpError(validateResponse.message);
        return;
      }

      if (!user?.user) {
        notifications.error('No existe usuario autenticado.');
        return;
      }

      const detalle = pendingApproval.solicitud.detalle!;
      const glosaFormateada = pendingApproval.glosa.trim() ? pendingApproval.glosa.trim().toUpperCase() : '';

      const requestData: AprobarSolicitudRequest = {
        COD_AGE: detalle.COD_AGE,
        NRO_SOL: detalle.NRO_SOL,
        TRAMO: detalle.NIVEL,
        PRIORIDAD: detalle.ORDEN,
        GLOSA: glosaFormateada,
        COD_APRUEBA: user?.cargo || '',
        CUOTA_FIJA: parseFloat(detalle.CUOTA_FIJA),
        PLAZO: parseInt(detalle.PLAZO),
        FEC_1_ER: detalle.FECHA_1RACUOTA,
        MONTO_APRO: parseFloat(detalle.MONTO_APROB),
        MONTO_NETO: parseFloat(detalle.MONTO_NETO),
        TEA: parseFloat(detalle.TEA_INTERES),
        COD_USER: user?.user
      };

      const response = await aprobarSolicitud(requestData);

      if (response.status) {
        notifications.success(response.message || 'Solicitud aprobada exitosamente');
        setShowOtpModal(false);
        setSelectedSolicitud(null);
        setPendingApproval(null);
        cargarSolicitudes();
      } else {
        notifications.error(response.message || 'Error al aprobar la solicitud');
        setOtpError(response.message);
      }
    } catch (error) {
      setOtpError('Error inesperado al validar OTP');
    } finally {
      setIsValidatingOtp(false);
    }
  };

  const handleRechazar = async (
    solicitud: SolicitudCredito & { detalle?: DetalleSolicitud },
    glosa: string
  ) => {
    if (!solicitud.detalle) {
      notifications.warning('No se puede denegar: faltan datos del detalle de la solicitud');
      return;
    }

    if (!user?.user) {
      notifications.error('Error: No se puede determinar el usuario que deniega');
      return;
    }

    try {
      setIsProcessing(true);

      const detalle = solicitud.detalle;
      const glosaFormateada = glosa.trim() ? glosa.trim().toUpperCase() : '';

      const requestData: DenegarSolicitudRequest = {
        COD_AGE: detalle.COD_AGE,
        NRO_SOL: detalle.NRO_SOL,
        TRAMO: detalle.NIVEL,
        PRIORIDAD: detalle.ORDEN,
        GLOSA: glosaFormateada,
        COD_APRUEBA: user.user
      };

      const response = await denegarSolicitud(requestData);

      if (response.status) {
        notifications.success(response.message || 'Solicitud denegada exitosamente');
        setSelectedSolicitud(null);
        cargarSolicitudes();
      } else {
        notifications.error(response.message || 'Error al denegar la solicitud');
      }
    } catch (err) {
      notifications.error('Error inesperado al denegar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnular = async (
    solicitud: SolicitudCredito & { detalle?: DetalleSolicitud },
    glosa: string
  ) => {
    if (!solicitud.detalle) {
      notifications.error('No se puede anular sin el detalle de la solicitud');
      return;
    }

    try {
      setIsProcessing(true);

      const requestData: AnularSolicitudRequest = {
        COD_AGE: solicitud.detalle.COD_AGE,
        NRO_SOL: solicitud.detalle.NRO_SOL,
        GLOSA: glosa.toUpperCase(),
        COD_APRUEBA: user?.cargo || '',
        NIVEL: solicitud.detalle.NIVEL,
        ORDEN: solicitud.detalle.ORDEN,
      };

      const response = await anularSolicitud(requestData);

      if (response.status) {
        notifications.success(response.message || 'Solicitud anulada exitosamente');
        setSelectedSolicitud(null);
        cargarSolicitudes();
      } else {
        notifications.error(response.message || 'Error al anular la solicitud');
      }
    } catch (error) {
      notifications.error('Error inesperado al anular la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprimir = (_solicitud: SolicitudCredito) => {
    notifications.warning('Función de impresión en desarrollo');
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setPendingApproval(null);
    setOtpError('');
  };

  return {
    // Estado
    solicitudes,
    filteredSolicitudes,
    searchTerm,
    setSearchTerm,
    selectedAgencia,
    setSelectedAgencia,
    agencias,
    isLoading,
    error,
    selectedSolicitud,
    setSelectedSolicitud,
    isProcessing,
    // OTP
    showOtpModal,
    isValidatingOtp,
    otpError,
    generatedOtpCode, // 🔥 TEMPORAL: Código OTP generado
    pendingApproval,
    // Permisos
    hasAccess,
    canApproveCreditApproval,
    // Handlers
    cargarSolicitudes,
    handleVerDetalle,
    handleAprobar,
    handleValidateOtp,
    handleRechazar,
    handleAnular,
    handleImprimir,
    handleCloseOtpModal,
  };
};