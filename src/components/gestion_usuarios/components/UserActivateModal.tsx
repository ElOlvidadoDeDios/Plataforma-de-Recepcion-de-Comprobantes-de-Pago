import React from 'react';
import ReactDOM from 'react-dom';
import { User } from '../../../types';
import { updateUserStatus } from '../../../api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UserActivateModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

const UserActivateModal: React.FC<UserActivateModalProps> = ({
  isOpen,
  user,
  onClose
}) => {
  const queryClient = useQueryClient();

  const handleActivateUser = async () => {
    if (!user) return;
    
    try {
      await updateUserStatus(user._id, 1);
      toast.success('Usuario activado correctamente');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al activar el usuario');
    }
  };

  if (!isOpen || !user) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activar Usuario</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que deseas activar al usuario <span className="font-medium">{user.email}</span>? 
          Esto permitirá asignar roles y gestionar agencias.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleActivateUser}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Activar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserActivateModal;