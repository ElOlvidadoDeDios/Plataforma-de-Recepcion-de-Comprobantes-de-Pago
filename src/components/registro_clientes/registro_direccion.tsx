import {departamentoOptions, locationData} from './departamentos';
// Mock data para el ejemplo - reemplaza con tus imports reales

interface DireccionData {
    tipo_direccion: string;
    tipo_via: string;
    nombre: string;
    numero: string;
    interior: string;
    zona: string;
    nombre_zona: string;
    departamento: string;
    provincia: string;
    distrito: string;
    referencia: string;
}

export interface RegistroDireccionProps {
    formData: DireccionData;
    onInputChange: (field: keyof DireccionData, value: string) => void;
}

const tipoDireccionOptions = ['DOMICILIARIA', 'FAMILIAR', 'TRABAJO'];
const tipoViaOptions = [
    'AVENIDA', 'JIRON', 'CALLE', 'PASAJE', 'ALAMEDA', 'MALECON', 'OVALO',
    'PARQUE', 'PLAZA', 'CARRETERA', 'BLOCK', 'OTROS', 'MANZANA', 'RESIDENCIAL',
    'BARRIO', 'URBANIZACION', 'ANEXO', 'ASOC.PRO VIVIENDA', 'COMUNIDAD', 'NO DEFINIDO'
];
const zonaOptions = [
    'NINGUNO', 'URBANIZACION', 'PUEBLO JOVEN', 'UNIDAD VECINAL', 'CONJUNTO HABITACIONAL',
    'ASENTAMIENTO HUMANO', 'COOPERATIVA', 'RESIDENCIAL', 'ZONA INDUSTRIAL', 'GRUPO',
    'CASERIO', 'FUNDO', 'ANEXO', 'OTROS', 'SECTOR', 'BARRIO', 'PUEBLO', 'CIUDAD',
    'OTRO', 'NO DEFINIDO'
];

export default function RegistroDireccion({ formData, onInputChange }: RegistroDireccionProps) {
    const handleInputChange = (field: keyof DireccionData, value: string) => {
        onInputChange(field, value);
    };

    // Get available provincias based on selected departamento
    const provincias = formData.departamento && locationData[formData.departamento]
        ? locationData[formData.departamento].provincias
        : [];

    // Get available distritos based on selected provincia
    const distritos = formData.departamento && formData.provincia && locationData[formData.departamento]?.distritos[formData.provincia]
        ? locationData[formData.departamento].distritos[formData.provincia]
        : [];

    return (
        <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 rounded-lg shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Dirección</h2>
            
            <div className="space-y-4">
                {/* FILA 1: tipo_direccion, tipo_via, nombre, numero, interior */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo de Dirección</label>
                        <select
                            value={formData.tipo_direccion}
                            onChange={(e) => handleInputChange('tipo_direccion', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="">Seleccione</option>
                            {tipoDireccionOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo de Vía</label>
                        <select
                            value={formData.tipo_via}
                            onChange={(e) => handleInputChange('tipo_via', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="">Seleccione</option>
                            {tipoViaOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            placeholder="Nombre de la vía"
                        />
                    </div>
                    
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Número</label>
                        <input
                            type="text"
                            maxLength={5}
                            value={formData.numero}
                            onChange={(e) => handleInputChange('numero', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            placeholder="Nro"
                        />
                    </div>
                    
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Interior</label>
                        <input
                            type="text"
                            maxLength={5}
                            value={formData.interior}
                            onChange={(e) => handleInputChange('interior', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            placeholder="Int."
                        />
                    </div>
                </div>

                {/* FILA 2: zona, nombre_zona */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Zona</label>
                        <select
                            value={formData.zona}
                            onChange={(e) => handleInputChange('zona', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="">Seleccione</option>
                            {zonaOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre de Zona</label>
                        <input
                            type="text"
                            value={formData.nombre_zona}
                            onChange={(e) => handleInputChange('nombre_zona', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            placeholder="Nombre de la zona"
                        />
                    </div>
                </div>

                {/* FILA 3: departamento, provincia, distrito */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Departamento</label>
                        <select
                            value={formData.departamento}
                            onChange={(e) => {
                                handleInputChange('departamento', e.target.value);
                                handleInputChange('provincia', '');
                                handleInputChange('distrito', '');
                            }}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                        >
                            <option value="">Seleccione</option>
                            {departamentoOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Provincia</label>
                        <select
                            value={formData.provincia}
                            onChange={(e) => {
                                handleInputChange('provincia', e.target.value);
                                handleInputChange('distrito', '');
                            }}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            disabled={!formData.departamento}
                        >
                            <option value="">Seleccione</option>
                            {provincias.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Distrito</label>
                        <select
                            value={formData.distrito}
                            onChange={(e) => handleInputChange('distrito', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            disabled={!formData.provincia}
                        >
                            <option value="">Seleccione</option>
                            {distritos.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* FILA 4: referencia (sola) */}
                <div className="grid grid-cols-1">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Referencia</label>
                        <input
                            type="text"
                            value={formData.referencia}
                            onChange={(e) => handleInputChange('referencia', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            placeholder="Ingrese una referencia para ubicar mejor la dirección"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


