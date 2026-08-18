import React, { useState, useEffect, useRef, useCallback } from 'react';
import { verificarOrigen, RespuestaValidacionOrigen, EstadoValidacion } from '../../../api/verificarOrigenPagoApi';

interface VoucherDetail {
  montoPago: string;
  nroOperacion: string;
  nro_banco: string; // Campo para número de banco
  tipoOperacion: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  imageIndex: number; // Índice de la imagen correspondiente
  ruta: string; // Ruta de la imagen
  fecha_voucher: string; // Nueva propiedad para la fecha de pago
  origen: string; // Nueva propiedad para el origen del pago
}

// Estado de validación por voucher
interface OrigenValidationState {
  loading: boolean;
  resultado: RespuestaValidacionOrigen | null;
  error: string | null;
}

interface PaymentFormProps {
  vouchers: VoucherDetail[];
  onUpdateVoucher: (index: number, field: keyof VoucherDetail, value: string) => void;
  onRejectVoucher: (index: number) => void;
  onAcceptVoucher?: (index: number) => void;
  agenciaName: string;
  isEditable: boolean;
  userData?: {
    agencias?: { cod_caja: string; user_caja: string }[];
    email?: string;
    dni?: string;
  } | null;
  agenciaCode?: string;
  creditoId?: string; // ID del crédito para validar origen
}

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm mt-2">
    {message}
  </div>
);

// Componente para mostrar el resultado de validación de origen
interface OrigenValidationMessageProps {
  validationState: OrigenValidationState;
}

