import React, { useState } from 'react';
import { UserResponse } from '../../../types';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  user: UserResponse | null;
  currentUser: any;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({
  isOpen,
  user,
  currentUser,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const isChangingOwnPassword = currentUser?.email === user.email;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validaciones
    if (!newPassword || !confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      // Llamar al endpoint de cambio directo de contraseña (sin verificación por email)
      const response = await fetch(`${API_BASE_URL}/admin-change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id,
          newPassword,
          isTemporaryPassword: !isChangingOwnPassword // Solo temporal si no es el propio usuario
        }),
      });

      if (response.ok) {
        const message = isChangingOwnPassword 
          ? 'Tu contraseña ha sido actualizada exitosamente'
          : `Contraseña de ${user.email} actualizada exitosamente. Es una contraseña temporal que debe cambiar en su próximo login.`;
        
        toast.success(message);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        handleClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNewPassword('');
    setConfirmPassword('');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isChangingOwnPassword ? 'Cambiar Mi Contraseña' : `Cambiar Contraseña de ${user.email}`}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              {isChangingOwnPassword 
                ? '🔑 Estás cambiando tu propia contraseña'
                : `🔧 Cambio administrativo para ${user.name || user.email}. Esta será una contraseña temporal.`
              }
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Nueva Contraseña *
              </label>
              {!isChangingOwnPassword && (
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Generar Automática
                </button>
              )}
            </div>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type="text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Confirme la nueva contraseña"
              minLength={6}
              required
            />
          </div>

          {!isChangingOwnPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                <strong>⚠️ Importante:</strong> Esta será una contraseña temporal. El usuario deberá cambiarla en su próximo inicio de sesión.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                isChangingOwnPassword 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLoading 
                ? 'Cambiando...' 
                : isChangingOwnPassword 
                  ? 'Cambiar Mi Contraseña' 
                  : 'Asignar Nueva Contraseña'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminChangePasswordModal;