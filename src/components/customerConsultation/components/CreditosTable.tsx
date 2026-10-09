import { useState, lazy, Suspense, useEffect, useContext, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DetalleCredito, ClienteResponse, checkVoucherExists, procesarPayoutKambia, PayoutDto } from '../../../api/customerConsultationAPI';
import { getPaymentsByCreditoId } from '../../../api/paymentsApi';
import { generarContrato, obtenerUrlFirmada } from '../../../api/firmaDigitalApi';
import { PaymentRecord } from '../../../types';
import PagosModal from './modal-de-vouchers/modal-vouchers';
import ComprobanteDesembolsoModal from './ComprobanteDesembolsoModal';
import ValidarContratoModal from './ValidarContratoModal';
import { AuthContext } from '../../../contexts/AuthContext';
import { Permission, UserRole } from '../../../types/permissions';
import { logContractGenerationInfo } from '../../../utils/deviceInfo';
import { isOtorgaToday, getOtorgaErrorMessage } from '../../../utils/dateValidation';

const CronogramaModal = lazy(() => import('../../cronograma/CronogramaPage'));
// const PagosPrestamoModal = lazy(() => import('./PagosPrestamoModal'));

interface CreditosTableProps {
  creditos: DetalleCredito[];
  clientData: ClienteResponse;
  onRefreshData?: () => void; // Función para refrescar los datos
  onUpdateCredito?: (creditoId: string, updatedData: Partial<DetalleCredito>) => void; // Función para actualizar un crédito específico
}

