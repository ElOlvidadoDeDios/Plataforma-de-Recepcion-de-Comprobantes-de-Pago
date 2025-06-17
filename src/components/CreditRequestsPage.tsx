import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCreditRequests } from '../hooks/useCreditRequests';
import { useCreditAttention } from '../hooks/useCreditAttention';
import { useAuth } from '../hooks/useAuth';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { CreditRequest, CreditRequestStatus, AttentionStatus } from '../types/creditRequest';
import { getBotInteractionsByDni } from '../api/botInteractionsApi';
import Layout from './Layout';
import InfiniteScrollIndicator from './shared/InfiniteScrollIndicator';
import toast from 'react-hot-toast';

// Componente principal
const CreditRequestsPage: React.FC = () => {
  const { requests, loading, error, loadingMore, pagination, loadRequests, loadRequestsByStatus, loadRequestsByDni, loadMoreData, updateAttentionStatus, resetData } = useCreditRequests();
  const { getLastAttentionUser } = useCreditAttention();
  const { hasPermission } = useAuth();
  const [searchDni, setSearchDni] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('APPROVED_PENDING');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{id: string, dni: string, nombre: string} | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [attentionUsers, setAttentionUsers] = useState<Record<string, {email: string, fecha: string, hora: string}>>({});
  const [modalError, setModalError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Detectar si está en móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Determinar el modo de vista basado en el tamaño de pantalla
  const viewMode = isMobile ? 'cards' : 'table';

  // Función para validar si el DNI es correcto (8 dígitos, solo números)
  const esDniValido = (dni: string) => {
    const dniLimpio = dni.trim();
    return dniLimpio.length === 8 && /^\d+$/.test(dniLimpio);
  };

 

  // 🚀 Filtrar solicitudes en el frontend (para compatibilidad con estados combinados)
  const filteredRequests = React.useMemo(() => {
    return requests.filter((request) => {
      if (statusFilter === '') {
        return true;
      } else if (statusFilter === 'APPROVED_PENDING') {
        return request.status === 'APPROVED' && request.estadoAtencion === 'PENDIENTE';
      } else if (statusFilter === 'APPROVED_ATTENDED') {
        return request.status === 'APPROVED' && request.estadoAtencion === 'ATENDIDO';
      } else {
        return request.status === statusFilter;
      }
    });
  }, [requests, statusFilter]);

  // Función para buscar solicitudes por DNI
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchDni.trim()) {
      loadRequestsByDni(searchDni);
      toast.success(`Buscando solicitudes para DNI: ${searchDni}`, { id: 'busqueda-toast' });
    } else {
      toast.error('Por favor, ingresa un DNI válido', { id: 'busqueda-toast' });
    }
  };

  // Filtrar solicitudes según el estado
  const handleStatusFilter = (filter: string) => {
    setStatusFilter(filter);
    resetData(); // Limpiar datos anteriores
    
    if (filter === '') {
      loadRequests(1, false);
    } else if (filter === 'APPROVED_PENDING' || filter === 'APPROVED_ATTENDED') {
      loadRequestsByStatus('APPROVED', 1, false);
    } else {
      loadRequestsByStatus(filter as CreditRequestStatus, 1, false);
    }
  };

  // useEffect para cargar los datos iniciales según el filtro por defecto
  useEffect(() => {
    // Cargar datos iniciales con el filtro por defecto (APPROVED_PENDING)
    if (statusFilter === 'APPROVED_PENDING' || statusFilter === 'APPROVED_ATTENDED') {
      loadRequestsByStatus('APPROVED', 1, false);
    } else if (statusFilter === '') {
      loadRequests(1, false);
    } else {
      loadRequestsByStatus(statusFilter as CreditRequestStatus, 1, false);
    }
  }, []); // Solo al montar el componente

  // Función para cargar más datos cuando se hace scroll
  const handleLoadMore = React.useCallback(() => {
    // Determinar el estado actual para cargar más
    let currentStatus: CreditRequestStatus | undefined;
    if (statusFilter === 'APPROVED_PENDING' || statusFilter === 'APPROVED_ATTENDED') {
      currentStatus = 'APPROVED';
    } else if (statusFilter && statusFilter !== '') {
      currentStatus = statusFilter as CreditRequestStatus;
    }
    
    loadMoreData(currentStatus);
  }, [statusFilter, loadMoreData]);

  // 🚀 Hook para infinite scroll optimizado
  const { setSentinelRef } = useInfiniteScroll({
    hasNext: pagination.hasNext,
    loading: loadingMore,
    onLoadMore: handleLoadMore,
    disabled: !!searchDni.trim(), // Desactivar durante búsquedas por DNI
    threshold: 300
  });

  // Actualizar el estado de atención (Pendiente/Atendido)
  const handleAttentionUpdate = async (id: string, newStatus: AttentionStatus, dni: string, currentStatus: AttentionStatus) => {
    try {
      // Verificar permisos si se intenta cambiar de ATENDIDO a PENDIENTE
      if (currentStatus === 'ATENDIDO' && newStatus === 'PENDIENTE' && !hasPermission('canRevertAttentionStatus')) {
        toast.error('No tiene permisos para cambiar el estado de ATENDIDO a PENDIENTE');
        return;
      }

      await updateAttentionStatus(id, newStatus);
      toast.success(`Estado actualizado a ${newStatus}`);
      setOpenDropdownId(null);
      
      // Si se marca como atendido, obtener la información del usuario que lo atendió
      if (newStatus === 'ATENDIDO') {
        const attentionInfo = await getLastAttentionUser(dni);
        if (attentionInfo) {
          setAttentionUsers(prev => ({
            ...prev,
            [dni]: attentionInfo
          }));
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('No tiene permisos para realizar esta acción');
      } else {
        toast.error('Error al actualizar el estado');
      }
    }
  };

  // Cargar la información de quién atendió cada solicitud
  useEffect(() => {
    const loadAttentionInfo = async () => {
      const uniqueDnis = [...new Set(requests
        .filter(req => req.estadoAtencion === 'ATENDIDO')
        .map(req => req.dni))];
      
      for (const dni of uniqueDnis) {
        const attentionInfo = await getLastAttentionUser(dni);
        if (attentionInfo) {
          setAttentionUsers(prev => ({
            ...prev,
            [dni]: attentionInfo
          }));
        }
      }
    };

    if (requests.length > 0) {
      loadAttentionInfo();
    }
  }, [requests, getLastAttentionUser]);

  // Colores para los estados de las solicitudes
  const getStatusBadgeColor = (status: CreditRequestStatus) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  const getAttentionBadgeColor = (status: AttentionStatus) => {
    return status === 'ATENDIDO'
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-md'
      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-md';
  };

  // Función para preparar respuesta al cliente
  const handlePrepareRespond = (id: string, dni: string, nombre: string) => {
    const defaultMessage = `¡Hola ${nombre}! Gracias por la aprobación de su préstamo. Le informo que tiene pre-aprobados los siguientes montos disponibles:
- S/100
- S/200
- S/300
- S/500

Me gustaría saber qué monto le interesa para brindarle mayor información sobre las condiciones y cuotas.

Quedo atento a su respuesta.`;
    
    setCustomMessage(defaultMessage);
    setSelectedRequest({id, dni, nombre});
    setShowModal(true);
  };

  // Función para responder al cliente por WhatsApp
  const handleRespond = async () => {
    if (!selectedRequest) return;

    setIsLoading(true);
    setModalError('');

    try {
      const response = await getBotInteractionsByDni(selectedRequest.dni);
      if (response.data.length > 0) {
        const phoneNumber = response.data[0].phone_number;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
        const encodedMessage = encodeURIComponent(customMessage);
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
        
        // Cerrar el modal después de enviar exitosamente
        toast.success(`Mensaje enviado a ${selectedRequest.nombre}`);
        setShowModal(false);
        setSelectedRequest(null);
        setCustomMessage('');
        setModalError('');
      } else {
        setModalError('No se encontró el número de teléfono para este DNI. Verifica que el cliente haya interactuado con el bot.');
      }
    } catch (error) {
      setModalError('Error al buscar el número de teléfono. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setCustomMessage('');
    setModalError('');
    setIsLoading(false);
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <Layout title="Solicitudes de Crédito">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Cargando solicitudes...</span>
        </div>
      </Layout>
    );
  }

  // Mostrar error si falla la carga
  if (error) {
    return (
      <Layout title="Solicitudes de Crédito">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-md">{error}</div>
      </Layout>
    );
  }

  // Interfaz principal
  return (
    <Layout title="Solicitudes de Crédito">
      {/* Panel de Filtros con Sombreado de Dos Colores */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-cyan-200">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-inner border border-white/50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Panel de Filtros - Solicitudes de Crédito
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {/* Formulario de búsqueda por DNI */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchDni}
                onChange={(e) => setSearchDni(e.target.value)}
                placeholder="Buscar por DNI"
                className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/90 text-sm"
              />
              <button
                type="submit"
                onClick={handleSearch}
                disabled={!esDniValido(searchDni)}
                className={`bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2 rounded-md transition-all duration-200 transform shadow-md text-sm font-medium whitespace-nowrap ${
                  !esDniValido(searchDni) ? 'opacity-50 cursor-not-allowed' : 'hover:from-cyan-700 hover:to-blue-700 hover:scale-105'
                }`}
              >
                Buscar
              </button>
            </div>

            {/* Filtro por estado */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/90 text-sm"
            >
              <option value="APPROVED_PENDING">Aprobados Pendientes</option>
              <option value="APPROVED_ATTENDED">Aprobados Atendidos</option>
              <option value="REJECTED">Rechazados</option>
              <option value="">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mostrar mensaje si no hay solicitudes */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-fade-in">
          <p className="text-gray-600 font-medium">No se encontraron solicitudes</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Vista de tarjetas */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {filteredRequests.map((request: CreditRequest) => (
            <div
              key={request._id}
              className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
            >
              <div>
                <h3 className="font-semibold text-md text-gray-800 truncate">
                  {request.nombre} {request.apellido}
                </h3>
                <p className="text-gray-600 text-sm">DNI: {request.dni}</p>
                <p className="text-xs text-gray-500">
                  {request.fecha} - {request.hora}
                </p>
                {request.puntaje && (
                  <p className="mt-1 text-cyan-600 text-sm font-medium">Puntaje: {request.puntaje.toFixed(2)}</p>
                )}
                {request.estadoAtencion === 'ATENDIDO' && attentionUsers[request.dni] && (
                  <p className="mt-1 text-xs text-gray-500">
                    Atendido por: {attentionUsers[request.dni].email}<br/>
                    {attentionUsers[request.dni].fecha} - {attentionUsers[request.dni].hora}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    request.status
                  )}`}
                >
                  {request.status}
                </span>
                <div className="relative">
                  <button
                    onClick={() => {
                      // Solo permitir abrir el dropdown si:
                      // - La solicitud está PENDIENTE, o
                      // - La solicitud está ATENDIDA y el usuario es admin
                      if (request.estadoAtencion === 'PENDIENTE' ||
                          (request.estadoAtencion === 'ATENDIDO' && hasPermission('canRevertAttentionStatus'))) {
                        setOpenDropdownId(openDropdownId === request._id ? null : request._id);
                      }
                    }}
                    className={`w-full px-2 py-1 rounded-md text-sm font-medium ${getAttentionBadgeColor(
                      request.estadoAtencion
                    )} ${request.estadoAtencion === 'ATENDIDO' && !hasPermission('canRevertAttentionStatus')
                        ? 'cursor-default'
                        : 'cursor-pointer'}
                    transition-all duration-200 flex justify-between items-center`}
                  >
                    {request.estadoAtencion}
                    {/* Mostrar flecha solo si se puede abrir el dropdown */}
                    {(request.estadoAtencion === 'PENDIENTE' ||
                      (request.estadoAtencion === 'ATENDIDO' && hasPermission('canRevertAttentionStatus'))) && (
                      <svg
                        className={`w-4 h-4 transform transition-transform ${
                          openDropdownId === request._id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                  {openDropdownId === request._id && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                      {request.estadoAtencion === 'ATENDIDO' ? (
                        // Si está atendido, solo mostrar opción PENDIENTE para admin
                        hasPermission('canRevertAttentionStatus') && (
                          <button
                            onClick={() => handleAttentionUpdate(request._id, 'PENDIENTE', request.dni, request.estadoAtencion)}
                            className="block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                          >
                            PENDIENTE
                          </button>
                        )
                      ) : (
                        // Si está pendiente, solo mostrar opción ATENDIDO
                        <button
                          onClick={() => handleAttentionUpdate(request._id, 'ATENDIDO', request.dni, request.estadoAtencion)}
                          className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-100"
                        >
                          ATENDIDO
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {request.status === 'APPROVED' && !request.respondidoEn && request.estadoAtencion !== 'ATENDIDO' && (
                  <button
                    onClick={() => handlePrepareRespond(request._id, request.dni, request.nombre)}
                    className="w-full px-2 py-1 rounded-md text-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-md font-medium"
                  >
                    Responder
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>

          {/* 🚀 Sentinel element para Intersection Observer */}
          {pagination.hasNext && !searchDni.trim() && (
            <div ref={setSentinelRef} className="h-4" />
          )}

          {/* 🚀 Indicador de infinite scroll */}
          {!searchDni.trim() && (
            <InfiniteScrollIndicator
              loading={loadingMore}
              hasMore={pagination.hasNext}
              total={pagination.total}
              itemName="solicitudes"
            />
          )}
        </>
      ) : (
        /* Vista de tabla responsive */
        <div className="bg-white rounded-xl shadow-lg animate-fade-in w-full max-w-full">
          <div className="w-full">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-cyan-50 to-blue-100">
                 <tr>
                   <th className="w-[22%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     <span className="hidden sm:inline">Nombre Completo</span>
                     <span className="sm:hidden">Nombre</span>
                   </th>
                   <th className="w-[12%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     DNI
                   </th>
                   <th className="w-[14%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     <span className="hidden md:inline">Fecha/Hora</span>
                     <span className="md:hidden">Fecha</span>
                   </th>
                   <th className="w-[10%] px-1 sm:px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                     <span className="hidden sm:inline">Puntaje</span>
                     <span className="sm:hidden">Pts</span>
                   </th>
                   <th className="w-[12%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     Estado
                   </th>
                   <th className="w-[15%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     <span className="hidden sm:inline">Atención</span>
                     <span className="sm:hidden">Atenc.</span>
                   </th>
                   <th className="w-[15%] px-1 sm:px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                     <span className="hidden sm:inline">Acciones</span>
                     <span className="sm:hidden">Acc.</span>
                   </th>
                 </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRequests.map((request: CreditRequest, index: number) => (
                <tr key={request._id} className={`transition-all duration-200 hover:bg-cyan-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}>
                  <td className="w-[22%] px-1 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-900">
                    <div className="truncate">
                      {request.nombre} {request.apellido}
                    </div>
                  </td>
                  <td className="w-[12%] px-1 sm:px-3 py-2 text-xs sm:text-sm text-gray-500">{request.dni}</td>
                  <td className="w-[14%] px-1 sm:px-3 py-2">
                    <div className="text-xs sm:text-sm text-gray-500">
                      <div className="hidden md:block">{request.fecha} - {request.hora}</div>
                      <div className="md:hidden">{request.fecha}</div>
                       {request.estadoAtencion === 'ATENDIDO' && attentionUsers[request.dni] && (
                         <p className="mt-1 text-xs hidden xl:block">
                           Atendido por: {attentionUsers[request.dni].email}<br/>
                           {attentionUsers[request.dni].fecha} - {attentionUsers[request.dni].hora}
                         </p>
                       )}
                     </div>
                   </td>
                   <td className="w-[10%] px-1 sm:px-3 py-2 text-center">
                     {request.puntaje && (
                       <span className="text-cyan-600 font-medium text-xs sm:text-sm">
                         <span className="hidden sm:inline">{request.puntaje.toFixed(2)}</span>
                         <span className="sm:hidden">{request.puntaje.toFixed(1)}</span>
                       </span>
                     )}
                   </td>
                   <td className="w-[12%] px-1 sm:px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="w-[15%] px-1 sm:px-3 py-2 relative">
                    <div className="relative">
                      <button
                        onClick={() => {
                          // Solo permitir abrir el dropdown si:
                          // - La solicitud está PENDIENTE, o
                          // - La solicitud está ATENDIDA y el usuario es admin
                          if (request.estadoAtencion === 'PENDIENTE' ||
                              (request.estadoAtencion === 'ATENDIDO' && hasPermission('canRevertAttentionStatus'))) {
                            setOpenDropdownId(openDropdownId === request._id ? null : request._id);
                          }
                        }}
                        className={`w-full px-2 py-1 rounded-md text-sm font-medium ${getAttentionBadgeColor(
                          request.estadoAtencion
                        )} ${request.estadoAtencion === 'ATENDIDO' && !hasPermission('canRevertAttentionStatus')
                            ? 'cursor-default'
                            : 'cursor-pointer'}
                        transition-all duration-200 flex justify-between items-center`}
                      >
                        {request.estadoAtencion}
                        {/* Mostrar flecha solo si se puede abrir el dropdown */}
                        {(request.estadoAtencion === 'PENDIENTE' ||
                          (request.estadoAtencion === 'ATENDIDO' && hasPermission('canRevertAttentionStatus'))) && (
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              openDropdownId === request._id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>
                      {openDropdownId === request._id && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
                          {request.estadoAtencion === 'ATENDIDO' ? (
                            // Si está atendido, solo mostrar opción PENDIENTE para admin
                            hasPermission('canRevertAttentionStatus') && (
                              <button
                                onClick={() => handleAttentionUpdate(request._id, 'PENDIENTE', request.dni, request.estadoAtencion)}
                                className="block w-full px-4 py-2 text-sm text-red-700 hover:bg-red-500"
                              >

                                PENDIENTE
                              </button>
                            )
                          ) : (
                            // Si está pendiente, solo mostrar opción ATENDIDO
                            <button
                              onClick={() => handleAttentionUpdate(request._id, 'ATENDIDO', request.dni, request.estadoAtencion)}
                              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-100"
                            >
                              ATENDIDO
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="w-[15%] px-1 sm:px-3 py-2 text-xs sm:text-sm font-medium">
                    {request.status === 'APPROVED' && !request.respondidoEn && request.estadoAtencion !== 'ATENDIDO' && (
                      <button
                        onClick={() => handlePrepareRespond(request._id, request.dni, request.nombre)}
                        className="w-full px-2 py-1 rounded-md text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all duration-200"
                      >
                        <span className="hidden sm:inline">Responder</span>
                        <span className="sm:hidden">Resp.</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          
          {/* 🚀 Sentinel element para Intersection Observer */}
          {pagination.hasNext && !searchDni.trim() && (
            <div ref={setSentinelRef} className="h-4" />
          )}
          
          {/* 🚀 Indicador de infinite scroll */}
          {!searchDni.trim() && (
            <InfiniteScrollIndicator
              loading={loadingMore}
              hasMore={pagination.hasNext}
              total={pagination.total}
              itemName="solicitudes"
            />
          )}
        </div>
      )}
      {/* Modal de Respuesta */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen bg-black/50 z-[9999] backdrop-blur-sm"
          onClick={closeModal}
          style={{
            position: 'fixed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-200 z-[10000] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Responder por WhatsApp
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cliente: {selectedRequest?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="space-y-4">
              {/* Mensaje de error */}
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Error al enviar mensaje</h4>
                      <p className="text-sm text-red-700 mt-1">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje para enviar:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-4 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                  rows={isMobile ? 6 : 8}
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={isLoading}
                />
              </div>
              
              {/* Contador de caracteres */}
              <div className="text-right text-sm text-gray-500">
                {customMessage.length} caracteres
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleRespond}
                disabled={!customMessage.trim() || isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  (customMessage.trim() && !isLoading)
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar por WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default CreditRequestsPage;