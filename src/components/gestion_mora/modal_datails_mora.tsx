import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { creditAttentionApi, ClienteMora, GestionMora1x1Request } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

const Notification = useNotifications();

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
  gestionesAnteriores,
  loadingGestionesAnteriores,
  onCloseDetailsModal,
  onCloseGestionModal,
  onCloseExtractModal,
  onOpenGestionModal,
  onSetGestionesAnteriores,
  onSetLoadingGestionesAnteriores,
  onOpenExtractModal,
}: ModalDetailsProps) => {
  // Hooks
  const { user } = useAuth();

  // Estados
  const [motivoRetraso, setMotivoRetraso] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mesConsulta, setMesConsulta] = useState('');
  const [anoConsulta, setAnoConsulta] = useState('');
  const [gestionMoraActualizada, setGestionMoraActualizada] = useState<any>(null);

  // Funciones utilitarias
  const getEstadoMora = (diasAtraso: number) => {
    if (diasAtraso <= 8) return { text: 'Mora Temprana', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', bgGradient: 'from-green-50 to-emerald-50' };
    if (diasAtraso <= 30) return { text: 'Mora Media', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️', bgGradient: 'from-yellow-50 to-amber-50' };
    return { text: 'Mora Crítica', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', bgGradient: 'from-red-50 to-pink-50' };
  };

  const yaExisteGestion = (cliente: ClienteMora) => {
    // Verificar si hay gestión actualizada
    if (gestionMoraActualizada) {
      if (Array.isArray(gestionMoraActualizada)) {
        return gestionMoraActualizada.some(g => g?.ID_GESTION);
      }
      return gestionMoraActualizada.ID_GESTION;
    }
    
    // Verificar en las gestiones del cliente
    if (cliente?.GESTION_MORA && Array.isArray(cliente.GESTION_MORA)) {
      return cliente.GESTION_MORA.some(gestion => gestion?.ID_GESTION);
    }
    
    return false;
  };

  const formatearPeriodo = (mes: string, ano: string) => `${ano}${mes.padStart(2, '0')}`;

  // Funciones de gestión
  const guardarGestionMora = async () => {
    if (!selectedCliente || !user?.dni || !motivoRetraso.trim() || !compromiso.trim() || !fechaCompromiso) {
      Notification[!user?.dni ? 'error' : 'info'](!user?.dni ? 'Error: No se pudo obtener la información del usuario' : 'Por favor complete todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const gestionData = {
        PAGARE: selectedCliente.CREDITO_MORA.PAGARE,
        CUENTA: selectedCliente.CREDITO_MORA.CUENTA,
        OTORGA: selectedCliente.CREDITO_MORA.OTORGA,
        MOTIVO: motivoRetraso.trim(),
        COMPROMISO: compromiso.trim(),
        FECHA_COMPROMISO: fechaCompromiso,
        REGISTRADOR: user.dni,
      };

      const response = await creditAttentionApi.saveGestionMora(gestionData);
      if (response.status) {
        onCloseGestionModal();
        resetForm();
        const periodoActual = formatearPeriodo(String(new Date().getMonth() + 1), String(new Date().getFullYear()));
        await actualizarGestionMora(selectedCliente, periodoActual);
      } else {
        Notification.error('Error al guardar la gestión de mora: ' + response.message);
      }
    } catch (error) {
      Notification.error('Error al guardar la gestión de mora. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMotivoRetraso('');
    setCompromiso('');
    setFechaCompromiso('');
  };

  const extraerGestionesAnteriores = async () => {
    if (!mesConsulta || !anoConsulta || !selectedCliente) {
      Notification.info(!selectedCliente ? 'No hay cliente seleccionado' : 'Por favor seleccione mes y año para consultar');
      return;
    }

    onSetLoadingGestionesAnteriores(true);
    try {
      const periodo = formatearPeriodo(mesConsulta, anoConsulta);
      const gestionData: GestionMora1x1Request = {
        PAGARE: selectedCliente.CREDITO_MORA.PAGARE,
        OTORGA: selectedCliente.CREDITO_MORA.OTORGA,
        CUENTA: selectedCliente.CREDITO_MORA.CUENTA,
        PERIODO: periodo,
      };

      const response = await creditAttentionApi.getGestionMora1x1(gestionData);
      
      // FIX: Corregir el mapeo aquí
      let gestiones: any[] = [];
      
      if (Array.isArray(response)) {
        // Si la respuesta es un array directo
        gestiones = response;
      } else if (response && response.GESTION_MORA) {
        // Si la respuesta tiene una propiedad GESTION_MORA que es un array o un objeto
        gestiones = Array.isArray(response.GESTION_MORA) 
          ? response.GESTION_MORA 
          : [response.GESTION_MORA];
      }
      
      if (gestiones.length > 0) {
        const gestionesMapeadas = gestiones.map((gestion: any) => {
          return {
            CREDITO_MORA: { ...selectedCliente.CREDITO_MORA },
            // FIX: Si la gestión ya tiene la estructura GESTION_MORA, usarla directamente
            // Si no, crear la estructura
            GESTION_MORA: gestion.GESTION_MORA || gestion,
          };
        });
        onSetGestionesAnteriores(gestionesMapeadas);
      } else {
        onSetGestionesAnteriores([]);
      }
      onOpenExtractModal();
    } catch (error) {
      console.error("Error al extraer gestiones anteriores:", error);
      onSetGestionesAnteriores([]);
      onOpenExtractModal();
    } finally {
      onSetLoadingGestionesAnteriores(false);
    }
  };

  const actualizarGestionMora = async (cliente: ClienteMora, periodo: string) => {
    try {
      const gestionData: GestionMora1x1Request = {
        PAGARE: cliente.CREDITO_MORA.PAGARE,
        OTORGA: cliente.CREDITO_MORA.OTORGA,
        CUENTA: cliente.CREDITO_MORA.CUENTA,
        PERIODO: periodo,
      };
      console.log("Datos enviados a getGestionMora1x1:", gestionData);
      const response = await creditAttentionApi.getGestionMora1x1(gestionData);
      console.log("Respuesta de getGestionMora1x1:", response);
      setGestionMoraActualizada(response.GESTION_MORA);
    } catch (error) {
      setGestionMoraActualizada(null);
    }
  };

  const abrirModalGestionConDatos = (cliente: ClienteMora) => {
    // Obtener los datos de gestión (usar la más reciente si hay múltiples)
    let datosGestion = null;
    
    if (gestionMoraActualizada) {
      if (Array.isArray(gestionMoraActualizada)) {
        // Usar la primera gestión del array (o podrías implementar lógica para la más reciente)
        datosGestion = gestionMoraActualizada.find(g => g?.ID_GESTION) || gestionMoraActualizada[0];
      } else {
        datosGestion = gestionMoraActualizada;
      }
    } else if (cliente.GESTION_MORA && Array.isArray(cliente.GESTION_MORA)) {
      datosGestion = cliente.GESTION_MORA.find(g => g?.ID_GESTION) || cliente.GESTION_MORA[0];
    }
    
    // Llenar el formulario con los datos
    if (datosGestion) {
      setMotivoRetraso(datosGestion.MOTIVO_RETRASO || '');
      setCompromiso(datosGestion.COMPROMISO || '');
      setFechaCompromiso(datosGestion.FECHA_COMPROMISO || '');
    } else {
      // Limpiar el formulario si no hay datos
      resetForm();
    }
    
    onOpenGestionModal(cliente);
  };

  const cerrarModalGestionCompleto = () => {
    onCloseGestionModal();
    resetForm();
    setIsSubmitting(false);
  };

  // Efectos
  useEffect(() => {
    if (showDetailsModal && selectedCliente) {
      const periodoActual = formatearPeriodo(String(new Date().getMonth() + 1), String(new Date().getFullYear()));
      actualizarGestionMora(selectedCliente, periodoActual);
    }
  }, [showDetailsModal, selectedCliente]);

  useEffect(() => {
    if (!showDetailsModal) setGestionMoraActualizada(null);
  }, [showDetailsModal]);

  // Renderizado
  const renderDetalleCliente = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">🏦 Información del Crédito</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Cliente:', value: selectedCliente?.CREDITO_MORA.SOCIO },
          { label: 'Producto:', value: selectedCliente?.CREDITO_MORA.PRODUCTO },
          { label: 'Pagaré:', value: selectedCliente?.CREDITO_MORA.PAGARE },
          { label: 'Cuenta:', value: selectedCliente?.CREDITO_MORA.CUENTA },
          { label: 'Fecha Otorgado:', value: new Date(selectedCliente?.CREDITO_MORA.OTORGA || '').toLocaleDateString('es-PE') },
          { label: 'Días en Atraso:', value: `${selectedCliente?.CREDITO_MORA.DIAS_ATRASO} días`, className: 'text-red-600 font-bold text-lg' },
          { label: 'Saldo Presente:', value: `S/ ${parseFloat(selectedCliente?.CREDITO_MORA.SALDO_PRESENTE || '0').toFixed(2)}`, className: 'text-red-600 font-bold text-xl' },
          { label: 'Estado de Mora:', value: getEstadoMora(parseInt(selectedCliente?.CREDITO_MORA.DIAS_ATRASO || '0')), isEstado: true },
        ].map((item, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-blue-700">{item.label}</label>
            {item.isEstado ? (
              <div className="flex items-center space-x-2">
                <span className="text-xl">{item.value.icon}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.value.color}`}>{item.value.text}</span>
              </div>
            ) : (
              <p className={`text-gray-900 ${item.className || 'font-semibold'}`}>
                {typeof item.value === 'string' || typeof item.value === 'number' ? item.value : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderGestionMora = () => {
    // Obtener el array completo de gestiones
    const gestiones = gestionMoraActualizada ? 
      (Array.isArray(gestionMoraActualizada) ? gestionMoraActualizada : [gestionMoraActualizada]) :
      (selectedCliente?.GESTION_MORA || []);

    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
          📊 Gestión de Mora {gestiones.length > 1 && `(${gestiones.length} registros)`}
        </h3>
        
        {gestiones.length > 0 && gestiones.some(g => g?.ID_GESTION) ? (
          <div className="space-y-4">
            {gestiones.map((gestion, index) => (
              gestion?.ID_GESTION && (
                <div key={gestion.ID_GESTION || index} className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-amber-800">
                      📝 Gestión #{index + 1}
                    </h4>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      ID: {gestion.ID_GESTION}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { 
                        label: 'Motivo del Retraso:', 
                        value: gestion.MOTIVO_RETRASO, 
                        isTextArea: true 
                      },
                      { 
                        label: 'Compromiso:', 
                        value: gestion.COMPROMISO, 
                        isTextArea: true 
                      },
                      { 
                        label: 'Fecha de Compromiso:', 
                        value: gestion.FECHA_COMPROMISO 
                      },
                      { 
                        label: 'Estado:', 
                        value: gestion.ESTADO 
                      },
                      { 
                        label: 'Registrador:', 
                        value: gestion.REGISTRADOR 
                      },
                      { 
                        label: 'Fecha de Registro:', 
                        value: gestion.FECHA_REGISTRO ? new Date(gestion.FECHA_REGISTRO).toLocaleDateString('es-PE') : null
                      }
                    ].map((item, itemIndex) => (
                      item.value && (
                        <div key={itemIndex}>
                          <label className="block text-sm font-medium text-amber-700 mb-1">
                            {item.label}
                          </label>
                          {item.isTextArea ? (
                            <p className="text-gray-900 bg-gray-50 p-3 rounded border text-sm leading-relaxed">
                              {item.value || 'Información no disponible'}
                            </p>
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {item.value || 'Información no disponible'}
                            </p>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                  
                  {/* Separador entre gestiones */}
                  {index < gestiones.length - 1 && gestiones[index + 1]?.ID_GESTION && (
                    <hr className="mt-4 border-amber-200" />
                  )}
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-amber-700 font-medium">Sin gestión registrada</p>
            <p className="text-amber-600 text-sm">Este cliente aún no tiene registros de gestión de mora.</p>
          </div>
        )}
      </div>
    );
  };

  const renderFormGestion = () => (
    <form onSubmit={(e) => { e.preventDefault(); guardarGestionMora(); }} className="p-6 space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Pagaré:', value: selectedCliente?.CREDITO_MORA.PAGARE },
            { label: 'Cuenta:', value: selectedCliente?.CREDITO_MORA.CUENTA },
            { label: 'Días atraso:', value: `${selectedCliente?.CREDITO_MORA.DIAS_ATRASO} días`, className: 'text-red-600 font-bold' },
            { label: 'Saldo:', value: `S/ ${parseFloat(selectedCliente?.CREDITO_MORA.SALDO_PRESENTE || '0').toFixed(2)}`, className: 'text-red-600 font-bold' },
          ].map((item, index) => (
            <div key={index}>
              <span className="font-medium text-gray-600">{item.label}</span>
              <span className={`ml-2 ${item.className || 'font-mono'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Motivo del Retraso', value: motivoRetraso, onChange: setMotivoRetraso, type: 'textarea', placeholder: 'Describa el motivo del retraso en el pago...', icon: '📝' },
          { label: 'Compromiso del Cliente', value: compromiso, onChange: setCompromiso, type: 'textarea', placeholder: 'Detalle el compromiso de pago acordado con el cliente...', icon: '🤝' },
          { label: 'Fecha de Compromiso', value: fechaCompromiso, onChange: setFechaCompromiso, type: 'date', icon: '📅' },
        ].map((item, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{item.icon} {item.label} <span className="text-red-500">*</span></label>
            {item.type === 'textarea' ? (
              <textarea
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder={item.placeholder}
                required
              />
            ) : (
              <input
                type={item.type}
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>
        ))}
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
  );

  const renderGestionesAnteriores = () => (
    <div className="p-6 space-y-6">
      {gestionesAnteriores.length > 0 ? (
        <div className="space-y-4">
          {gestionesAnteriores.map((gestion, index) => (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-purple-900">📅 Cliente: {gestion.CREDITO_MORA?.SOCIO || 'No especificado'}</h3>
                <span className="text-sm text-purple-700">Pagaré: {gestion.CREDITO_MORA?.PAGARE || 'No especificado'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Motivo del Retraso:', value: gestion.GESTION_MORA?.MOTIVO_RETRASO },
                  { label: 'Compromiso:', value: gestion.GESTION_MORA?.COMPROMISO },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-purple-700 mb-1">{item.label}</label>
                    <p className="text-gray-900 bg-white p-2 rounded border text-sm">{item.value ?? 'Información no disponible'}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                {[
                  { label: 'Fecha de Compromiso:', value: gestion.GESTION_MORA?.FECHA_COMPROMISO },
                  { label: 'Estado:', value: gestion.GESTION_MORA?.ESTADO },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-purple-700 mb-1">{item.label}</label>
                    <p className="text-gray-900 font-semibold">{item.value ?? 'Información no disponible'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 font-medium">No se encontraron gestiones anteriores</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Modal de Detalles */}
      {showDetailsModal && selectedCliente && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">📋 Detalles del Cliente en Mora</h2>
                <button onClick={onCloseDetailsModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {renderDetalleCliente()}
              {renderGestionMora()}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-5 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">📥 Extraer Gestión de mora Anterior</h3>
                <div className="text-center">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Mes', value: mesConsulta, onChange: setMesConsulta, options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), text: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i] })) },
                      { label: 'Año', value: anoConsulta, onChange: setAnoConsulta, options: Array.from({ length: 5 }, (_, i) => ({ value: String(new Date().getFullYear() - i), text: String(new Date().getFullYear() - i) })) },
                    ].map((item, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-purple-700 mb-2">📅 {item.label}</label>
                        <select
                          value={item.value}
                          onChange={(e) => item.onChange(e.target.value)}
                          className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Seleccionar {item.label.toLowerCase()}...</option>
                          {item.options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                        </select>
                      </div>
                    ))}
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
                <button onClick={onCloseDetailsModal} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium">Cerrar</button>
                <button
                  onClick={() => { onCloseDetailsModal(); abrirModalGestionConDatos(selectedCliente); }}
                  className={`px-6 py-2 rounded-lg transition-colors font-medium ${yaExisteGestion(selectedCliente) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
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
                <h2 className="text-2xl font-bold text-gray-900">⚡ Gestionar Mora - {selectedCliente.CREDITO_MORA.SOCIO}</h2>
                <button onClick={cerrarModalGestionCompleto} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {renderFormGestion()}
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
                <h2 className="text-2xl font-bold text-gray-900">📥 Gestiones Anteriores - {selectedCliente.CREDITO_MORA.SOCIO}</h2>
                <button onClick={onCloseExtractModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {renderGestionesAnteriores()}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
              <div className="flex justify-end">
                <button onClick={onCloseExtractModal} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium">Cerrar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ModalDetailsMora;