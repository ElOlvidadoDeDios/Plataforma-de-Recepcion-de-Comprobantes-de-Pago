import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { UserRole } from '../../../types/roles';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UserCreateSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
}

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const UserCreateSimpleModal: React.FC<UserCreateSimpleModalProps> = ({
  isOpen,
  onClose,
  canCreateUsers,
  isSuperAdmin
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    lastName: '',
    dni: '',
    role: UserRole.BASIC_USER,
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !canCreateUsers) return null;

  const getAvailableRoles = (): UserRole[] => {
    const baseRoles = [
      UserRole.BASIC_USER,
      UserRole.CREDIT_USER,
      UserRole.PAYMENTS_USER,
      UserRole.ADMIN
    ];
    
    // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
    if (isSuperAdmin) {
      return [UserRole.SUPER_ADMIN, ...baseRoles];
    }
    
    return baseRoles;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validaciones
    if (!formData.email || !formData.name || !formData.lastName || !formData.dni || !formData.password) {
      toast.error('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      setIsLoading(false);
      return;
    }

    try {
      // Llamar a la API para crear usuario directamente
      const response = await fetch(`${API_BASE_URL}/create-user-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          lastName: formData.lastName,
          dni: formData.dni,
          password: formData.password,
          role: formData.role,
          isTemporaryPassword: true // Marcar como contraseña temporal
        }),
      });

      if (response.ok) {
        toast.success(`Usuario ${formData.email} creado exitosamente. La contraseña es temporal y debe cambiarse en el primer login.`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        handleClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al crear el usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      email: '',
      name: '',
      lastName: '',
      dni: '',
      role: UserRole.BASIC_USER,
      password: '',
      confirmPassword: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Crear Nuevo Usuario
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

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI *
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                required
                maxLength={8}
                pattern="[0-9]{8}"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                required
              >
                {getAvailableRoles().map(role => (
                  <option key={role} value={role}>
                    {role === UserRole.SUPER_ADMIN ? '🔥 Super Admin' :
                     role === UserRole.ADMIN ? 'Admin' :
                     role === UserRole.PAYMENTS_USER ? 'Usuario de Pagos' :
                     role === UserRole.CREDIT_USER ? 'Usuario de Créditos' :
                     'Usuario Básico'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña Temporal *
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Generar Automática
              </button>
            </div>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Confirme la contraseña"
              minLength={6}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600">
              <strong>Importante:</strong> Esta será una contraseña temporal. El usuario deberá cambiarla en su primer inicio de sesión.
            </p>
          </div>

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
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default UserCreateSimpleModal;