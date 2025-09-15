import { useState } from 'react';

// Interfaces para datos básicos del usuario (igual que en familiares)
interface DatosBasicos {
  NVA_CTA: string;
  APE_PAT: string;
  APE_MAT: string;
  NOMBRES: string;
  SITUACION?: string; // 🚨 CAMPO NECESARIO PARA VALIDACIÓN
}

interface Hijo {
  edad: number;
  vive: string;
  nivel: string;
  institucion: string;
  dondeEstudia: string;
}

interface FormData {
  tiempo: number;
  creditos: string;
  cargaFamiliar: string;
  numHijos: number;
  hijos: Hijo[];
  tieneVehiculo: string;
}

interface FormularioAdicionalProps {
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
  datosBasicos: DatosBasicos; // 🚨 AGREGADO: Recibir datos del usuario
}

export default function FormularioAdicional({ onSubmit, onCancel, datosBasicos }: FormularioAdicionalProps) {
  const puedeEditar = datosBasicos.SITUACION === 'AFILIADO'; // Validar si es AFILIADO

  const [formData, setFormData] = useState<FormData>({
    tiempo: 0,
    creditos: '',
    cargaFamiliar: '',
    numHijos: 0,
    hijos: [],
    tieneVehiculo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleHijosChange = (numHijos: number) => {
    const nuevosHijos: Hijo[] = [];
    for (let i = 0; i < numHijos; i++) {
      nuevosHijos.push({
        edad: 0,
        vive: '',
        nivel: '',
        institucion: '',
        dondeEstudia: ''
      });
    }
    
    setFormData(prev => ({
      ...prev,
      numHijos,
      hijos: nuevosHijos
    }));
  };

  const handleHijoChange = (index: number, field: keyof Hijo, value: any) => {
    setFormData(prev => ({
      ...prev,
      hijos: prev.hijos.map((hijo, i) => 
        i === index ? { ...hijo, [field]: value } : hijo
      )
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.tiempo <= 0) {
      newErrors.tiempo = 'El tiempo debe ser mayor a 0';
    }
    
    if (!formData.creditos) {
      newErrors.creditos = 'Debe seleccionar una opción';
    }
    
    if (!formData.cargaFamiliar) {
      newErrors.cargaFamiliar = 'Debe seleccionar una opción';
    }

    if (!formData.tieneVehiculo) {
      newErrors.tieneVehiculo = 'Debe seleccionar una opción';
    }

    if (formData.cargaFamiliar === 'si' && formData.numHijos <= 0) {
      newErrors.numHijos = 'Debe indicar el número de hijos';
    }

    // Validar datos de hijos
    formData.hijos.forEach((hijo, index) => {
      if (hijo.edad <= 0) {
        newErrors[`hijo_${index}_edad`] = 'La edad debe ser mayor a 0';
      }
      if (!hijo.vive) {
        newErrors[`hijo_${index}_vive`] = 'Debe seleccionar una opción';
      }
      if (!hijo.nivel) {
        newErrors[`hijo_${index}_nivel`] = 'Debe seleccionar el nivel de estudios';
      }
      if (!hijo.institucion) {
        newErrors[`hijo_${index}_institucion`] = 'Debe seleccionar el tipo de institución';
      }
      if (!hijo.dondeEstudia.trim()) {
        newErrors[`hijo_${index}_dondeEstudia`] = 'Debe indicar dónde estudia';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 rounded-lg mb-6">
        <div className="mb-4">
          <p className="text-sm md:text-base">
            <strong>Cuenta:</strong> {datosBasicos.NVA_CTA}
          </p>
          <p className="text-sm md:text-base">
            <strong>Socio:</strong> {`${datosBasicos.APE_PAT} ${datosBasicos.APE_MAT} ${datosBasicos.NOMBRES}`}
          </p>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-center">
          📋 Información Adicional del Socio
        </h2>
        <p className="text-center text-blue-100 mt-2">
          Complete los siguientes datos para completar el perfil
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tiempo laborando */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm md:text-base font-semibold text-blue-800 mb-2">
            ⏰ Tiempo laborando o tiempo del negocio (en meses):
          </label>
          <input
            type="number"
            min="0"
            value={formData.tiempo || ''}
            disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
            onChange={(e) => handleInputChange('tiempo', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.tiempo ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingrese el tiempo en meses"
          />
          {errors.tiempo && (
            <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.tiempo}</p>
          )}
        </div>

        {/* Créditos */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <label className="block text-sm md:text-base font-semibold text-green-800 mb-2">
            💳 ¿Tuvo créditos?
          </label>
          <select
            value={formData.creditos}
            onChange={(e) => handleInputChange('creditos', e.target.value)}
            disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              errors.creditos ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccione una opción</option>
            <option value="formal">Formales</option>
            <option value="informal">Informales</option>
            <option value="ninguno">Ninguno</option>
          </select>
          {errors.creditos && (
            <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.creditos}</p>
          )}
        </div>

        {/* Vehículo */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <label className="block text-sm md:text-base font-semibold text-orange-800 mb-2">
            🚗 ¿Tiene vehículo?
          </label>
          <select
            value={formData.tieneVehiculo}
            onChange={(e) => handleInputChange('tieneVehiculo', e.target.value)}
            disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              errors.tieneVehiculo ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccione una opción</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
          {errors.tieneVehiculo && (
            <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.tieneVehiculo}</p>
          )}
        </div>

        {/* Carga familiar */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="block text-sm md:text-base font-semibold text-purple-800 mb-2">
            👨‍👩‍👧‍👦 ¿Tiene carga familiar?
          </label>
          <select
            value={formData.cargaFamiliar}
            onChange={(e) => handleInputChange('cargaFamiliar', e.target.value)}
            disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.cargaFamiliar ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccione una opción</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
          {errors.cargaFamiliar && (
            <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.cargaFamiliar}</p>
          )}

          {/* Número de hijos */}
          {formData.cargaFamiliar === 'si' && (
            <div className="mt-4">
              <label className="block text-sm md:text-base font-medium text-purple-700 mb-2">
                👶 Número de hijos:
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.numHijos || ''}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 0;
                  handleInputChange('numHijos', num);
                  // Deshabilitar si no es AFILIADO
                  handleHijosChange(num);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.numHijos ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ingrese el número de hijos"
              />
              {errors.numHijos && (
                <p className="text-red-500 text-xs md:text-sm mt-1">⚠️ {errors.numHijos}</p>
              )}
            </div>
          )}
        </div>

        {/* Detalles de hijos */}
        {formData.hijos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg md:text-xl font-semibold text-purple-800 text-center">
              👨‍👩‍👧‍👦 Información de los hijos
            </h3>
            {formData.hijos.map((hijo, index) => (
              <div key={index} className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-4 text-center">
                  👶 Hijo {index + 1}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edad:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={hijo.edad || ''}
                      onChange={(e) => handleHijoChange(index, 'edad', parseInt(e.target.value) || 0)}
                      disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`hijo_${index}_edad`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors[`hijo_${index}_edad`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hijo_${index}_edad`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Vive con el titular?
                    </label>
                    <select
                      value={hijo.vive}
                      onChange={(e) => handleHijoChange(index, 'vive', e.target.value)}
                      disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`hijo_${index}_vive`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    {errors[`hijo_${index}_vive`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hijo_${index}_vive`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel de estudios:
                    </label>
                    <select
                      value={hijo.nivel}
                      onChange={(e) => handleHijoChange(index, 'nivel', e.target.value)}
                      disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`hijo_${index}_nivel`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione</option>
                      <option value="inicial">Inicial</option>
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                      <option value="universidad">Universidad</option>
                    </select>
                    {errors[`hijo_${index}_nivel`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hijo_${index}_nivel`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de institución:
                    </label>
                    <select
                      value={hijo.institucion}
                      onChange={(e) => handleHijoChange(index, 'institucion', e.target.value)}
                      disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
                      className={`w-full px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border rounded-lg ${
                        errors[`hijo_${index}_institucion`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccione</option>
                      <option value="publica">Pública</option>
                      <option value="privada">Privada</option>
                    </select>
                    {errors[`hijo_${index}_institucion`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hijo_${index}_institucion`]}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Dónde estudia? (Colegio o Universidad):
                    </label>
                    <input
                      type="text"
                      value={hijo.dondeEstudia}
                      onChange={(e) => handleHijoChange(index, 'dondeEstudia', e.target.value)}
                      disabled={!puedeEditar} // Deshabilitar si no es AFILIADO
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors[`hijo_${index}_dondeEstudia`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nombre del colegio/universidad"
                    />
                    {errors[`hijo_${index}_dondeEstudia`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hijo_${index}_dondeEstudia`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
          >
            ❌ Cancelar
          </button>
          <button
            type="submit"
            className={`w-full sm:w-auto px-6 py-3 rounded-lg transition duration-200 font-medium ${
              puedeEditar
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : 'bg-gray-400 text-gray-700 cursor-not-allowed'
            }`}
            disabled={!puedeEditar} // Desactivar si no es AFILIADO
          >
            💾 Guardar Información
          </button>
        </div>
      </form>
    </div>
  );
}