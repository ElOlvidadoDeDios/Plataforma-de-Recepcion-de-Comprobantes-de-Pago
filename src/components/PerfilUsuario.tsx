import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { SessionManager } from '../utils/sessionManager';
import Layout from './Layout';

interface PerfilData {
  TLF_CELULAR: string;
  TLF_CELULAR2: string;
  EMAIL: string;
  razon?: string;
  cargo?: string;
}

interface NumeroCelular {
  id: string;
  numero_celular: string;
  tipo: 'principal' | 'secundario';
  fecha_creacion: string;
  fecha_actualizacion: string;
}

const PerfilUsuario: React.FC = () => {
  const { user } = useAuth();
  const Notification = useNotifications();
  
  // Obtener la URL base del env
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  
  const [perfilData, setPerfilData] = useState<PerfilData>({
    TLF_CELULAR: '',
    TLF_CELULAR2: '',
    EMAIL: user?.email || ''
  });
  
  const [numerosCelular, setNumerosCelular] = useState<NumeroCelular[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingNumeros, setLoadingNumeros] = useState(false);

  // Función para cargar números de celular del usuario
  const cargarNumerosCelular = async () => {
    if (!user?.dni) return;
    
    setLoadingNumeros(true);
    try {
      const response = await fetch(`${API_BASE_URL}/numeros-celular/mis-numeros`, {
        headers: {
          'Authorization': `Bearer ${SessionManager.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setNumerosCelular(data.data);
        
        // Actualizar el estado del perfil con los números existentes
        const principal = data.data.find((num: NumeroCelular) => num.tipo === 'principal');
        const secundario = data.data.find((num: NumeroCelular) => num.tipo === 'secundario');
        
        setPerfilData(prev => ({
          ...prev,
          TLF_CELULAR: principal?.numero_celular || '',
          TLF_CELULAR2: secundario?.numero_celular || ''
        }));
      }
    } catch (error) {
      console.error('Error al cargar números de celular:', error);
      Notification.error('Error al cargar los números de celular');
    } finally {
      setLoadingNumeros(false);
    }
  };

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    if (user) {
      setPerfilData({
        TLF_CELULAR: '',
        TLF_CELULAR2: '',
        EMAIL: user.email || '',
        razon: user.razon || '',
        cargo: user.cargo || ''
      });
      
      // Cargar números de celular existentes
      cargarNumerosCelular();
    }
  }, [user]);

  const handleInputChange = (field: keyof PerfilData, value: string) => {
    setPerfilData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Validar que sea un número de 9 dígitos que empiece con 9
    const phoneRegex = /^9\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    // Validaciones
    if (!perfilData.TLF_CELULAR) {
      Notification.error('El número de celular principal es obligatorio');
      return;
    }

    if (!validatePhoneNumber(perfilData.TLF_CELULAR)) {
      Notification.error('El número de celular principal debe tener 9 dígitos y empezar con 9');
      return;
    }

    if (perfilData.TLF_CELULAR2 && !validatePhoneNumber(perfilData.TLF_CELULAR2)) {
      Notification.error('El número de celular secundario debe tener 9 dígitos y empezar con 9');
      return;
    }

    setSaving(true);
    
    try {
      // Guardar/actualizar número principal
      const responsePrincipal = await fetch(`${API_BASE_URL}/numeros-celular/actualizar-mi-numero`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
        body: JSON.stringify({
          numero_celular: perfilData.TLF_CELULAR,
          tipo: 'principal'
        })
      });

      const dataPrincipal = await responsePrincipal.json();
      if (!dataPrincipal.success) {
        throw new Error(dataPrincipal.message || 'Error al actualizar número principal');
      }

      // Guardar/actualizar número secundario si existe
      if (perfilData.TLF_CELULAR2) {
        const responseSecundario = await fetch('/api/numeros-celular/actualizar-mi-numero', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            numero_celular: perfilData.TLF_CELULAR2,
            tipo: 'secundario'
          })
        });

        const dataSecundario = await responseSecundario.json();
        if (!dataSecundario.success) {
          throw new Error(dataSecundario.message || 'Error al actualizar número secundario');
        }
      }

      Notification.success('Números de celular actualizados correctamente');
      
      // Recargar los números para mostrar los datos actualizados
      await cargarNumerosCelular();
      
    } catch (error) {
      console.error('Error al actualizar números:', error);
      Notification.error((error as Error).message || 'Error al actualizar los números de celular.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      // Restaurar con los números existentes en la base de datos
      const principal = numerosCelular.find(num => num.tipo === 'principal');
      const secundario = numerosCelular.find(num => num.tipo === 'secundario');
      
      setPerfilData({
        TLF_CELULAR: principal?.numero_celular || '',
        TLF_CELULAR2: secundario?.numero_celular || '',
        EMAIL: user.email || '',
        razon: user.razon || '',
        cargo: user.cargo || ''
      });
      Notification.info('Datos restaurados a los valores originales');
    }
  };

  return (
    <Layout title="Mi Perfil">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            {/* Información del usuario */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Información de la cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Usuario:</span>
                  <p className="text-gray-800">{user?.user || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Nombre:</span>
                  <p className="text-gray-800">{user?.razon || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">DNI:</span>
                  <p className="text-gray-800">{user?.dni || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Rol:</span>
                  <p className="text-gray-800">{user?.role || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Formulario editable */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Datos de contacto
              </h3>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={perfilData.EMAIL}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  placeholder="correo@ejemplo.com"
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no puede ser modificado desde el perfil de usuario
                </p>
              </div>

              {/* Números de Celular Registrados */}
              {loadingNumeros ? (
                <div className="col-span-2">
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Cargando números de celular...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Celular Principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Celular Principal *
                    </label>
                    <input
                      type="tel"
                      value={perfilData.TLF_CELULAR}
                      onChange={(e) => handleInputChange('TLF_CELULAR', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="987654321"
                      maxLength={9}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Debe tener 9 dígitos y empezar con 9
                    </p>
                    {numerosCelular.find(num => num.tipo === 'principal') && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Registrado: {new Date(numerosCelular.find(num => num.tipo === 'principal')?.fecha_actualizacion || '').toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Celular Secundario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Celular Secundario (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={perfilData.TLF_CELULAR2}
                      onChange={(e) => handleInputChange('TLF_CELULAR2', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="987654321"
                      maxLength={9}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Debe tener 9 dígitos y empezar con 9
                    </p>
                    {numerosCelular.find(num => num.tipo === 'secundario') && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Registrado: {new Date(numerosCelular.find(num => num.tipo === 'secundario')?.fecha_actualizacion || '').toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PerfilUsuario;