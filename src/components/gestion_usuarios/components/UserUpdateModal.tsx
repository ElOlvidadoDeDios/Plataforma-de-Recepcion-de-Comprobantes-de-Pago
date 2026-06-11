import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { User } from '../../../types';
import { updateUserComplete, fetchUserById } from '../../../api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UserUpdateModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

const UserUpdateModal: React.FC<UserUpdateModalProps> = ({
  isOpen,
  user,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    razon: '',
    dni: '',
    cargo: '',
    user: '',
    id_ana: '',
    id_age: '',
  });

  // Cargar datos completos del usuario cuando se abre el modal
  useEffect(() => {
    const loadUserData = async () => {
      if (user && isOpen) {
        setFetching(true);
        try {
          const fullUserData = await fetchUserById(user._id);
          setFormData({
            email: fullUserData.email || '',
            razon: fullUserData.razon || '',
            dni: fullUserData.dni || '',
            cargo: fullUserData.cargo || '',
            user: fullUserData.user || '',
            id_ana: fullUserData.id_ana || '',
            id_age: fullUserData.id_age || '',
          });
        } catch (error: any) {
          toast.error('Error al cargar los datos del usuario');
          // Fallback a los datos mínimos
          setFormData({
            email: user.email || '',
            razon: user.razon || '',
            dni: user.dni || '',
            cargo: user.cargo || '',
            user: user.user || '',
            id_ana: user.id_ana || '',
            id_age: user.id_age || '',
          });
        } finally {
          setFetching(false);
        }
      }
    };

    loadUserData();
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validaciones solo para campos editables
    if (!formData.email.trim()) {
      toast.error('El email es requerido');
      return;
    }

    if (formData.cargo && formData.cargo.trim().length < 2) {
      toast.error('El cargo debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Email SÍ se envía ahora. razon y dni NO (son campos protegidos)
      await updateUserComplete(user._id, {
        email: formData.email.trim(),
        cargo: formData.cargo.trim(),
        user: formData.user.trim(),
        id_ana: formData.id_ana.trim(),
        id_age: formData.id_age.trim(),
      });

      toast.success('Usuario actualizado correctamente');
      onClose();
      
      // Refrescar la lista de usuarios
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Actualizar Usuario</h3>
          <button
            onClick={onClose}
            disabled={loading || fetching}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        {fetching ? (
          <div className="p-6 flex justify-center items-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            {/* Razón Social */}
            <div>
              <label htmlFor="razon" className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social / Nombre <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(no editable)</span>
              </label>
              <input
                type="text"
                id="razon"
                name="razon"
                value={formData.razon}
                onChange={handleChange}
                disabled={true}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="Nombre de la empresa o persona"
              />
              <p className="text-xs text-gray-500 mt-1">🔒 Este campo no puede ser modificado por seguridad</p>
            </div>

            {/* DNI */}
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                DNI / Documento <span className="text-xs text-gray-500">(no editable)</span>
              </label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="Número de documento"
              />
              <p className="text-xs text-gray-500 mt-1">🔒 Este campo no puede ser modificado por seguridad</p>
            </div>

            {/* Cargo */}
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo / Puesto
              </label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Ej: Gerente, Cajero, etc."
              />
            </div>

            {/* Usuario / Código */}
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario / Código de Usuario
              </label>
              <input
                type="text"
                id="user"
                name="user"
                value={formData.user}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Código de usuario POS"
              />
            </div>

            {/* ID Analista */}
            <div>
              <label htmlFor="id_ana" className="block text-sm font-medium text-gray-700 mb-1">
                ID Analista
              </label>
              <input
                type="text"
                id="id_ana"
                name="id_ana"
                value={formData.id_ana}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="ID del analista"
              />
            </div>

            {/* ID Agencia */}
            <div>
              <label htmlFor="id_age" className="block text-sm font-medium text-gray-700 mb-1">
                ID Agencia
              </label>
              <input
                type="text"
                id="id_age"
                name="id_age"
                value={formData.id_age}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="ID de la agencia"
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">ℹ️ Nota:</span> Para cambiar contraseña, rol, estado o permisos, usa las opciones específicas en la tabla.
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading && <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default UserUpdateModal;
