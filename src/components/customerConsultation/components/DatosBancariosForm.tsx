import React, { useState, useEffect } from 'react';
import { DatosBancarios, guardarDatosBancarios } from '../../../api/customerConsultationAPI';

interface DatosBancariosFormProps {
  dni: string;
  nombreCompleto: string;
  cuentaDile: string;
  onSave: () => void;
  onCancel: () => void;
}

const DatosBancariosForm: React.FC<DatosBancariosFormProps> = ({
  dni,
  nombreCompleto,
  cuentaDile,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<DatosBancarios>({
    BANCO: '',
    TIPO_CUENTA: '',
    NUM_CUENTA: '',
    DNI_SOCIO: dni,
    CUENTA_DILE: cuentaDile,
    DNI_TITULAR: '',
    NOMBRE_TITULAR: '',
    ESTADO: 'ACTIVO'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [esTitular, setEsTitular] = useState(true);

  // El formulario siempre es para agregar nuevas cuentas
  // No cargamos datos existentes porque el endpoint es solo para insertar

  // Efecto para manejar el cambio de titular
  useEffect(() => {
    if (esTitular) {
      setFormData(prev => ({
        ...prev,
        DNI_TITULAR: dni,
        NOMBRE_TITULAR: nombreCompleto
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        DNI_TITULAR: '',
        NOMBRE_TITULAR: ''
      }));
    }
  }, [esTitular, dni, nombreCompleto]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo de cuenta, limpiar campos relacionados
    if (name === 'TIPO_CUENTA') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        BANCO: '',
        NUM_CUENTA: ''
      }));
    } 
    // Si cambia el banco, limpiar número de cuenta
    else if (name === 'BANCO') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        NUM_CUENTA: ''
      }));
    } 
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEsTitular(e.target.checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.BANCO || !formData.NUM_CUENTA) {
      return;
    }

    if (!esTitular && (!formData.DNI_TITULAR || !formData.NOMBRE_TITULAR)) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Siempre usamos guardarDatosBancarios ya que el endpoint es para insertar nuevas cuentas
      const response = await guardarDatosBancarios(dni, formData);

      if (response.status) {
        onSave();
      } else {
      }
    } catch (error) {
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
                Agregar Datos Bancarios
              </h2>
              <p className="text-sm text-gray-600">Socio: {nombreCompleto} - DNI: {dni}</p>
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
            {/* Checkbox - ¿Es titular de la cuenta? */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={esTitular}
                  onChange={handleTitularChange}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-blue-700">
                  ¿Es {nombreCompleto} el titular de la cuenta bancaria?
                </span>
              </label>
            </div>

            {/* Datos del Titular (solo si NO es titular) */}
            {!esTitular && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-yellow-700 mb-3">Datos del Titular de la Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI del Titular *
                    </label>
                    <input
                      type="text"
                      name="DNI_TITULAR"
                      value={formData.DNI_TITULAR || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="DNI del titular"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      name="NOMBRE_TITULAR"
                      value={formData.NOMBRE_TITULAR || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Nombre completo del titular"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

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
                {isBilleteraDigital ? 'Billetera Digital *' : 'Banco/Entidad Financiera *'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isBilleteraDigital ? 'Número de Celular *' : 'Número de Cuenta *'}
                </label>
                <input
                  type="text"
                  name="NUM_CUENTA"
                  value={formData.NUM_CUENTA || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder={isBilleteraDigital ? 'Número de celular asociado' : 'Número de cuenta bancaria'}
                  required
                />
                {isBilleteraDigital && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ingrese el número de celular asociado a {formData.BANCO}
                  </p>
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
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatosBancariosForm;