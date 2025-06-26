import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { creditAttentionApi } from '../../api/creditAttentionApi';
import { HistorialCredito } from '../../types/creditRequest';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

const CreditAttentionResponse: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    // Filtros para búsqueda manual
    const [searchType, setSearchType] = useState<'email' | 'dni'>('dni');
    const [manualEmail, setManualEmail] = useState('');
    const [manualDni, setManualDni] = useState('');

    // Roles
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    // Inicializa el rango de fechas a hoy por defecto
    const today = new Date().toISOString().slice(0, 10);
    const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
        startDate: today,
        endDate: today
    });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setViewMode(mobile ? 'cards' : 'table');
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cargar historial automáticamente por email al montar
    // Carga automática solo por email del usuario autenticado
    useEffect(() => {
        // Si es admin o super admin, carga TODO el historial del día de hoy (por defecto)
        if (isAdmin) {
            fetchHistorial('', 'all');
        } else if (user?.email) {
            // Si es usuario de pago, carga solo su historial
            fetchHistorial(user.email, 'email');
        }
        // eslint-disable-next-line
    }, [user?.email, isAdmin]);

 

    // Estado para manejar los datos
    const [consultas, setConsultas] = useState<HistorialCredito[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Función para buscar historial
    // Generaliza la búsqueda por email o dni
    const fetchHistorial = async (value: string, type: 'email' | 'dni' | 'all') => {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        try {
            let response: any;

            if (type === 'all') {
                // Admin/superadmin: historial completo del día
                response = await creditAttentionApi.getHistorialCompleto(
                    dateRange.startDate || undefined,
                    dateRange.endDate || undefined
                );
            } else if (type === 'email' && value) {
                response = await creditAttentionApi.getHistorialByEmail(
                    value,
                    dateRange.startDate || undefined,
                    dateRange.endDate || undefined
                );
            } else if (type === 'dni' && value) {
                response = await creditAttentionApi.getHistorialBySolicitudDni(value);
            } else {
                setConsultas([]);
                return;
            }

            // Acceder a los datos según la estructura de tu API
            // Elimina response.historial y mapea los datos para cumplir el tipo HistorialCredito
            const historialData = response.data || response || [];
            setConsultas(
                Array.isArray(historialData)
                    ? historialData.map((item: any) => ({
                        ...item,
                        // Asegura que solicitud_atendida tenga los campos requeridos
                        solicitud_atendida: {
                            ...item.solicitud_atendida,
                            _id: item.solicitud_atendida?._id || '', // valor por defecto si falta
                            estadoAtencion: item.solicitud_atendida?.estadoAtencion || item.solicitud_atendida?.estado_nuevo || '',
                        }
                    }))
                    : []
            );

        } catch (error: any) {
            setIsError(true);
            setError(error);
            setConsultas([]);
            toast.error(error.message || 'Error al obtener el historial');
        } finally {
            setIsLoading(false);
        }
    };

    // Búsqueda manual por email o dni
    const handleSearch = () => {
        if (isAdmin && searchType === 'email' && manualEmail) {
            // Admin busca por email específico y rango de fechas
            fetchHistorial(manualEmail, 'email');
        } else if (isAdmin && searchType === 'dni' && manualDni) {
            // Admin busca por DNI específico y rango de fechas
            fetchHistorial(manualDni, 'dni');
        } else if (isAdmin) {
            // Admin busca todos por rango de fechas
            fetchHistorial('', 'all');
        } else if (searchType === 'email') {
            fetchHistorial(manualEmail, 'email');
        } else {
            fetchHistorial(manualDni, 'dni');
        }
    };

    const handleClearSearch = () => {
        setManualEmail('');
        setManualDni('');
        setDateRange({ startDate: '', endDate: '' });
        setConsultas([]);
        setIsError(false);
        setError(null);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        // Si la fecha viene en formato DD/MM/YYYY, la convertimos
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            return `${day}/${month}/${year}`;
        }
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const formatDateTime = (dateString: string, timeString: string) => {
        if (!dateString) return 'N/A';
        return `${formatDate(dateString)} ${timeString || ''}`.trim();
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'APPROVED': 'bg-green-100 text-green-800',
            'REJECTED': 'bg-red-100 text-red-800'
        };
        
        const statusLabels = {
            'PENDING': 'PENDIENTE',
            'APPROVED': 'APROBADO',
            'REJECTED': 'RECHAZADO'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[status as keyof typeof statusLabels] || status}
            </span>
        );
    };

    const getAttentionStatusBadge = (status: string) => {
        const statusColors = {
            'ATENDIDO': 'bg-blue-100 text-blue-800',
            'PENDIENTE': 'bg-orange-100 text-orange-800'
        };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    // Filtrar por rango de fechas si está establecido
    const filteredConsultas = consultas.filter(consulta => {
        if (!dateRange.startDate && !dateRange.endDate) return true;
        
        // Convertir fecha_atencion DD/MM/YYYY a Date
        const [day, month, year] = consulta.fecha_atencion.split('/');
        const consultaDate = new Date(`${year}-${month}-${day}`);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        if (startDate && consultaDate < startDate) return false;
        if (endDate && consultaDate > endDate) return false;
        
        return true;
    });

    return (
        <div className="p-0 bg-blue-50 min-h-screen w-full">
            <div className="max-w-7xl mx-auto">
                {/* Botón para regresar */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/credit-requests')}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
                    >
                        ← Volver a Solicitudes de Crédito
                    </button>
                </div>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Historial de Atención de Créditos
                    </h1>
                    <p className="text-gray-600">
                        Consulta el historial de atenciones y solicitudes de crédito
                    </p>
                </div>

                {/* Filtros de búsqueda */}
                <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Tipo de búsqueda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar por:
                            </label>
                            <select
                                value={searchType}
                                onChange={(e) => {
                                    setSearchType(e.target.value as 'email' | 'dni');
                                    setManualEmail('');
                                    setManualDni('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {isAdmin && <option value="email">Email</option>}
                                <option value="dni">DNI</option>
                            </select>
                        </div>

                        {/* Campo de búsqueda */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {searchType === 'email' ? 'Email:' : 'DNI:'}
                            </label>
                            {searchType === 'email' && isAdmin ? (
                                <input
                                    type="email"
                                    value={manualEmail}
                                    onChange={(e) => setManualEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={manualDni}
                                    onChange={(e) => setManualDni(e.target.value)}
                                    placeholder="12345678"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            )}
                        </div>

                        {/* Fecha inicio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha inicio:
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Fecha fin */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha fin:
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                        <button
                            onClick={handleClearSearch}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Limpiar
                        </button>
                        {!isMobile && (
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                {viewMode === 'table' ? 'Vista Tarjetas' : 'Vista Tabla'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Contenido principal */}
                {isError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">
                            Error al cargar el historial: {error?.message || 'Error desconocido'}
                        </p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Cargando historial...</span>
                    </div>
                ) : filteredConsultas.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No se encontraron registros
                        </h3>
                        <p className="text-gray-600">
                            {(searchType === 'email' && manualEmail) || (searchType === 'dni' && manualDni)
                                ? 'No hay historial disponible para los criterios de búsqueda especificados.'
                                : 'Ingrese un email o DNI para buscar el historial.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Contador de resultados */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Se encontraron {filteredConsultas.length} registro(s)
                            </p>
                        </div>

                        {/* Vista de tabla (desktop) */}
                        {viewMode === 'table' && !isMobile && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden shadow-md w-full">
                                <div>
                                    <table className="w-full min-w-full divide-y divide-blue-200">
                                        <thead className="bg-blue-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Usuario Atención
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Cliente Atendido
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Estado Crédito
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Estado Atención
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Puntaje
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Fecha Atención
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                                    Mensaje
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-blue-50 divide-y divide-blue-100">
                                            {filteredConsultas.map((consulta) => (
                                                <tr key={consulta._id} className="hover:bg-blue-100">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-blue-900">{consulta.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-blue-900">
                                                            {consulta.solicitud_atendida.nombre} {consulta.solicitud_atendida.apellido}
                                                        </div>
                                                        <div className="text-sm text-blue-500">
                                                            DNI: {consulta.solicitud_atendida.dni}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusBadge(consulta.solicitud_atendida.status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getAttentionStatusBadge(consulta.solicitud_atendida.estadoAtencion)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                                                        {consulta.solicitud_atendida.puntaje?.toFixed(2) || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                                                        {formatDateTime(consulta.fecha_atencion, consulta.hora_atencion)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-blue-900 max-w-xs">
                                                        <div className="truncate" title={consulta.solicitud_atendida.mensaje}>
                                                            {consulta.solicitud_atendida.mensaje || 'Sin mensaje'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Vista de tarjetas (mobile/cards) */}
                        {(viewMode === 'cards' || isMobile) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredConsultas.map((consulta) => (
                                    <div key={consulta._id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                ID: {consulta._id.slice(-8)}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(consulta.solicitud_atendida.status)}
                                                {getAttentionStatusBadge(consulta.solicitud_atendida.estadoAtencion)}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Usuario que Atendió:</p>
                                                <p className="text-sm text-gray-900">{consulta.email}</p>

                                            </div>
                                            
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Cliente Atendido:</p>
                                                <p className="text-sm text-gray-900">
                                                    {consulta.solicitud_atendida.nombre} {consulta.solicitud_atendida.apellido}
                                                </p>
                                                <p className="text-sm text-gray-500">DNI: {consulta.solicitud_atendida.dni}</p>
                                            </div>
                                            
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Puntaje:</p>
                                                <p className="text-sm text-gray-900 font-medium">
                                                    {consulta.solicitud_atendida.puntaje?.toFixed(2) || 'N/A'}
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Fecha y Hora:</p>
                                                <p className="text-sm text-gray-900">
                                                    {formatDateTime(consulta.fecha_atencion, consulta.hora_atencion)}
                                                </p>
                                            </div>
                                            
                                            {consulta.solicitud_atendida.mensaje && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Mensaje:</p>
                                                    <p className="text-sm text-gray-900 line-clamp-3">
                                                        {consulta.solicitud_atendida.mensaje}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CreditAttentionResponse;