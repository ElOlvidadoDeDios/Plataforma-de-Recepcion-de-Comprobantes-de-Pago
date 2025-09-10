import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";


const Notification = useNotifications();

export default function CalculadoraCreditos() {
    const [formData, setFormData] = useState({
        moneda: "PEN",
        dni: '75654687',
        razon_social: '',
        prestamo: 'CONSUMO NO-REVOLVENTE',
        producto: 'PAGA DIARIO (CT)',
        cuota: 'FIJA',
        frecuencia: '',
        pago: 'Caja',
        desde: '2025-08-01',
        fecha_1er_pago: '2025-08-31',
        tipoCalendarioPago: 'DiaFijo',
        Monto_solicitado: '14906.88',
        monto_minimo: '1',
        monto_maximo: '1',
        Nro_cuotas: '0',
        plazo_maximo: '1',
        plazo_minimo: '1',
        valor_cuota: '0.00',
        TEA: '0.00',
        TEM: '0.00',
        TEM_minimo: '1',
        TEM_maximo: '1'
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            Notification.success('Datos guardados correctamente');
        } catch (error) {
            Notification.error('Error al guardar los datos');
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "text-sm font-medium";

    return (
        <div className='w-full h-full p-6 bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg rounded-lg overflow-auto'>
            <div className="bg-blue-400 -mx-6 -mt-6 mb-6 p-4 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">Moneda</span>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="moneda" value="PEN" checked={formData.moneda === "PEN"} onChange={(e) => handleInputChange('moneda', e.target.value)} />
                            Soles
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="moneda" value="USD" checked={formData.moneda === "USD"} onChange={(e) => handleInputChange('moneda', e.target.value)} />
                            Dólares
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-2 mb-6 items-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className={`w-full sm:w-20 ${labelClass}`}>DNI</label>
                    <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className={inputClass}
                    placeholder="Ingrese DNI"
                    />
                </div>
                <input
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    className={`${inputClass} w-full`}
                    placeholder="Razón Social"
                />
                <button
                    className="px-3 py-2 bg-gray-200 border border-gray-300 rounded text-sm hover:bg-gray-300 transition-colors whitespace-nowrap"
                    disabled
                >
                    {formData.dni }
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Préstamo</label>
                    <select value={formData.prestamo} onChange={(e) => handleInputChange('prestamo', e.target.value)} className={inputClass}>
                        <option value="CONSUMO NO-REVOLVENTE">CONSUMO NO-REVOLVENTE</option>
                        <option value="CONSUMO REVOLVENTE">CONSUMO REVOLVENTE</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Producto</label>
                    <select value={formData.producto} onChange={(e) => handleInputChange('producto', e.target.value)} className={inputClass}>
                        <option value="PAGA DIARIO (CT)">PAGA DIARIO (CT)</option>
                        <option value="PAGA SEMANAL">PAGA SEMANAL</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Cuota</label>
                    <select value={formData.cuota} onChange={(e) => handleInputChange('cuota', e.target.value)} className={inputClass}>
                        <option value="FIJA">FIJA</option>
                        <option value="VARIABLE">VARIABLE</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-24 ${labelClass}`}>Frecuencia</label>
                    <select value={formData.frecuencia} onChange={(e) => handleInputChange('frecuencia', e.target.value)} className={inputClass}>
                        <option value="">Seleccionar...</option>
                        <option value="DIARIA">DIARIA</option>
                        <option value="SEMANAL">SEMANAL</option>
                        <option value="MENSUAL">MENSUAL</option>
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Pago</label>
                    <select value={formData.pago} onChange={(e) => handleInputChange('pago', e.target.value)} className={inputClass}>
                        <option value="Caja">Caja</option>
                        <option value="Banco">Banco</option>
                        <option value="Descuento por planilla">Descuento por planilla</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-16 ${labelClass}`}>Desde</label>
                    <input type="date" value={formData.desde} onChange={(e) => handleInputChange('desde', e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-32 ${labelClass}`}>Fecha 1er Pago</label>
                    <input type="date" value={formData.fecha_1er_pago} onChange={(e) => handleInputChange('fecha_1er_pago', e.target.value)} className={inputClass} />
                </div>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input type="radio" name="tipoCalendario" value="DiaFijo" checked={formData.tipoCalendarioPago === "DiaFijo"} onChange={(e) => handleInputChange('tipoCalendarioPago', e.target.value)} className="w-4 h-4" />
                        <span className="text-sm font-medium select-none">Día Fijo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input type="radio" name="tipoCalendario" value="DiaVariable" checked={formData.tipoCalendarioPago === "DiaVariable"} onChange={(e) => handleInputChange('tipoCalendarioPago', e.target.value)} className="w-4 h-4" />
                        <span className="text-sm font-medium select-none">Día Variable (c/30 d)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input type="radio" name="tipoCalendario" value="FinMes" checked={formData.tipoCalendarioPago === "FinMes"} onChange={(e) => handleInputChange('tipoCalendarioPago', e.target.value)} className="w-4 h-4" />
                        <span className="text-sm font-medium select-none">Fin de Mes</span>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2 text-center">Monto Solicitado</label>
                    <input type="number" value={formData.Monto_solicitado} onChange={(e) => handleInputChange('Monto_solicitado', e.target.value)} className={inputClass} step="0.01" />
                </div>
                <div className="col-span-1">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-center text-gray-600">Monto Mínimo</label>
                            <input type="number" value={formData.monto_minimo} onChange={(e) => handleInputChange('monto_minimo', e.target.value)} className={inputClass} step="0.01" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 text-center text-gray-600">Monto Máximo</label>
                            <input type="number" value={formData.monto_maximo} onChange={(e) => handleInputChange('monto_maximo', e.target.value)} className={inputClass} step="0.01" />
                        </div>
                    </div>
                </div>
                <div className="col-span-1">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-center text-gray-600">Plazo Mínimo</label>
                            <input type="number" value={formData.plazo_minimo} onChange={(e) => handleInputChange('plazo_minimo', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1 text-center text-gray-600">Plazo Máximo</label>
                            <input type="number" value={formData.plazo_maximo} onChange={(e) => handleInputChange('plazo_maximo', e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-40 ${labelClass}`}>Nro de Cuotas a Pagar</label>
                    <input type="number" value={formData.Nro_cuotas} onChange={(e) => handleInputChange('Nro_cuotas', e.target.value)} className={inputClass} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-24 ${labelClass}`}>Valor Cuota</label>
                    <input type="number" value={formData.valor_cuota} onChange={(e) => handleInputChange('valor_cuota', e.target.value)} className={inputClass} step="0.01" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-16 ${labelClass}`}>TEA %</label>
                    <input type="number" value={formData.TEA} onChange={(e) => handleInputChange('TEA', e.target.value)} className={inputClass} step="0.01" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-16 ${labelClass}`}>TEM %</label>
                    <input type="number" value={formData.TEM} onChange={(e) => handleInputChange('TEM', e.target.value)} className={inputClass} step="0.01" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div>
                    <label className="block text-sm font-medium mb-2 text-center">TEM Mínimo</label>
                    <input type="number" value={formData.TEM_minimo} onChange={(e) => handleInputChange('TEM_minimo', e.target.value)} className={inputClass} step="0.01" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-center">TEM Máximo</label>
                    <input type="number" value={formData.TEM_maximo} onChange={(e) => handleInputChange('TEM_maximo', e.target.value)} className={inputClass} step="0.01" />
                </div>
            </div>

            <div className="text-center">
                <button onClick={handleSubmit} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold border border-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Imprimir
                </button>
            </div>
        </div>
    );
}
