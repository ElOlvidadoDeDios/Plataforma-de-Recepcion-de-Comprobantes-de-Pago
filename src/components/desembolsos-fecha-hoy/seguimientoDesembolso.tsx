import Layout from '../Layout';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { desembolsosFechaHoy, dataResponseApi } from '../../api/desembolsofechahoy';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/permissions';
import { AGENCIAS } from '../../types';
import { useCombinedPermissions } from '../../hooks/useCombinedPermissions';

const DEFAULT_ROW_HEIGHT = 45;   // se usa solo si aún no hay filas para medir (px)
const DEFAULT_HEADER_HEIGHT = 48;
const FOOTER_SPACE = 110;        // espacio reservado para total/paginación y márgenes (px)
const MIN_ROWS = 3;
const MAX_ROWS = 100;

// Menor número = aparece primero
const prioridadEstado = (status: string | undefined | null): number => {
    if (status === 'COMPLETO') return 2;
    if (status === 'EXTORNADO') return 1;
    return 0; // cualquier otro estado = pendiente
};

const SeguimientoDesembolso: React.FC = () => {
    const { user } = useAuth();
    const permissions = useCombinedPermissions();
    const [desembolsos, setDesembolsos] = useState<dataResponseApi[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<string>('TODAS');
    const [pageSize, setPageSize] = useState<number>(10);
    const tableRef = useRef<HTMLDivElement>(null);

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

    // 1) Filtro por permisos
    const desembolsosPermitidos = useMemo(() => {
        if (!user) return [];
        if (canViewAllDesembolsos()) return desembolsos;

        const userAgencia = getUserAgencia();
        if (!userAgencia) return desembolsos;
        return desembolsos.filter(d => d.AGENCIA === userAgencia);
    }, [desembolsos, user]);

    // 2) Agencias para el select
    const agenciasDisponibles = useMemo(() => {
        const set = new Set<string>();
        desembolsosPermitidos.forEach(d => set.add(String(d.AGENCIA ?? 'SIN AGENCIA').trim()));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [desembolsosPermitidos]);

    // 3) Filtro por agencia + orden (pendientes primero)
    const desembolsosOrdenados = useMemo(() => {
        const filtrados =
            agenciaSeleccionada === 'TODAS'
                ? desembolsosPermitidos
                : desembolsosPermitidos.filter(
                      d => String(d.AGENCIA ?? 'SIN AGENCIA').trim() === agenciaSeleccionada
                  );

        // sort estable: respeta el orden original dentro de cada estado
        return [...filtrados].sort(
            (a, b) => prioridadEstado(a.STATUS_GLOBAL) - prioridadEstado(b.STATUS_GLOBAL)
        );
    }, [desembolsosPermitidos, agenciaSeleccionada]);

    // Tamaño de página automático según el alto disponible
    useEffect(() => {
        if (loading) return;

        const calcular = () => {
            const el = tableRef.current;
            if (!el) return;

            const headerH =
                el.querySelector('thead')?.getBoundingClientRect().height || DEFAULT_HEADER_HEIGHT;
            const rowH =
                el.querySelector('tbody tr[data-row]')?.getBoundingClientRect().height ||
                DEFAULT_ROW_HEIGHT;

            const top = el.getBoundingClientRect().top + window.scrollY;
            const disponible = window.innerHeight - top - headerH - FOOTER_SPACE;
            const filas = Math.floor(disponible / rowH);

            setPageSize(Math.max(MIN_ROWS, Math.min(filas, MAX_ROWS)));
        };

        calcular();
        window.addEventListener('resize', calcular);
        return () => window.removeEventListener('resize', calcular);
    }, [loading, desembolsosOrdenados.length]);

    // Paginación
    const totalItems = desembolsosOrdenados.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginaSegura = Math.min(currentPage, totalPages);

    const itemsPagina = useMemo(() => {
        const inicio = (paginaSegura - 1) * pageSize;
        return desembolsosOrdenados.slice(inicio, inicio + pageSize);
    }, [desembolsosOrdenados, paginaSegura, pageSize]);

    // Volver a la página 1 al cambiar la agencia
    useEffect(() => {
        setCurrentPage(1);
    }, [agenciaSeleccionada]);

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

    const titulo = 'SEGUIMIENTO DE CREDITOS DESEMBOLSADOS HOY';

    if (!hasPermission) {
        return (
            <Layout title={titulo} showBackButton={true}>
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
            <Layout title={titulo} showBackButton={true}>
                <div className="flex justify-center items-center p-8">
                    <p className="text-lg">Cargando datos...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title={titulo} showBackButton={true}>
                <div className="flex justify-center items-center p-8">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </Layout>
        );
    }

    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
    const colSpan = isSuperAdmin ? 10 : 9;
    const thClass = 'px-4 py-3 border-b text-left text-sm font-semibold text-gray-700';
    const tdClass = 'px-4 py-3 border-b text-sm text-gray-700';
    const selectClass =
        'border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400';

    return (
        <Layout title={titulo} showBackButton={true}>
            <div className="p-4">
                {/* Filtro */}
                <div className="mb-4 flex flex-col">
                    <label htmlFor="filtro-agencia" className="text-xs font-semibold text-gray-600 mb-1">
                        Agencia
                    </label>
                    <select
                        id="filtro-agencia"
                        value={agenciaSeleccionada}
                        onChange={e => setAgenciaSeleccionada(e.target.value)}
                        disabled={!canViewAllDesembolsos() && agenciasDisponibles.length <= 1}
                        className={`${selectClass} min-w-[200px] w-fit disabled:bg-gray-100`}
                    >
                        <option value="TODAS">Todas las agencias</option>
                        {agenciasDisponibles.map(ag => (
                            <option key={ag} value={ag}>{ag}</option>
                        ))}
                    </select>
                </div>

                {/* Tabla */}
                <div ref={tableRef} className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className={thClass}>DNI</th>
                                <th className={thClass}>Cuenta</th>
                                <th className={thClass}>Razón Social</th>
                                <th className={thClass}>Pagaré</th>
                                <th className={thClass}>Otorga</th>
                                <th className={thClass}>Monto Neto</th>
                                <th className={thClass}>Agencia</th>
                                <th className={thClass}>ID Payout</th>
                                <th className={thClass}>Estado global</th>
                                {isSuperAdmin && <th className={thClass}>Estado Detalle</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {itemsPagina.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-500">
                                        No hay desembolsos para mostrar
                                    </td>
                                </tr>
                            ) : (
                                itemsPagina.map((desembolso, index) => (
                                    <tr
                                        data-row
                                        key={`${desembolso.DNI}_${desembolso.PAGARE}_${index}`}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className={tdClass}>{desembolso.DNI}</td>
                                        <td className={tdClass}>{desembolso.CUENTA}</td>
                                        <td className={tdClass}>{desembolso.RAZON_SOCIAL}</td>
                                        <td className={tdClass}>{desembolso.PAGARE}</td>
                                        <td className={tdClass}>{desembolso.OTORGA}</td>
                                        <td className={tdClass}>{desembolso.MONTO_NETO}</td>
                                        <td className={tdClass}>{desembolso.AGENCIA}</td>
                                        <td className={tdClass}>{desembolso.ID_PAYOUT}</td>
                                        <td className="px-4 py-3 border-b text-sm">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    desembolso.STATUS_GLOBAL === 'COMPLETO'
                                                        ? 'bg-green-500 text-white'
                                                        : desembolso.STATUS_GLOBAL === 'EXTORNADO'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-orange-500 text-white'
                                                }`}
                                            >
                                                {desembolso.STATUS_GLOBAL}
                                            </span>
                                        </td>
                                        {isSuperAdmin && (
                                            <td className={tdClass}>{desembolso.STATUS_DETALLE || 'N/A'}</td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pie: total + paginación */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-600">
                        Total de registros: {totalItems}
                        {!canViewAllDesembolsos() && user?.id_age && (
                            <span className="ml-2 text-blue-600 font-medium">
                                (Filtrado por agencia: {getUserAgencia()})
                            </span>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(Math.max(paginaSegura - 1, 1))}
                                disabled={paginaSegura === 1}
                                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Página {paginaSegura} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(Math.min(paginaSegura + 1, totalPages))}
                                disabled={paginaSegura === totalPages}
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