import Layout from '../Layout';
import React, { useEffect, useState, useMemo } from "react";
import { desembolsosFechaHoy, dataResponseApi } from '../../api/desembolsofechahoy';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/permissions';
import { AGENCIAS } from '../../types';
import { useCombinedPermissions } from '../../hooks/useCombinedPermissions';
import { Eye, Info, RotateCcw } from 'lucide-react';

const SeguimientoDesembolso: React.FC = () => {
    const { user } = useAuth();
    const permissions = useCombinedPermissions();
    const [desembolsos, setDesembolsos] = useState<dataResponseApi[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar permisos específicos para seguimiento de desembolsos hoy
    const hasPermission = permissions.canAccessSeguimientoDesembolsosHoy();
    
    if (!hasPermission) {
        return (
            <Layout title="SEGUIMIENTO DE CREDITOS DESEMBOLSADOS HOY" showBackButton={true}>
                <div className="flex justify-center items-center p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🚫</div>
                        <h2 className="text-xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
                        <p className="text-gray-600">No tienes permisos para acceder a esta funcionalidad.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Función para obtener la agencia del usuario basada en id_age
    const getUserAgencia = (): string | null => {
        if (!user || !user.id_age) return null;
        
        // Buscar el nombre de la agencia usando el código id_age
        const agenciaEncontrada = Object.entries(AGENCIAS).find(([_, codigo]) => codigo === user.id_age);
        return agenciaEncontrada ? agenciaEncontrada[0] : null;
    };

    // Función para verificar si el usuario puede ver todos los desembolsos
    const canViewAllDesembolsos = (): boolean => {
        if (!user) return false;
        return user.role === UserRole.SUPER_ADMIN ||
               user.role === UserRole.GERENTE_GENERAL ||
               user.role === UserRole.JEFE_OPERACIONES;
    };

    // Filtrar desembolsos según el rol del usuario
    const desembolsosFiltrados = useMemo(() => {
        if (!user) return [];
        
        // Super Admin, Gerente General y Jefe de Operaciones ven todos los desembolsos
        if (canViewAllDesembolsos()) {
            return desembolsos;
        }

        // Otros usuarios ven solo los datos de su agencia
        const userAgencia = getUserAgencia();
        if (!userAgencia) {
            // Si no tiene agencia asignada, puede ver todos los datos
            return desembolsos;
        }
        
        return desembolsos.filter(desembolso =>
            desembolso.AGENCIA === userAgencia
        );
    }, [desembolsos, user]);

    useEffect(() => {
        const fetchDesembolsos = async () => {
            try {
                setLoading(true);
                const data = await desembolsosFechaHoy();
                setDesembolsos(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchDesembolsos();
    }, []);

    if (loading) {
        return (
            <Layout title="SEGUIMIENTO DE CREDITOS DESEMBOLSADOS HOY" showBackButton={true}>
                <div className="flex justify-center items-center p-8">
                    <p className="text-lg">Cargando datos...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="SEGUIMIENTO DE CREDITOS DESEMBOLSADOS HOY" showBackButton={true}>
                <div className="flex justify-center items-center p-8">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="SEGUIMIENTO DE CREDITOS DESEMBOLSADOS HOY" showBackButton={true}>
            <div className="p-4">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">DNI</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Cuenta</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Razón Social</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Pagaré</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Otorga</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Monto Neto</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Agencia</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">ID Payout</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Estado global</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Estado Detalle</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {desembolsosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-6 text-center text-gray-500">
                                        No hay desembolsos para hoy
                                    </td>
                                </tr>
                            ) : (
                                desembolsosFiltrados.map((desembolso, index) => (
                                    <tr key={desembolso.ID_PAYOUT || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.DNI}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.CUENTA}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.RAZON_SOCIAL}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.PAGARE}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.OTORGA}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.MONTO_NETO}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.AGENCIA}</td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{desembolso.ID_PAYOUT}</td>
                                        <td className="px-4 py-3 border-b text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                desembolso.STATUS_GLOBAL === 'COMPLETO'
                                                    ? 'bg-green-500 text-white'
                                                    : desembolso.STATUS_GLOBAL === 'EXTORNADO'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-orange-500 text-white'
                                            }`}>
                                                {desembolso.STATUS_GLOBAL}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-b text-sm text-gray-700">
                                            {desembolso.STATUS_DETALLE || 'N/A'}
                                        </td>

                                        <td className="flex items-center gap-2">
                                            <button
                                                title="Reintentar"
                                                className="p-1 text-gray-600 hover:text-orange-600 transition-colors"
                                            >
                                                <RotateCcw size={18} />
                                            </button>

                                            <button
                                                title="Ver vouchers"
                                                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            <button
                                                title="Detalles"
                                                className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                                            >
                                                <Info size={18} />
                                            </button>
                                        </td>  
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                    Total de registros: {desembolsosFiltrados.length}
                    {!canViewAllDesembolsos() && user?.id_age && (
                        <span className="ml-2 text-blue-600 font-medium">
                            (Filtrado por agencia: {getUserAgencia()})
                        </span>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default SeguimientoDesembolso;