import React, { useState } from 'react';
import { useCreditRequests } from '../hooks/useCreditRequests';
import { CreditRequest, CreditRequestStatus, AttentionStatus } from '../types/creditRequest';
import { getBotInteractionsByDni } from '../api/botInteractionsApi';
import Layout from './Layout';

const CreditRequestsPage: React.FC = () => {
    const { requests, loading, error, loadRequestsByStatus, loadRequestsByDni, updateAttentionStatus } = useCreditRequests();
    const [searchDni, setSearchDni] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('APPROVED_PENDING');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchDni.trim()) {
            loadRequestsByDni(searchDni);
        }
    };

    const handleStatusFilter = (filter: string) => {
        setStatusFilter(filter);
        if (filter === 'APPROVED_PENDING' || filter === 'APPROVED_ATTENDED') {
            loadRequestsByStatus('APPROVED');
        } else if (filter && filter !== '') {
            loadRequestsByStatus(filter as CreditRequestStatus);
        }
    };

    // Filtrar las solicitudes después de cargarlas
    const filteredRequests = requests.filter(request => {
        if (statusFilter === 'APPROVED_PENDING') {
            return request.status === 'APPROVED' && request.estadoAtencion === 'PENDIENTE';
        }
        if (statusFilter === 'APPROVED_ATTENDED') {
            return request.status === 'APPROVED' && request.estadoAtencion === 'ATENDIDO';
        }
        if (statusFilter && statusFilter !== '') {
            return request.status === statusFilter;
        }
        return true;
    });

    const handleAttentionUpdate = async (id: string, currentStatus: AttentionStatus) => {
        const newStatus = currentStatus === 'PENDIENTE' ? 'ATENDIDO' : 'PENDIENTE';
        await updateAttentionStatus(id, newStatus);
    };

    const getStatusBadgeColor = (status: CreditRequestStatus) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getAttentionBadgeColor = (status: AttentionStatus) => {
        return status === 'ATENDIDO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
    };

    const handleRespond = async (dni: string, nombre: string) => {
        try {
            const response = await getBotInteractionsByDni(dni);
            if (response.data.length > 0) {
                const phoneNumber = response.data[0].phone_number;
                // Formato internacional para WhatsApp (eliminar el + si existe)
                const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
                
                // Mensaje predeterminado
                const message = `¡Hola ${nombre}! Gracias por la aprobación de su préstamo. Le informo que tiene pre-aprobados los siguientes montos disponibles:
- S/100
- S/200
- S/300
- S/500

Me gustaría saber qué monto le interesa para brindarle mayor información sobre las condiciones y cuotas.

Quedo atento a su respuesta.`;

                // Codificar el mensaje para URL
                const encodedMessage = encodeURIComponent(message);
                
                // Abrir WhatsApp web con el número y mensaje
                window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
            } else {
                alert('No se encontró el número de teléfono para este DNI');
            }
        } catch (error) {
            console.error('Error al buscar el número de teléfono:', error);
            alert('Error al buscar el número de teléfono');
        }
    };

    if (loading) {
        return (
            <Layout title="Solicitudes de Crédito">
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Solicitudes de Crédito">
                <div className="text-red-600 p-4">{error}</div>
            </Layout>
        );
    }

    return (
        <Layout title="Solicitudes de Crédito">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchDni}
                                onChange={(e) => setSearchDni(e.target.value)}
                                placeholder="Buscar por DNI"
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                            <button
                                type="submit"
                                className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
                            >
                                Buscar
                            </button>
                        </form>
                    </div>

                    <div className="space-y-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="APPROVED_PENDING">Aprobados Pendientes</option>
                            <option value="APPROVED_ATTENDED">Aprobados Atendidos</option>
                            <option value="REJECTED">Rechazados</option>
                            <option value="">Todos</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <p className="text-gray-600 font-medium">
                        No se encontraron solicitudes
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map((request: CreditRequest) => (
                        <div key={request._id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{request.nombre} {request.apellido}</h3>
                                    <p className="text-gray-600">DNI: {request.dni}</p>
                                    <p className="text-sm text-gray-500">
                                        {request.fecha} - {request.hora}
                                    </p>
                                    {request.mensaje && (
                                        <p className="mt-2 text-gray-700">{request.mensaje}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(request.status)}`}>
                                        {request.status}
                                    </span>
                                    <button
                                        onClick={() => handleAttentionUpdate(request._id, request.estadoAtencion)}
                                        className={`px-3 py-1 rounded-full text-sm ${getAttentionBadgeColor(request.estadoAtencion)}`}
                                    >
                                        {request.estadoAtencion}
                                    </button>
                                    {request.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleRespond(request.dni, request.nombre)}
                                            className="px-3 py-1 rounded-full text-sm bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                                        >
                                            Responder
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default CreditRequestsPage;