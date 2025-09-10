import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";

const Notification = useNotifications();

type ProyeccionItem = {
    item: number | string;
    fechaVencimiento: string;
    interes: number | string;
    saldo: number | string;
};

type PlanItem = {
    desde: string;
    hasta: string;
    tasaMes: string;
    tasaVence: string;
    tasa: string;
};

export default function PlazoFijo() {
    const [formData, setFormData] = useState({
        producto: "DEPOSITO REMUNERADO",
        plazo: "360",
        tipoPagoInteres: "Mensual",
        importe: "12000.00",
        tea: "15.00",
        tasaPlazo: "15.00"
    });

    const [proyeccionIntereses, setProyeccionIntereses] = useState<ProyeccionItem[]>([]);
    const [interesesFinal, setInteresesFinal] = useState<string>("");

    // Datos de ejemplo para los planes de plazo fijo
    const planesPlazos: PlanItem[] = [
        { desde: "30", hasta: "89", tasaMes: "8.50", tasaVence: "9.00", tasa: "9.50" },
        { desde: "90", hasta: "179", tasaMes: "10.00", tasaVence: "10.50", tasa: "11.00" },
        { desde: "180", hasta: "359", tasaMes: "12.00", tasaVence: "12.50", tasa: "13.00" },
        { desde: "360", hasta: "720", tasaMes: "14.00", tasaVence: "14.50", tasa: "15.00" },
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fetchSimulatedData = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const simulatedData = {
                    proyeccion: [
                        { item: 1, fechaVencimiento: '07/09/2025', interes: '140.58', saldo: '140.58' },
                        { item: 2, fechaVencimiento: '07/10/2025', interes: '140.58', saldo: '281.16' },
                        { item: 3, fechaVencimiento: '06/11/2025', interes: '140.58', saldo: '421.74' },
                        { item: 4, fechaVencimiento: '06/12/2025', interes: '140.58', saldo: '562.32' },
                        { item: 5, fechaVencimiento: '05/01/2026', interes: '140.58', saldo: '702.90' },
                        { item: 6, fechaVencimiento: '04/02/2026', interes: '140.58', saldo: '843.48' },
                        { item: 7, fechaVencimiento: '06/03/2026', interes: '140.58', saldo: '984.06' },
                        { item: 8, fechaVencimiento: '05/04/2026', interes: '140.58', saldo: '1,124.64' },
                        { item: 9, fechaVencimiento: '05/05/2026', interes: '140.58', saldo: '1,265.22' },
                    ],
                    interesesFinal: '1,686.96'
                };
                resolve(simulatedData);
            }, 1000);
        });
    };

    const handleSubmit = async () => {
        try {
            const data = await fetchSimulatedData();
            const { proyeccion, interesesFinal } = data as { proyeccion: ProyeccionItem[], interesesFinal: string };
            setProyeccionIntereses(proyeccion);
            setInteresesFinal(interesesFinal);
        } catch (error) {
            Notification.error('Error al obtener la proyección de intereses');
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400";
    const selectClass = "w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white";

    return (
        <div className='w-full h-full bg-red-50 p-2 md:p-4 bg-gradient-to-br from-blue-100 to-blue-200 '>
            <div className="w-full max-w-none">
                {/* Header con fecha */}
                <div className="flex justify-end mb-4">
                    <div className="bg-white px-3 py-1 border border-gray-300 rounded text-sm">
                        8/08/2025
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Barra lateral vertical con texto PLAZO FIJO */}
                    <div className="bg-blue-600 text-white flex flex-col items-center justify-center text-lg font-bold tracking-normal py-4 px-3 min-h-full">
                        <div className="vertical-text">
                            P
                        </div>
                        <div className="vertical-text">
                            L
                        </div>
                        <div className="vertical-text">
                            A
                        </div>
                        <div className="vertical-text">
                            Z
                        </div>
                        <div className="vertical-text">
                            O
                        </div>
                        <div className="vertical-text my-2">
                            &nbsp;
                        </div>
                        <div className="vertical-text">
                            F
                        </div>
                        <div className="vertical-text">
                            I
                        </div>
                        <div className="vertical-text">
                            J
                        </div>
                        <div className="vertical-text">
                            O
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Panel izquierdo - Formulario */}
                        <div className="lg:col-span-1 ">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded border border-gray-300 overflow-hidden">
                                <div className="p-4 space-y-4">
                                    {/* Producto */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Producto
                                        </label>
                                        <select 
                                            value={formData.producto} 
                                            onChange={(e) => handleInputChange('producto', e.target.value)} 
                                            className={selectClass}
                                        >
                                            <option value="DEPOSITO REMUNERADO">DEPOSITO REMUNERADO</option>
                                        </select>
                                    </div>

                                    {/* Plazo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Plazo
                                        </label>
                                        <select 
                                            value={formData.plazo} 
                                            onChange={(e) => handleInputChange('plazo', e.target.value)} 
                                            className={selectClass}
                                        >
                                            <option value="30">30</option>
                                            <option value="60">60</option>
                                            <option value="90">90</option>
                                            <option value="180">180</option>
                                            <option value="360">360</option>
                                            <option value="720">720</option>
                                        </select>
                                    </div>

                                    {/* Tipo de Pago de Interés */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Pago de Interés
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input 
                                                    type="radio" 
                                                    name="tipoPagoInteres" 
                                                    value="Mensual" 
                                                    checked={formData.tipoPagoInteres === "Mensual"} 
                                                    onChange={(e) => handleInputChange('tipoPagoInteres', e.target.value)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Mensual</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input 
                                                    type="radio" 
                                                    name="tipoPagoInteres" 
                                                    value="Vencimiento" 
                                                    checked={formData.tipoPagoInteres === "Vencimiento"} 
                                                    onChange={(e) => handleInputChange('tipoPagoInteres', e.target.value)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">Vencimiento</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Importe */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Importe
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.importe} 
                                            onChange={(e) => handleInputChange('importe', e.target.value)} 
                                            className={inputClass}
                                            placeholder="12,000.00"
                                        />
                                    </div>

                                    {/* T.E.A. */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            T.E.A. (%)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.tea} 
                                            onChange={(e) => handleInputChange('tea', e.target.value)} 
                                            className={inputClass}
                                            placeholder="15.00"
                                        />
                                    </div>

                                    {/* Tasa del Plazo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tasa del Plazo (%)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.tasaPlazo} 
                                            onChange={(e) => handleInputChange('tasaPlazo', e.target.value)} 
                                            className={inputClass}
                                            placeholder="15.00"
                                        />
                                    </div>

                                    {/* Botón Calcular */}
                                    <div className="pt-4">
                                        <button 
                                            onClick={handleSubmit}
                                            className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded py-2 px-4 text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Calcular
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel derecho - Tablas */}
                        <div className="lg:col-span-2 space-y-4 bg-gradient-to-br from-blue-100 to-blue-200">
                            {/* Planes de Plazo Fijo */}
                            <div className="bg-gradient-to-br from-blue-100 to-blue-500 rounded border border-gray-300 overflow-hidden">
                                <div className="bg-blue-500 text-white px-4 py-2">
                                    <h3 className="text-sm font-semibold">Planes de Plazo Fijo</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-yellow-100">
                                            <tr>
                                                <th className="px-3 py-2 text-center border-r border-gray-300">Desde</th>
                                                <th className="px-3 py-2 text-center border-r border-gray-300">Hasta</th>
                                                <th className="px-3 py-2 text-center border-r border-gray-300">Tasa Mes</th>
                                                <th className="px-3 py-2 text-center border-r border-gray-300">Tasa Vence</th>
                                                <th className="px-3 py-2 text-center">Tasa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {planesPlazos.map((plan, index) => (
                                                <tr key={index} className="border-b border-gray-200">
                                                    <td className="px-3 py-2 text-center border-r border-gray-300">{plan.desde}</td>
                                                    <td className="px-3 py-2 text-center border-r border-gray-300">{plan.hasta}</td>
                                                    <td className="px-3 py-2 text-center border-r border-gray-300">{plan.tasaMes}</td>
                                                    <td className="px-3 py-2 text-center border-r border-gray-300">{plan.tasaVence}</td>
                                                    <td className="px-3 py-2 text-center">{plan.tasa}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Proyección de Intereses */}
                            {proyeccionIntereses.length > 0 && (
                                <div className="bg-bg-gradient-to-br from-blue-100 to-blue-500 rounded border border-gray-300 overflow-hidden">
                                    <div className="bg-blue-500 text-white px-4 py-2">
                                        <h3 className="text-sm font-semibold">Proyección de Intereses</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-3 py-2 text-center border-r border-gray-300">Item</th>
                                                    <th className="px-3 py-2 text-center border-r border-gray-300">Fec.Vence</th>
                                                    <th className="px-3 py-2 text-center border-r border-gray-300">Interés</th>
                                                    <th className="px-3 py-2 text-center">Saldo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {proyeccionIntereses.map((item, index) => (
                                                    <tr 
                                                        key={index} 
                                                        className={`bg-gradient-to-br from-blue-100 to-blue-500 border-b border-gray-300 ${index === 0 ? 'bg-red-500 text-white' : ''}`}
                                                    >
                                                        <td className="px-3 py-2 text-center border-r border-gray-300">{item.item}</td>
                                                        <td className="px-3 py-2 text-center border-r border-gray-300">{item.fechaVencimiento}</td>
                                                        <td className="px-3 py-2 text-center border-r border-gray-300">{item.interes}</td>
                                                        <td className="px-3 py-2 text-center">{item.saldo}</td>
                                                    </tr>
                                                ))}
                                                {/* Fila de total */}
                                                <tr className="bg-blue-100 font-semibold">
                                                    <td colSpan={3} className="px-3 py-2 text-right border-r border-gray-300">
                                                        Interés Final
                                                    </td>
                                                    <td className="px-3 py-2 text-center bg-blue-300">
                                                        {interesesFinal}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .vertical-text {
                    display: block;
                    text-align: center;
                    line-height: 1.2;
                    margin-bottom: 2px;
                    height: auto;
                }
                
                @media (max-width: 1024px) {
                    .vertical-text {
                        display: inline-block;
                        margin-bottom: 0;
                        margin-right: 4px;
                    }
                }
            `}</style>
        </div>
    );
}