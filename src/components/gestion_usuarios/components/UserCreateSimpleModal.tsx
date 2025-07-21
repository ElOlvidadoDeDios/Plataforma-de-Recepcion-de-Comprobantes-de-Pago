import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { UserRole } from '../../../types/roles';
import { SessionManager } from '../../../utils/sessionManager';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { fetchUserDataByDni } from '../../../api/userApi';

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
    razon: '',
    cargo: '',
    user: '',
    dni: '',
    role: UserRole.BASIC_USER,
    password: '',
    confirmPassword: '',
    id_ana: '',
    id_age: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  if (!isOpen || !canCreateUsers) return null;

  const getAvailableRoles = (): UserRole[] => {
    const baseRoles = [
      UserRole.BASIC_USER,
      UserRole.ANALISTA_CREDITOS_I,
      UserRole.CAJERO,
      UserRole.ADMINISTRADOR,
      UserRole.GERENTE_GENERAL,
      UserRole.JEFE_OPERACIONES
    ];

    if (isSuperAdmin) {
      return [UserRole.SUPER_ADMIN, ...baseRoles];
    }
    return baseRoles;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validaciones
    if (!formData.email || !formData.razon || !formData.cargo || !formData.user || !formData.dni || !formData.password) {
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

    // Validar que id_ana e id_age estén presentes
    if (!formData.id_ana.trim()) {
      toast.error('El campo ID ANA es obligatorio.');
      setIsLoading(false);
      return;
    }
    if (!formData.id_age.trim()) {
      toast.error('El campo ID AGE es obligatorio.');
      setIsLoading(false);
      return;
    }

    if (formData.dni.length !== 8) {
      toast.error('El DNI debe tener 8 dígitos');
      setIsLoading(false);
      return;
    }

    // Verificar que id_ana e id_age estén presentes
    if (!formData.id_ana) {
      toast.error('ID ANA es requerido. Verifique el DNI.');
      setIsLoading(false);
      return;
    }

    // Preparar datos para envío
    const userData = {
      email: formData.email.trim(),
      razon: formData.razon.trim(),
      cargo: formData.cargo.trim(),
      user: formData.user.trim(),
      dni: formData.dni.trim(),
      password: formData.password,
      role: formData.role,
      isTemporaryPassword: true,
      id_ana: formData.id_ana.trim(),
      id_age: formData.id_age.trim()
    };


    try {
      const response = await fetch(`${API_BASE_URL}/create-user-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(`Usuario ${formData.email} creado exitosamente. La contraseña es temporal y debe cambiarse en el primer login.`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        handleClose();
      } else {
        toast.error(responseData.message || 'Error al crear el usuario');
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
      razon: '',
      cargo: '',
      user: '',
      dni: '',
      role: UserRole.BASIC_USER,
      password: '',
      confirmPassword: '',
      id_ana: '',
      id_age: ''
    });
  };

  const handleInputChange = async (field: string, value: string) => {
    // Actualizar el campo inmediatamente
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si es DNI y tiene 8 dígitos, buscar datos del usuario
    if (field === 'dni' && value.length === 8 && /^\d{8}$/.test(value)) {
      setIsLoadingUserData(true);
      try {
        const userData = await fetchUserDataByDni(value);
        
        if (userData) {
          setFormData(prev => ({
            ...prev,
            razon: userData.RAZON || '',
            cargo: userData.CARGO || '',
            id_ana: userData.ID_ANA || '',
            id_age: userData.ID_AGE || '',
            user: userData.USER || ''
          }));
          toast.success('Datos del usuario cargados correctamente');
        } else {
          toast.error('No se encontraron datos para este DNI');
          // Limpiar campos si no hay datos
          setFormData(prev => ({
            ...prev,
            razon: '',
            cargo: '',
            id_ana: '',
            id_age: '',
            user: ''
          }));
        }
      } catch (error) {
        toast.error('Error al buscar datos del usuario');
        // Limpiar campos en caso de error
        setFormData(prev => ({
          ...prev,
          razon: '',
          cargo: '',
          id_ana: '',
          id_age: '',
          user: ''
        }));
      } finally {
        setIsLoadingUserData(false);
      }
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
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
              DNI * {isLoadingUserData && <span className="text-blue-500">(Cargando datos...)</span>}
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
              Razón Social *
            </label>
            <input
              type="text"
              value={formData.razon}
              onChange={(e) => handleInputChange('razon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50"
              required
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo *
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50"
                required
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario *
              </label>
              <input
                type="text"
                value={formData.user}
                onChange={(e) => handleInputChange('user', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50"
                required
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID ANA *
              </label>
              <input
                type="text"
                value={formData.id_ana}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID AGENCIA
              </label>
              <input
                type="text"
                value={formData.id_age}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-gray-50"
                readOnly
              />
            </div>
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
                   role === UserRole.ADMINISTRADOR ? 'Administrador' :
                   role === UserRole.CAJERO ? 'Cajero' :
                   role === UserRole.ANALISTA_CREDITOS_I ? 'Analista de Créditos I' :
                   role === UserRole.GERENTE_GENERAL ? 'Gerente General' :
                   role === UserRole.JEFE_OPERACIONES ? 'Jefe de Operaciones' :
                   role === UserRole.BASIC_USER ? 'Usuario Básico' :
                   ''}
                </option>
              ))}
            </select>
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

          {/* Debug info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>ID ANA: {formData.id_ana || 'No definido'}</p>
            <p>ID AGE: {formData.id_age || 'No definido'}</p>
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
              disabled={isLoading || isLoadingUserData}
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