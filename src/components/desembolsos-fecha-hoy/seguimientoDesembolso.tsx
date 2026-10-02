import Layout from '../Layout';
import React, { useEffect, useState, useMemo } from 'react';
import { desembolsosFechaHoy, dataResponseApi } from '../../api/desembolsofechahoy';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/permissions';
import { AGENCIAS } from '../../types';
import { useCombinedPermissions } from '../../hooks/useCombinedPermissions';
import { PAGE_SIZE, sortAndPaginateDesembolsos } from './seguimientoDesembolso.utils';

const SeguimientoDesembolso: React.FC = () => {
    const { user } = useAuth();
    const permissions = useCombinedPermissions();
    const [desembolsos, setDesembolsos] = useState<dataResponseApi[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const hasPermission = permissions.canAccessSeguimientoDesembolsosHoy();

    const getUserAgencia = (): string | null => {
        if (!user || !user.id_age) return null;

        const agenciaEncontrada = Object.entries(AGENCIAS).find(([_, codigo]) => codigo === user.id_age);
        return agenciaEncontrada ? agenciaEncontrada[0] : null;
    };

    const canViewAllDesembolsos = (): boolean => {
        if (!user) return false;
        return user.role === UserRole.SUPER_ADMIN ||
            user.role === UserRole.GERENTE_GENERAL ||
            user.role === UserRole.JEFE_OPERACIONES;
    };

    const desembolsosFiltrados = useMemo(() => {
        if (!user) return [];

        let filtrados: dataResponseApi[];

        if (canViewAllDesembolsos()) {
            filtrados = desembolsos;
        } else {
            const userAgencia = getUserAgencia();
            if (!userAgencia) {
                filtrados = desembolsos;
            } else {
                filtrados = desembolsos.filter(desembolso => desembolso.AGENCIA === userAgencia);
            }
        }

        return filtrados;
    }, [desembolsos, user]);

    useEffect(() => {
        setCurrentPage(1);
    }, [desembolsosFiltrados.length]);

    const paginaActual = useMemo(() => {
        return sortAndPaginateDesembolsos(desembolsosFiltrados, PAGE_SIZE, currentPage);
    }, [desembolsosFiltrados, currentPage]);

    const gruposPorAgencia = useMemo(() => {
        const grupos: { agencia: string; items: dataResponseApi[] }[] = [];

        for (const item of paginaActual.items) {
            const agencia = String(item.AGENCIA ?? 'SIN AGENCIA').trim();
            const grupo = grupos.find(g => g.agencia === agencia);

            if (grupo) {
                grupo.items.push(item);
            } else {
                grupos.push({ agencia, items: [item] });
            }
        }

        return grupos;
    }, [paginaActual.items]);

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

    const colSpan = user?.role === UserRole.SUPER_ADMIN ? 10 : 9;

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
                                {user?.role === UserRole.SUPER_ADMIN && (
                                    <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">Estado Detalle</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {desembolsosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-500">
                                        No hay desembolsos para hoy
                                    </td>
                                </tr>
                            ) : (
                                gruposPorAgencia.map((grupo) => (
                                    <React.Fragment key={grupo.agencia}>
                                        <tr className="bg-blue-50">
                                            <td colSpan={colSpan} className="px-4 py-2 text-sm font-bold text-blue-800 uppercase">
                                                Agencia {grupo.agencia}
                                            </td>
                                        </tr>
                                        {grupo.items.map((desembolso, index) => (
                                            <tr key={`${desembolso.DNI}_${desembolso.PAGARE}_${index}`} className="hover:bg-gray-50">
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
                                                {user?.role === UserRole.SUPER_ADMIN && (
                                                    <td className="px-4 py-3 border-b text-sm text-gray-700">
                                                        {desembolso.STATUS_DETALLE || 'N/A'}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-600">
                        Total de registros: {paginaActual.totalItems}
                        {!canViewAllDesembolsos() && user?.id_age && (
                            <span className="ml-2 text-blue-600 font-medium">
                                (Filtrado por agencia: {getUserAgencia()})
                            </span>
                        )}
                    </div>

                    {paginaActual.totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Página {paginaActual.currentPage} / {paginaActual.totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginaActual.totalPages))}
                                disabled={currentPage === paginaActual.totalPages}
                                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SeguimientoDesembolso;