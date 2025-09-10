import { useState } from "react";
import { Calculator, Printer } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

const Notification = useNotifications();

type ProyeccionItem = {
    producto: string;
    TEA: number;
    frecuencia: string;
    hasta: string;
    frecuencia2: string;
    importe: number;
    fecha_calculo: string;
    fecha_vencimiento: string;
}

export default function AhorroLibre() {
    const [formData, setFormData] = useState({
        producto: "",
        TEA: 0,
        frecuencia: "",
        hasta: "",
        frecuencia2: "",
        importe: 0,
        fecha_calculo: "",
        fecha_vencimiento: ""
    });

    const [resultados, setResultados] = useState<ProyeccionItem | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fetchSimulatedAhorroLibre = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const simulatedData = {
                    producto: "DEPOSITO REMUNERADO",
                    TEA: 15.00,
                    frecuencia: "DIARIO",
                    hasta: "2025-08-01",
                    importe: 12000.00,
                    fecha_calculo: "2025-08-31",
                    fecha_vencimiento: "2025-08-31"
                };
                resolve(simulatedData);
            }, 1000);
        });
    };

    const handleSubmit = async () => {
        try {
            const data = await fetchSimulatedAhorroLibre();
            const typedData = data as ProyeccionItem;
            const { producto, TEA, frecuencia, hasta, frecuencia2, importe, fecha_calculo, fecha_vencimiento } = typedData;
            setFormData(prev => ({ ...prev, producto, TEA, frecuencia, hasta, frecuencia2, importe, fecha_calculo, fecha_vencimiento }));
            setResultados(typedData);
            Notification.success('Cálculo realizado correctamente');
        } catch (error) {
            Notification.error('Error al realizar el cálculo');
        }
    }

    const handlePrint = () => {
        window.print();
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400";
    const selectClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white";

    return (
        <div className="flex gap-2 bg-gradient-to-br from-blue-100 to-blue-200 p-2 md:p-4">
            <div className="w-full h-full">
                <div className="flex gap-2 h-full">
                    {/* Barra lateral vertical con texto "AHORRO LIBRE" */}
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <div className="vertical-text">A</div>
                        <div className="vertical-text">H</div>
                        <div className="vertical-text">O</div>
                        <div className="vertical-text">R</div>
                        <div className="vertical-text">R</div>
                        <div className="vertical-text">O</div>
                        <div className="vertical-text my-2">&nbsp;</div>
                        <div className="vertical-text">L</div>
                        <div className="vertical-text">I</div>
                        <div className="vertical-text">B</div>
                        <div className="vertical-text">R</div>
                        <div className="vertical-text">E</div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 ">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {/* Panel formulario */}
                            <div className="bg-white rounded-lg shadow-md p-4 h-fit">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Producto */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                                        <select
                                            value={formData.producto}
                                            onChange={(e) => handleInputChange('producto', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="CUENTA MOVIL">CUENTA MOVIL</option>
                                            <option value="CUENTA ESTRELLA">CUENTA ESTRELLA</option>
                                            <option value="CUENTA MOVIL $">CUENTA MOVIL $</option>
                                        </select>
                                    </div>

                                    {/* TEA */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">T.E.A. (%)</label>
                                        <input
                                            type="number"
                                            value={formData.TEA}
                                            onChange={(e) => handleInputChange('TEA', e.target.value)}
                                            className={inputClass}
                                            step="0.01"
                                            placeholder="8.00"
                                        />
                                    </div>

                                    {/* Frecuencia de depósito */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de Depósito</label>
                                        <select
                                            value={formData.frecuencia}
                                            onChange={(e) => handleInputChange('frecuencia', e.target.value)}
                                            className={selectClass}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="MESES">MESES</option>
                                            <option value="28DIAS">28DIAS</option>
                                            <option value="BIMESTRAL">BIMESTRAL</option>
                                            <option value="SEMANAL">SEMANAL</option>
                                            <option value="QUINCENAL">QUINCENAL</option>
                                            <option value="SEMESTRAL">SEMESTRAL</option>
                                        </select>
                                    </div>

                                    {/* Hasta */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                        <input 
                                            type="number" 
                                            value={formData.hasta} 
                                            onChange={(e) => handleInputChange('hasta', e.target.value)} 
                                            className={inputClass}
                                            placeholder="12"
                                        />
                                    </div>

                                    {/* Importe */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Importe</label>
                                        <input
                                            type="number"
                                            value={formData.importe}
                                            onChange={(e) => handleInputChange('importe', e.target.value)}
                                            className={inputClass}
                                            placeholder="12222"
                                            step="0.01"
                                        />
                                    </div>

                                    {/* Fecha de Cálculo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Cálculo</label>
                                        <input 
                                            type="date" 
                                            value={formData.fecha_calculo} 
                                            onChange={(e) => handleInputChange('fecha_calculo', e.target.value)} 
                                            className={inputClass} 
                                        />
                                    </div>

                                    {/* Fecha de Vencimiento */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                                        <input 
                                            type="date" 
                                            value={formData.fecha_vencimiento} 
                                            onChange={(e) => handleInputChange('fecha_vencimiento', e.target.value)} 
                                            className={inputClass} 
                                        />
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex gap-3 mt-6 justify-end">
                                    <button
                                        onClick={handleSubmit}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Calculator size={16} />
                                        Calcular
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Printer size={16} />
                                        Imprimir
                                    </button>
                                </div>
                            </div>

                            {/* Panel de resultados */}
                            <div className="bg-white rounded-lg shadow-md p-4 h-fit">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Simulador de Movimientos</h3>
                                
                                {resultados ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse border border-gray-300">
                                            <thead className="bg-blue-600 text-white">
                                                <tr>
                                                    <th className="border border-gray-300 p-2">Item</th>
                                                    <th className="border border-gray-300 p-2">Operación</th>
                                                    <th className="border border-gray-300 p-2">Fecha Depósito</th>
                                                    <th className="border border-gray-300 p-2">Monto Depósito</th>
                                                    <th className="border border-gray-300 p-2">Capital Acum.</th>
                                                    <th className="border border-gray-300 p-2">Interés</th>
                                                    <th className="border border-gray-300 p-2">Interés Acum.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="bg-gray-50">
                                                    <td className="border border-gray-300 p-2 text-center">1</td>
                                                    <td className="border border-gray-300 p-2">DEPÓSITO</td>
                                                    <td className="border border-gray-300 p-2">08/08/2025</td>
                                                    <td className="border border-gray-300 p-2 text-right">12,222.00</td>
                                                    <td className="border border-gray-300 p-2 text-right">12,222.00</td>
                                                    <td className="border border-gray-300 p-2 text-right">0.00</td>
                                                    <td className="border border-gray-300 p-2 text-right">0.00</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2 text-center">2</td>
                                                    <td className="border border-gray-300 p-2">CAPITALIZACIÓN</td>
                                                    <td className="border border-gray-300 p-2">31/08/2025</td>
                                                    <td className="border border-gray-300 p-2 text-right">0.00</td>
                                                    <td className="border border-gray-300 p-2 text-right">12,282.24</td>
                                                    <td className="border border-gray-300 p-2 text-right">60.24</td>
                                                    <td className="border border-gray-300 p-2 text-right">0.00</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Resumen */}
                                        <div className="flex justify-end mt-4 gap-4 text-sm">
                                            <div className="bg-yellow-500 text-white px-3 py-1 rounded">
                                                <div>Total</div>
                                                <div className="font-bold">0.00</div>
                                            </div>
                                            <div className="bg-blue-500 text-white px-3 py-1 rounded">
                                                <div>Total Capital</div>
                                                <div className="font-bold">14,827.42</div>
                                            </div>
                                            <div className="bg-green-500 text-white px-3 py-1 rounded">
                                                <div>Total Interés</div>
                                                <div className="font-bold">79.46</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        Haga clic en "Calcular" para ver los resultados
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}