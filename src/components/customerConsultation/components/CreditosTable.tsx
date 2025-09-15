import { useState, lazy, Suspense, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { DetalleCredito, ClienteResponse, checkVoucherExists } from '../../../api/customerConsultationAPI';
import { getPaymentsByCreditoId } from '../../../api/paymentsApi';
import { generarContrato, verificarDocumentoFirmado } from '../../../api/firmaDigitalApi';
import { PaymentRecord } from '../../../types';
import ComprobanteDesembolsoModal from './ComprobanteDesembolsoModal';
import { AuthContext } from '../../../contexts/AuthContext';
import { Permission, UserRole } from '../../../types/permissions';

const CronogramaModal = lazy(() => import('../../cronograma/CronogramaPage'));
// const PagosPrestamoModal = lazy(() => import('./PagosPrestamoModal'));

interface CreditosTableProps {
  creditos: DetalleCredito[];
  clientData: ClienteResponse;
  onRefreshData?: () => void; // Función para refrescar los datos
}

const CreditosTable = ({ creditos, clientData, onRefreshData }: CreditosTableProps) => {
  const authContext = useContext(AuthContext);
  const { user } = authContext || {};
  
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

  // Obtener la URL base del env y asegurarse que no termine en slash
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');

  // Función para determinar si es una ruta de comprobante
  const isComprobantePath = (str: string): boolean => {
    return str.startsWith('/comprobantes/') || str.includes('public/comprobantes') || str.includes('public\\comprobantes');
  };

  // Función para construir el src de la imagen (igual que en PaymentImage)
  const getImageSrc = (image: string): string => {
    if (!image) return ''; // Protección contra undefined

    // Si ya comienza con data:image, es un base64 completo
    if (image.startsWith('data:image')) {
      return image;
    }
    
    // Si es una ruta de comprobante
    if (isComprobantePath(image)) {
      // Si ya es una URL completa, usarla tal cual
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Extraer solo el nombre del archivo y usar el prefijo /comprobantes
      const fileName = image.split(/[/\\]/).pop();
      if (!fileName) return '';
      const finalUrl = `${API_BASE_URL}/comprobantes/${fileName}`;
      return finalUrl;
    }

    // Si no es ninguno de los anteriores, asumimos que es un string base64
    return `data:image/jpeg;base64,${image}`;
  };

  const handleVerCronograma = (credito: DetalleCredito) => {
    setSelectedPrestamo(credito);
    setIsModalOpen(true);
  };

  const handleVerPagos = async (creditoId: string) => {
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
  };

  // Función para generar contrato cuando el estado es FIRMAR
  const handleGenerarContrato = async (credito: DetalleCredito) => {
      if (!clientData.INFO_SOCIO.CONTACTO.EMAIL) {
          setNotificationMessage('No se puede firmar: el campo de correo electrónico está vacío.');
          setShowNotificationModal(true);
          return;
      }
  
      try {
          setLoadingFirma(true);
          setSelectedCreditoFirma(credito.ID_PRESTAMO);
  
          const response = await generarContrato({
              PAGARE: credito.ID_PRESTAMO,
              DNI: clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
              TIPO_DOC: clientData.INFO_SOCIO.DATOS_PERSONALES.TIPO_DOC
          });

      if (response.success) {
        // Verificar el estado de la respuesta del endpoint
        if (response.data && response.data.status === false) {
          // El endpoint devolvió un error (DNI/PAGARE incorrecto, etc.)
          setNotificationMessage(response.data.message || 'Error al generar el contrato');
          setShowNotificationModal(true);
        } else {
          // El contrato se generó exitosamente
          setNotificationMessage('Contrato generado exitosamente. El documento está listo para firmar.');
          setShowNotificationModal(true);
          // Refrescar los datos para obtener el estado actualizado
          if (onRefreshData) {
            setTimeout(() => {
              onRefreshData();
            }, 1000); // Esperar 1 segundo antes de refrescar
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

  // Función para verificar si el documento ya fue firmado
  const handleVerificarFirma = async (credito: DetalleCredito) => {
    if (!credito.FIRM_DIGITAL?.ID_DOCUMENT) {
      setNotificationMessage('No hay documento para verificar');
      setShowNotificationModal(true);
      return;
    }

    try {
      setLoadingFirma(true);
      setSelectedCreditoFirma(credito.ID_PRESTAMO);

      const response = await verificarDocumentoFirmado({
        ID_DOCUMENT_FIRM: credito.FIRM_DIGITAL.ID_DOCUMENT,
        PAGARE: credito.ID_PRESTAMO
      });

      if (response.success) {
        // Verificar el estado de la respuesta del endpoint
        if (response.data && response.data.status === false) {
          // El documento aún no está firmado
          setNotificationMessage(response.data.message || 'El documento aún no ha sido firmado');
          setShowNotificationModal(true);
        } else {
          // El documento ya fue firmado, refrescar datos
          setNotificationMessage('Documento firmado exitosamente. Los datos se actualizarán automáticamente.');
          setShowNotificationModal(true);
          // Refrescar los datos para obtener el estado actualizado
          if (onRefreshData) {
            setTimeout(() => {
              onRefreshData();
            }, 1000); // Esperar 1 segundo antes de refrescar
          }
        }
      } else {
        setNotificationMessage(`Error al verificar el documento: ${response.message}`);
        setShowNotificationModal(true);
      }
    } catch (error) {
      setNotificationMessage('Error al verificar el estado de la firma');
      setShowNotificationModal(true);
    } finally {
      setLoadingFirma(false);
      setSelectedCreditoFirma('');
    }
  };

  // Hook para cargar el estado de vouchers al inicio
  useEffect(() => {
    const verificarVouchers = async () => {
      if (!clientData?.INFO_SOCIO?.DATOS_PERSONALES?.DNI || !creditos?.length) return;
      
      const resultados: Record<string, boolean> = {};
      
      for (const credito of creditos) {
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
  }, [clientData, creditos]);

  // Función para abrir modal de subir comprobante de desembolso
  const handleSubirComprobante = async (credito: DetalleCredito) => {
    try {
      // Primero verificar si ya existe el voucher
      const result = await checkVoucherExists(
        clientData.INFO_SOCIO.DATOS_PERSONALES.DNI,
        credito.ID_PRESTAMO
      );

      if (result.exists && result.url) {
        // Si existe, abrir directamente la imagen en nueva pestaña
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
        <a
          href={firmDigital.URL_SIGNED_FILE}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
          title="Ver contrato firmado"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </a>
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

    // Si el estado es PENDIENTE, mostrar botón para verificar (documento generado pero no firmado)
    if (firmDigital.ESTADO === 'PENDIENTE') {
      return (
        <button
          onClick={() => handleVerificarFirma(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Verificar estado de firma - Documento pendiente de firma"
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
          onClick={() => handleVerificarFirma(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Verificar estado de firma"
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
        <a
          href={firmDigital.URL_SIGNED_FILE}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
          title="Ver contrato firmado"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M9 7h6M9 11h6M9 15h2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </a>
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

    // Si el estado es PENDIENTE, mostrar botón para verificar (documento generado pero no firmado)
    if (firmDigital.ESTADO === 'PENDIENTE') {
      return (
        <button
          onClick={() => handleVerificarFirma(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Verificar estado de firma - Documento pendiente de firma"
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
          onClick={() => handleVerificarFirma(credito)}
          disabled={isLoading}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          title="Verificar estado de firma"
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

  if (!Array.isArray(creditos) || creditos.length === 0 || typeof creditos[0] === 'string') {
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
            {creditos.map((credito, index) => (
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
        {creditos.map((credito, index) => (
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
          onClick={(e) => {
            // Cerrar modal al hacer clic en el fondo
            if (e.target === e.currentTarget) {
              setIsPagosModalOpen(false);
              setPagosData([]);
              setSelectedCreditoId('');
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-[85vw] w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Evitar que se cierre al hacer clic dentro del modal
          >
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 sm:px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold">
                Pagos del Préstamo: {selectedCreditoId}
              </h2>
              <button
                onClick={() => {
                  setIsPagosModalOpen(false);
                  setPagosData([]);
                  setSelectedCreditoId('');
                }}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-60px)]">
              {pagosData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg">No se encontraron pagos para este préstamo</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {pagosData.map((pago, index) => (
                    <div key={`${pago.dni}-${pago.fecha}-${pago.hora}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                      {/* Información del pago */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-cyan-800">📅 {pago.fecha} - {pago.hora}</h3>
                          <p className="text-sm text-gray-600">Cliente: {pago.nombreSocio}</p>
                          <p className="text-sm text-gray-600">DNI: {pago.dni}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cuotas Vencidas: <span className="font-medium">{pago.cuotasVencidasCantidad}</span></p>
                          <p className="text-sm text-gray-600">Estado General:
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                              pago.estadoGeneral === 'atendido' ? 'bg-green-100 text-green-800' :
                              pago.estadoGeneral === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {pago.estadoGeneral.toUpperCase()}
                            </span>
                          </p>
                        </div>
                        {/* <div className="text-right">
                          <p className="text-xs text-gray-500">Cuota Seleccionada:</p>
                          <p className="text-sm font-medium">{pago.cuotaSeleccionada || 'No especificada'}</p>
                        </div> */}
                      </div>

                      {/* Imágenes de comprobantes */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {pago.comprobantebase_64?.map((comprobante, compIndex) => (
                          <div key={`${comprobante._id}-${compIndex}`} className="border rounded-lg p-2 bg-white shadow-sm">
                            <div className="aspect-[3/4] mb-2 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={getImageSrc(comprobante.ruta)}
                                alt={`Comprobante ${compIndex + 1}`}
                                className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(getImageSrc(comprobante.ruta), '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy="0.3em">Error al cargar imagen</text></svg>';
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">Estado:</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  comprobante.estado === 'aceptado' ? 'bg-green-100 text-green-800' :
                                  comprobante.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {comprobante.estado.toUpperCase()}
                                </span>
                              </div>
                              {comprobante.monto_pago && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium">Monto:</span>
                                  <span className="text-xs">S/ {comprobante.monto_pago}</span>
                                </div>
                              )}
                              {comprobante.nroOperacion && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium">Nro. Op:</span>
                                  <span className="text-xs">{comprobante.nroOperacion}</span>
                                </div>
                              )}
                              {comprobante.tipoOperacion && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium">Tipo:</span>
                                  <span className="text-xs">{comprobante.tipoOperacion}</span>
                                </div>
                              )}
                              {comprobante.motivo_rechazo && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-red-600">Motivo rechazo:</span>
                                  <p className="text-xs text-red-600 mt-1">{comprobante.motivo_rechazo}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
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
