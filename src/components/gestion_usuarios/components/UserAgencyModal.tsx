import React from 'react';
import ReactDOM from 'react-dom';
import { User, AgenciaCaja, AGENCIAS } from '../../../types';

interface UserAgencyModalProps {
  isOpen: boolean;
  user: User | null;
  currentUser: any;
  userAgencias: AgenciaCaja[];
  onClose: () => void;
  onSave: () => void;
  onAgenciaChange: (index: number, field: keyof AgenciaCaja, value: string) => void;
  onAddAgencia: () => void;
  onRemoveAgencia: (index: number) => void;
}

const UserAgencyModal: React.FC<UserAgencyModalProps> = ({
  isOpen,
  user,
  currentUser,
  userAgencias,
  onClose,
  onSave,
  onAgenciaChange,
  onAddAgencia,
  onRemoveAgencia
}) => {
  if (!isOpen || !user) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-cyan-700">
            {currentUser?.id === user._id ? 'Mis Agencias' : `Gestionar Agencias - ${user.email}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {currentUser?.id === user._id
            ? 'Gestiona tus agencias asignadas. Cada agencia debe tener un código único.'
            : `Asigna agencias al usuario ${user.email}. Solo los usuarios con roles de PAYMENTS_USER, ADMIN o SUPER_ADMIN pueden tener agencias.`
          }
        </p>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium text-gray-900">Agencias Asignadas</h4>
              <p className="text-sm text-gray-500">Cada agencia debe tener un código único.</p>
            </div>
            <button
              onClick={onAddAgencia}
              className="px-3 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Agencia
            </button>
          </div>

          {userAgencias.map((agencia, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 hover:border-cyan-300 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">Agencia {index + 1}</span>
                {userAgencias.length > 1 && (
                  <button
                    onClick={() => onRemoveAgencia(index)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Agencia</label>
                  <select
                    value={agencia.agencia}
                    onChange={(e) => onAgenciaChange(index, 'agencia', e.target.value)}
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="">Selecciona una agencia</option>
                    {Object.entries(AGENCIAS).map(([nombre, codigo]) => (
                      <option key={codigo} value={codigo}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Código de Caja</label>
                  <input
                    type="text"
                    value={agencia.cod_caja}
                    onChange={(e) => onAgenciaChange(index, 'cod_caja', e.target.value)}
                    placeholder="Ej: C001"
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Usuario de Caja</label>
                  <input
                    type="text"
                    value={agencia.user_caja}
                    onChange={(e) => onAgenciaChange(index, 'user_caja', e.target.value)}
                    placeholder="Ej: UCAJA001"
                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserAgencyModal;