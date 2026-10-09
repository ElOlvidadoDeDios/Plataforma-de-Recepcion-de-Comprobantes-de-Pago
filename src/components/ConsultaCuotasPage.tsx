import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from './Layout';
import {
  fetchMisPagosByRangoFechas,
  fetchMisPagosByRangoFechasYAnalista,
} from '../api';
import { ConsultaCuota } from '../types/consultaCuotas';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/roles';
import { extraerVoucherExterno } from './customerConsultation/services/vouchers.service';
import {
  VoucherData,
  generateVoucherPDF,
  generateVoucherPDFBlobUrl,
  generateVoucherPDFDataUri,
} from './pagos_recaudadores/vaucher_pdf';

interface VoucherPreviewItem {
  url: string;
  previewSrc: string;
  fileName: string;
  voucherData: VoucherData;
}

const ConsultaCuotasPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'atendido' | 'pendiente'>('todos');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [previewVouchers, setPreviewVouchers] = useState<VoucherPreviewItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: today,
    endDate: today,
  });

  const canUseGeneralEndpoint =
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.JEFE_OPERACIONES ||
    user?.role === UserRole.CAJERO ||
    user?.role === UserRole.RECAUDADOR;

  const canUseAnalistaEndpoint =
    user?.role === UserRole.ANALISTA_CREDITOS_I ||
    user?.role === UserRole.ANALISTA_CREDITOS_PAGO_DIARIO;

  const calculateItemsPerPage = (isMobileView: boolean, currentViewMode: 'table' | 'cards') => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Espacio aproximado ocupado por header, filtros y separaciones de la vista.
    const reservedHeight = isMobileView ? 520 : 440;
    const availableHeight = Math.max(220, viewportHeight - reservedHeight);

    if (currentViewMode === 'table') {
      const estimatedRowHeight = 84;
      return Math.max(3, Math.floor(availableHeight / estimatedRowHeight));
    }

    const columns = viewportWidth >= 1024 ? 3 : viewportWidth >= 768 ? 2 : 1;
    const estimatedCardHeight = 250;
    const rows = Math.max(1, Math.floor(availableHeight / estimatedCardHeight));
    return Math.max(columns, rows * columns);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewMode(mobile ? 'cards' : 'table');
      setItemsPerPage(calculateItemsPerPage(mobile, mobile ? 'cards' : 'table'));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setItemsPerPage(calculateItemsPerPage(isMobile, viewMode));
  }, [isMobile, viewMode]);

  const { data: consultas = [], isLoading, isError, refetch } = useQuery<ConsultaCuota[]>({
    queryKey: ['mis-pagos', user?.role, user?.id_ana, dateRange.startDate, dateRange.endDate],
    enabled: false,
    queryFn: async () => {
      if (!dateRange.startDate || !dateRange.endDate) {
        throw new Error('Debe seleccionar fecha inicio y fecha fin');
      }

      if (canUseGeneralEndpoint) {
        return fetchMisPagosByRangoFechas(dateRange.startDate, dateRange.endDate);
      }

      if (!canUseAnalistaEndpoint) {
        throw new Error('Tu rol no tiene acceso a esta vista de Mis Pagos.');
      }

      const idAnalistaActual = user?.user;
      if (!idAnalistaActual) {
        throw new Error('No se encontro IDAnalistaActual para el usuario actual');
      }

      return fetchMisPagosByRangoFechasYAnalista(
        idAnalistaActual,
        dateRange.startDate,
        dateRange.endDate,
      );
    },
    staleTime: 30000,
    retry: 3,
  });

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const filteredConsultas = consultas.filter((consulta) => {
    if (estadoFilter === 'todos') {
      // Continue to text filter
    } else if (estadoFilter === 'atendido') {
      if (consulta.estado?.toLowerCase() !== 'atendido') {
        return false;
      }
    } else if (!['pendiente', 'parcial'].includes(consulta.estado?.toLowerCase() || '')) {
      return false;
    }

    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const nombre = String(consulta.nombreSocio || '').toLowerCase();
    const dni = String(consulta.dni || '').toLowerCase();
    return nombre.includes(query) || dni.includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredConsultas.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange.startDate, dateRange.endDate, estadoFilter, searchTerm, user?.role, user?.user]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleConsultas = filteredConsultas.slice(startIndex, endIndex);

  const getVouchersAceptados = (consulta: ConsultaCuota) => {
    return (consulta.comprobantebase_64 || []).filter(
      (voucher) => voucher.estado?.toLowerCase() === 'aceptado' && Boolean(voucher?.nroOperacion),
    );
  };

  const canExtractVouchers = (consulta: ConsultaCuota) => {
    const estadoAtendido = consulta.estado?.toLowerCase() === 'atendido';
    return estadoAtendido && getVouchersAceptados(consulta).length > 0;
  };

  const getNumerosOperacion = (consulta: ConsultaCuota): string[] => {
    const numeros = (consulta.comprobantebase_64 || [])
      .map((voucher) => String(voucher?.nroOperacion || '').trim())
      .filter((nro) => Boolean(nro));

    return Array.from(new Set(numeros));
  };

  const getOperacionesConMonto = (consulta: ConsultaCuota) => {
    const operaciones = (consulta.comprobantebase_64 || [])
      .filter((voucher) => Boolean(String(voucher?.nroOperacion || '').trim()))
      .map((voucher) => ({
        nroOperacion: String(voucher?.nroOperacion || '').trim(),
        montoPago: voucher?.monto_pago,
      }));

    const dedup = new Map<string, { nroOperacion: string; montoPago?: number }>();
    operaciones.forEach((op) => {
      if (!dedup.has(op.nroOperacion)) {
        dedup.set(op.nroOperacion, op);
      }
    });

    return Array.from(dedup.values());
  };

  const getActionLabel = (consulta: ConsultaCuota) => {
    const vouchers = consulta.comprobantebase_64 || [];
    const tieneAceptados = vouchers.some(
      (voucher) => voucher.estado?.toLowerCase() === 'aceptado',
    );
    const tieneRechazados = vouchers.some(
      (voucher) => voucher.estado?.toLowerCase() === 'rechazado',
    );
    const estado = (consulta.estado || '').toLowerCase();

    if (!tieneAceptados && tieneRechazados) {
      return 'Pagos rechazados';
    }

    if (['pendiente', 'parcial'].includes(estado)) {
      return 'Pendiente';
    }

    return 'Sin extracción';
  };

  const isPagosRechazados = (consulta: ConsultaCuota) => getActionLabel(consulta) === 'Pagos rechazados';
  const isPendienteAccion = (consulta: ConsultaCuota) => getActionLabel(consulta) === 'Pendiente';

  const cerrarPreview = () => {
    previewVouchers.forEach((item) => URL.revokeObjectURL(item.url));
    setPreviewVouchers([]);
    setPreviewIndex(0);
    setIsPreviewOpen(false);
  };

  const descargarPreviewActual = () => {
    const actual = previewVouchers[previewIndex];
    if (!actual) {
      return;
    }
    generateVoucherPDF(actual.voucherData);
  };

  const descargarTodos = () => {
    previewVouchers.forEach((item) => {
      generateVoucherPDF(item.voucherData);
    });
  };

  const handleExtractVouchers = async (consulta: ConsultaCuota) => {
    const vouchersAceptados = getVouchersAceptados(consulta);

    if (vouchersAceptados.length === 0) {
      setExtractError('No se encontraron vouchers validos para extraer.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const previews: VoucherPreviewItem[] = [];

      for (const voucher of vouchersAceptados) {
        const voucherData = await extraerVoucherExterno(
          {
            pagare: consulta.pagare,
            nroOperacion: String(voucher.nroOperacion || '').trim(),
            fecha: consulta.fecha,
            hora: consulta.hora,
            dni: consulta.dni,
          },
          user || undefined,
        );

        const url = generateVoucherPDFBlobUrl(voucherData);
        const recibo = String(voucherData?.RECIBO || voucher.nroOperacion || 'voucher').trim();
        previews.push({
          url,
          previewSrc: generateVoucherPDFDataUri(voucherData),
          fileName: `Voucher_${recibo}.pdf`,
          voucherData,
        });
      }

      if (previews.length > 0) {
        setPreviewVouchers(previews);
        setPreviewIndex(0);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al extraer voucher';
      setExtractError(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const TableView = () => (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-cyan-50 to-blue-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Socio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Prestamo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Nro Operacion/Monto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Estado de Pago</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Fecha de Registro</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-cyan-700 uppercase tracking-wider border-b border-cyan-200">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visibleConsultas.map((consulta: ConsultaCuota, index) => (
            <tr key={consulta._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-cyan-50 transition-colors`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{consulta.nombreSocio}</div>
                  <div className="text-sm text-gray-500">DNI: {consulta.dni}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {consulta.pagare}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5">
                  {getOperacionesConMonto(consulta).length > 0 ? (
                    getOperacionesConMonto(consulta).map((op, nroIndex) => (
                      <div
                        key={`${consulta._id}-nro-${nroIndex}`}
                        className="inline-flex items-center gap-2"
                      >
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {op.nroOperacion}
                        </span>
                        <span className="text-xs text-emerald-700 font-medium">
                          {typeof op.montoPago === 'number' ? `S/ ${op.montoPago.toFixed(2)}` : 'S/ -'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Sin nro. operación</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                  {consulta.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {consulta.fecha} {consulta.hora}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {canExtractVouchers(consulta) ? (
                  <button
                    onClick={() => handleExtractVouchers(consulta)}
                    disabled={isExtracting}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? 'Extrayendo...' : 'Extraer Vouchers'}
                  </button>
                ) : isPagosRechazados(consulta) ? (
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md cursor-not-allowed opacity-95"
                  >
                    Pagos rechazados
                  </button>
                ) : isPendienteAccion(consulta) ? (
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-md cursor-not-allowed opacity-95"
                  >
                    Pendiente
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">{getActionLabel(consulta)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleConsultas.map((consulta: ConsultaCuota) => (
        <div key={consulta._id} className="bg-white shadow-lg rounded-xl border border-gray-200 p-4 hover:shadow-xl transition-all duration-200">
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{consulta.nombreSocio}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">DNI: {consulta.dni}</span>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 whitespace-nowrap">
                  {consulta.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm"><span className="font-medium text-gray-700">Prestamo:</span> <span className="text-blue-600 font-semibold">{consulta.pagare}</span></span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8l-1 10H9L8 7z" />
              </svg>
              <span className="text-sm text-gray-600">{consulta.fecha} {consulta.hora}</span>
            </div>

            {canExtractVouchers(consulta) && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleExtractVouchers(consulta)}
                  disabled={isExtracting}
                  className="w-full px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {isExtracting
                    ? 'Extrayendo...'
                    : `Extraer Vouchers (${getVouchersAceptados(consulta).length})`}
                </button>
              </div>
            )}

            {!canExtractVouchers(consulta) && isPagosRechazados(consulta) && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled
                  className="w-full px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-md cursor-not-allowed opacity-95"
                >
                  Pagos rechazados
                </button>
              </div>
            )}

            {!canExtractVouchers(consulta) && isPendienteAccion(consulta) && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled
                  className="w-full px-3 py-2 text-xs font-semibold text-white bg-orange-500 rounded-md cursor-not-allowed opacity-95"
                >
                  Pendiente
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Layout title="Mis Pagos">
        <div className="px-4 sm:px-6 py-6">
          {extractError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {extractError}
            </div>
          )}

          {/* Filtros de busqueda */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value as 'todos' | 'atendido' | 'pendiente')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="todos">Todos</option>
                  <option value="atendido">Atendido</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre o DNI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  refetch();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Buscar
              </button>
              <button
                onClick={() => {
                  setDateRange({ startDate: today, endDate: today });
                  refetch();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Hoy
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis Pagos</h2>
            <span className="text-sm text-gray-500">
              Vista: {isMobile ? 'Tarjetas' : 'Tabla'} | Registros: {filteredConsultas.length}
            </span>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
            </div>
          )}

          {isError && (
            <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-500">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">Error al cargar mis pagos. Verifica fechas o permisos.</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !isError && (viewMode === 'table' ? <TableView /> : <CardsView />)}

          {!isLoading && !isError && filteredConsultas.length > 0 && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredConsultas.length)} de {filteredConsultas.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[110px] text-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {isPreviewOpen && previewVouchers.length > 0 && (
        <div
          className="fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center p-3"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cerrarPreview();
            }
          }}
        >
          <div className="w-full max-w-5xl h-[88vh] rounded-lg bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-cyan-600 text-white px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
              <p className="text-sm font-semibold">
                Previsualizacion de voucher {previewIndex + 1} de {previewVouchers.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {previewVouchers.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                      disabled={previewIndex === 0}
                      className="px-3 py-1 rounded-md bg-white text-cyan-700 text-sm disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((prev) => Math.min(previewVouchers.length - 1, prev + 1))}
                      disabled={previewIndex === previewVouchers.length - 1}
                      className="px-3 py-1 rounded-md bg-white text-cyan-700 text-sm disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={descargarPreviewActual}
                  className="px-3 py-1 rounded-md bg-blue-700 text-white text-sm"
                >
                  Descargar actual
                </button>
                {previewVouchers.length > 1 && (
                  <button
                    type="button"
                    onClick={descargarTodos}
                    className="px-3 py-1 rounded-md bg-blue-900 text-white text-sm"
                  >
                    Descargar todos
                  </button>
                )}
                <button
                  type="button"
                  onClick={cerrarPreview}
                  className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="h-[calc(88vh-56px)] bg-gray-100">
              <object
                data={previewVouchers[previewIndex]?.previewSrc}
                type="application/pdf"
                className="h-full w-full"
              >
                <embed
                  src={previewVouchers[previewIndex]?.previewSrc}
                  type="application/pdf"
                  className="h-full w-full"
                />
                <div className="h-full w-full flex items-center justify-center p-4 text-center">
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Tu navegador no permite vista previa embebida.</p>
                    <a
                      href={previewVouchers[previewIndex]?.previewSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-2 rounded-md bg-cyan-600 text-white text-sm"
                    >
                      Abrir vista previa
                    </a>
                  </div>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsultaCuotasPage;