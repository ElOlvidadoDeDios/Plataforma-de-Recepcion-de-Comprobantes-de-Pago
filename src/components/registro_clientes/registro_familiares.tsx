interface FamiliarData{
    ap_paterno: string;
    ap_materno: string;
    nombres: string;
    Fecha_nac: string;
    vinculo_familiar: string;
    sexo: string;
    tipo_documento: string;
    Nro_doc: string
    telefono: string;
    email: string;
    direccion: string;
    beneficiario: boolean; 
 }

export interface RegistroLaboralProps {
    formData: FamiliarData;
    onInputChange: (field: keyof FamiliarData, value: string) => void;
}

export default function RegistroFamiliares({ formData, onInputChange }: RegistroLaboralProps) {
    return (
        <div className=" mx-auto p-6 bg-white shadow-lg rounded-lg bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50">
            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Paterno:</label>
                        <input
                            type="text"
                            value={formData.ap_paterno}
                            onChange={(e) => onInputChange("ap_paterno", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="Ingrese apellido paterno"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Materno:</label>
                        <input
                            type="text"
                            value={formData.ap_materno}
                            onChange={(e) => onInputChange("ap_materno", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="Ingrese apellido materno"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombres:</label>
                    <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => onInputChange("nombres", e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        placeholder="Ingrese nombres completos"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento:</label>
                        <input
                            type="date"
                            value={formData.Fecha_nac}
                            onChange={(e) => onInputChange("Fecha_nac", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vínculo Familiar:</label>
                        <input
                            type="text"
                            value={formData.vinculo_familiar}
                            onChange={(e) => onInputChange("vinculo_familiar", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="Ej: Hijo/a, Cónyuge, Padre/Madre"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sexo:</label>
                    <select
                        value={formData.sexo}
                        onChange={(e) => onInputChange("sexo", e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors bg-white"
                    >
                        <option value="">Seleccione una opción</option>
                        <option value="masculino">MASCULINO</option>
                        <option value="femenino">FEMENINO</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento:</label>
                        <select
                            value={formData.tipo_documento}
                            onChange={(e) => onInputChange("tipo_documento", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        >
                            <option value="">Seleccione una opción</option>
                            <option value="DNI">DNI</option>
                            <option value="Pasaporte">PASAPORTE</option>
                            <option value="CE">CE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nro de Documento:</label>
                        <input
                            type="text"
                            value={formData.Nro_doc}
                            onChange={(e) => onInputChange("Nro_doc", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="Ingrese número de documento"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono:</label>
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={(e) => onInputChange("telefono", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="Ej: +51 999 999 999"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => onInputChange("email", e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                            placeholder="ejemplo@correo.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección:</label>
                    <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => onInputChange("direccion", e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        placeholder="Ingrese dirección completa"
                    />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-md">
                    <input
                        type="checkbox"
                        id="beneficiario"
                        checked={formData.beneficiario}
                        onChange={(e) => onInputChange("beneficiario", e.target.checked ? "true" : "false")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="beneficiario" className="text-sm font-medium text-gray-700">
                        Es beneficiario
                    </label>
                </div>


            </form>
        </div>
    );
} 