const OrigenValidationMessage: React.FC<OrigenValidationMessageProps> = ({ validationState }) => {
  if (validationState.loading) {
    return (
      <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-500 flex items-center gap-2">
        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Validando origen...
      </div>
    );
  }

  if (validationState.error) {
    return (
      <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
        ❌ {validationState.error}
      </div>
    );
  }

  if (!validationState.resultado) return null;

  const { estado, mensaje, infoPagador, ultimoPago, socioEncontrado, advertencia } = validationState.resultado;

  // Determinar estilo según el estado
  const getEstiloMensaje = (estado: EstadoValidacion) => {
    switch (estado) {
      case 'APROBADO_ORIGEN_COINCIDE':
      case 'APROBADO_SOCIO_PAGO_DIRECTO':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'APROBADO_PAGADOR_HABITUAL_NO_TITULAR':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'APROBADO_ORIGEN_NUEVO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'ALERTA_ORIGEN_DE_OTRO_SOCIO':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'ALERTA_ORIGEN_NO_COINCIDE_SOCIO':
      case 'ERROR_CREDITO_NO_ENCONTRADO':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const estiloClase = getEstiloMensaje(estado);
  const esAlerta = estado.startsWith('ALERTA_') || estado === 'ERROR_CREDITO_NO_ENCONTRADO';

  return (
    <div className={`mt-2 px-3 py-2 border rounded-md text-xs ${estiloClase}`}>
      {/* Mensaje principal */}
      <p className="font-medium">{mensaje}</p>
      
      {/* Info adicional para pagador habitual no titular */}
      {infoPagador && (
        <div className="mt-1 pt-1 border-t border-current/20">
          <p>👤 Pagador: <strong>{infoPagador.pagadorRegistrado}</strong></p>
          <p>📋 Titular: <strong>{infoPagador.titularCredito}</strong></p>
          {infoPagador.nota && <p className="italic mt-1">{infoPagador.nota}</p>}
        </div>
      )}

      {/* Info de último pago */}
      {ultimoPago && !infoPagador && (
        <div className="mt-1 pt-1 border-t border-current/20">
          <p>📅 Último pago: <strong>{ultimoPago.fechaUltimoPago}</strong> - S/ {ultimoPago.montoUltimoPago}</p>
          <p>👤 Socio: <strong>{ultimoPago.nombreSocio}</strong></p>
        </div>
      )}

      {/* Alerta si pagó a otro socio */}
      {socioEncontrado && (
        <div className="mt-1 pt-1 border-t border-current/20">
          <p>⚠️ Este origen ya pagó al socio: <strong>{socioEncontrado.nombreSocio}</strong></p>
          <p>🆔 Crédito: {socioEncontrado.creditoId}</p>
          <p>📅 Fecha: {socioEncontrado.fechaPago}</p>
        </div>
      )}

      {/* Advertencia de origen no reconocido */}
      {advertencia && (
        <div className="mt-1 pt-1 border-t border-current/20">
          <p>⚠️ Origen recibido: <strong>{advertencia.origenRecibido}</strong></p>
          <p>👤 Titular esperado: <strong>{advertencia.socioEsperado}</strong></p>
          <p className="italic">{advertencia.razon}</p>
        </div>
      )}

      {/* Indicador visual para alertas */}
      {esAlerta && (
        <div className="mt-2 flex items-center gap-1 text-xs font-bold">
          <span>⚠️</span>
          <span>VERIFICAR ANTES DE PROCEDER</span>
        </div>
      )}
    </div>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  vouchers,
  onUpdateVoucher,
  onRejectVoucher,
  onAcceptVoucher,
  isEditable,
  userData,
  agenciaCode,
  creditoId
}) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado de validación por imageIndex del voucher (clave única)
  const [origenValidations, setOrigenValidations] = useState<Record<number, OrigenValidationState>>({});
  
  // Refs para debounce
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  
  // Ref para trackear el origen anterior por voucher
  const prevOrigenes = useRef<Record<number, string>>({});

  // Función para validar origen con debounce
  // Usa imageIndex como identificador único del voucher
  const validarOrigenDebounced = useCallback((imageIndex: number, origen: string) => {
    // Limpiar timer anterior si existe
    if (debounceTimers.current[imageIndex]) {
      clearTimeout(debounceTimers.current[imageIndex]);
    }

    // Si no hay creditoId o el origen está vacío, limpiar validación
    if (!creditoId || !origen.trim()) {
      setOrigenValidations(prev => ({
        ...prev,
        [imageIndex]: { loading: false, resultado: null, error: null }
      }));
      prevOrigenes.current[imageIndex] = '';
      return;
    }

    // Si el origen no cambió, no revalidar
    if (prevOrigenes.current[imageIndex] === origen.trim()) {
      return;
    }

    // Establecer estado de carga
    setOrigenValidations(prev => ({
      ...prev,
      [imageIndex]: { loading: true, resultado: null, error: null }
    }));

    // Debounce de 800ms
    debounceTimers.current[imageIndex] = setTimeout(async () => {
      try {
        const resultado = await verificarOrigen({
          creditoId: creditoId,
          origen: origen.trim()
        });
        
        prevOrigenes.current[imageIndex] = origen.trim();
        setOrigenValidations(prev => ({
          ...prev,
          [imageIndex]: { loading: false, resultado, error: null }
        }));
      } catch (error: any) {
        setOrigenValidations(prev => ({
          ...prev,
          [imageIndex]: {
            loading: false,
            resultado: null,
            error: error.message || 'Error al validar origen'
          }
        }));
      }
    }, 800);
  }, [creditoId]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Limpiar validaciones cuando cambian los vouchers (nuevo pago seleccionado)
  useEffect(() => {
    // Obtener los imageIndex actuales de los vouchers
    const currentImageIndexes = new Set(vouchers.map(v => v.imageIndex));
    
    // Limpiar validaciones de vouchers que ya no están
    setOrigenValidations(prev => {
      const newValidations: Record<number, OrigenValidationState> = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (currentImageIndexes.has(idx)) {
          newValidations[idx] = prev[idx];
        }
      });
      return newValidations;
    });
    
    // Limpiar también los origenes previos
    Object.keys(prevOrigenes.current).forEach(key => {
      const idx = parseInt(key);
      if (!currentImageIndexes.has(idx)) {
        delete prevOrigenes.current[idx];
      }
    });
  }, [vouchers]);

  // Función para validar datos obligatorios
  const validateRequiredData = (): string | null => {
    if (!agenciaCode || agenciaCode.trim() === '') {
      return 'No se ha seleccionado una agencia. Debe tener una agencia asignada para procesar pagos.';
    }

    const codCaja = userData?.agencias?.[0]?.cod_caja || '';
    const userCaja = userData?.agencias?.[0]?.user_caja || '';

    if (!codCaja || codCaja.trim() === '') {
      return 'Falta información de código de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userCaja || userCaja.trim() === '') {
      return 'Falta información de usuario de caja. Contacte al administrador para configurar su agencia correctamente.';
    }

    if (!userData?.email || userData.email.trim() === '') {
      return 'Falta información del usuario (email). Inicie sesión nuevamente.';
    }

    if (!userData?.dni || userData.dni.trim() === '') {
      return 'Falta información del usuario (DNI). Inicie sesión nuevamente.';
    }

    return null;
  };

  return (
    <div className="w-full h-full rounded-lg flex flex-col p-2 pt-8 space-y-6 overflow-y-auto">
      {vouchers.map((voucher, index) => (
        <div key={voucher.imageIndex} className="border rounded-lg p-4 relative">
          {/* Botones de acción individual - movidos arriba del título */}
          {isEditable && voucher.estado === 'pendiente' && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {/* Botón Aceptar Parcial */}
              {onAcceptVoucher && (
                <button
                  onClick={async () => {
                    if (loading) return; // SIMPLE: Evitar múltiples clics
                    setLoading(true);

                    // VALIDAR DATOS OBLIGATORIOS PRIMERO
                    const validationError = validateRequiredData();
                    if (validationError) {
                      setErrorMessage(validationError);
                      setLoading(false);
                      return;
                    }

                    const currentVoucher = vouchers[index];
                    if (!currentVoucher.montoPago || !currentVoucher.nroOperacion || !currentVoucher.nro_banco || !currentVoucher.tipoOperacion || !currentVoucher.fecha_voucher || !currentVoucher.origen) {
                      setErrorMessage('Debe completar todos los datos del comprobante antes de aceptarlo');
                      setLoading(false);
                      return;
                    }
                    
                    try {
                      setErrorMessage('');
                      await onAcceptVoucher?.(index);
                    } catch (error: any) {
                      setErrorMessage(error.message || 'Error al procesar la aceptación parcial');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading} // Deshabilitar cuando está cargando
                  className={`text-green-500 hover:text-green-700 flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Aceptar solo este comprobante"
                >
                  <span className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                    loading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}>
                    {loading ? 'Procesando...' : 'Aceptar parcial'}
                  </span>
                </button>
              )}
              
              {/* Botón Rechazar Parcial */}
              <button
                onClick={() => {
                  if (loading) return; // SIMPLE: Evitar múltiples clics

                  // VALIDAR DATOS OBLIGATORIOS PRIMERO
                  const validationError = validateRequiredData();
                  if (validationError) {
                    setErrorMessage(validationError);
                    return;
                  }

                  const currentVoucher = vouchers[index];
                  if (!currentVoucher.montoPago || !currentVoucher.nroOperacion || !currentVoucher.nro_banco || !currentVoucher.tipoOperacion || !currentVoucher.fecha_voucher || !currentVoucher.origen) {
                    setErrorMessage('Debe completar todos los datos del comprobante antes de rechazarlo');
                    return;
                  }
                  setErrorMessage('');
                  onRejectVoucher(index);
                }}
                disabled={loading} // Deshabilitar cuando está cargando
                className={`text-red-500 hover:text-red-700 flex items-center gap-1 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Rechazar solo este comprobante"
              >
                <span className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}>
                  {loading ? 'Procesando...' : 'Rechazo parcial'}
                </span>
              </button>
            </div>
          )}


          <div className="flex flex-col gap-4 mt-4">
            {/* pagador origen */}
            <div className="mt-4 flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Origen pagador:
              </label>

              <input
                type="text"
                className={`w-48 rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : origenValidations[voucher.imageIndex]?.resultado?.estado?.startsWith('ALERTA_')
                      ? 'border-orange-400 bg-orange-50 focus:ring-2 focus:ring-orange-500'
                      : origenValidations[voucher.imageIndex]?.resultado?.estado?.startsWith('APROBADO_')
                        ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                value={voucher.origen || ""}
                onChange={(e) => {
                  onUpdateVoucher(index, 'origen', e.target.value);
                  // Validar origen con debounce usando imageIndex como identificador único
                  validarOrigenDebounced(voucher.imageIndex, e.target.value);
                }}
                onBlur={(e) => {
                  // Validar inmediatamente al perder foco si hay valor
                  if (e.target.value.trim() && creditoId) {
                    validarOrigenDebounced(voucher.imageIndex, e.target.value);
                  }
                }}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
                placeholder="Nombre del pagador"
              />
              
              {/* Mensaje de validación de origen */}
              {creditoId && origenValidations[voucher.imageIndex] && (
                <OrigenValidationMessage validationState={origenValidations[voucher.imageIndex]} />
              )}
            </div>
            {/* Monto */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Monto pago:
              </label>
              <input
                type="text"
                inputMode="decimal"
                className="w-48 mx-auto rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:ring-2 focus:ring-cyan-500 transition-colors"
                value={voucher.montoPago}
                onChange={(e) => onUpdateVoucher(index, 'montoPago', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>

            {/* Número de operación */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Número de operación:
              </label>
              <input
                type="text"
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                maxLength={25}
                value={voucher.nroOperacion}
                onChange={(e) => onUpdateVoucher(index, 'nroOperacion', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>

            {/* Tipo de operación */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Tipo de operación:
              </label>
              <select
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors outline-none focus:outline-none ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                value={voucher.tipoOperacion}
                onChange={(e) => onUpdateVoucher(index, 'tipoOperacion', e.target.value)}
                disabled={!isEditable || voucher.estado === 'rechazado'}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="PLIN">PLIN</option>
                <option value="YAPE">YAPE</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>

            {/* Número de banco */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-center font-medium text-gray-700">
                Número de banco:
              </label>
              <input
                type="text"
                className={`w-48 mx-auto rounded-md border px-3 py-2 text-sm text-center transition-colors ${
                  !isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                }`}
                maxLength={20}
                value={voucher.nro_banco}
                onChange={(e) => onUpdateVoucher(index, 'nro_banco', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
                placeholder="Ej: 002, 009, etc."
              />
            </div>
            {/* FECHA DE PAGO */}
            <div className="flex flex-col">
              <label className="text-sm text-center font-medium text-gray-700">Fecha de pago</label>

              <input
                type="date"
                className={`mt-4 block w1/2 mx-auto text-center rounded-md border-gray-300 shadow-sm
                  focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm
                  ${!isEditable || voucher.estado === 'rechazado'
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-2 focus:ring-cyan-500'
                  }`}
                
                /* ✅ CORREGIDO: usar value directamente ya que siempre tendrá valor desde PaymentDetailsModalState */
                value={voucher.fecha_voucher}

                onChange={(e) => onUpdateVoucher(index, 'fecha_voucher', e.target.value)}
                readOnly={!isEditable || voucher.estado === 'rechazado'}
              />
            </div>
          </div>  
          {/* Indicador del comprobante en la parte inferior */}
          <div className="mt-4 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              📄 Comprobante {voucher.imageIndex + 1}
              {voucher.estado !== 'pendiente' && (
                <span className={`ml-2 font-medium ${voucher.estado === 'rechazado' ? 'text-red-500' : 'text-green-500'}`}>
                  • {voucher.estado.toUpperCase()}
                </span>
              )}
            </p>
          </div>
          
          {errorMessage && (
            <div className="mt-4">
              <ErrorMessage message={errorMessage} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};