import { useState, useEffect, useContext } from 'react';
// Importar solo las funciones que ya existen en el primer archivo
import registroClienteApi, { saverDirecion, saverDirecionData } from '../../api/registroDeclientesApi';
import { AuthContext } from '../../contexts/AuthContext';
import { InputField, SelectField } from './FormFields';
import { DireccionData, RegistroDireccionProps } from './FormFields';

/*  "DIRECCION": {
    "CUENTA": "000000028224",
    "TIPO_DIR": "01",
    "TIPO_VIA": "01",
    "NOM_VIA": "AV PERU 2815 SAN MARTIN DE PORRES ",
    "NUMERO": "2815",
    "INTERIOR": "",
    "TIPO_ZONA": "01",
    "NOM_ZONA": " AV PERU 2815 SAN MARTIN DE PORRES ",
    "REFERENCIA": "",
    "DPTO": "15",
    "PROV": "01",
    "DIST": "35",
    "TIPO_SECTOR": "   ",
    "DIRECCION": "AVENIDA AV PERU 2815 SAN MARTIN DE PORRES  N° 2815  AV PERU SAN MARTIN DE PORRES"
  }
*/
export default function RegistroDireccion({ datosBasicos, datosDireccionApi }: RegistroDireccionProps) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState<DireccionData>({
    cuenta: '',
    socio: '',
    tipo_direccion: '',
    tipo_via: '',
    nombre: '',
    numero: '',
    interior: '',
    zona: '',
    nombre_zona: '',
    departamento: '',
    provincia: '',
    distrito: '',
    sector: '',
    referencia: '',
  });

  // Estados para los datos del API - usando any por ahora ya que las funciones devuelven any[]
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<any[]>([]);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [opcionesSector, setOpcionesSector] = useState<any>({
    TIPO_DIRECCION: [],
    TIPO_VIA: [],
    TIPO_ZONA: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // Estado para controlar si los campos son de solo lectura

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Usar las funciones exactas que ya existen
        const [deptosData, sectorOpcionesData] = await Promise.all([
          registroClienteApi.useComboBoxDepartamentosData(),
          registroClienteApi.useComboBoxSectorOpcionesData()
        ]);
        
        setDepartamentos(deptosData);
        setOpcionesSector(sectorOpcionesData);
        
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar provincias cuando se selecciona un departamento
  useEffect(() => {
    if (formData.departamento) {
      const loadProvincias = async () => {
        try {
          const data = await registroClienteApi.useComboBoxProvinciasData(formData.departamento);
          setProvincias(data);
        } catch (error) {
        }
      };
      loadProvincias();
    } else {
      setProvincias([]);
    }
  }, [formData.departamento]);

  // Cargar distritos cuando se selecciona una provincia
  useEffect(() => {
    if (formData.departamento && formData.provincia) {
      const loadDistritos = async () => {
        try {
          const data = await registroClienteApi.useComboBoxDistritosData(formData.departamento, formData.provincia);
          setDistritos(data);
        } catch (error) {
        }
      };
      loadDistritos();
    } else {
      setDistritos([]);
    }
  }, [formData.departamento, formData.provincia]);

  // Cargar sectores cuando se selecciona un distrito
  useEffect(() => {
    if (formData.departamento && formData.provincia && formData.distrito) {
      const loadSectores = async () => {
        try {
          const data = await registroClienteApi.useComboBoxSectoresData(formData.departamento, formData.provincia, formData.distrito);
          setSectores(data);
        } catch (error) {
        }
      };
      loadSectores();
    } else {
      setSectores([]);
    }
  }, [formData.departamento, formData.provincia, formData.distrito]);

  // Effect para autocompletar el formulario cuando lleguen datos de dirección de la API
  useEffect(() => {
    if (datosDireccionApi) {
      
      // Mapear los datos de la API al formato del formulario
      const direccionMapeada = {
        cuenta: datosDireccionApi.CUENTA || '',
        socio: `${datosBasicos.APE_PAT} ${datosBasicos.APE_MAT} ${datosBasicos.NOMBRES}`.trim(),
        tipo_direccion: datosDireccionApi.TIPO_DIR || '',
        tipo_via: datosDireccionApi.TIPO_VIA || '',
        nombre: datosDireccionApi.NOM_VIA || '',
        numero: datosDireccionApi.NUMERO || '',
        interior: datosDireccionApi.INTERIOR || '',
        zona: datosDireccionApi.TIPO_ZONA || '',
        nombre_zona: datosDireccionApi.NOM_ZONA || '',
        departamento: datosDireccionApi.DPTO || '',
        provincia: datosDireccionApi.PROV || '',
        distrito: datosDireccionApi.DIST || '',
        sector: datosDireccionApi.TIPO_SECTOR || '',
        referencia: datosDireccionApi.REFERENCIA || '',
      };

      setFormData(direccionMapeada);
      setIsReadOnly(true); // Bloquear edición cuando hay datos de la API
    } else {
      setIsReadOnly(false); // Permitir edición cuando no hay datos de la API
    }
  }, [datosDireccionApi, datosBasicos]);

  const handleInputChange = (field: keyof DireccionData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setFormData({
      cuenta: '',
      socio: '',
      tipo_direccion: '',
      tipo_via: '',
      nombre: '',
      numero: '',
      interior: '',
      zona: '',
      nombre_zona: '',
      departamento: '',
      provincia: '',
      distrito: '',
      sector: '',
      referencia: '',
    });
    setProvincias([]);
    setDistritos([]);
    setSectores([]);
    setIsReadOnly(false); // Permitir edición después de limpiar
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Campos obligatorios (Interior no es obligatorio)
    if (!formData.tipo_direccion) errors.push('Tipo de Dirección');
    if (!formData.tipo_via) errors.push('Tipo de Vía');
    if (!formData.nombre.trim()) errors.push('Nombre de la vía');
    if (!formData.numero.trim()) errors.push('Número');
    if (!formData.zona) errors.push('Zona');
    if (!formData.nombre_zona.trim()) errors.push('Nombre de Zona');
    if (!formData.departamento) errors.push('Departamento');
    if (!formData.provincia) errors.push('Provincia');
    if (!formData.distrito) errors.push('Distrito');
    // Sector y Referencia también opcionales según tu lógica anterior
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validar campos requeridos
      const errors = validateForm();
      if (errors.length > 0) {
        alert(`❌ Los siguientes campos son obligatorios:\n\n• ${errors.join('\n• ')}`);
        return;
      }

      if (!user?.user) {
        alert('❌ No se pudo obtener el código de usuario');
        return;
      }

      // Mapear datos del formulario a la interfaz de la API
      const direccionData: saverDirecionData = {
        CUENTA: datosBasicos.NVA_CTA || '', // Usar la cuenta del cliente
        TIPO_DIR: formData.tipo_direccion,
        TIPO_VIA: formData.tipo_via,
        NOM_VIA: formData.nombre.trim(),
        NUMERO: formData.numero.trim(),
        INTERIOR: formData.interior.trim(),
        TIPO_ZONA: formData.zona || '',
        NOM_ZONA: formData.nombre_zona.trim(),
        DPTO: formData.departamento,
        PROV: formData.provincia,
        DIST: formData.distrito,
        TIPO_SECTOR: formData.sector || '',
        REFERENCIA: formData.referencia.trim(),
        COD_USER: user.user, // Usar el código de usuario del contexto
      };

;

      // Llamar a la API
      await saverDirecion(direccionData);
      
    } catch (error) {
      // El error ya se muestra en la función saverDirecion
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 rounded-lg shadow-lg">
        <div className="flex justify-center items-center h-40">
          <div className="text-lg text-gray-600">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 rounded-lg shadow-lg">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Dirección</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 italic mb-2 pb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
            <input
              type="text"
              name="cuenta"
              value={datosBasicos.NVA_CTA || '<AUTOMATICO>'}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Socio</label>
            <input
              type="text"
              name="socio"
              value={`${datosBasicos.APE_PAT} ${datosBasicos.APE_MAT} ${datosBasicos.NOMBRES}`.trim()}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
              readOnly
            />
          </div>
        </div>

        {/* FILA 1: tipo_direccion, tipo_via, nombre, numero, interior */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="sm:col-span-1 lg:col-span-1">
            <SelectField
              label="Tipo de Dirección"
              value={formData.tipo_direccion}
              onChange={(value) => handleInputChange('tipo_direccion', value)}
              options={opcionesSector.TIPO_DIRECCION?.map((tipo: any) => ({
                value: tipo.TIPO_DIR,
                label: tipo.NOM_DIR
              })) || []}
              placeholder="Seleccione"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <SelectField
              label="Tipo de Vía"
              value={formData.tipo_via}
              onChange={(value) => handleInputChange('tipo_via', value)}
              options={opcionesSector.TIPO_VIA?.map((tipo: any) => ({
                value: tipo.TIPO_VIA,
                label: tipo.NOM_TVIA
              })) || []}
              placeholder="Seleccione"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <InputField
              label="Nombre"
              type="text"
              value={formData.nombre}
              onChange={(value) => handleInputChange('nombre', value)}
              placeholder="Nombre de la vía"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <InputField
              label="Número"
              type="text"
              value={formData.numero}
              onChange={(value) => handleInputChange('numero', value)}
              placeholder="Nro"
              maxLength={5}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-1">
            <InputField
              label="Interior"
              type="text"
              value={formData.interior}
              onChange={(value) => handleInputChange('interior', value)}
              placeholder="Int."
              maxLength={5}
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* FILA 2: zona, nombre_zona */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <SelectField
              label="Zona"
              value={formData.zona}
              onChange={(value) => handleInputChange('zona', value)}
              options={opcionesSector.TIPO_ZONA?.map((tipo: any) => ({
                value: tipo.TIPO_ZONA,
                label: tipo.NOM_TZONA
              })) || []}
              placeholder="Seleccione"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <InputField
              label="Nombre de Zona"
              type="text"
              value={formData.nombre_zona}
              onChange={(value) => handleInputChange('nombre_zona', value)}
              placeholder="Nombre de la zona"
              required
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* FILA 3: departamento, provincia, distrito, sector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <SelectField
              label="Departamento"
              value={formData.departamento}
              onChange={(value) => {
                handleInputChange('departamento', value);
                handleInputChange('provincia', '');
                handleInputChange('distrito', '');
                handleInputChange('sector', '');
              }}
              options={departamentos.map((depto: any) => ({
                value: depto.DPTO,
                label: depto.NOM_UBIGEO
              }))}
              placeholder="Seleccione"
              required
              disabled={isReadOnly}
            />
          </div>

          <div>
            <SelectField
              label="Provincia"
              value={formData.provincia}
              onChange={(value) => {
                handleInputChange('provincia', value);
                handleInputChange('distrito', '');
                handleInputChange('sector', '');
              }}
              options={provincias.map((prov: any) => ({
                value: prov.PROV,
                label: prov.NOM_UBIGEO
              }))}
              placeholder="Seleccione"
              required
              disabled={!formData.departamento || isReadOnly}
            />
          </div>

          <div>
            <SelectField
              label="Distrito"
              value={formData.distrito}
              onChange={(value) => {
                handleInputChange('distrito', value);
                handleInputChange('sector', '');
              }}
              options={distritos.map((dist: any) => ({
                value: dist.DIST,
                label: dist.NOM_UBIGEO
              }))}
              placeholder="Seleccione"
              required
              disabled={!formData.provincia || isReadOnly}
            />
          </div>

          <div>
            <SelectField
              label="Sector"
              value={formData.sector}
              onChange={(value) => handleInputChange('sector', value)}
              options={sectores && sectores.length > 0 ? sectores.map((sector: any) => ({
                value: sector.TIPO_SECTOR,
                label: sector.NOM_SECTOR
              })) : []}
              placeholder={sectores && sectores.length > 0 ? "Seleccione" : "No hay sectores disponibles"}
              disabled={!formData.distrito || isReadOnly}
            />
          </div>
        </div>

        {/* FILA 4: referencia (sola) */}
        <div className="grid grid-cols-1">
          <div>
            <InputField
              label="Referencia"
              type="text"
              value={formData.referencia}
              onChange={(value) => handleInputChange('referencia', value)}
              placeholder="Ingrese una referencia para ubicar mejor la dirección"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Botones Limpiar y Guardar */}
      <div className="flex justify-end gap-4 p-4 bg-gray-100 mt-6 rounded-b-lg">
        {/* Solo mostrar botón Limpiar cuando NO hay datos autocompletados */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Limpiar
          </button>
        )}
        
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isReadOnly}
          className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
            saving || isReadOnly
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
          title={isReadOnly ? 'Esta dirección ya está registrada y no puede ser modificada' : ''}
        >
          {saving ? '🔄 Guardando...' : isReadOnly ? '📋 Dirección Registrada' : '💾 Guardar'}
        </button>
      </div>
      
      {/* Mensaje informativo cuando hay datos autocompletados */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Información:</strong> Esta dirección ya está registrada en el sistema y no puede ser modificada.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}