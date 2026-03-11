import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/roles';
import Layout from '../Layout';
import {
  ClienteDesembolso,
  obtenerCreditosPendientesDesembolsar,
  formatearMonto,
  getEstadoDatosBancarios,
  tieneDatosBancariosCompletos,
} from '../../api/desembolsosApi';
import SubirComprobanteDesembolsoModal from './SubirComprobanteDesembolsoModal';

const PendientesAdesembolsar: React.FC = () => {
  const { user } = useAuth();
  const [creditos, setCreditos] = useState<ClienteDesembolso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedCredito, setSelectedCredito] = useState<ClienteDesembolso | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Verificar si el usuario tiene permisos para acceder a este componente
  const hasAccess = (): boolean => {
    if (!user || !user.role) return false;
    
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.GERENTE_GENERAL,
      UserRole.JEFE_OPERACIONES,
      UserRole.CAJERO,
      UserRole.ANALISTA_CREDITOS_PAGO_DIARIO
    ];
    
    return allowedRoles.includes(user.role);
  };

  // Cargar datos del endpoint
  const cargarCreditos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await obtenerCreditosPendientesDesembolsar();
      setCreditos(data);
    } catch (err) {
      setError('Error al cargar los créditos pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess()) {
      cargarCreditos();
    }
  }, [user]);

  // Estadísticas para el header
  const totalCreditos = creditos.length;
  const creditosConDatosBancarios = creditos.filter(tieneDatosBancariosCompletos).length;
  const creditosSinDatosBancarios = totalCreditos - creditosConDatosBancarios;
  const montoTotal = creditos.reduce((total, credito) => {
    const montoStr = credito?.DATOS_DESEMBOLSO?.MONTO_APROB ?? '0';
    const monto = parseFloat(montoStr.replace(/[^\d.]/g, '')) || 0;
    return total + monto;
  }, 0);

  // Funciones para manejar el modal
  const abrirModal = (credito: ClienteDesembolso) => {
    setSelectedCredito(credito);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedCredito(null);
  };

  const handleUploadSuccess = () => {
    // Opcionalmente recargar la lista de créditos
    cargarCreditos();
  };

  const getEstadoBadge = (cliente: ClienteDesembolso) => {
    const estado = getEstadoDatosBancarios(cliente);
    switch (estado) {
      case 'COMPLETO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completo
          </span>
        );
      case 'INCOMPLETO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Incompleto
          </span>
        );
      case 'FALTA':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Falta
          </span>
        );
      default:
        return null;
    }
  };

  // Componente para renderizar como cards - LAYOUT VERTICAL MEJORADO
  const CreditoCard = ({ credito }: { credito: ClienteDesembolso }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      {/* Header de la card */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              {credito.DATOS_SOCIO.RAZON}
            </h3>
            <p className="text-sm text-gray-500">
              DNI: {credito.DATOS_SOCIO.DNI_SOCIO}
              {credito.DATOS_RESPONSABLE?.AGENCIA && (
                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  Agencia: {credito.DATOS_RESPONSABLE.AGENCIA}
                </span>
              )}
            </p>
          </div>
          {getEstadoBadge(credito)}
        </div>
      </div>

      {/* Contenido de la card - LAYOUT VERTICAL */}
      <div className="px-6 py-4">
        <div className="space-y-6">
          {/* Información del Crédito */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
              Información del Crédito
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {credito.DATOS_DESEMBOLSO === null ? (
                <div className="text-center py-4">
                  <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
                    <svg className="w-8 h-8 text-orange-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-orange-700 font-semibold text-sm">Validado fuera de tiempo</p>
                    <p className="text-orange-600 text-xs mt-1">Los datos de desembolso no están disponibles</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pagaré:</span>
                    <span className="text-sm font-normal text-gray-900">
                      {credito.DATOS_DESEMBOLSO.PAGARE}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Producto:</span>
                    <span className="text-sm font-normal text-gray-900">
                      {credito.DATOS_DESEMBOLSO.NOM_PROD}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monto Aprobado:</span>
                    <span className="text-sm font-normal text-gray-600">
                      S/ {formatearMonto(credito.DATOS_DESEMBOLSO.MONTO_APROB)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monto a Desembolsar:</span>
                    <span className="text-sm font-bold text-green-600">
                     S/ {credito.DATOS_DESEMBOLSO.MONTO_NETO}
                    </span>
                  </div>
                </>
              )}
              {credito.DATOS_RESPONSABLE && (
                <>
                  {credito.DATOS_RESPONSABLE.ANALISTA && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Analista:</span>
                      <span className="text-sm font-normal text-gray-900">
                        {credito.DATOS_RESPONSABLE.ANALISTA}
                      </span>
                    </div>
                  )}
                  {(credito.DATOS_RESPONSABLE as any).CELULAR && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tel. Analista:</span>
                      <span className="text-sm font-normal text-blue-600">
                        {(credito.DATOS_RESPONSABLE as any).CELULAR}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Datos de Firma Digital - NUEVA SECCIÓN */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estado de Firma Digital
            </h4>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              {!credito.DATOS_FIRMA?.FIRMANTE ? (
                <div className="text-center py-2">
                  <svg className="w-6 h-6 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-orange-600 font-medium">Sin firma digital</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Firmante:</span>
                      <p className="text-sm font-semibold text-blue-800">
                        {credito.DATOS_FIRMA.FIRMANTE}
                      </p>
                    </div>
                    <div>
                        <span className="text-xs text-blue-600 font-medium">Estado:</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          credito.DATOS_FIRMA.STATUS === 'signed'
                            ? 'bg-green-100 text-green-800'
                            : credito.DATOS_FIRMA.STATUS === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {credito.DATOS_FIRMA.STATUS === 'signed'
                            ? 'FIRMADO'
                            : credito.DATOS_FIRMA.STATUS === 'pending'
                            ? 'PENDIENTE'
                            : 'SIN GENERAR'}
                        </span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Email:</span>
                      <p className="text-sm font-medium text-blue-700">
                        {credito.DATOS_FIRMA.EMAIL}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">numero cel. socio:</span>
                      <p className="text-sm font-medium text-blue-700">
                        {credito.DATOS_FIRMA.CELULAR}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 border-t border-blue-200 pt-3">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Fecha Creación:</span>
                      <p className="text-xs text-blue-700">
                        {credito.DATOS_FIRMA.FECHA_CREA} {credito.DATOS_FIRMA.HORA_CREA}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Fecha Validación:</span>
                      <p className="text-xs text-blue-700">
                        {credito.DATOS_FIRMA.FECHA_VALIDA ?
                          `${credito.DATOS_FIRMA.FECHA_VALIDA} ${credito.DATOS_FIRMA.HORA_VALIDA}` :
                          'Pendiente'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Datos Bancarios - AHORA DEBAJO DE LA INFORMACIÓN DE FIRMA */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
              Datos Bancarios
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {!credito.DATOS_BANCO.BANCO ? (
                <div className="text-center py-4">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm text-gray-500 italic">Sin datos bancarios</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Titular:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {credito.DATOS_BANCO.TITULAR || 'Sin titular'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Banco:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {credito.DATOS_BANCO.BANCO}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tipo de Cuenta:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {credito.DATOS_BANCO.TIPO_CUENTA}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Número de Cuenta:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {credito.DATOS_BANCO.NUM_CUENTA || 'Sin número'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Número de Cuenta CCI:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {credito.DATOS_BANCO.CCI || 'Sin número'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          {credito.DATOS_DESEMBOLSO === null ? (
            <button
              disabled
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              No disponible
            </button>
          ) : (
            <button
              onClick={() => abrirModal(credito)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Subir Comprobante
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Componente para renderizar como tabla
  const CreditoTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Crédito
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Firma Digital
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datos Bancarios
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {creditos.map((credito, index) => (
            <tr key={`${credito.DATOS_SOCIO.DNI_SOCIO}-${credito.DATOS_DESEMBOLSO?.PAGARE || index}`} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {credito.DATOS_SOCIO.RAZON}
                    </div>
                    <div className="text-sm text-gray-500">
                      DNI: {credito.DATOS_SOCIO.DNI_SOCIO}
                      {credito.DATOS_RESPONSABLE?.AGENCIA && (
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Agencia: {credito.DATOS_RESPONSABLE.AGENCIA}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {credito.DATOS_DESEMBOLSO === null ? (
                  <div className="text-center py-2">
                    <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
                      <p className="text-orange-700 font-semibold text-sm">Validado fuera de tiempo</p>
                      <p className="text-orange-600 text-xs mt-1">Datos no disponibles</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 mb-1">
                      {credito.DATOS_DESEMBOLSO.PAGARE}
                    </div>
                    <div className="text-gray-600 mb-1">
                      {credito.DATOS_DESEMBOLSO.NOM_PROD}
                    </div>
                    <div className="font-semibold text-green-600">
                      S/ {formatearMonto(credito.DATOS_DESEMBOLSO.MONTO_APROB)}
                    </div>
                    {credito.DATOS_RESPONSABLE?.ANALISTA && (
                      <div className="text-gray-500 text-xs">
                        Analista: {credito.DATOS_RESPONSABLE.ANALISTA}
                        {(credito.DATOS_RESPONSABLE as any).CELULAR && (
                          <span className="ml-2 text-blue-600">
                            Tel: {(credito.DATOS_RESPONSABLE as any).CELULAR}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {!credito.DATOS_FIRMA?.FIRMANTE ? (
                  <div className="text-sm text-orange-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sin firma
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        credito.DATOS_FIRMA.STATUS === 'signed'
                          ? 'bg-green-400'
                          : credito.DATOS_FIRMA.STATUS === 'pending'
                          ? 'bg-yellow-400'
                          : 'bg-gray-400'
                      }`}></span>
                      <span className="font-medium text-gray-800">
                        {credito.DATOS_FIRMA.FIRMANTE}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      {credito.DATOS_FIRMA.EMAIL}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {credito.DATOS_FIRMA.STATUS === 'signed'
                        ? 'FIRMADO'
                        : credito.DATOS_FIRMA.STATUS === 'pending'
                        ? 'PENDIENTE'
                        : 'SIN GENERAR'} - {credito.DATOS_FIRMA.FECHA_CREA}
                    </div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {!credito.DATOS_BANCO.BANCO ? (
                  <div className="text-sm text-gray-500 italic">Sin datos bancarios</div>
                ) : (
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">
                      {credito.DATOS_BANCO.TITULAR || 'Sin titular'}
                    </div>
                    <div className="text-gray-600">
                      {credito.DATOS_BANCO.BANCO} - {credito.DATOS_BANCO.TIPO_CUENTA}
                    </div>
                    <div className="text-gray-500">
                      {credito.DATOS_BANCO.NUM_CUENTA || 'Sin número'}
                    </div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {getEstadoBadge(credito)}
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  {credito.DATOS_DESEMBOLSO === null ? (
                    <span className="text-gray-400 text-sm cursor-not-allowed">
                      No disponible
                    </span>
                  ) : (
                    <button
                      onClick={() => abrirModal(credito)}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    >
                      Subir Comprobante
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Si no tiene acceso, mostrar mensaje de error
  if (!hasAccess()) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-red-500 mb-4">No tienes permisos para acceder a esta sección.</p>
            <p className="text-gray-600 text-sm">
              Este módulo está disponible solo para: Super Usuario, Gerencia, Jefa de Operaciones y Cajera.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="CRÉDITOS PENDIENTES A DESEMBOLSO - PAGOS" showBackButton={true}>
      <div className="h-full flex flex-col space-y-6">
        {/* Header con estadísticas */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6 rounded-lg shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold">CRÉDITOS PENDIENTES A DESEMBOLSO - PAGOS</h2>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Toggle View Mode */}
              <div className="flex items-center justify-center space-x-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 sm:flex-none p-2 sm:p-2 rounded-md transition-colors flex items-center justify-center ${
                    viewMode === 'cards' 
                      ? 'bg-white/30 text-white shadow-sm' 
                      : 'bg-transparent text-white/70 hover:bg-white/20'
                  }`}
                  title="Vista de tarjetas"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM19 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2z" />
                  </svg>
                  <span className="ml-1 text-xs sm:hidden">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 sm:flex-none p-2 sm:p-2 rounded-md transition-colors flex items-center justify-center ${
                    viewMode === 'table' 
                      ? 'bg-white/30 text-white shadow-sm' 
                      : 'bg-transparent text-white/70 hover:bg-white/20'
                  }`}
                  title="Vista de tabla"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
                  </svg>
                  <span className="ml-1 text-xs sm:hidden">Tabla</span>
                </button>
              </div>
              
              <button
                onClick={cargarCreditos}
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 min-h-[40px]"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm sm:text-base">{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white/10 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl font-bold">{totalCreditos}</div>
              <div className="text-xs sm:text-sm opacity-90">Total Créditos</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl font-bold text-green-200">{creditosConDatosBancarios}</div>
              <div className="text-xs sm:text-sm opacity-90">Con Datos Bancarios</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl font-bold text-red-200">{creditosSinDatosBancarios}</div>
              <div className="text-xs sm:text-sm opacity-90">Sin Datos Bancarios</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl font-bold">S/ {formatearMonto(montoTotal.toString())}</div>
              <div className="text-xs sm:text-sm opacity-90">Monto Total</div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Cargando créditos pendientes...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-medium text-red-600 mb-2">Error al cargar datos</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={cargarCreditos}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && creditos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No hay créditos pendientes</h3>
              <p className="text-gray-500">No se encontraron créditos pendientes a desembolsar para el día de hoy.</p>
            </div>
          )}

          {/* Contenido - Cards o Table */}
          {!isLoading && !error && creditos.length > 0 && (
            <>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {creditos.map((credito, index) => (
                    <CreditoCard
                      key={`${credito.DATOS_SOCIO.DNI_SOCIO}-${credito.DATOS_DESEMBOLSO?.PAGARE || index}`}
                      credito={credito}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <CreditoTable />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal para subir comprobante */}
      {showModal && selectedCredito && (
        <SubirComprobanteDesembolsoModal
          credito={selectedCredito}
          onClose={cerrarModal}
          onSuccess={handleUploadSuccess}
        />
      )}
    </Layout>
  );
};

export default PendientesAdesembolsar;