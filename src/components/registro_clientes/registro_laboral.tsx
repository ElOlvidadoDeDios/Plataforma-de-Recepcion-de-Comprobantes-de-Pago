import React, { useState, useEffect } from 'react';
import { departamentoOptions, locationData } from './departamentos';

interface RegistroLaboralProps {
  formData: any;
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function RegistroLaboral({ formData, onInputChange }: RegistroLaboralProps) {
  const [provinciasDisponibles, setProvinciasDisponibles] = useState<string[]>([]);
  const [distritosDisponibles, setDistritosDisponibles] = useState<string[]>([]);
  // Valores por defecto para los campos laborales
  const getFieldValue = (field: string, defaultValue: string = '') => {
    return formData[field] ?? defaultValue;
  };

  // Actualizar provincias cuando cambia el departamento
  useEffect(() => {
    const departamento = getFieldValue('departamento', 'AMAZONAS');
    if (departamento && locationData[departamento]) {
      setProvinciasDisponibles(locationData[departamento].provincias);
      // Limpiar provincia y distrito cuando cambia departamento
      if (formData.provincia && !locationData[departamento].provincias.includes(formData.provincia)) {
        onInputChange('provincia', '');
        onInputChange('distrito', '');
      }
    } else {
      setProvinciasDisponibles([]);
    }
  }, [formData.departamento]);

  // Actualizar distritos cuando cambia la provincia
  useEffect(() => {
    const departamento = getFieldValue('departamento', 'AMAZONAS');
    const provincia = getFieldValue('provincia');
    if (departamento && provincia && locationData[departamento] && locationData[departamento].distritos[provincia]) {
      setDistritosDisponibles(locationData[departamento].distritos[provincia]);
      // Limpiar distrito cuando cambia provincia
      if (formData.distrito && !locationData[departamento].distritos[provincia].includes(formData.distrito)) {
        onInputChange('distrito', '');
      }
    } else {
      setDistritosDisponibles([]);
    }
  }, [formData.departamento, formData.provincia]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onInputChange(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Sección Superior */}
          <div className="grid grid-cols-3 gap-4 items-center border-b border-gray-200 pb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuenta
              </label>
              <input
                type="text"
                name="cuenta"
                value={getFieldValue('cuenta', 'AUTOMATICO')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
                readOnly
              />
            </div>
            <div className="text-center">
              <span className="text-gray-600 font-medium">&lt;AUTOMATICO&gt;</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Socio
              </label>
              <input
                type="text"
                name="socio"
                value={getFieldValue('socio')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Seleccione Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Seleccione Empresa</h3>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agencia
                </label>
                <select
                  name="agencia"
                  value={getFieldValue('agencia', 'OFICINA PRINCIPAL')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OFICINA PRINCIPAL">OFICINA PRINCIPAL</option>
                  <option value="SUCURSAL 1">SUCURSAL 1</option>
                  <option value="SUCURSAL 2">SUCURSAL 2</option>
                </select>
              </div>
              <div className="text-center">
                <span className="text-red-600 font-medium text-sm">
                  OPCIONAL PARA ESCOGER UNA EMPRESA DE OTRA AGENCIA
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código C.I.P.
                </label>
                <input
                  type="text"
                  name="codigoCIP"
                  value={getFieldValue('codigoCIP')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={getFieldValue('nombre')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Seleccione Cargo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Seleccione Cargo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  name="cargo"
                  value={getFieldValue('cargo')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <input
                  type="text"
                  name="area"
                  value={getFieldValue('area')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Ing.
                </label>
                <input
                  type="text"
                  name="fechaIng"
                  value={getFieldValue('fechaIng', '23/08/2025')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Situa. Laboral
                </label>
                <select
                  name="situacionLaboral"
                  value={getFieldValue('situacionLaboral', 'ACTIVO')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo
                </label>
                <select
                  name="grupo"
                  value={getFieldValue('grupo', 'DIARIA')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DIARIA">DIARIA</option>
                  <option value="SEMANAL">SEMANAL</option>
                  <option value="MENSUAL">MENSUAL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seleccione Datos de Dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Seleccione Datos de Dirección</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Vía
                </label>
                <select
                  name="tipoVia"
                  value={getFieldValue('tipoVia', 'AVENIDA')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AVENIDA">AVENIDA</option>
                  <option value="CALLE">CALLE</option>
                  <option value="JIRON">JIRON</option>
                  <option value="PASAJE">PASAJE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombreVia"
                  value={getFieldValue('nombreVia')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nro.
                </label>
                <input
                  type="text"
                  name="numero"
                  value={getFieldValue('numero')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inter.
                </label>
                <input
                  type="text"
                  name="interior"
                  value={getFieldValue('interior')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  name="departamento"
                  value={getFieldValue('departamento', 'AMAZONAS')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {departamentoOptions.map(departamento => (
                    <option key={departamento} value={departamento}>{departamento}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <select
                  name="provincia"
                  value={getFieldValue('provincia')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {provinciasDisponibles.map(departamento => (
                    <option key={departamento} value={departamento}>{departamento}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distrito
                </label>
                <select
                  name="distrito"
                  value={getFieldValue('distrito')}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {distritosDisponibles.map(departamento => (
                    <option key={departamento} value={departamento}>{departamento}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia
              </label>
              <input
                type="text"
                name="referencia"
                value={getFieldValue('referencia')}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese referencia de ubicación"
              />
            </div>
          </div>

        </form>
    </div>
  );
}