const CreditosTable = ({ creditos, clientData, onRefreshData, onUpdateCredito }: CreditosTableProps) => {
  const authContext = useContext(AuthContext);
  const { user } = authContext || {};
  
  // Estado local para manejar los créditos (copia actualizable)
  const [localCreditos, setLocalCreditos] = useState<DetalleCredito[]>(creditos);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<DetalleCredito | null>(null);
  const [isPagosModalOpen, setIsPagosModalOpen] = useState(false);
  const [pagosData, setPagosData] = useState<PaymentRecord[]>([]);
  const [selectedCreditoId, setSelectedCreditoId] = useState<string>('');
  const [loadingPagos, setLoadingPagos] = useState(false);
  // Estados para el modal de notificación
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  // Estados para firma digital
  const [loadingFirma, setLoadingFirma] = useState(false);
  const [selectedCreditoFirma, setSelectedCreditoFirma] = useState<string>('');
  // Estados para subir comprobante de desembolso
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [selectedCreditoDesembolso, setSelectedCreditoDesembolso] = useState<DetalleCredito | null>(null);
  // Estado para rastrear qué vouchers existen
  const [vouchersExistentes, setVouchersExistentes] = useState<Record<string, boolean>>({});
  // Estados para el modal de validación de contrato
  const [showValidarContratoModal, setShowValidarContratoModal] = useState(false);
  const [selectedCreditoValidar, setSelectedCreditoValidar] = useState<DetalleCredito | null>(null);
  // Estados para Payout Kambia
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [selectedCreditoPayout, setSelectedCreditoPayout] = useState<string>('');

  // Sincronizar el estado local con los props cuando cambien
  useEffect(() => {
    setLocalCreditos(creditos);
  }, [creditos]);

  // Función para actualizar un crédito específico en el estado local
  const updateLocalCredito = (creditoId: string, updatedData: Partial<DetalleCredito>) => {
    setLocalCreditos(prevCreditos =>
      prevCreditos.map(credito =>
        credito.ID_PRESTAMO === creditoId
          ? { ...credito, ...updatedData }
          : credito
      )
    );
    
    // También notificar al componente padre si tiene la función
    if (onUpdateCredito) {
      onUpdateCredito(creditoId, updatedData);
    }
  };

  // FUNCIONES DE VALIDACIÓN DE PERMISOS
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Super Admin tiene todos los permisos
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // Verificar si el usuario tiene el permiso específico
    return user.permissions?.includes(permission) || false;
  };

  const canGenerateContracts = (): boolean => {
    return hasPermission(Permission.PARTNERS_EDIT);
  };

  const canViewContracts = (): boolean => {
    return hasPermission(Permission.PARTNERS_VIEW) || hasPermission(Permission.PARTNERS_EDIT);
  };

  const canViewSignedContracts = (): boolean => {
    // Cualquier usuario con permisos de ver socios puede ver contratos YA FIRMADOS
    return canViewContracts();
  };

  const handleVerCronograma = (credito: DetalleCredito) => {
    setSelectedPrestamo(credito);
    setIsModalOpen(true);
  };

  const handleVerPagos = useCallback(async (creditoId: string) => {
    try {
      setLoadingPagos(true);
      setSelectedCreditoId(creditoId);
      
      const response = await getPaymentsByCreditoId(creditoId);
      
      if (response.success && response.data.length > 0) {
        setPagosData(response.data);
        setIsPagosModalOpen(true);
      } else {
        // Mostrar mensaje en modal si no hay pagos
        setNotificationMessage('No se encontraron pagos para este préstamo');
        setShowNotificationModal(true);
      }
    } catch (error) {
      setNotificationMessage('Error al cargar los pagos del préstamo');
      setShowNotificationModal(true);
    } finally {
      setLoadingPagos(false);
    }
  }, []);

  // Función memoizada para cerrar el modal de pagos
  const handleClosePagosModal = useCallback(() => {
    setIsPagosModalOpen(false);
    setPagosData([]);
    setSelectedCreditoId('');
  }, []);

  // Función para generar contrato cuando el estado es FIRMAR
  const handleGenerarContrato = async (credito: DetalleCredito) => {
      // 🔴 VALIDACIÓN NUEVA: Verificar que OTORGA sea HOY
      if (!isOtorgaToday(credito.OTORGA)) {
          setNotificationMessage(getOtorgaErrorMessage(credito.OTORGA));
          setShowNotificationModal(true);
          return;
      }

      // Validar que tenga número de celular
      const celular = clientData.INFO_SOCIO.CONTACTO.CELULAR;
      if (!celular || celular.trim() === '') {
          setNotificationMessage('No se puede generar el contrato: el campo de número de celular está vacío. Por favor, complete esta información antes de continuar.');
          setShowNotificationModal(true);
          return;
      }

      if (!clientData.INFO_SOCIO.CONTACTO.EMAIL) {
          setNotificationMessage('No se puede firmar: el campo de correo electrónico está vacío.');
          setShowNotificationModal(true);
          return;
      }

      // Validar que tenga datos bancarios completos (cuenta y CCI)
      const datosBancarios = clientData.INFO_SOCIO["DATOS BANCARIOS"];
      if (!datosBancarios || datosBancarios.length === 0) {
          setNotificationMessage('No se puede generar el contrato: faltan datos bancarios. Por favor, complete la información de cuenta bancaria y CCI.');
          setShowNotificationModal(true);
          return;
      }

      const primerDatoBancario = datosBancarios[0] as any; // Cast porque la API externa devuelve NUM_CCI
      const tieneNumCuenta = primerDatoBancario.NUM_CUENTA && primerDatoBancario.NUM_CUENTA.trim() !== '';
      const tieneCCI = primerDatoBancario.NUM_CCI && primerDatoBancario.NUM_CCI.trim() !== '';

      if (!tieneNumCuenta || !tieneCCI) {
          const camposFaltantes = [];
          if (!tieneNumCuenta) camposFaltantes.push('número de cuenta');
          if (!tieneCCI) camposFaltantes.push('CCI');
          
          setNotificationMessage(`No se puede generar el contrato: faltan los siguientes datos bancarios: ${camposFaltantes.join(' y ')}. Por favor, complete esta información antes de continuar.`);
          setShowNotificationModal(true);
          return;
      }
  
      try {
          setLoadingFirma(true);
          setSelectedCreditoFirma(credito.ID_PRESTAMO);

          // 🔍 Capturar información del dispositivo al generar contrato
          await logContractGenerationInfo(credito.ID_PRESTAMO);
  
          const response = await generarContrato({
              PAGARE: credito.ID_PRESTAMO,
              DNI: clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
              TIPO_DOC: clientData.INFO_SOCIO.DATOS_PERSONALES.TIPO_DOC
          });

      if (response.success) {
        // Verificar el estado de la respuesta del endpoint
        if (response.data && response.data.status === false) {
          // El endpoint devolvió un error con status false
          // Esto puede ser por horario de atención, DNI/PAGARE incorrecto, etc.
          const errorMessage = response.data.message || 'Error al generar el contrato';
          setNotificationMessage(errorMessage);
          setShowNotificationModal(true);
          
          // No actualizar el estado del crédito cuando hay error
          return;
        } else if (response.data && response.data.status === true) {
          // El contrato se generó exitosamente con status true
          setNotificationMessage('Contrato generado exitosamente. El documento está listo para firmar.');
          setShowNotificationModal(true);
          
          // Actualizar inmediatamente el estado local del crédito
          if (response.data.ID_DOCUMENT) {
            updateLocalCredito(credito.ID_PRESTAMO, {
              FIRM_DIGITAL: {
                ESTADO: 'PENDIENTE',
                ID_DOCUMENT: response.data.ID_DOCUMENT,
                URL_SIGNED_FILE: credito.FIRM_DIGITAL?.URL_SIGNED_FILE || null
              }
            });
          } else {
            // Si no hay ID_DOCUMENT en la respuesta, solo cambiar el estado
            updateLocalCredito(credito.ID_PRESTAMO, {
              FIRM_DIGITAL: {
                ESTADO: 'PENDIENTE',
                ID_DOCUMENT: credito.FIRM_DIGITAL?.ID_DOCUMENT || null,
                URL_SIGNED_FILE: credito.FIRM_DIGITAL?.URL_SIGNED_FILE || null
              }
            });
          }
          
          // Refrescar los datos para obtener el estado actualizado del servidor
          if (onRefreshData) {
            setTimeout(() => {
              onRefreshData();
            }, 500); // Reducir tiempo de espera
          }
        } else {
          // Respuesta exitosa pero sin estructura esperada
          setNotificationMessage('Contrato generado exitosamente. El documento está listo para firmar.');
          setShowNotificationModal(true);
          
          // Actualizar el estado como antes para compatibilidad con versiones anteriores
          updateLocalCredito(credito.ID_PRESTAMO, {
            FIRM_DIGITAL: {
              ESTADO: 'PENDIENTE',
              ID_DOCUMENT: credito.FIRM_DIGITAL?.ID_DOCUMENT || null,
              URL_SIGNED_FILE: credito.FIRM_DIGITAL?.URL_SIGNED_FILE || null
            }
          });
          
          // Refrescar los datos para obtener el estado actualizado del servidor
          if (onRefreshData) {
            setTimeout(() => {
              onRefreshData();
            }, 500);
          }
        }
      } else {
        setNotificationMessage(`Error al generar el contrato: ${response.message}`);
        setShowNotificationModal(true);
      }
    } catch (error) {
      setNotificationMessage('Error al generar el contrato');
      setShowNotificationModal(true);
    } finally {
      setLoadingFirma(false);
      setSelectedCreditoFirma('');
    }
  };

  // Función para manejar el clic en contrato firmado y obtener URL pública
  const handleVerContratoFirmado = async (credito: DetalleCredito) => {
    if (!credito.FIRM_DIGITAL?.URL_SIGNED_FILE) {
      setNotificationMessage('No hay URL de contrato firmado disponible');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoadingFirma(true);
      setSelectedCreditoFirma(credito.ID_PRESTAMO);

      // Llamar al endpoint para obtener la URL pública
      const response = await obtenerUrlFirmada({
        URL: credito.FIRM_DIGITAL.URL_SIGNED_FILE
      });

      if (response.success && response.url) {
        // Abrir la URL pública en una nueva pestaña
        window.open(response.url, '_blank');
      } else {
        // Si no se puede obtener la URL pública, usar la original
        setNotificationMessage('No se pudo obtener la URL pública. Usando URL original...');
        setShowNotificationModal(true);
        setTimeout(() => {
          if (credito.FIRM_DIGITAL?.URL_SIGNED_FILE) {
            window.open(credito.FIRM_DIGITAL.URL_SIGNED_FILE, '_blank');
          }
        }, 1000);
      }
    } catch (error) {
      // En caso de error, usar la URL original
      setNotificationMessage('Error al obtener URL pública. Usando URL original...');
      setShowNotificationModal(true);
      setTimeout(() => {
        if (credito.FIRM_DIGITAL?.URL_SIGNED_FILE) {
          window.open(credito.FIRM_DIGITAL.URL_SIGNED_FILE, '_blank');
        }
      }, 1000);
    } finally {
      setLoadingFirma(false);
      setSelectedCreditoFirma('');
    }
  };

  // Hook para cargar el estado de vouchers al inicio
  useEffect(() => {
    const verificarVouchers = async () => {
      if (!clientData?.INFO_SOCIO?.DATOS_PERSONALES?.DNI || !localCreditos?.length) return;
      
      const resultados: Record<string, boolean> = {};
      
      for (const credito of localCreditos) {
        if (credito.ESTADO === 'VIGENTE') {
          try {
            const result = await checkVoucherExists(
              clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
              credito.ID_PRESTAMO
            );
            resultados[credito.ID_PRESTAMO] = result.exists;
          } catch (error) {
            resultados[credito.ID_PRESTAMO] = false;
          }
        }
      }
      
      setVouchersExistentes(resultados);
    };

    verificarVouchers();
  }, [clientData, localCreditos]);

  // Función para abrir modal de subir comprobante de desembolso
  const handleSubirComprobante = async (credito: DetalleCredito) => {
    try {
      // Primero verificar si ya existe el voucher
      const result = await checkVoucherExists(
        clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
        credito.ID_PRESTAMO
      );

      if (result.exists && result.url) {
        // Si existe, abrir directamente la URL original
        window.open(result.url, '_blank');
      } else {
        // Si no existe, abrir el modal para subir
        setSelectedCreditoDesembolso(credito);
        setShowComprobanteModal(true);
      }
    } catch (error) {
      // En caso de error, abrir el modal por defecto
      setSelectedCreditoDesembolso(credito);
      setShowComprobanteModal(true);
    }
  };

  // Función para abrir el modal de validación de contrato (estado PENDIENTE - azul)
  const handleAbrirValidarContrato = (credito: DetalleCredito) => {
    setSelectedCreditoValidar(credito);
    setShowValidarContratoModal(true);
  };

  // Función para manejar Payout Kambia cuando hay error en datos bancarios
  const handlePayoutKambia = async (credito: DetalleCredito) => {
    try {
      setLoadingPayout(true);
      setSelectedCreditoPayout(credito.ID_PRESTAMO);

      const payoutData: PayoutDto = {
        PAGARE: credito.ID_PRESTAMO,
        USER: user?.dni || 'usuario_no_identificado'
      };

      const response = await procesarPayoutKambia(payoutData);

      if (response.status) {
        setNotificationMessage(response.message || 'Payout procesado exitosamente');
        setShowNotificationModal(true);
      } else {
        setNotificationMessage(response.message || 'Error al procesar payout');
        setShowNotificationModal(true);
      }
    } catch (error) {
      setNotificationMessage('Error al procesar el payout');
      setShowNotificationModal(true);
    } finally {
      setLoadingPayout(false);
      setSelectedCreditoPayout('');
    }
  };

  // Función para determinar si mostrar el botón de Payout Kambia
  const shouldShowPayoutButton = (credito: DetalleCredito): boolean => {
    const datosBancarios = clientData.INFO_SOCIO["DATOS BANCARIOS"];
    const firmDigital = credito.FIRM_DIGITAL;
    
    // Condiciones para mostrar el botón:
    // 1. OBSERVACION === "ERROR" O "pending" en datos bancarios
    // 2. La firma está validada (verde, estado FIRMADO)
    // 3. NO se ha subido el comprobante de pago (voucher pendiente)
    
    const tieneObservacionErrorOPending = Boolean(
      datosBancarios &&
      datosBancarios.some(cuenta =>
        cuenta.OBSERVACION === 'ERROR' || cuenta.OBSERVACION === 'PENDING'
      )
    );
    const firmaValidada = Boolean(firmDigital && firmDigital.ESTADO === 'FIRMADO');
    const voucherNoPendiente = Boolean(!vouchersExistentes[credito.ID_PRESTAMO]);
    
    return tieneObservacionErrorOPending && firmaValidada && voucherNoPendiente;
  };

  // Función para renderizar el botón de Payout Kambia
  const renderPayoutButton = (credito: DetalleCredito) => {
    if (!shouldShowPayoutButton(credito)) {
      return null;
    }

    const isLoading = loadingPayout && selectedCreditoPayout === credito.ID_PRESTAMO;

    return (
      <button
        onClick={() => handlePayoutKambia(credito)}
        disabled={isLoading}
        className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors disabled:bg-purple-300"
        title="Procesar Payout Kambia - Error en datos bancarios"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )}
      </button>
    );
  };

  // Función para renderizar el botón de contrato según el estado de firma digital
  const renderContratoButton = (credito: DetalleCredito) => {
    const firmDigital = credito.FIRM_DIGITAL;
    const isLoading = loadingFirma && selectedCreditoFirma === credito.ID_PRESTAMO;

    // VALIDACIÓN DE PERMISOS PRIMERO
    // Si está firmado, verificar permisos para ver contratos firmados
    if (firmDigital && firmDigital.ESTADO === 'FIRMADO' && firmDigital.URL_SIGNED_FILE) {
      if (!canViewSignedContracts()) {
        return (
          <button
            className="p-2 bg-gray-400 text-white rounded-full cursor-default"
            title="Sin permisos para ver contratos"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
      }
      
      return (
        <button
          onClick={() => handleVerContratoFirmado(credito)}
          disabled={isLoading}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-green-300"
          title="Ver contrato firmado"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>
      );
    }

    // Para acciones que requieren generar contratos, verificar permisos de edición
    const requiresGeneratePermission = firmDigital && (
      firmDigital.ESTADO === 'FIRMAR' ||
      firmDigital.ESTADO === 'PENDIENTE' ||
      (firmDigital.ID_DOCUMENT && !firmDigital.URL_SIGNED_FILE)
    );

    if (requiresGeneratePermission && !canGenerateContracts()) {
      return (
        <button
          className="p-2 bg-red-400 text-white rounded-full cursor-default"
          title="Sin permisos para generar contratos - Solo lectura"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    // Si el crédito NO es vigente, solo mostrar opciones limitadas
    if (credito.ESTADO !== 'VIGENTE') {
      // Si no hay firma digital o estado es NO_FIRMA, no mostrar botón
      if (!firmDigital || firmDigital.ESTADO === 'NO_FIRMA') {
        return (
          <button
            className="p-2 bg-gray-400 text-white rounded-full cursor-default"
            title="Contrato no disponible"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
      }
      
      // Para créditos no vigentes con otros estados de firma, mostrar botón deshabilitado
      return (
        <button
          className="p-2 bg-gray-400 text-white rounded-full cursor-default"
          title="Crédito no vigente - No se pueden realizar acciones"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    // A partir de aquí, solo créditos VIGENTES

    // Si no hay firma digital o estado es NO_FIRMA, no mostrar botón
    if (!firmDigital) {
        return (
            <button
                className="p-2 bg-gray-400 text-white rounded-full cursor-default"
                title="Contrato no disponible"
                disabled
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
                </svg>
            </button>
        );
    }
    
    // PRIMERO: Validar estados específicos antes que condiciones generales
    if (firmDigital.ESTADO === 'NO_FIRMA') {
        return (
            <button
                className="p-2 bg-gray-400 text-white rounded-full cursor-default"
                title="Contrato no disponible"
                disabled
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
                </svg>
            </button>
        );
    }

    if (firmDigital.ESTADO === 'NO_FIRMAR') {
        return (
            <button
                className="p-2 bg-red-400 text-white rounded-full cursor-default"
                title="No se puede firmar: fecha límite expirada"
                disabled
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
                </svg>
            </button>
        );
    }

    // Si el estado es FIRMAR, mostrar botón para generar contrato
    if (firmDigital.ESTADO === 'FIRMAR') {
      return (
        <button
          onClick={() => handleGenerarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:bg-orange-300"
          title="Generar contrato para firmar"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>
      );
    }

    // Si el estado es PENDIENTE, mostrar botón para abrir modal de validación (documento generado pero no firmado)
    if (firmDigital.ESTADO === 'PENDIENTE') {
      return (
        <button
          onClick={() => handleAbrirValidarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Validar contrato - Documento pendiente de firma"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14.5 9.5L16 11l3-3" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
      );
    }

    // ULTIMO: Si hay ID_DOCUMENT pero no URL_SIGNED_FILE (caso de respaldo)
    // Solo aplica después de verificar todos los estados específicos
    if (firmDigital.ID_DOCUMENT && !firmDigital.URL_SIGNED_FILE) {
      return (
        <button
          onClick={() => handleAbrirValidarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Validar contrato"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14.5 9.5L16 11l3-3" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
      );
    }

    // Estado por defecto
    return (
      <button
        className="p-2 bg-gray-400 text-white rounded-full cursor-default"
        title="Estado desconocido"
        disabled
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    );
  };

  // Función para renderizar el botón de contrato en vista móvil (solo íconos)
  const renderContratoButtonMobile = (credito: DetalleCredito) => {
    const firmDigital = credito.FIRM_DIGITAL;
    const isLoading = loadingFirma && selectedCreditoFirma === credito.ID_PRESTAMO;

    // VALIDACIÓN DE PERMISOS PRIMERO
    // Si está firmado, verificar permisos para ver contratos firmados
    if (firmDigital && firmDigital.ESTADO === 'FIRMADO' && firmDigital.URL_SIGNED_FILE) {
      if (!canViewSignedContracts()) {
        return (
          <button
            className="p-2 bg-gray-400 text-white rounded-full cursor-default"
            title="Sin permisos para ver contratos"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
      }
      
      return (
        <button
          onClick={() => handleVerContratoFirmado(credito)}
          disabled={isLoading}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-green-300"
          title="Ver contrato firmado"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>
      );
    }

    // Para acciones que requieren generar contratos, verificar permisos de edición
    const requiresGeneratePermission = firmDigital && (
      firmDigital.ESTADO === 'FIRMAR' ||
      firmDigital.ESTADO === 'PENDIENTE' ||
      (firmDigital.ID_DOCUMENT && !firmDigital.URL_SIGNED_FILE)
    );

    if (requiresGeneratePermission && !canGenerateContracts()) {
      return (
        <button
          className="p-2 bg-red-400 text-white rounded-full cursor-default"
          title="Sin permisos para generar contratos - Solo lectura"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    // Si el crédito NO es vigente, solo mostrar opciones limitadas
    if (credito.ESTADO !== 'VIGENTE') {
      // Si no hay firma digital o estado es NO_FIRMA, no mostrar botón
      if (!firmDigital || firmDigital.ESTADO === 'NO_FIRMA') {
        return (
          <button
            className="p-2 bg-gray-400 text-white rounded-full cursor-default"
            title="Contrato no disponible"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
      }
      
      // Para créditos no vigentes con otros estados de firma, mostrar botón deshabilitado
      return (
        <button
          className="p-2 bg-gray-400 text-white rounded-full cursor-default"
          title="Crédito no vigente - No se pueden realizar acciones"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    // A partir de aquí, solo créditos VIGENTES

    // Si no hay firma digital, no mostrar botón
    if (!firmDigital) {
        return (
          <button
            className="p-2 bg-gray-400 text-white rounded-full cursor-default"
            title="Contrato no disponible"
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
    }

    // PRIMERO: Validar estados específicos antes que condiciones generales
    if (firmDigital.ESTADO === 'NO_FIRMA') {
      return (
        <button
          className="p-2 bg-gray-400 text-white rounded-full cursor-default"
          title="Contrato no disponible"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    if (firmDigital.ESTADO === 'NO_FIRMAR') {
      return (
        <button
          className="p-2 bg-red-400 text-white rounded-full cursor-default"
          title="No se puede firmar: fecha límite expirada"
          disabled
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      );
    }

    // Si el estado es FIRMAR, mostrar botón para generar contrato
    if (firmDigital.ESTADO === 'FIRMAR') {
      // 🔴 VALIDAR que OTORGA sea HOY
      const canGenerateToday = isOtorgaToday(credito.OTORGA);

      if (!canGenerateToday) {
        return (
          <button
            className="p-2 bg-red-400 text-white rounded-full cursor-default"
            title={getOtorgaErrorMessage(credito.OTORGA)}
            disabled
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 9v6m3-3H9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        );
      }

      return (
        <button
          onClick={() => handleGenerarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:bg-orange-300"
          title="Generar contrato para firmar"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
        </button>
      );
    }

    // Si el estado es PENDIENTE, mostrar botón para abrir modal de validación (documento generado pero no firmado)
    if (firmDigital.ESTADO === 'PENDIENTE') {
      return (
        <button
          onClick={() => handleAbrirValidarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Validar contrato - Documento pendiente de firma"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14.5 9.5L16 11l3-3" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
      );
    }

    // ULTIMO: Si hay ID_DOCUMENT pero no URL_SIGNED_FILE (caso de respaldo)
    // Solo aplica después de verificar todos los estados específicos
    if (firmDigital.ID_DOCUMENT && !firmDigital.URL_SIGNED_FILE) {
      return (
        <button
          onClick={() => handleAbrirValidarContrato(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Validar contrato"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14.5 9.5L16 11l3-3" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
      );
    }

    // Estado por defecto
    return (
      <button
        className="p-2 bg-gray-400 text-white rounded-full cursor-default"
        title="Estado desconocido"
        disabled
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    );
  };

  if (!Array.isArray(localCreditos) || localCreditos.length === 0 || typeof localCreditos[0] === 'string') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 overflow-hidden">
        <h2 className="text-lg font-bold uppercase text-cyan-800 mb-3 pb-2 border-b-2 border-cyan-200">
          HISTORIAL DE PRÉSTAMOS
        </h2>
        
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-4 rounded-lg">
          <div className="flex justify-center items-center">
            <p className="text-base sm:text-lg font-semibold text-center">
              SIN PRÉSTAMOS A MOSTRAR
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 overflow-hidden">
      <h2 className="text-lg font-bold uppercase text-cyan-800 mb-3 pb-2 border-b-2 border-cyan-200">
        HISTORIAL DE PRÉSTAMOS
      </h2>
      
      {/* Vista de Escritorio - Tabla */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap table-auto border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0 z-10">
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ID PRESTAMO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ESTADO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">MONTO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">SALDO CAPITAL</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">FRECUENCIA</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">OTORGA</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">PRODUCTO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {localCreditos.map((credito, index) => (
              <tr key={`${credito.ID_PRESTAMO}-${index}`} className="transition-colors duration-200 ease-in-out hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50">
                <td className="px-4 py-2 text-sm border border-gray-200">
                  <button
                    onClick={() => handleVerPagos(credito.ID_PRESTAMO)}
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors duration-200 font-medium"
                    disabled={loadingPagos}
                  >
                    {loadingPagos && selectedCreditoId === credito.ID_PRESTAMO ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Cargando...
                      </span>
                    ) : (
                      credito.ID_PRESTAMO
                    )}
                  </button>
                </td>
                <td className="px-4 py-2 text-sm border border-gray-200">
                  <span className="px-2 py-1 rounded-full text-xs font-medium">{credito.ESTADO}</span>
                </td>
                <MoneyCell value={credito.MONTO} />
                <MoneyCell value={credito.SALDO_CAPITAL || '0'} />
                <td className="px-4 py-2 text-sm font-medium text-center border border-gray-200">{credito.FRECUENCIA}</td>
                <td className="px-4 py-2 text-sm text-center border border-gray-200">{credito.OTORGA}</td>
                <td className="px-4 py-2 text-sm text-center border border-gray-200">{credito.PRODUCTO || 'No especificado'}</td>
                <td className="px-4 py-2 text-sm border border-gray-200">
                  {credito.ESTADO === 'VIGENTE' && (
                    <div className="flex gap-2">
                      <button
                        className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                        title="Ver cronograma"
                        onClick={() => handleVerCronograma(credito)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      {renderContratoButton(credito)}
                      <button
                        className={`p-2 ${vouchersExistentes[credito.ID_PRESTAMO]
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                        } text-white rounded-full transition-colors`}
                        title={vouchersExistentes[credito.ID_PRESTAMO]
                          ? "Ver comprobante de desembolso"
                          : "Falta subir comprobante de desembolso"
                        }
                        onClick={() => handleSubirComprobante(credito)}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </button>
                      {renderPayoutButton(credito)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil - Tarjetas */}
      <div className="lg:hidden">
        {localCreditos.map((credito, index) => (
          <div key={`${credito.ID_PRESTAMO}-${index}`} className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-cyan-800">
                ID Préstamo:
                <button
                  onClick={() => handleVerPagos(credito.ID_PRESTAMO)}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors duration-200 ml-2"
                  disabled={loadingPagos}
                >
                  {loadingPagos && selectedCreditoId === credito.ID_PRESTAMO ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Cargando...
                    </span>
                  ) : (
                    credito.ID_PRESTAMO
                  )}
                </button>
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${credito.ESTADO === 'Vigente' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                {credito.ESTADO}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <InfoField label="Monto" value={`S/ ${credito.MONTO}`} />
              <InfoField label="Saldo Capital" value={`S/ ${credito.SALDO_CAPITAL || '0'}`} />
              <InfoField label="Producto" value={credito.PRODUCTO || 'No especificado'} />
              <InfoField label="Frecuencia" value={credito.FRECUENCIA} />
            </div>
            <div className="mt-2 grid grid-cols-1">
              <InfoField label="Otorga" value={credito.OTORGA} />
            </div>
            <div className="mt-2">
              <InfoField label="Analista" value={credito.ANALISTA} />
            </div>
            {credito.ESTADO === 'VIGENTE' && (
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  className="p-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
                  onClick={() => handleVerCronograma(credito)}
                  title="Ver cronograma"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                {renderContratoButtonMobile(credito)}
                <button
                  className={`p-2 ${vouchersExistentes[credito.ID_PRESTAMO]
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                  } text-white rounded-full transition-colors`}
                  title={vouchersExistentes[credito.ID_PRESTAMO]
                    ? "Ver comprobante de desembolso"
                    : "Falta subir comprobante de desembolso"
                  }
                  onClick={() => handleSubirComprobante(credito)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
                {renderPayoutButton(credito)}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && selectedPrestamo && (
        <Suspense fallback={<div>Cargando cronograma...</div>}>
          <CronogramaModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            prestamo={selectedPrestamo}
            clientData={clientData}
          />
        </Suspense>
      )}

      {/* Modal simple de pagos del préstamo */}
      {isPagosModalOpen && typeof document !== 'undefined' && createPortal(
        <PagosModal
          selectedCreditoId={selectedCreditoId}
          pagosData={pagosData}
          onClose={handleClosePagosModal}
        />,
        document.body
      )}

      {/* Modal de Notificación */}
      {showNotificationModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Información</h3>
              <p className="text-gray-500 mb-6">{notificationMessage}</p>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para subir comprobante de desembolso */}
      {showComprobanteModal && selectedCreditoDesembolso && (
        <ComprobanteDesembolsoModal
          credito={selectedCreditoDesembolso}
          clientData={clientData}
          readOnly={true}
          onClose={async () => {
            setShowComprobanteModal(false);
            
            // Verificar realmente si el voucher existe después de cerrar el modal
            if (selectedCreditoDesembolso) {
              try {
                const result = await checkVoucherExists(
                  clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
                  selectedCreditoDesembolso.ID_PRESTAMO
                );
                
                // Solo actualizar el estado si realmente existe
                setVouchersExistentes(prev => ({
                  ...prev,
                  [selectedCreditoDesembolso.ID_PRESTAMO]: result.exists
                }));
              } catch (error) {
                // En caso de error, mantener el estado como falso
                setVouchersExistentes(prev => ({
                  ...prev,
                  [selectedCreditoDesembolso.ID_PRESTAMO]: false
                }));
              }
            }
            
            setSelectedCreditoDesembolso(null);
          }}
        />
      )}

      {/* Modal para validar contrato (estado PENDIENTE) */}
      {showValidarContratoModal && selectedCreditoValidar && (
        <ValidarContratoModal
          isOpen={showValidarContratoModal}
          onClose={() => {
            setShowValidarContratoModal(false);
            setSelectedCreditoValidar(null);
          }}
          credito={selectedCreditoValidar}
          clientData={clientData}
          userDni={user?.dni || ''}
          onValidar={(credito) => {
            // Actualizar el estado local del crédito cuando se valida
            updateLocalCredito(credito.ID_PRESTAMO, {
              FIRM_DIGITAL: {
                ESTADO: 'FIRMADO',
                ID_DOCUMENT: credito.FIRM_DIGITAL?.ID_DOCUMENT || null,
                URL_SIGNED_FILE: credito.FIRM_DIGITAL?.URL_SIGNED_FILE || null
              }
            });
          }}
          onRechazar={(credito, motivo) => {
            //console.log('Contrato rechazado:', credito.ID_PRESTAMO, 'Motivo:', motivo);
            // Aquí se podría agregar lógica adicional para el rechazo
          }}
          onRefreshData={onRefreshData}
        />
      )}
    </div>
  );
};

const MoneyCell = ({ value }: { value: string }) => (
  <td className="px-4 py-2 text-sm border border-gray-200">
    <div className="flex items-center justify-end gap-1">
      <span className="text-gray-500">S/</span>
      <span className="font-medium">{value}</span>
    </div>
  </td>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default CreditosTable;