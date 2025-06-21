import React from 'react';
import { AGENCIAS, AgenciaCaja } from '../../../types';
import { UserWithRole } from '../../../types/roles';

interface AgencyFilterProps {
  filtroAgencia: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia';
  setFiltroAgencia: (value: 'mis_pagos' | 'mis_agencias' | 'agencia_especifica' | 'todas' | 'por_usuario' | 'usuario_y_agencia') => void;
  agenciaEspecifica: string;
  setAgenciaEspecifica: (value: string) => void;
  user: UserWithRole | null;
  esAdmin: boolean;
  esSuperAdmin: boolean;
  esUserPayment: boolean;
}

const AgencyFilter: React.FC<AgencyFilterProps> = ({
  filtroAgencia,
  setFiltroAgencia,
  agenciaEspecifica,
  setAgenciaEspecifica,
  user,
  esAdmin,
  esSuperAdmin,
  esUserPayment
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">🏢 Filtrar por agencia:</label>
      <div className="space-y-2">
        {/* Mis pagos - Disponible para todos */}
        <label className="flex items-center">
          <input
            type="radio"
            name="agencia"
            value="mis_pagos"
            checked={filtroAgencia === 'mis_pagos'}
            onChange={(e) => setFiltroAgencia(e.target.value as 'mis_pagos')}
            className="mr-2"
          />
          👤 Solo mis pagos procesados
        </label>

        {/* Mis agencias - Solo si tiene agencias asignadas */}
        {user?.agencias && user.agencias.length > 0 && (
          <label className="flex items-center">
            <input
              type="radio"
              name="agencia"
              value="mis_agencias"
              checked={filtroAgencia === 'mis_agencias'}
              onChange={(e) => setFiltroAgencia(e.target.value as 'mis_agencias')}
              className="mr-2"
            />
            🏠 Pagos en mis agencias ({user.agencias.length} asignadas)
          </label>
        )}

        {/* Agencia específica - Solo si tiene múltiples agencias O es admin */}
        {((user?.agencias && user.agencias.length > 1) || esAdmin || esSuperAdmin) && (
          <label className="flex items-center">
            <input
              type="radio"
              name="agencia"
              value="agencia_especifica"
              checked={filtroAgencia === 'agencia_especifica'}
              onChange={(e) => setFiltroAgencia(e.target.value as 'agencia_especifica')}
              className="mr-2"
            />
            🎯 Agencia específica
            {esUserPayment && <span className="text-xs text-gray-500 ml-1">(solo tus pagos)</span>}
          </label>
        )}

        {/* Por usuario específico - Solo Admin/Super Admin */}
        {(esAdmin || esSuperAdmin) && (
          <label className="flex items-center">
            <input
              type="radio"
              name="agencia"
              value="por_usuario"
              checked={filtroAgencia === 'por_usuario'}
              onChange={(e) => setFiltroAgencia(e.target.value as 'por_usuario')}
              className="mr-2"
            />
            👥 Por usuario específico (todas sus agencias)
          </label>
        )}

        {/* 🆕 Por usuario y agencia específica - Solo Admin/Super Admin */}
        {(esAdmin || esSuperAdmin) && (
          <label className="flex items-center">
            <input
              type="radio"
              name="agencia"
              value="usuario_y_agencia"
              checked={filtroAgencia === 'usuario_y_agencia'}
              onChange={(e) => setFiltroAgencia(e.target.value as 'usuario_y_agencia')}
              className="mr-2"
            />
            👥🏢 Por usuario y agencia específica
          </label>
        )}

        {/* Todas las agencias - Solo Admin/Super Admin */}
        {(esAdmin || esSuperAdmin) && (
          <label className="flex items-center">
            <input
              type="radio"
              name="agencia"
              value="todas"
              checked={filtroAgencia === 'todas'}
              onChange={(e) => setFiltroAgencia(e.target.value as 'todas')}
              className="mr-2"
            />
            🌐 Todas las agencias (métricas globales)
          </label>
        )}
      </div>
      
      {/* Lista desplegable de agencias para admin/super admin */}
      {filtroAgencia === 'agencia_especifica' && (
        <div className="mt-2">
          <select
            value={agenciaEspecifica}
            onChange={(e) => setAgenciaEspecifica(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="">🏢 Seleccionar agencia...</option>
            {(esAdmin || esSuperAdmin) ?
              // Admin/Super Admin ven todas las agencias disponibles
              Object.entries(AGENCIAS).map(([nombre, codigo]) => (
                <option key={codigo} value={codigo}>
                  {nombre} ({codigo})
                </option>
              ))
              :
              // Usuario normal solo ve sus agencias asignadas
              user?.agencias?.map((ag: AgenciaCaja) => (
                <option key={ag.agencia} value={ag.agencia}>
                  {Object.entries(AGENCIAS).find(([_, code]) => code === ag.agencia)?.[0] || ag.agencia} ({ag.agencia})
                </option>
              ))
            }
          </select>
          {(esAdmin || esSuperAdmin) && (
            <p className="text-xs text-blue-600 mt-1">
              ✅ Como admin, puedes seleccionar cualquier agencia disponible
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgencyFilter;