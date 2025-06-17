import React, { useState } from 'react';
import { UserRole } from '../../../types/roles';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
}

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  canCreateUsers,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: datos básicos, 2: verificación, 3: completar registro
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    lastName: '',
    dni: '',
    role: UserRole.BASIC_USER,
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  if (!isOpen || !canCreateUsers) return null;

//   const getAvailableRoles = (): UserRole[] => {
//     const baseRoles = [
//       UserRole.BASIC_USER,
//       UserRole.CREDIT_USER,
//       UserRole.PAYMENTS_USER,
//       UserRole.ADMIN
//     ];
    
//     // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
//     if (isSuperAdmin) {
//       return [UserRole.SUPER_ADMIN, ...baseRoles];
//     }
    
//     return baseRoles;
//   };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.name || !formData.lastName || !formData.dni) {
      toast.error('Todos los campos básicos son obligatorios');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Código de verificación enviado al correo del nuevo usuario');
        setStep(2);
      } else {
        toast.error(data.message || 'Error al enviar el código de verificación');
        if (data.message === 'El usuario ya está verificado.') {
          toast.error('Este correo ya está registrado en el sistema');
        }
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email, 
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Código verificado. Complete los datos del usuario');
        setToken(data.token);
        setStep(3);
      } else {
        toast.error(data.message || 'Código de verificación inválido');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

    try {
      const response = await fetch(`${API_BASE_URL}/complete-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          name: formData.name,
          lastName: formData.lastName,
          dni: formData.dni,
          password: formData.password
        }),
      });

      if (response.ok) {
        toast.success(`Usuario ${formData.email} creado exitosamente`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        handleClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al completar el registro');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setFormData({
      email: '',
      name: '',
      lastName: '',
      dni: '',
      role: UserRole.BASIC_USER,
      password: '',
      confirmPassword: ''
    });
    setVerificationCode('');
    setToken('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Crear Nuevo Usuario - Paso {step} de 3
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

        {step === 1 && (
          <form onSubmit={handleRegisterEmail} className="space-y-4">
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
              />
            </div>
            <div className="flex justify-end gap-3">
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
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Se ha enviado un código de verificación a <strong>{formData.email}</strong>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de verificación
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Código de 6 dígitos"
                maxLength={6}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña inicial
              </label>
              <input
                type="password"
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
                Confirmar contraseña
              </label>
              <input
                type="password"
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
                El usuario podrá cambiar su contraseña desde el panel de gestión una vez que inicie sesión.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Volver
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
        )}
      </div>
    </div>
  );
};

export default UserCreateModal;