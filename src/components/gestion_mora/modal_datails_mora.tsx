import { useState } from 'react';
import ReactDOM from 'react-dom';
import { creditAttentionApi, ClienteMora } from '../../api';
import { useAuth } from '../../hooks/useAuth';

interface ModalDetailsProps {
  showDetailsModal: boolean;
  showGestionModal: boolean;
  showExtractModal: boolean;
  selectedCliente: ClienteMora | null;
  selectedAnalista: string;
  analistas: any[];
  gestionesAnteriores: any[];
  loadingGestionesAnteriores: boolean;
  onCloseDetailsModal: () => void;
  onCloseGestionModal: () => void;
  onCloseExtractModal: () => void;
  onOpenGestionModal: (cliente: ClienteMora) => void;
  onReloadData: () => void;
  onSetGestionesAnteriores: (gestiones: any[]) => void;
  onSetLoadingGestionesAnteriores: (loading: boolean) => void;
  onOpenExtractModal: () => void;
}

const ModalDetailsMora = ({
  showDetailsModal,
  showGestionModal,
  showExtractModal,
  selectedCliente,
  selectedAnalista,
  analistas,
  gestionesAnteriores,
  loadingGestionesAnteriores,
  onCloseDetailsModal,
  onCloseGestionModal,
  onCloseExtractModal,
  onOpenGestionModal,
  onReloadData,
  onSetGestionesAnteriores,
  onSetLoadingGestionesAnteriores,
  onOpenExtractModal
}: ModalDetailsProps) => {
  // Hook para obtener información del usuario autenticado
  const { user } = useAuth();

  // Estados para el formulario de gestión
  const [motivoRetraso, setMotivoRetraso] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mesConsulta, setMesConsulta] = useState('');
  const [anoConsulta, setAnoConsulta] = useState('');

  // Función para determinar el estado de mora
  const getEstadoMora = (diasAtraso: number) => {
    if (diasAtraso <= 8) {
      return {
        text: 'Mora Temprana',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅',
        bgGradient: 'from-green-50 to-emerald-50',
      };
    }
    if (diasAtraso <= 30) {
      return {
        text: 'Mora Media',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⚠️',
        bgGradient: 'from-yellow-50 to-amber-50',
      };
    }
    return {
      text: 'Mora Crítica',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '❌',
      bgGradient: 'from-red-50 to-pink-50',
    };
  };

  // Función para verificar si ya existe gestión de mora
  const yaExisteGestion = (cliente: ClienteMora) => {
    return cliente.GESTION_MORA.ID_GESTION !== null &&
           cliente.GESTION_MORA.ID_GESTION !== undefined &&
           cliente.GESTION_MORA.ID_GESTION !== '';
  };

  // Función para guardar gestión de mora
  const guardarGestionMora = async () => {
    if (!selectedCliente) return;
    
    // Validar que el usuario esté autenticado y tenga DNI
    if (!user || !user.dni) {
      alert('Error: No se pudo obtener la información del usuario');
      return;
    }

    // Validar que todos los campos estén llenos
    if (!motivoRetraso.trim() || !compromiso.trim() || !fechaCompromiso) {
      alert('Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar los datos para enviar a la API
      const gestionData = {
        PAGARE: selectedCliente.CREDITO_MORA.PAGARE,
        CUENTA: selectedCliente.CREDITO_MORA.CUENTA,
        OTORGA: selectedCliente.CREDITO_MORA.OTORGA,
        MOTIVO: motivoRetraso.trim(),
        COMPROMISO: compromiso.trim(),
        FECHA_COMPROMISO: fechaCompromiso,
        REGISTRADOR: user.dni
      };

      // Llamar a la API para guardar la gestión
      const response = await creditAttentionApi.saveGestionMora(gestionData);
      
      if (response.status) {
        onCloseGestionModal();
        
        // Limpiar los campos del formulario
        setMotivoRetraso('');
        setCompromiso('');
        setFechaCompromiso('');
        
        // Recargar datos
        onReloadData();
      } else {
        alert('Error al guardar la gestión de mora: ' + response.message);
      }
    } catch (error: any) {
      alert('Error al guardar la gestión de mora. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para convertir mes/año a formato YYYYMM
  const formatearPeriodo = (mes: string, ano: string): string => {
    return `${ano}${mes.padStart(2, '0')}`;
  };

  // Función para obtener código de agencia por nombre
  const obtenerCodigoAgencia = (nombreAgencia: string): string => {
    const mapeoAgencias: { [key: string]: string } = {
      'AGENCIA SAN JERÓNIMO': '02',
      'AGENCIA SANTIAGO': '05',
      'AGENCIA SICUANI': '04',
      'AGENCIA LIMA': '98',
      'OFICINA PRINCIPAL': '01',
      'AGENCIA QUILLABAMBA': '03',
      'AGENCIA TICA TICA': '08',
      'AGENCIA JULIACA': '98'
    };
    return mapeoAgencias[nombreAgencia] || '01';
  };

  // Función para extraer datos de gestión de períodos anteriores
  const extraerGestionesAnteriores = async () => {
    if (!mesConsulta || !anoConsulta) {
      alert('Por favor seleccione mes y año para consultar');
      return;
    }

    if (!selectedCliente) {
      alert('No hay cliente seleccionado');
      return;
    }

    onSetLoadingGestionesAnteriores(true);
    try {
      const periodo = formatearPeriodo(mesConsulta, anoConsulta);
      let response: any;
      
      if (selectedAnalista === 'current_user') {
        // Para el usuario actual, usamos el endpoint con período
        response = await creditAttentionApi.getClientesEnMora(periodo);
      } else {
        // Para analista específico, usamos el endpoint con período
        const analista = analistas.find(a => a.ID_ANA === selectedAnalista);
        if (!analista) {
          throw new Error('Analista no encontrado');
        }
        
        // Obtener código de agencia del analista
        const codigoAgencia = obtenerCodigoAgencia(analista.AGENCIA);       
        response = await creditAttentionApi.getClientesEnMoraByAnalista({
          ID_ANA: analista.ID_ANA,
          CARGO: analista.CARGO,
          AGENCIA: codigoAgencia,
          PERIODO: periodo
        });
      }

      // Filtrar solo las gestiones del cliente específico que se está visualizando
      const gestionesDelCliente = response.data_mora?.filter((cliente: ClienteMora) => {
        // Buscar por el mismo socio y que tenga gestión de mora
        return cliente.CREDITO_MORA.SOCIO === selectedCliente.CREDITO_MORA.SOCIO &&
               cliente.GESTION_MORA.ID_GESTION !== null &&
               cliente.GESTION_MORA.ID_GESTION !== undefined &&
               cliente.GESTION_MORA.ID_GESTION !== '';
      }) || [];

      onSetGestionesAnteriores(gestionesDelCliente);
      onOpenExtractModal();
    } catch (error) {
      alert('Error al obtener gestiones anteriores');
    } finally {
      onSetLoadingGestionesAnteriores(false);
    }
  };
  // Función para cerrar modal de gestión y limpiar estados
  const cerrarModalGestionCompleto = () => {
    onCloseGestionModal();
    setMotivoRetraso('');
    setCompromiso('');
    setFechaCompromiso('');
    setIsSubmitting(false);
  };

  // Función para abrir modal de gestión con datos pre-llenados
  const abrirModalGestionConDatos = (cliente: ClienteMora) => {
    setMotivoRetraso(cliente.GESTION_MORA.MOTIVO_RETRASO || '');
    setCompromiso(cliente.GESTION_MORA.COMPROMISO || '');
    setFechaCompromiso(cliente.GESTION_MORA.FECHA_COMPROMISO || '');
    onOpenGestionModal(cliente);
  };

  return (
    <>
      {/* Modal de Detalles */}
      {showDetailsModal && selectedCliente && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Detalles del Cliente en Mora
                </h2>
                <button
                  onClick={onCloseDetailsModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Información del Crédito */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  🏦 Información del Crédito
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Cliente:</label>
                    <p className="text-gray-900 font-semibold">{selectedCliente.CREDITO_MORA.SOCIO}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Producto:</label>
                    <p className="text-gray-900">{selectedCliente.CREDITO_MORA.PRODUCTO}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Pagaré:</label>
                    <p className="text-gray-900 font-mono">{selectedCliente.CREDITO_MORA.PAGARE}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Cuenta:</label>
                    <p className="text-gray-900 font-mono">{selectedCliente.CREDITO_MORA.CUENTA}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Fecha Otorgado:</label>
                    <p className="text-gray-900">{new Date(selectedCliente.CREDITO_MORA.OTORGA).toLocaleDateString('es-PE')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Días en Atraso:</label>
                    <p className="text-red-600 font-bold text-lg">{selectedCliente.CREDITO_MORA.DIAS_ATRASO} días</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Saldo Presente:</label>
                    <p className="text-red-600 font-bold text-xl">S/ {parseFloat(selectedCliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Estado de Mora:</label>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const estado = getEstadoMora(parseInt(selectedCliente.CREDITO_MORA.DIAS_ATRASO));
                        return (
                          <>
                            <span className="text-xl">{estado.icon}</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estado.color}`}>
                              {estado.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Gestión de Mora */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                  📊 Gestión de Mora
                </h3>
                
                {selectedCliente.GESTION_MORA.ID_GESTION ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-amber-700">ID Gestión:</label>
                          <p className="text-gray-900 font-mono">{selectedCliente.GESTION_MORA.ID_GESTION}</p>
                        </div>
                        
                        {selectedCliente.GESTION_MORA.MOTIVO_RETRASO && (
                          <div>
                            <label className="block text-sm font-medium text-amber-700">Motivo del Retraso:</label>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded border">{selectedCliente.GESTION_MORA.MOTIVO_RETRASO}</p>
                          </div>
                        )}
                        
                        {selectedCliente.GESTION_MORA.COMPROMISO && (
                          <div>
                            <label className="block text-sm font-medium text-amber-700">Compromiso:</label>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded border">{selectedCliente.GESTION_MORA.COMPROMISO}</p>
                          </div>
                        )}
                        
                        {selectedCliente.GESTION_MORA.FECHA_COMPROMISO && (
                          <div>
                            <label className="block text-sm font-medium text-amber-700">Fecha de Compromiso:</label>
                            <p className="text-gray-900 font-semibold">{selectedCliente.GESTION_MORA.FECHA_COMPROMISO}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-amber-700 font-medium">Sin gestión registrada</p>
                    <p className="text-amber-600 text-sm">Este cliente aún no tiene registros de gestión de mora.</p>
                  </div>
                )}
              </div>

              {/* Botón para extraer datos de gestión anterior */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-5 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  📥 Extraer Gestión de mora Anterior
                </h3>
                <div className="text-center">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        📅 Mes
                      </label>
                      <select
                        value={mesConsulta}
                        onChange={(e) => setMesConsulta(e.target.value)}
                        className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Seleccionar mes...</option>
                        <option value="01">Enero</option>
                        <option value="02">Febrero</option>
                        <option value="03">Marzo</option>
                        <option value="04">Abril</option>
                        <option value="05">Mayo</option>
                        <option value="06">Junio</option>
                        <option value="07">Julio</option>
                        <option value="08">Agosto</option>
                        <option value="09">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        📅 Año
                      </label>
                      <select
                        value={anoConsulta}
                        onChange={(e) => setAnoConsulta(e.target.value)}
                        className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Seleccionar año...</option>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={extraerGestionesAnteriores}
                    className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium disabled:opacity-50"
                    disabled={loadingGestionesAnteriores || !mesConsulta || !anoConsulta}
                  >
                    {loadingGestionesAnteriores ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando...
                      </span>
                    ) : (
                      '📥 Extraer Gestiones Anteriores'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onCloseDetailsModal}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    onCloseDetailsModal();
                    abrirModalGestionConDatos(selectedCliente);
                  }}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                    yaExisteGestion(selectedCliente)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  disabled={yaExisteGestion(selectedCliente)}
                >
                  ⚡ {yaExisteGestion(selectedCliente) ? 'Ya Gestionado' : 'Gestionar'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Gestión de Mora */}
      {showGestionModal && selectedCliente && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  ⚡ Gestionar Mora - {selectedCliente.CREDITO_MORA.SOCIO}
                </h2>
                <button
                  onClick={cerrarModalGestionCompleto}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); guardarGestionMora(); }} className="p-6 space-y-6">
              {/* Información resumida del cliente */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Pagaré:</span>
                    <span className="ml-2 font-mono">{selectedCliente.CREDITO_MORA.PAGARE}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cuenta:</span>
                    <span className="ml-2 font-mono">{selectedCliente.CREDITO_MORA.CUENTA}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Días atraso:</span>
                    <span className="ml-2 font-bold text-red-600">{selectedCliente.CREDITO_MORA.DIAS_ATRASO} días</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Saldo:</span>
                    <span className="ml-2 font-bold text-red-600">S/ {parseFloat(selectedCliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Formulario de gestión */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Motivo del Retraso <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motivoRetraso}
                    onChange={(e) => setMotivoRetraso(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Describa el motivo del retraso en el pago..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🤝 Compromiso del Cliente <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={compromiso}
                    onChange={(e) => setCompromiso(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Detalle el compromiso de pago acordado con el cliente..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Fecha de Compromiso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaCompromiso}
                    onChange={(e) => setFechaCompromiso(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 -mb-6 -mx-6 px-6 pb-6 rounded-b-xl">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cerrarModalGestionCompleto}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !motivoRetraso.trim() || !compromiso.trim() || !fechaCompromiso}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      '💾 Guardar Gestión'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Extracción de Gestiones Anteriores */}
      {showExtractModal && selectedCliente && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  📥 Gestiones Anteriores - {selectedCliente.CREDITO_MORA.SOCIO}
                </h2>
                <button
                  onClick={onCloseExtractModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {gestionesAnteriores.length > 0 ? (
                <div className="space-y-4"> 
                  {gestionesAnteriores.map((gestion, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-purple-900">
                          📅 Cliente: {gestion.CREDITO_MORA?.SOCIO || 'No especificado'}
                        </h3>
                        <span className="text-sm text-purple-700">
                          Pagaré: {gestion.CREDITO_MORA?.PAGARE || 'No especificado'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">
                            Motivo del Retraso:
                          </label>
                          <p className="text-gray-900 bg-white p-2 rounded border text-sm">
                            {gestion.GESTION_MORA?.MOTIVO_RETRASO || 'No especificado'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">
                            Compromiso:
                          </label>
                          <p className="text-gray-900 bg-white p-2 rounded border text-sm">
                            {gestion.GESTION_MORA?.COMPROMISO || 'No especificado'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-1">
                            Fecha de Compromiso:
                          </label>
                          <p className="text-gray-900 font-semibold">
                            {gestion.GESTION_MORA?.FECHA_COMPROMISO || 'No especificada'}
                          </p>
                        </div>
                        
                        <div className="bg-gray-100 px-4 py-2 rounded-lg">
                          <span className="text-gray-600 font-medium text-sm">
                            📋 Solo Informativo
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-600 font-medium">No se encontraron gestiones anteriores</p>
                  <p className="text-gray-500 text-sm">Este cliente no tiene registros de gestión de mora para el período consultado.</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={onCloseExtractModal}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ModalDetailsMora;