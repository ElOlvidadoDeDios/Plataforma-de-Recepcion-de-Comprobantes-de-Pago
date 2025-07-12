import React, { useState, useEffect } from 'react';
import { DatosBancarios, guardarDatosBancarios, actualizarDatosBancarios } from '../../../api/customerConsultationAPI';

interface DatosBancariosFormProps {
  dni: string;
  datosBancarios: DatosBancarios[];
  onSave: () => void;
  onCancel: () => void;
}

const DatosBancariosForm: React.FC<DatosBancariosFormProps> = ({
  dni,
  datosBancarios,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<DatosBancarios>({
    TITULAR: '',
    BANCO: '',
    TIPO_CUENTA: '',
    NUM_CUENTA: '',
    ESTADO: 'ACTIVO'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si ya existen datos bancarios
  useEffect(() => {
    if (datosBancarios && datosBancarios.length > 0) {
      const datoExistente = datosBancarios[0];
      if (datoExistente.TITULAR || datoExistente.BANCO || datoExistente.NUM_CUENTA) {
        setFormData({
          TITULAR: datoExistente.TITULAR || '',
          BANCO: datoExistente.BANCO || '',
          TIPO_CUENTA: datoExistente.TIPO_CUENTA || '',
          NUM_CUENTA: datoExistente.NUM_CUENTA || '',
          ESTADO: datoExistente.ESTADO || 'ACTIVO'
        });
        setIsEditing(true);
      }
    }
  }, [datosBancarios]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de cuenta, limpiar campos relacionados
    if (name === 'TIPO_CUENTA') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        BANCO: '',
        NUM_CUENTA: '',
        CELULAR: ''
      }));
    } 
    // Si cambia el banco, limpiar número de cuenta y celular
    else if (name === 'BANCO') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        NUM_CUENTA: '',
        CELULAR: ''
      }));
    } 
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.TITULAR || !formData.TIPO_CUENTA || !formData.BANCO) {
      alert('Por favor, complete todos los campos obligatorios');
      return;
    }

    // Validar según el tipo de cuenta
    if (isBilleteraDigital) {
      if (!formData.NUM_CUENTA) {
        alert('Por favor, ingrese el número de celular para billetera digital');
        return;
      }
    } else {
      if (!formData.NUM_CUENTA) {
        alert('Por favor, ingrese el número de cuenta');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      let response;
      if (isEditing) {
        response = await actualizarDatosBancarios(dni, formData);
      } else {
        response = await guardarDatosBancarios(dni, formData);
      }

      if (response.status) {
        alert(response.message || 'Datos bancarios guardados exitosamente');
        onSave();
      } else {
        alert('Error al guardar los datos bancarios');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar los datos bancarios');
    } finally {
      setIsLoading(false);
    }
  };

  const tiposCuenta = [
    'AHORRO',
    'CORRIENTE', 
    'CTS',
    'PLAZO_FIJO',
    'BILLETERA_DIGITAL'
  ];

  const bancosPorTipo = {
    'AHORRO': [
      'BCP - Banco de Crédito del Perú',
      'BBVA - Banco Continental',
      'Scotiabank',
      'Interbank',
      'Banco de la Nación',
      'Banco Financiero',
      'Banco Pichincha',
      'Banco Falabella',
      'Banco Ripley',
      'Banco Santander',
      'Banco Citibank',
      'Banco GNB',
      'Banco Azteca',
      'Banco Cencosud',
      'Otro'
    ],
    'CORRIENTE': [
      'BCP - Banco de Crédito del Perú',
      'BBVA - Banco Continental',
      'Scotiabank',
      'Interbank',
      'Banco de la Nación',
      'Banco Financiero',
      'Banco Pichincha',
      'Banco Santander',
      'Banco Citibank',
      'Banco GNB',
      'Otro'
    ],
    'CTS': [
      'BCP - Banco de Crédito del Perú',
      'BBVA - Banco Continental',
      'Scotiabank',
      'Interbank',
      'Banco de la Nación',
      'Banco Financiero',
      'Banco Pichincha',
      'Banco Santander',
      'Banco Citibank',
      'Otro'
    ],
    'PLAZO_FIJO': [
      'BCP - Banco de Crédito del Perú',
      'BBVA - Banco Continental',
      'Scotiabank',
      'Interbank',
      'Banco de la Nación',
      'Banco Financiero',
      'Banco Pichincha',
      'Banco Santander',
      'Otro'
    ],
    'BILLETERA_DIGITAL': [
      'Yape',
      'Plin',
      'Lukita',
      'Tunki',
      'Otro'
    ]
  };

  // Verificar si es billetera digital
  const isBilleteraDigital = formData.TIPO_CUENTA === 'BILLETERA_DIGITAL';
  
  // Obtener bancos disponibles según el tipo de cuenta
  const bancosDisponibles = formData.TIPO_CUENTA ? bancosPorTipo[formData.TIPO_CUENTA as keyof typeof bancosPorTipo] || [] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? 'Editar Datos Bancarios' : 'Agregar Datos Bancarios'}
              </h2>
              <p className="text-sm text-gray-600">DNI: {dni}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Titular */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titular de la cuenta *
              </label>
              <input
                type="text"
                name="TITULAR"
                value={formData.TITULAR || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Nombre completo del titular"
                required
              />
            </div>

            {/* Tipo de Cuenta - PRIMERO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cuenta *
              </label>
              <select
                name="TIPO_CUENTA"
                value={formData.TIPO_CUENTA || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              >
                <option value="">Seleccione tipo de cuenta</option>
                {tiposCuenta.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo === 'BILLETERA_DIGITAL' ? 'Billetera Digital' : 
                     tipo === 'PLAZO_FIJO' ? 'Cuenta a Plazo Fijo' :
                     tipo === 'AHORRO' ? 'Cuenta de Ahorro' :
                     tipo === 'CORRIENTE' ? 'Cuenta Corriente' :
                     tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Banco/Entidad - SEGUNDO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBilleteraDigital ? 'Billetera Digital *' : 'Banco/Entidad *'}
              </label>
              <select
                name="BANCO"
                value={formData.BANCO || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                disabled={!formData.TIPO_CUENTA}
              >
                <option value="">
                  {!formData.TIPO_CUENTA ? 'Primero seleccione el tipo de cuenta' : 
                   isBilleteraDigital ? 'Seleccione billetera digital' : 'Seleccione banco/entidad'}
                </option>
                {bancosDisponibles.map((banco) => (
                  <option key={banco} value={banco}>
                    {banco}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo condicional: Número de Celular (para billetera digital) o Número de Cuenta (para bancos) */}
            {formData.BANCO && (
              <div>
                {isBilleteraDigital ? (
                  // Para billeteras digitales: Número de celular
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Celular *
                    </label>
                    <input
                      type="text"
                      name="CELULAR"
                      value={formData.NUM_CUENTA || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Número de celular asociado"
                      required
                    />
                  </div>
                ) : (
                  // Para bancos: Número de cuenta
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Cuenta *
                    </label>
                    <input
                      type="text"
                      name="NUM_CUENTA"
                      value={formData.NUM_CUENTA || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Número de cuenta bancaria"
                      required
                    />
                  </div>
                )}
              </div>
            )}
            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatosBancariosForm;