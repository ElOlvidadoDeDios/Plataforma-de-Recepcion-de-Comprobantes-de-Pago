import React, { useState, useEffect } from 'react';
import { useCreditRequests } from '../hooks/useCreditRequests';
import { useCreditAttention } from '../hooks/useCreditAttention';
import { useAuth } from '../hooks/useAuth';
import { CreditRequest, CreditRequestStatus, AttentionStatus } from '../types/creditRequest';
import { getBotInteractionsByDni } from '../api/botInteractionsApi';
import Layout from './Layout';
import toast from 'react-hot-toast';

// Componente principal
const CreditRequestsPage: React.FC = () => {
  const { requests, loading, error, loadRequests, loadRequestsByStatus, loadRequestsByDni, updateAttentionStatus } = useCreditRequests();
  const { getLastAttentionUser } = useCreditAttention();
  const { hasPermission } = useAuth();
  const [searchDni, setSearchDni] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('APPROVED_PENDING');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{id: string, dni: string, nombre: string} | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [attentionUsers, setAttentionUsers] = useState<Record<string, {email: string, fecha: string, hora: string}>>({});

  // Función para validar si el DNI es correcto (8 dígitos, solo números)
  const esDniValido = (dni: string) => {
    const dniLimpio = dni.trim();
    return dniLimpio.length === 8 && /^\d+$/.test(dniLimpio);
  };

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
    if (filter === '') {
      // Si se selecciona "Todos", usar loadRequests que trae todas las solicitudes
      loadRequests();
    } else if (filter === 'APPROVED_PENDING' || filter === 'APPROVED_ATTENDED') {
      loadRequestsByStatus('APPROVED');
    } else {
      loadRequestsByStatus(filter as CreditRequestStatus);
    }
  };

  const filteredRequests = requests
    .filter((request) => {
      if (statusFilter === '') {
        // Si el filtro es vacío (Todos), mostrar todas las solicitudes
        return true;
      } else if (statusFilter === 'APPROVED_PENDING') {
        return request.status === 'APPROVED' && request.estadoAtencion === 'PENDIENTE';
      } else if (statusFilter === 'APPROVED_ATTENDED') {
        return request.status === 'APPROVED' && request.estadoAtencion === 'ATENDIDO';
      } else {
        return request.status === statusFilter;
      }
    })
    .sort((a, b) => {
      // Si es APPROVED_PENDING, mantener el orden actual (más antiguo primero)
      if (statusFilter === 'APPROVED_PENDING') {
        return 0; // mantiene el orden original
      }
      
      // Para los demás casos, ordenar por fecha más reciente primero
      const dateA = new Date(`${a.fecha} ${a.hora}`);
      const dateB = new Date(`${b.fecha} ${b.hora}`);
      return dateB.getTime() - dateA.getTime(); // orden descendente
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
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getAttentionBadgeColor = (status: AttentionStatus) => {
    return status === 'ATENDIDO'
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-gray-500 text-white hover:bg-gray-600';
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

    try {
      const response = await getBotInteractionsByDni(selectedRequest.dni);
      if (response.data.length > 0) {
        const phoneNumber = response.data[0].phone_number;
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
        const encodedMessage = encodeURIComponent(customMessage);
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
        
        // Aquí deberías actualizar el estado de la solicitud para marcar que se respondió
        toast.success(`Mensaje enviado a ${selectedRequest.nombre}`);
        setShowModal(false);
        setSelectedRequest(null);
        setCustomMessage('');
      } else {
        toast.error('No se encontró el número de teléfono para este DNI');
      }
    } catch (error) {
      console.error('Error al buscar el número de teléfono:', error);
      toast.error('Error al buscar el número de teléfono');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setCustomMessage('');
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
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-8 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario de búsqueda por DNI */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              placeholder="Buscar por DNI"
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!esDniValido(searchDni)} // Desactivar si el DNI no es válido
              className={`bg-cyan-600 text-white px-4 py-2 rounded-md transition-all duration-200 transform ${
                !esDniValido(searchDni) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-700 hover:scale-105'
              }`}
            >
              Buscar
            </button>
          </form>

          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          >
            <option value="APPROVED_PENDING">Aprobados Pendientes</option>
            <option value="APPROVED_ATTENDED">Aprobados Atendidos</option>
            <option value="REJECTED">Rechazados</option>
            <option value="">Todos</option>
          </select>

          {/* Botones para cambiar vista (tarjetas/tabla) */}
          <div className="flex justify-end">
           <button
             onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
             className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-200"
           >
             Ver como {viewMode === 'table' ? 'Tarjetas' : 'Tabla'}
           </button>
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
                    className="w-full px-2 py-1 rounded-md text-sm bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-200"
                  >
                    Responder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de tabla */
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto animate-fade-in">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Nombre
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   DNI
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Fecha/Hora
                 </th>
                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Puntage
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Estado
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Atención
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Acciones
                 </th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request: CreditRequest) => (
                <tr key={request._id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.nombre} {request.apellido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dni}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {request.fecha} - {request.hora}
                       {request.estadoAtencion === 'ATENDIDO' && attentionUsers[request.dni] && (
                         <p className="mt-1 text-xs">
                           Atendido por: {attentionUsers[request.dni].email}<br/>
                           {attentionUsers[request.dni].fecha} - {attentionUsers[request.dni].hora}
                         </p>
                       )}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-center">
                     {request.puntaje && (
                       <span className="text-cyan-600 font-medium">{request.puntaje.toFixed(2)}</span>
                     )}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap relative">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'APPROVED' && !request.respondidoEn && request.estadoAtencion !== 'ATENDIDO' && (
                      <button
                        onClick={() => handlePrepareRespond(request._id, request.dni, request.nombre)}
                        className="w-full px-2 py-1 rounded-md text-sm bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-200"
                      >
                        Responder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal de Respuesta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Responder a {selectedRequest?.nombre}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-4 text-gray-800 border rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
              rows={8}
              placeholder="Escribe tu mensaje aquí..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRespond}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
              >
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CreditRequestsPage;