import React from 'react';
import { createPortal } from 'react-dom';
import { UserResponse, AgenciaCaja } from '../../../types';
import { UserWithRole } from '../../../types/roles';
import AgencyFilter from './AgencyFilter';
import UserFilter from './UserFilter';
import PaymentTypeFilter from './PaymentTypeFilter';
import DateRangeFilter from './DateRangeFilter';

interface ReportConfigModalProps {
  exportModalOpen: boolean;
  setExportModalOpen: (value: boolean) => void;
  
  // Filtro de agencia
  filtroAgencia: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia';
  setFiltroAgencia: (value: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia') => void;
  agenciaEspecifica: string;
  setAgenciaEspecifica: (value: string) => void;
  
  // Filtro de usuario
  usuariosDisponibles: UserResponse[];
  cargandoUsuarios: boolean;
  usuarioSeleccionado: string;
  setUsuarioSeleccionado: (value: string) => void;
  setFiltroUsuario: (value: string) => void;
  agenciasUsuarioSeleccionado: AgenciaCaja[];
  setAgenciasUsuarioSeleccionado: (agencias: AgenciaCaja[]) => void;
  agenciaUsuarioEspecifica: string;
  setAgenciaUsuarioEspecifica: (value: string) => void;
  
  // Filtro de tipo de pago
  filtroTipoPago: 'todos' | 'pago_normal' | 'pago_liquida';
  setFiltroTipoPago: (value: 'todos' | 'pago_normal' | 'pago_liquida') => void;
  
  // Filtro de fechas
  rangoExporte: 'hoy' | 'rango' | 'todo';
  setRangoExporte: (value: 'hoy' | 'rango' | 'todo') => void;
  fechaInicioExporte: string;
  setFechaInicioExporte: (value: string) => void;
  fechaFinExporte: string;
  setFechaFinExporte: (value: string) => void;
  
  // Acciones
  handleMostrarVista: () => void;
  handleExportExcel: () => void;
  loading: boolean;
  
  // Usuario y permisos
  user: UserWithRole | null;
  esAdmin: boolean;
  esSuperAdmin: boolean;
  esUserPayment: boolean;
}

const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  exportModalOpen,
  setExportModalOpen,
  filtroAgencia,
  setFiltroAgencia,
  agenciaEspecifica,
  setAgenciaEspecifica,
  usuariosDisponibles,
  cargandoUsuarios,
  usuarioSeleccionado,
  setUsuarioSeleccionado,
  setFiltroUsuario,
  agenciasUsuarioSeleccionado,
  setAgenciasUsuarioSeleccionado,
  agenciaUsuarioEspecifica,
  setAgenciaUsuarioEspecifica,
  filtroTipoPago,
  setFiltroTipoPago,
  rangoExporte,
  setRangoExporte,
  fechaInicioExporte,
  setFechaInicioExporte,
  fechaFinExporte,
  setFechaFinExporte,
  handleMostrarVista,
  handleExportExcel,
  loading,
  user,
  esAdmin,
  esSuperAdmin,
  esUserPayment
}) => {
  if (!exportModalOpen) return null;

return createPortal(
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4"
    onClick={() => setExportModalOpen(false)}
  >
    <div
      className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">📊 Configurar Reporte de Pagos</h3>
            <p className="text-sm text-gray-500 mt-1">Personaliza tu reporte antes de exportar</p>
          </div>
          <button
            onClick={() => setExportModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Filtro por agencia */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500 p-2 rounded-lg">
              <span className="text-white text-lg">🏢</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Filtrar por Agencia</h4>
              <p className="text-sm text-gray-600">Selecciona el alcance de tu reporte</p>
            </div>
          </div>
          <AgencyFilter
            filtroAgencia={filtroAgencia}
            setFiltroAgencia={setFiltroAgencia}
            agenciaEspecifica={agenciaEspecifica}
            setAgenciaEspecifica={setAgenciaEspecifica}
            user={user}
            esAdmin={esAdmin}
            esSuperAdmin={esSuperAdmin}
            esUserPayment={esUserPayment}
          />
        </div>

        {/* Filtro por usuario */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-500 p-2 rounded-lg">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Filtrar por Usuario</h4>
              <p className="text-sm text-gray-600">Selecciona un usuario específico</p>
            </div>
          </div>
          <UserFilter
            filtroAgencia={filtroAgencia}
            usuariosDisponibles={usuariosDisponibles}
            cargandoUsuarios={cargandoUsuarios}
            usuarioSeleccionado={usuarioSeleccionado}
            setUsuarioSeleccionado={setUsuarioSeleccionado}
            setFiltroUsuario={setFiltroUsuario}
            agenciasUsuarioSeleccionado={agenciasUsuarioSeleccionado}
            setAgenciasUsuarioSeleccionado={setAgenciasUsuarioSeleccionado}
            agenciaUsuarioEspecifica={agenciaUsuarioEspecifica}
            setAgenciaUsuarioEspecifica={setAgenciaUsuarioEspecifica}
            esAdmin={esAdmin}
            esSuperAdmin={esSuperAdmin}
          />
        </div>

        {/* Filtro por tipo de pago */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <span className="text-white text-lg">💰</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Tipo de Pago</h4>
              <p className="text-sm text-gray-600">Especifica qué tipos de transacciones incluir</p>
            </div>
          </div>
          <PaymentTypeFilter
            filtroTipoPago={filtroTipoPago}
            setFiltroTipoPago={setFiltroTipoPago}
          />
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-sm">📋</span>
              <div className="text-xs text-blue-700">
                <strong>Nota importante:</strong> Este reporte incluye únicamente pagos aplicados exitosamente 
                (Pago Normal y Liquidación). Los rechazos no se incluyen automáticamente.
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por rango de fechas */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Período de Tiempo</h4>
              <p className="text-sm text-gray-600">Define el rango temporal del reporte</p>
            </div>
          </div>
          <DateRangeFilter
            rangoExporte={rangoExporte}
            setRangoExporte={setRangoExporte}
            fechaInicioExporte={fechaInicioExporte}
            setFechaInicioExporte={setFechaInicioExporte}
            fechaFinExporte={fechaFinExporte}
            setFechaFinExporte={setFechaFinExporte}
          />
        </div>
      </div>

      {/* Footer con botones */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleMostrarVista}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Cargando...</span>
              </>
            ) : (
              <>
                <span>👁️</span>
                <span>Ver Vista Previa</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <span>📊</span>
                <span>Exportar Excel</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setExportModalOpen(false)}
            className="sm:w-auto bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
);
};

export default ReportConfigModal;