import { useEffect } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import {
    fetchGetNomPrestamo,
    fetchTipodeproductoPrestamo,
    fetchTipoCuota,
    fetchFrecuenciaPago,
    fetchTipoCondicionPago,
} from "../../api/SimuladorApi";

// Importar el componente PDF
import CronogramaPagosPDF from './PdfcronogramaSimulado';
// Importar el custom hook
import { useCalculadoraCreditos } from "./funtionauxiliar";

export default function CalculadoraCreditos() {
    const Notification = useNotifications();
    
    // Usar el custom hook para obtener todos los estados y funciones
    const {
        // Estados
        formData,
        setFormData,
        montoError,
        plazoError,
        prestamos,
        setPrestamos,
        productos,
        setProductos,
        cuotas,
        setCuotas,
        frecuencias,
        setFrecuencias,
        condicionesPago,
        setCondicionesPago,
        loading,
        setLoading,
        valoresCalculados,
        cronogramaData,
        mostrarCronograma,
        setMostrarCronograma,
        inputRefs,
        userModifiedFirstPaymentDate,
        setUserModifiedFirstPaymentDate,
        
        // Funciones de navegación móvil
        handleEnter,
        handleFieldBlur,
        handleFormKeyDown,
        handleSelectChangeWithMobileAdvance,
        handleDNIBlur,
        
        // Funciones de manejo del formulario
        handleInputChange,
        handleMontoChange,
        handlePlazoChange,
        handleTEMChange,
        
        // Funciones principales de la calculadora
        calcularValoresCuota,
        recalcularValoresPorTEM,
        generarCronograma,
        handleMonedaChange,
        handleTipoCalendarioChange,
        handleFechaPrimerPagoChange,
        handleFechaDesdeChange,
        loadMontoMinMax,
        loadPlazoMinMax
    } = useCalculadoraCreditos();


    // Carga inicial de datos por defecto
    useEffect(() => {
        const loadDefaultData = async () => {
            if (cuotas.length > 0 && condicionesPago.length > 0) return;
            try {
                setLoading(true);
                const [cuotasData, condicionesData] = await Promise.all([
                    fetchTipoCuota(),
                    fetchTipoCondicionPago()
                ]);

                // Procesar cuotas
                const cuotasArray = Array.isArray(cuotasData) ? cuotasData : [cuotasData];
                setCuotas(cuotasArray);
                if (cuotasArray.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        cuota_tipo: cuotasArray[0].TIPO_CUOTA,
                        cuota_nombre: cuotasArray[0].NOM_CUOTA
                    }));
                }

                // Procesar condiciones de pago
                const condicionesArray = Array.isArray(condicionesData) ? condicionesData : [condicionesData];
                setCondicionesPago(condicionesArray);
                if (condicionesArray.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        pago_tipo: condicionesArray[0].TIPO_CONDIPAGO,
                        pago_nombre: condicionesArray[0].NOM_CONDIPAGO
                    }));
                }
            } catch (error) {
                Notification.error('Error al cargar datos iniciales');
            } finally {
                setLoading(false);
            }
        };
        loadDefaultData();
    }, []);

    


    // Efectos para carga de datos dependientes
    useEffect(() => { if (formData.prestamo_id && formData.producto_codigo && formData.frecuencia_codigo) loadMontoMinMax(); }, [formData.prestamo_id, formData.producto_codigo, formData.frecuencia_codigo, formData.moneda_codigo]);
    useEffect(() => { if (formData.Monto_solicitado && parseFloat(formData.Monto_solicitado) > 0) loadPlazoMinMax(); }, [formData.Monto_solicitado]);
    //useEffect(() => { if (formData.Nro_cuotas && parseInt(formData.Nro_cuotas) > 0) loadTeaMinMax(); }, [formData.Nro_cuotas]);

    // Efecto para calcular valores automáticamente
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.prestamo_id && formData.producto_codigo && formData.frecuencia_codigo &&
                formData.Monto_solicitado && formData.Nro_cuotas && formData.cuota_tipo &&
                formData.pago_tipo && !montoError && !plazoError &&
                parseFloat(formData.Monto_solicitado) > 0 && parseInt(formData.Nro_cuotas) > 0) {
                
                // Siempre recalcular cuando cambien monto o cuotas (incluso después del cálculo inicial)
                calcularValoresCuota();
            }
        }, 500); // Delay para evitar llamadas excesivas

        return () => clearTimeout(timer);
    }, [formData.prestamo_id, formData.producto_codigo, formData.frecuencia_codigo,
        formData.Monto_solicitado, formData.Nro_cuotas, formData.cuota_tipo,
        formData.pago_tipo, formData.moneda_codigo, formData.desde,
        formData.tipoCalendario_codigo, montoError, plazoError]);

    // 🔄 NUEVO EFECTO: Cuando el usuario cambia manualmente la fecha del primer pago, recalcular valores
    useEffect(() => {
        if (userModifiedFirstPaymentDate && valoresCalculados &&
            formData.prestamo_id && formData.producto_codigo && formData.frecuencia_codigo &&
            formData.Monto_solicitado && formData.Nro_cuotas && formData.cuota_tipo &&
            formData.pago_tipo && !montoError && !plazoError &&
            parseFloat(formData.Monto_solicitado) > 0 && parseInt(formData.Nro_cuotas) > 0) {
            
            const timer = setTimeout(() => {
                // Recalcular valores con la nueva fecha seleccionada por el usuario
                calcularValoresCuota();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [userModifiedFirstPaymentDate, formData.fecha_1er_pago]);

    // Efecto para recalcular cuando cambie solo el TEM (sin cambiar monto/cuotas)
    useEffect(() => {
        if (valoresCalculados && formData.TEM && parseFloat(formData.TEM) > 0) {
            // Solo usar recálculo por TEM si los campos principales no han cambiado
            const timer = setTimeout(() => {
                // Verificar que todos los campos principales estén completos
                if (formData.prestamo_id && formData.producto_codigo && formData.frecuencia_codigo &&
                    formData.Monto_solicitado && formData.Nro_cuotas &&
                    parseFloat(formData.Monto_solicitado) > 0 && parseInt(formData.Nro_cuotas) > 0) {
                    recalcularValoresPorTEM(formData.TEM);
                }
            }, 800); // Delay mayor para evitar conflictos con el useEffect principal

            return () => clearTimeout(timer);
        }
    }, [formData.TEM]);

    // Función para cargar préstamos desde la DB
    const loadPrestamos = async () => {
        try {
            setLoading(true);
            const prestamosData = await fetchGetNomPrestamo();
            setPrestamos(prestamosData);
        } catch (error) {
            Notification.error('Error al cargar tipos de préstamo');
        } finally {
            setLoading(false);
        }
    };

    // ✅ CORREGIDO: handlePrestamoChange CON avance automático en móvil
    const handlePrestamoChange = async (prestamoId: string) => {
        const prestamoSeleccionado = prestamos.find(p => p.ID_VALOR === prestamoId);
        if (prestamoSeleccionado) {
            setFormData(prev => ({
                ...prev,
                prestamo_id: prestamoSeleccionado.ID_VALOR,
                prestamo_nombre: prestamoSeleccionado.NOM_SUBTIPO_PRES,
                producto_codigo: '',
                producto_nombre: '',
                frecuencia_codigo: '',
                frecuencia_nombre: ''
            }));
            // Resetear el flag para que la fecha del primer pago se recalcule automáticamente
            setUserModifiedFirstPaymentDate(false);
            await loadProductos(prestamoSeleccionado.ID_VALOR);
        }
    };

    const loadProductos = async (prestamoId: string) => {
        try {
            setLoading(true);
            const productosData = await fetchTipodeproductoPrestamo(prestamoId);
            setProductos(productosData);
        } catch (error) {
            Notification.error('Error al cargar tipos de producto');
        } finally {
            setLoading(false);
        }
    };

    // ✅ CORREGIDO: handleProductoChange SIN avance automático forzado en móvil
    const handleProductoChange = async (productoCodigo: string) => {
        const productoSeleccionado = productos.find(p => p.TIPO_PROD === productoCodigo);
        if (productoSeleccionado) {
            setFormData(prev => ({
                ...prev,
                producto_codigo: productoSeleccionado.TIPO_PROD,
                producto_nombre: productoSeleccionado.NOMBRE,
                frecuencia_codigo: '',
                frecuencia_nombre: ''
            }));
            // Resetear el flag para que la fecha del primer pago se recalcule automáticamente
            setUserModifiedFirstPaymentDate(false);
            if (formData.prestamo_id) {
                await loadFrecuencias(formData.prestamo_id, productoCodigo);
            }
            
            // ❌ ELIMINADO: El avance automático en móvil
            // Los <select> funcionan perfectamente sin forzar el focus
        }
    };

    const loadFrecuencias = async (prestamoId: string, productoCodigo: string) => {
        try {
            setLoading(true);
            const frecuenciasData = await fetchFrecuenciaPago(prestamoId, productoCodigo);
            setFrecuencias(frecuenciasData);
        } catch (error) {
            Notification.error('Error al cargar frecuencias de pago');
        } finally {
            setLoading(false);
        }
    };

    // ✅ CORREGIDO: handleFrecuenciaChange SIN avance automático forzado en móvil
    const handleFrecuenciaChange = (frecuenciaCodigo: string) => {
        const frecuenciaSeleccionada = frecuencias.find(f => f.COD_FREC === frecuenciaCodigo);
        if (frecuenciaSeleccionada) {
            setFormData(prev => ({
                ...prev,
                frecuencia_codigo: frecuenciaSeleccionada.COD_FREC,
                frecuencia_nombre: frecuenciaSeleccionada.DES_FREC
            }));
            // Resetear el flag para que la fecha del primer pago se recalcule automáticamente
            setUserModifiedFirstPaymentDate(false);
            
            // ❌ ELIMINADO: El avance automático en móvil
            // Los <select> funcionan perfectamente sin forzar el focus
        }
    };


    // Clases para inputs y labels
    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "text-sm font-medium";

    // JSX del componente
    return (
        <div
            className='w-full h-full p-6 bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg rounded-lg overflow-auto'
            onKeyDown={handleFormKeyDown}
        >
            {/* Sección de Moneda */}
            <div className="bg-blue-400 -mx-6 -mt-6 mb-6 p-4 rounded-t-lg">
                <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">Moneda ({formData.moneda_codigo})</span>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                ref={(el) => inputRefs.current[0] = el}
                                type="radio"
                                name="moneda"
                                value="PEN"
                                checked={formData.moneda === "PEN"}
                                onChange={(e) => handleMonedaChange(e.target.value)}
                                onKeyDown={(e) => handleEnter(e, 0)}
                            />
                            Soles (S)
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                ref={(el) => inputRefs.current[1] = el}
                                type="radio"
                                name="moneda"
                                value="USD"
                                checked={formData.moneda === "USD"}
                                onChange={(e) => handleMonedaChange(e.target.value)}
                                onKeyDown={(e) => handleEnter(e, 1)}
                            />
                            Dólares (D)
                        </label>
                    </div>
                </div>
            </div>

            {/* Sección de DNI y Razón Social */}
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-2 mb-6 items-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className={`w-full sm:w-20 ${labelClass}`}>DNI</label>
                    <input
                        ref={(el) => inputRefs.current[2] = el}
                        type="text"
                        value={formData.dni}
                        onChange={(e) => handleInputChange('dni', e.target.value)}
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' && formData.dni.trim()) {
                                loadPrestamos(); // Cargar préstamos al presionar Enter
                            }
                            handleEnter(e, 2); 
                        }}
                        onBlur={() => {
                            handleFieldBlur(2, true);
                            handleDNIBlur(loadPrestamos);
                        }}
                        className={inputClass}
                        placeholder="Ingrese DNI y presione Enter"
                    />
                </div>
                <input
                    ref={(el) => inputRefs.current[3] = el}
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    className={`${inputClass} w-full`}
                    placeholder="Razón Social"
                    onKeyDown={(e) => handleEnter(e, 3)}
                    onBlur={() => handleFieldBlur(3, true)}
                />
                <button
                    className="px-3 py-2 bg-gray-200 border border-gray-300 rounded text-sm hover:bg-gray-300 transition-colors whitespace-nowrap"
                    disabled
                >
                    {formData.dni}
                </button>
            </div>

            {/* Indicador de carga */}
            {loading && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded text-center">
                    <span className="text-blue-600">⏳ Cargando datos...</span>
                </div>
            )}

            {/* Sección de Préstamo y Producto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Préstamo</label>
                    <select
                        ref={(el) => inputRefs.current[4] = el}
                        value={formData.prestamo_id}
                        onChange={(e) => {
                            handleSelectChangeWithMobileAdvance(4, () => {
                                handlePrestamoChange(e.target.value);
                            });
                        }}
                        onBlur={() => handleFieldBlur(4, false)}
                        className={inputClass}
                        disabled={loading || prestamos.length === 0}
                        onKeyDown={(e) => handleEnter(e, 4)}
                    >
                        <option value="">
                            {prestamos.length === 0 ? "Presione Enter en DNI para cargar..." : "Seleccione un préstamo"}
                        </option>
                        {prestamos.map((prestamo) => (
                            <option key={prestamo.ID_VALOR} value={prestamo.ID_VALOR}>
                                {prestamo.NOM_SUBTIPO_PRES}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Producto</label>
                    <select
                        ref={(el) => inputRefs.current[5] = el}
                        value={formData.producto_codigo}
                        onChange={(e) => {
                            handleSelectChangeWithMobileAdvance(5, () => {
                                handleProductoChange(e.target.value);
                            });
                        }}
                        onBlur={() => handleFieldBlur(5, false)}
                        className={inputClass}
                        disabled={loading || productos.length === 0}
                        onKeyDown={(e) => handleEnter(e, 5)}
                    >
                        <option value="">
                            {productos.length === 0 ? "Seleccione primero un préstamo" : "Seleccione un producto"}
                        </option>
                        {productos.map((producto) => (
                            <option key={producto.TIPO_PROD} value={producto.TIPO_PROD}>
                                {producto.NOMBRE}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sección de Cuota y Frecuencia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Cuota</label>
                    {/* ✅ CORREGIDO: onBlur con false para NO validar Enter */}
                    <select
                        ref={(el) => inputRefs.current[6] = el}
                        value={formData.cuota_tipo}
                        onChange={(e) => {
                            handleSelectChangeWithMobileAdvance(6, () => {
                                const cuotaSeleccionada = cuotas.find(c => c.TIPO_CUOTA === e.target.value);
                                if (cuotaSeleccionada) {
                                    setFormData(prev => ({
                                        ...prev,
                                        cuota_tipo: cuotaSeleccionada.TIPO_CUOTA,
                                        cuota_nombre: cuotaSeleccionada.NOM_CUOTA
                                    }));
                                }
                            });
                        }}
                        onBlur={() => handleFieldBlur(6, false)}
                        className={inputClass}
                        disabled={loading || cuotas.length === 0}
                        onKeyDown={(e) => handleEnter(e, 6)}
                    >
                        <option value="">Seleccione tipo de cuota</option>
                        {cuotas.map((cuota) => (
                            <option key={cuota.TIPO_CUOTA} value={cuota.TIPO_CUOTA}>
                                {cuota.NOM_CUOTA}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-24 ${labelClass}`}>Frecuencia</label>
                    <select
                        ref={(el) => inputRefs.current[7] = el}
                        value={formData.frecuencia_codigo}
                        onChange={(e) => {
                            handleSelectChangeWithMobileAdvance(7, () => {
                                handleFrecuenciaChange(e.target.value);
                            });
                        }}
                        onBlur={() => handleFieldBlur(7, false)}
                        className={inputClass}
                        disabled={loading || frecuencias.length === 0}
                        onKeyDown={(e) => handleEnter(e, 7)}
                    >
                        <option value="">
                            {frecuencias.length === 0 ? "Seleccione préstamo y producto" : "Seleccione frecuencia"}
                        </option>
                        {frecuencias.map((frecuencia) => (
                            <option key={frecuencia.COD_FREC} value={frecuencia.COD_FREC}>
                                {frecuencia.DES_FREC}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sección de Condición de Pago */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-20 ${labelClass}`}>Pago</label>
                    {/* ✅ CORREGIDO: onBlur con false para NO validar Enter */}
                    <select
                        ref={(el) => inputRefs.current[8] = el}
                        value={formData.pago_tipo}
                        onChange={(e) => {
                            handleSelectChangeWithMobileAdvance(8, () => {
                                const pagoSeleccionado = condicionesPago.find(p => p.TIPO_CONDIPAGO === e.target.value);
                                if (pagoSeleccionado) {
                                    setFormData(prev => ({
                                        ...prev,
                                        pago_tipo: pagoSeleccionado.TIPO_CONDIPAGO,
                                        pago_nombre: pagoSeleccionado.NOM_CONDIPAGO
                                    }));
                                }
                            });
                        }}
                        onBlur={() => handleFieldBlur(8, false)}
                        className={inputClass}
                        disabled={loading || condicionesPago.length === 0}
                        onKeyDown={(e) => handleEnter(e, 8)}
                    >
                        <option value="">Seleccione condición de pago</option>
                        {condicionesPago.map((condicion) => (
                            <option key={condicion.TIPO_CONDIPAGO} value={condicion.TIPO_CONDIPAGO}>
                                {condicion.NOM_CONDIPAGO}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sección de Fechas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-16 ${labelClass}`}>Desde</label>
                    <input
                        ref={(el) => inputRefs.current[9] = el}
                        type="date"
                        value={formData.desde}
                        onChange={(e) => handleFechaDesdeChange(e.target.value)}
                        className={inputClass}
                        max="2099-12-31"
                        onKeyDown={(e) => handleEnter(e, 9)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <label className={`w-full sm:w-32 ${labelClass}`}>Fecha 1er Pago</label>
                    <input
                        ref={(el) => inputRefs.current[10] = el}
                        type="date"
                        value={formData.fecha_1er_pago}
                        onChange={(e) => handleFechaPrimerPagoChange(e.target.value)}
                        className={inputClass}
                        min={formData.desde}
                        onKeyDown={(e) => handleEnter(e, 10)}
                    />
                </div>
            </div>

            {/* Sección de Tipo de Calendario */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <span className="text-sm font-medium text-gray-700">Tipo de Calendario ({formData.tipoCalendario_codigo}):</span>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input
                            ref={(el) => inputRefs.current[11] = el}
                            type="radio"
                            name="tipoCalendario"
                            value="DiaFijo"
                            checked={formData.tipoCalendarioPago === "DiaFijo"}
                            onChange={(e) => handleTipoCalendarioChange(e.target.value)}
                            className="w-4 h-4"
                            onKeyDown={(e) => handleEnter(e, 11)}
                        />
                        <span className="text-sm font-medium select-none">Día Fijo (F)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input
                            ref={(el) => inputRefs.current[12] = el}
                            type="radio"
                            name="tipoCalendario"
                            value="DiaVariable"
                            checked={formData.tipoCalendarioPago === "DiaVariable"}
                            onChange={(e) => handleTipoCalendarioChange(e.target.value)}
                            className="w-4 h-4"
                            onKeyDown={(e) => handleEnter(e, 12)}
                        />
                        <span className="text-sm font-medium select-none">Día Variable (V)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                        <input
                            ref={(el) => inputRefs.current[13] = el}
                            type="radio"
                            name="tipoCalendario"
                            value="FinMes"
                            checked={formData.tipoCalendarioPago === "FinMes"}
                            onChange={(e) => handleTipoCalendarioChange(e.target.value)}
                            className="w-4 h-4"
                            onKeyDown={(e) => handleEnter(e, 13)}
                        />
                        <span className="text-sm font-medium select-none">Fin de Mes (M)</span>
                    </label>
                </div>
            </div>

            {/* Sección de Monto Solicitado */}
            <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px,auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">💰 Monto Solicitado</label>
                        <input
                            ref={(el) => inputRefs.current[14] = el}
                            type="number"
                            value={formData.Monto_solicitado}
                            onChange={(e) => handleMontoChange(e.target.value)}
                            className={`${inputClass} text-center font-semibold ${montoError ? 'border-red-500 bg-red-50' : ''}`}
                            step="0.01"
                            min={formData.monto_minimo}
                            max={formData.monto_maximo}
                            placeholder="Ej: 5000"
                            onKeyDown={(e) => handleEnter(e, 14)}
                            onBlur={() => handleFieldBlur(14, true)}
                        />
                        {montoError && (
                            <div className="mt-1 text-xs text-red-600 font-medium">
                                ⚠️ {montoError}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Monto Mínimo</span>
                            <div className="px-3 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 min-w-[80px]">
                                {formData.monto_minimo}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Monto Máximo</span>
                            <div className="px-3 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 min-w-[80px]">
                                {formData.monto_maximo}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Número de Cuotas */}
            <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px,auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">📅 Nro de Cuotas a Pagar</label>
                        <input
                            ref={(el) => inputRefs.current[15] = el}
                            type="number"
                            value={formData.Nro_cuotas}
                            onChange={(e) => handlePlazoChange(e.target.value)}
                            className={`${inputClass} text-center font-semibold ${plazoError ? 'border-red-500 bg-red-50' : ''}`}
                            min={formData.plazo_minimo}
                            max={formData.plazo_maximo}
                            placeholder="Ej: 24"
                            onKeyDown={(e) => handleEnter(e, 15)}
                            onBlur={() => handleFieldBlur(15, true)}
                        />
                        {plazoError && (
                            <div className="mt-1 text-xs text-red-600 font-medium">
                                ⚠️ {plazoError}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Plazo Mínimo</span>
                            <div className="px-3 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 min-w-[80px]">
                                {formData.plazo_minimo}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">Plazo Máximo</span>
                            <div className="px-3 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 min-w-[80px]">
                                {formData.plazo_maximo}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Valor Cuota */}
            <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px,auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">💵 Valor Cuota</label>
                        <input
                            ref={(el) => inputRefs.current[16] = el}
                            type="number"
                            value={formData.valor_cuota}
                            onChange={(e) => handleInputChange('valor_cuota', e.target.value)}
                            className={`${inputClass} text-center font-semibold`}
                            step="0.01"
                            onKeyDown={(e) => handleEnter(e, 16)}
                        />
                    </div>
                    <div></div>
                </div>
            </div>

            {/* Sección de TEA */}
            <div className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px,auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">📊 TEA %</label>
                        <input
                            ref={(el) => inputRefs.current[17] = el}
                            type="number"
                            value={formData.TEA}
                            onChange={(e) => handleInputChange('TEA', e.target.value)}
                            className={`${inputClass} text-center font-semibold`}
                            step="0.01"
                            onKeyDown={(e) => handleEnter(e, 17)}
                        />
                    </div>
                    <div></div>
                </div>
            </div>

            {/* Sección de TEM */}
            <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-[300px,auto] gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">
                            📈 TEM % {valoresCalculados && <span className="text-green-600 text-xs">(✏️ Editable)</span>}
                        </label>
                        <input
                            ref={(el) => inputRefs.current[18] = el}
                            type="number"
                            value={formData.TEM}
                            onChange={(e) => handleTEMChange(e.target.value)}
                            className={`${inputClass} text-center font-semibold ${valoresCalculados ? 'bg-yellow-50 border-yellow-400' : ''}`}
                            step="0.01"
                            onKeyDown={(e) => handleEnter(e, 18)}
                            onBlur={() => handleFieldBlur(18, false)}
                            min={formData.TEM_minimo}
                            max={formData.TEM_maximo}
                            title={valoresCalculados ? "Campo editable: Los valores se recalcularán automáticamente" : "Calculado automáticamente"}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">TEM Mínimo</span>
                            <div className="px-3 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700 min-w-[80px]">
                                {formData.TEM_minimo}
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="block text-xs text-gray-500 mb-1">TEM Máximo</span>
                            <div className="px-3 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 min-w-[80px]">
                                {formData.TEM_maximo}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón de Generar Cronograma */}
            <div className="text-center">
                <button
                    onClick={generarCronograma}
                    disabled={loading || !valoresCalculados || montoError !== '' || plazoError !== ''}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold border border-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {loading ? '⏳ Generando...' : '📋 Generar Cronograma'}
                </button>
            </div>

            {/* Modal PDF del Cronograma */}
            {mostrarCronograma && cronogramaData && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setMostrarCronograma(false)}
                        ></div>

                        {/* Modal */}
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Cronograma de Pagos
                                    </h3>
                                    <button
                                        onClick={() => setMostrarCronograma(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                                <CronogramaPagosPDF datos={cronogramaData} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}