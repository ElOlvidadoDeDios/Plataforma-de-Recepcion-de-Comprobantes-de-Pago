import React from 'react';
import { AGENCIAS, UserResponse, AgenciaCaja } from '../../../types';

interface UserFilterProps {
  filtroAgencia: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia';
  usuariosDisponibles: UserResponse[];
  cargandoUsuarios: boolean;
  usuarioSeleccionado: string;
  setUsuarioSeleccionado: (value: string) => void;
  setFiltroUsuario: (value: string) => void;
  agenciasUsuarioSeleccionado: AgenciaCaja[];
  setAgenciasUsuarioSeleccionado: (agencias: AgenciaCaja[]) => void;
  agenciaUsuarioEspecifica: string;
  setAgenciaUsuarioEspecifica: (value: string) => void;
  esAdmin: boolean;
  esSuperAdmin: boolean;
}

const UserFilter: React.FC<UserFilterProps> = ({
  filtroAgencia,
  usuariosDisponibles,
  cargandoUsuarios,
  usuarioSeleccionado,
  setUsuarioSeleccionado,
  setFiltroUsuario,
  agenciasUsuarioSeleccionado,
  setAgenciasUsuarioSeleccionado,
  agenciaUsuarioEspecifica,
  setAgenciaUsuarioEspecifica,
  esAdmin,
  esSuperAdmin
}) => {
  if (!((filtroAgencia === 'por_usuario' || filtroAgencia === 'usuario_y_agencia') && (esAdmin || esSuperAdmin))) {
    return null;
  }

  return (
    <div className="mt-2">
      {cargandoUsuarios ? (
        <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          Cargando usuarios que pueden hacer pagos...
        </div>
      ) : (
        <>
          <select
            value={usuarioSeleccionado}
            onChange={(e) => {
              const selectedDni = e.target.value;
              setUsuarioSeleccionado(selectedDni);
              setFiltroUsuario(selectedDni);
              
              // Obtener agencias del usuario seleccionado
              const selectedUser = usuariosDisponibles.find(u => u.dni === selectedDni);
              setAgenciasUsuarioSeleccionado(selectedUser?.agencias || []);
              setAgenciaUsuarioEspecifica(''); // Reset agencia seleccionada
            }}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="">👥 Seleccionar usuario...</option>
            {usuariosDisponibles
              .filter(usuario => usuario.dni && usuario.dni.trim() !== '')
              .sort((a, b) => (a.razon || '').localeCompare(b.razon || ''))
              .map(usuario => (
                <option key={usuario._id} value={usuario.dni}>
                  {usuario.razon || usuario.email} ({usuario.dni}) 
                  {usuario.agencias && usuario.agencias.length > 0 && ` [${usuario.agencias.length} agencias]`}
                </option>
              ))
            }
          </select>
          {usuariosDisponibles.length === 0 && !cargandoUsuarios && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ No se encontraron usuarios que puedan hacer pagos
            </p>
          )}
        </>
      )}

      {/* Lista desplegable de agencias del usuario seleccionado */}
      {filtroAgencia === 'usuario_y_agencia' && usuarioSeleccionado && agenciasUsuarioSeleccionado.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            🏢 Agencias de {usuariosDisponibles.find(u => u.dni === usuarioSeleccionado)?.razon}:
          </label>
          <select
            value={agenciaUsuarioEspecifica}
            onChange={(e) => setAgenciaUsuarioEspecifica(e.target.value)}
            className="w-full rounded-md border border-blue-300 p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
          >
            <option value="">🏢 Seleccionar agencia del usuario...</option>
            {agenciasUsuarioSeleccionado.map((agencia: AgenciaCaja, index) => {
              const nombreAgencia = Object.entries(AGENCIAS).find(([_, code]) => code === agencia.agencia)?.[0] || agencia.agencia;
              return (
                <option key={index} value={agencia.agencia}>
                  {nombreAgencia} ({agencia.agencia}) - Caja: {agencia.cod_caja}
                </option>
              );
            })}
          </select>
          <p className="text-xs text-blue-700 mt-1">
            📊 Filtra los pagos procesados por este usuario específico en la agencia seleccionada
          </p>
        </div>
      )}

      {filtroAgencia === 'usuario_y_agencia' && usuarioSeleccionado && agenciasUsuarioSeleccionado.length === 0 && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ El usuario seleccionado no tiene agencias asignadas
          </p>
        </div>
      )}
    </div>
  );
};

export default UserFilter;