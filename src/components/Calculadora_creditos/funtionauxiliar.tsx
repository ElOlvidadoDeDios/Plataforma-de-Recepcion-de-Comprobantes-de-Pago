import { useContext, useRef, useState } from "react";
import { fetchActualizarCuota, fetchMontoMinimoMaximo, fetchObtenerCronogramaSimulado, fetchPlazoMinimoMaximo, fetchValorCuota, FrecuenciaPago, GetNomPrestamo, Monto_minimo_maximoRequest, Nombrecuota, ObtenerCronogramaSimuladoRequest, ObtenerCronogramaSimuladoResponse, Plazo_minimo_maximoRequest, Recalcularcuotarequest, Tipocondicionpago, TipoProductoPrestamo, Valor_cuotaRequest } from "../../api/SimuladorApi";
import { AuthContext } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";

// CUSTOM HOOK PARA CALCULADORA DE CRÉDITOS
export const useCalculadoraCreditos = () => {
    const Notification = useNotifications();
    
    // 🔐 OBTENER DATOS DEL USUARIO DESDE AUTH CONTEXT
    const { user } = useContext(AuthContext);
    
    // Funciones auxiliares para fechas
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Estado principal del formulario
    const [formData, setFormData] = useState({
        moneda: "PEN",
        moneda_codigo: "S",
        dni: '12345678',
        razon_social: '',
        prestamo: '',
        prestamo_id: '',
        prestamo_nombre: '',
        producto: '',
        producto_codigo: '',
        producto_nombre: '',
        cuota: '',
        cuota_tipo: '',
        cuota_nombre: '',
        frecuencia: '',
        frecuencia_codigo: '',
        frecuencia_nombre: '',
        pago: '',
        pago_tipo: '',
        pago_nombre: '',
        desde: getTodayDate(),
        fecha_1er_pago: getTomorrowDate(),
        tipoCalendarioPago: 'DiaFijo',
        tipoCalendario_codigo: 'F',
        Monto_solicitado: '',
        monto_minimo: '1',
        monto_maximo: '1',
        Nro_cuotas: '',
        plazo_maximo: '1',
        plazo_minimo: '1',
        valor_cuota: '0.00',
        cuota_real: '0.00',
        TEA: '0.00',
        TEM: '0.00',
        TEM_minimo: '1',
        TEM_maximo: '1'
    });

    // Estado para validaciones
    const [montoError, setMontoError] = useState<string>('');
    const [plazoError, setPlazoError] = useState<string>('');

    // Estados para opciones de combos
    const [prestamos, setPrestamos] = useState<GetNomPrestamo[]>([]);
    const [productos, setProductos] = useState<TipoProductoPrestamo[]>([]);
    const [cuotas, setCuotas] = useState<Nombrecuota[]>([]);
    const [frecuencias, setFrecuencias] = useState<FrecuenciaPago[]>([]);
    const [condicionesPago, setCondicionesPago] = useState<Tipocondicionpago[]>([]);
    const [loading, setLoading] = useState(false);

    // Estado para controlar si ya se calcularon los valores iniciales
    const [valoresCalculados, setValoresCalculados] = useState(false);
    
    // Estados para cronograma PDF
    const [cronogramaData, setCronogramaData] = useState<ObtenerCronogramaSimuladoResponse[] | null>(null);
    const [mostrarCronograma, setMostrarCronograma] = useState(false);

    // Referencias para manejo de enfoque
    const inputRefs = useRef<(HTMLElement | null)[]>([]);

    // 📱 MANEJO MEJORADO DE EVENTOS PARA MÓVIL - VERSIÓN ROBUSTA
    const isMobile = () => {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.innerWidth <= 768
        );
    };

    // Función para enfocar el siguiente campo (más robusta)
    const focusNextField = (currentIndex: number) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
            const nextField = inputRefs.current[nextIndex];
            
            // Método más agresivo para móvil
            if (isMobile()) {
                setTimeout(() => {
                    try {
                        nextField?.focus();
                        nextField?.click();
                        nextField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (error) {
                        console.log('Error focusing field:', error);
                    }
                }, 150);
                
                setTimeout(() => {
                    try {
                        if (document.activeElement !== nextField) {
                            nextField?.focus();
                            if (nextField && (nextField as HTMLInputElement).select) {
                                (nextField as HTMLInputElement).select();
                            }
                        }
                    } catch (error) {
                        console.log('Second focus attempt failed:', error);
                    }
                }, 300);
            } else {
                nextField?.focus();
            }
        } else {
            if (inputRefs.current[currentIndex]) {
                inputRefs.current[currentIndex]?.blur();
            }
        }
    };

    // Manejo de evento Enter optimizado
    const handleEnter = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            focusNextField(index);
        }
    };

    // Avance automático más agresivo para selects en móvil
    const autoAdvanceOnMobile = (currentIndex: number) => {
        if (isMobile()) {
            setTimeout(() => focusNextField(currentIndex), 100);
            setTimeout(() => focusNextField(currentIndex), 300);
            setTimeout(() => focusNextField(currentIndex), 500);
        }
    };

    // Manejo de onBlur mejorado
    const handleFieldBlur = (currentIndex: number, shouldAdvance: boolean = false) => {
        if (shouldAdvance && isMobile()) {
            const currentField = inputRefs.current[currentIndex];
            if (currentField) {
                const fieldValue = (currentField as HTMLInputElement | HTMLSelectElement).value;
                if (fieldValue && fieldValue.trim() !== '') {
                    setTimeout(() => {
                        focusNextField(currentIndex);
                    }, 200);
                }
            }
        }
    };

    // ✅ NUEVA FUNCIÓN: Manejar el onChange de selects en móvil
    const handleSelectChangeWithMobileAdvance = (currentIndex: number, callback: () => void) => {
        // Ejecutar el callback del onChange
        callback();
        
        // Si es móvil, avanzar al siguiente campo después de seleccionar
        if (isMobile()) {
            setTimeout(() => {
                focusNextField(currentIndex);
            }, 300); // Dar tiempo para que se actualice el estado
        }
    };

    // ✅ NUEVA FUNCIÓN: Manejar onBlur del DNI para cargar préstamos en móvil
    const handleDNIBlur = (loadPrestamosCallback: () => void) => {
        // Si es móvil y el DNI tiene contenido, cargar préstamos automáticamente
        if (isMobile() && formData.dni && formData.dni.trim().length > 0) {
            setTimeout(() => {
                loadPrestamosCallback();
            }, 200);
        }
    };

    // Prevenir envío accidental del formulario
    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.target) {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };

    // Manejo de cambios en el formulario
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Validación de monto solicitado
    const handleMontoChange = (value: string) => {
        setFormData(prev => ({ ...prev, Monto_solicitado: value }));
        
        if (!value.trim()) {
            setMontoError('');
            return;
        }
        
        const monto = parseFloat(value);
        const minimo = parseFloat(formData.monto_minimo);
        const maximo = parseFloat(formData.monto_maximo);
        
        if (!isNaN(monto)) {
            if (monto < minimo && minimo > 0) {
                setMontoError(`Monto debe ser mayor o igual a ${formData.monto_minimo}`);
            } else if (monto > maximo && maximo > 0) {
                setMontoError(`Monto debe ser menor o igual a ${formData.monto_maximo}`);
            } else {
                setMontoError('');
            }
        }
    };

    // Validación de número de cuotas (plazo)
    const handlePlazoChange = (value: string) => {
        setFormData(prev => ({ ...prev, Nro_cuotas: value }));
        
        if (!value.trim()) {
            setPlazoError('');
            return;
        }
        
        const plazo = parseInt(value);
        const minimo = parseInt(formData.plazo_minimo);
        const maximo = parseInt(formData.plazo_maximo);
        
        if (!isNaN(plazo)) {
            if (plazo < minimo && minimo > 0) {
                setPlazoError(`Plazo debe ser mayor o igual a ${formData.plazo_minimo} cuotas`);
            } else if (plazo > maximo && maximo > 0) {
                setPlazoError(`Plazo debe ser menor o igual a ${formData.plazo_maximo} cuotas`);
            } else {
                setPlazoError('');
            }
        }
    };

    // Manejo de cambio en TEM
    const handleTEMChange = (value: string) => {
        setFormData(prev => ({ ...prev, TEM: value }));
    };

    // Función auxiliar para convertir fecha a formato datetime de SQL Server
    const formatDateForSQL = (dateString: string): string => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year} 00:00:00`;
    };

    // Calcular valores automáticos (cuota, TEA, TEM)
    const calcularValoresCuota = async () => {
        // Verificar que todos los campos necesarios estén completos
        if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo ||
            !formData.Monto_solicitado || !formData.Nro_cuotas || !formData.cuota_tipo ||
            !formData.pago_tipo || !formData.desde || !formData.fecha_1er_pago) {
            return;
        }

        // Verificar que no haya errores de validación
        if (montoError || plazoError) {
            return;
        }

        try {
            // 🔐 USAR DATOS REALES DEL USUARIO LOGUEADO - USAR user.id_age NO user.agencias
            if (!user || !user.id_age) {
                Notification.error('Usuario no válido o sin código de agencia asignado');
                return;
            }
            
            // Aplicar lógica especial para agencias 06 y 07 → 98
            const agenciaProcesada = (user.id_age === '06' || user.id_age === '07')
                ? '98'
                : user.id_age;

            const requestData: Valor_cuotaRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo,
                PLAZO: parseInt(formData.Nro_cuotas),
                MONTO: parseFloat(formData.Monto_solicitado),
                TIPO_CUOTA: formData.cuota_tipo,
                FECHA_INICIO: formatDateForSQL(formData.desde),
                FECHA_PRI: formatDateForSQL(formData.fecha_1er_pago),
                DIA_FIJO: formData.tipoCalendario_codigo,
                CUENTA: "123456789", // Valor por defecto
                INT_PEND: 0, // Sin intereses pendientes
                TIPO_PAGO: formData.pago_tipo
                // NOTA: Este endpoint no acepta campo USER, solo COD_AGE se usa del usuario logueado
            };

            const valorData = await fetchValorCuota(requestData);

            setFormData(prev => ({
                ...prev,
                valor_cuota: valorData.CUOTA_SEGURO, // Cuota + seguro (para mostrar)
                cuota_real: valorData.CUOTA,         // 🔧 GUARDAR CUOTA REAL (sin seguro) para cronograma
                TEA: valorData.TEA,
                TEM: valorData.TEM,
                TEM_minimo: valorData.VARIA.TEM_MIN,
                TEM_maximo: valorData.VARIA.TEM_MAX
            }));

            // Marcar que ya se calcularon los valores iniciales
            setValoresCalculados(true);
            Notification.success('Valores calculados correctamente');
        } catch (error) {
            console.error('Error calculando valores:', error);
            Notification.error('Error al calcular los valores de la cuota');
        }
    };

    // Función para recalcular valores cuando cambie el TEM
    const recalcularValoresPorTEM = async (nuevoTEM: string) => {
        // Verificar que todos los campos necesarios estén completos
        if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo ||
            !formData.Monto_solicitado || !formData.Nro_cuotas || !formData.cuota_tipo ||
            !formData.pago_tipo || !formData.desde || !formData.fecha_1er_pago || !valoresCalculados) {
            return;
        }

        try {
            // 🔐 USAR DATOS REALES DEL USUARIO LOGUEADO para recálculo - USAR user.id_age
            if (!user || !user.id_age) {
                Notification.error('Usuario no válido o sin código de agencia asignado');
                return;
            }
            
            // Aplicar misma lógica de agencias que en cálculo inicial
            const agenciaProcesada = (user.id_age === '06' || user.id_age === '07')
                ? '98'
                : user.id_age;

            const requestData: Recalcularcuotarequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo,
                PLAZO: parseInt(formData.Nro_cuotas),
                MONTO: parseFloat(formData.Monto_solicitado),
                TIPO_CUOTA: formData.cuota_tipo,
                FECHA_INICIO: formatDateForSQL(formData.desde),
                FECHA_PRI: formatDateForSQL(formData.fecha_1er_pago),
                DIA_FIJO: formData.tipoCalendario_codigo,
                CUENTA: "123456789", // Valor por defecto
                INT_PEND: 0, // Sin intereses pendientes
                TIPO_PAGO: formData.pago_tipo,
                TEM: nuevoTEM
                // NOTA: Este endpoint no acepta campo USER, solo COD_AGE se usa del usuario logueado
            };

            const recalculoData = await fetchActualizarCuota(requestData);

            // Solo actualizar cuota y TEA (no cambiar TEM porque ya lo ingresó el usuario)
            setFormData(prev => ({
                ...prev,
                valor_cuota: recalculoData.CUOTA_SEGURO, // Cuota + seguro (para mostrar)
                cuota_real: recalculoData.CUOTA,         // 🔧 ACTUALIZAR CUOTA REAL (sin seguro) para cronograma
                TEA: recalculoData.TEA
            }));

            Notification.success('Valores recalculados correctamente');
        } catch (error) {
            Notification.error('Error al recalcular los valores');
        }
    };

    // Función para generar cronograma de pagos
    const generarCronograma = async () => {
        // Verificar que todos los campos necesarios estén completos
        if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo ||
            !formData.Monto_solicitado || !formData.Nro_cuotas || !formData.cuota_tipo ||
            !formData.pago_tipo || !formData.desde || !formData.fecha_1er_pago || !valoresCalculados) {
            Notification.warning('Complete todos los campos y calcule los valores antes de generar el cronograma');
            return;
        }

        // Verificar que no haya errores de validación
        if (montoError || plazoError) {
            Notification.warning('Corrija los errores de validación antes de continuar');
            return;
        }

        // 🔐 VALIDAR USUARIO LOGUEADO antes de generar cronograma - USAR user.id_age
        if (!user || !user.id_age) {
            Notification.error('Usuario no válido o sin código de agencia asignado');
            return;
        }

        try {
            setLoading(true);
            
            // Aplicar misma lógica de agencias para cronograma
            const agenciaProcesada = (user.id_age === '06' || user.id_age === '07')
                ? '98'
                : user.id_age;
            
            const requestData: ObtenerCronogramaSimuladoRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo,
                PLAZO: parseInt(formData.Nro_cuotas),
                MONTO: parseFloat(formData.Monto_solicitado),
                TIPO_CUOTA: formData.cuota_tipo,
                FECHA_INICIO: formatDateForSQL(formData.desde),
                FECHA_PRI: formatDateForSQL(formData.fecha_1er_pago),
                DIA_FIJO: formData.tipoCalendario_codigo,
                CUENTA: "123456789", // Valor por defecto
                INT_PEND: 0, // Sin intereses pendientes
                TIPO_PAGO: formData.pago_tipo,
                TEA: formData.TEA, // Usar TEA en lugar de TEM
                CUOTA_FIJA: parseFloat(formData.cuota_real), // 🔧 USAR CUOTA REAL (sin seguro) no CUOTA_SEGURO
                USER: user.user || user.dni, // 🔐 USAR USUARIO REAL DEL CONTEXTO
                DNI: formData.dni,
                RAZON: formData.razon_social || formData.dni // 🔧 USAR RAZÓN SOCIAL INGRESADA EN EL FORMULARIO
            };

            const cronogramaResponse = await fetchObtenerCronogramaSimulado(requestData);

            // Guardar los datos del cronograma y mostrar el PDF
            setCronogramaData(cronogramaResponse);
            setMostrarCronograma(true);
            
            Notification.success('Cronograma generado correctamente');
        } catch (error) {
            console.error('Error generando cronograma:', error);
            Notification.error('Error al generar el cronograma de pagos');
        } finally {
            setLoading(false);
        }
    };

    // Manejo de cambio de moneda
    const handleMonedaChange = (moneda: string) => {
        setFormData(prev => ({
            ...prev,
            moneda,
            moneda_codigo: moneda === "PEN" ? "S" : "D"
        }));
    };

    // Manejo de cambio de tipo de calendario
    const handleTipoCalendarioChange = (tipo: string) => {
        const codigoMap: Record<string, string> = {
            DiaFijo: 'F',
            DiaVariable: 'V',
            FinMes: 'M'
        };
        setFormData(prev => ({
            ...prev,
            tipoCalendarioPago: tipo,
            tipoCalendario_codigo: codigoMap[tipo] || 'F'
        }));
    };

    // Validación de fecha del primer pago
    const handleFechaPrimerPagoChange = (fecha: string) => {
        const fechaDesde = new Date(formData.desde);
        const fechaPago = new Date(fecha);
        if (fechaPago <= fechaDesde) {
            const siguienteDia = new Date(fechaDesde);
            siguienteDia.setDate(siguienteDia.getDate() + 1);
            const fechaCorregida = siguienteDia.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, fecha_1er_pago: fechaCorregida }));
            Notification.warning('La fecha del primer pago debe ser al menos un día después de la fecha "Desde"');
        } else {
            setFormData(prev => ({ ...prev, fecha_1er_pago: fecha }));
        }
    };

    // Carga de datos dependientes
    const loadMontoMinMax = async () => {
        if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo) return;
        try {
            // 🔐 USAR AGENCIA REAL DEL USUARIO para límites de monto - USAR user.id_age
            if (!user || !user.id_age) return;
            
            const agenciaProcesada = (user.id_age === '06' || user.id_age === '07')
                ? '98'
                : user.id_age;

            const requestData: Monto_minimo_maximoRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo
            };
            const montoData = await fetchMontoMinimoMaximo(requestData);
            
            // Manejar respuesta como array o objeto
            const montoResponse = Array.isArray(montoData) ? montoData[0] : montoData;
            setFormData(prev => ({
                ...prev,
                monto_minimo: montoResponse.DESDE || '0',
                monto_maximo: montoResponse.HASTA || '0'
            }));
        } catch (error) {
            Notification.error('Error al cargar monto mínimo y máximo');
        }
    };

    const loadPlazoMinMax = async () => {
        if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo || !formData.Monto_solicitado) return;
        try {
            // 🔐 USAR AGENCIA REAL DEL USUARIO para límites de plazo - USAR user.id_age
            if (!user || !user.id_age) return;
            
            const agenciaProcesada = (user.id_age === '06' || user.id_age === '07')
                ? '98'
                : user.id_age;

            const requestData: Plazo_minimo_maximoRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo,
                MONTO: formData.Monto_solicitado
            };
            const plazoData = await fetchPlazoMinimoMaximo(requestData);
            
            // Manejar respuesta como array o objeto
            const plazoResponse = Array.isArray(plazoData) ? plazoData[0] : plazoData;
            setFormData(prev => ({
                ...prev,
                plazo_minimo: plazoResponse.DESDE || '0',
                plazo_maximo: plazoResponse.HASTA || '0'
            }));
        } catch (error) {
            Notification.error('Error al cargar plazo mínimo y máximo');
        }
    };

    // Return del custom hook con todas las funciones y estados
    return {
        // Estados
        formData,
        setFormData,
        montoError,
        setMontoError,
        plazoError,
        setPlazoError,
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
        setValoresCalculados,
        cronogramaData,
        setCronogramaData,
        mostrarCronograma,
        setMostrarCronograma,
        inputRefs,
        
        // Funciones de navegación móvil
        isMobile,
        focusNextField,
        handleEnter,
        autoAdvanceOnMobile,
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
        loadMontoMinMax,
        loadPlazoMinMax,
        
        // Funciones auxiliares
        formatDateForSQL,
        getTodayDate,
        getTomorrowDate,
        
        // Datos de usuario
        user
    };
};