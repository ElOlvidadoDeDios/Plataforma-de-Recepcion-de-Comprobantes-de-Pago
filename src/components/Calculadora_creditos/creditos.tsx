import { useState, useEffect, useRef, useContext } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { AuthContext } from '../../contexts/AuthContext';
import {
    fetchGetNomPrestamo,
    fetchTipodeproductoPrestamo,
    fetchTipoCuota,
    fetchFrecuenciaPago,
    fetchTipoCondicionPago,
    fetchMontoMinimoMaximo,
    fetchPlazoMinimoMaximo,
    //fetchTeaMinimoMaximo,
    fetchValorCuota,
    fetchActualizarCuota,
    fetchObtenerCronogramaSimulado,
    GetNomPrestamo,
    TipoProductoPrestamo,
    Nombrecuota,
    FrecuenciaPago,
    Tipocondicionpago,
    Monto_minimo_maximoRequest,
    Plazo_minimo_maximoRequest,
    //Tea_minimo_maximoRequest,
    Valor_cuotaRequest,
    Recalcularcuotarequest,
    ObtenerCronogramaSimuladoRequest,
    ObtenerCronogramaSimuladoResponse
} from "../../api/SimuladorApi";

// Importar el componente PDF
import CronogramaPagosPDF from './PdfcronogramaSimulado';

const Notification = useNotifications();

export default function CalculadoraCreditos() {
    // 🔐 OBTENER DATOS DEL USUARIO DESDE AUTH CONTEXT (igual que en pendientesAafiliar.tsx línea 422)
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
        valor_cuota: '0.00', // CUOTA_SEGURO (cuota + seguro) - para mostrar al usuario
        cuota_real: '0.00',  // CUOTA (solo cuota sin seguro) - para cronograma
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

    // Manejo de evento Enter
    const handleEnter = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextIndex = index + 1;
            if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
                inputRefs.current[nextIndex]?.focus();
            } else {
                handleSubmit();
            }
        }
    };

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

    // Manejo de cambios en el formulario
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Validación de monto solicitado
    const handleMontoChange = (value: string) => {
        // Actualizar el campo inmediatamente
        setFormData(prev => ({ ...prev, Monto_solicitado: value }));
        
        // Limpiar error si el campo está vacío
        if (!value.trim()) {
            setMontoError('');
            return;
        }
        
        const monto = parseFloat(value);
        const minimo = parseFloat(formData.monto_minimo);
        const maximo = parseFloat(formData.monto_maximo);
        
        // Validar solo si es un número válido
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
        // Actualizar el campo inmediatamente
        setFormData(prev => ({ ...prev, Nro_cuotas: value }));
        
        // Limpiar error si el campo está vacío
        if (!value.trim()) {
            setPlazoError('');
            return;
        }
        
        const plazo = parseInt(value);
        const minimo = parseInt(formData.plazo_minimo);
        const maximo = parseInt(formData.plazo_maximo);
        
        // Validar solo si es un número válido
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

    // Manejo de cambio en TEM (para recalcular automáticamente)
    const handleTEMChange = (value: string) => {
        setFormData(prev => ({ ...prev, TEM: value }));
    };

    // Función auxiliar para convertir fecha a formato datetime de SQL Server
    const formatDateForSQL = (dateString: string): string => {
        // Parsear directamente del string para evitar problemas de zona horaria
        const [year, month, day] = dateString.split('-');
        // Formato para smalldatetime: DD/MM/YYYY HH:mm:ss (zona horaria Lima, Perú)
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
            // 🔐 USAR DATOS REALES DEL USUARIO LOGUEADO (como en pendientesAafiliar.tsx líneas 441-444)
            if (!user || !user.agencias || user.agencias.length === 0) {
                Notification.error('Usuario no válido o sin agencias asignadas');
                return;
            }
            
            // Aplicar lógica especial para agencias 06 y 07 → 98 (igual que pendientesAafiliar.tsx)
            const agenciaProcesada = (user.agencias[0].agencia === '06' || user.agencias[0].agencia === '07')
                ? '98'
                : user.agencias[0].agencia;

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

            console.log('Enviando datos para calcular valores:', requestData);
            const valorData = await fetchValorCuota(requestData);
            console.log('Respuesta del cálculo:', valorData);

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
            // 🔐 USAR DATOS REALES DEL USUARIO LOGUEADO para recálculo
            if (!user || !user.agencias || user.agencias.length === 0) {
                Notification.error('Usuario no válido o sin agencias asignadas');
                return;
            }
            
            // Aplicar misma lógica de agencias que en cálculo inicial
            const agenciaProcesada = (user.agencias[0].agencia === '06' || user.agencias[0].agencia === '07')
                ? '98'
                : user.agencias[0].agencia;

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

            console.log('Recalculando valores con nuevo TEM:', requestData);
            const recalculoData = await fetchActualizarCuota(requestData);
            console.log('Respuesta del recálculo:', recalculoData);

            // Solo actualizar cuota y TEA (no cambiar TEM porque ya lo ingresó el usuario)
            setFormData(prev => ({
                ...prev,
                valor_cuota: recalculoData.CUOTA_SEGURO, // Cuota + seguro (para mostrar)
                cuota_real: recalculoData.CUOTA,         // 🔧 ACTUALIZAR CUOTA REAL (sin seguro) para cronograma
                TEA: recalculoData.TEA
            }));

            Notification.success('Valores recalculados correctamente');
        } catch (error) {
            console.error('Error recalculando valores:', error);
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

        // 🔐 VALIDAR USUARIO LOGUEADO antes de generar cronograma
        if (!user || !user.agencias || user.agencias.length === 0) {
            Notification.error('Usuario no válido o sin agencias asignadas');
            return;
        }

        try {
            setLoading(true);
            
            // Aplicar misma lógica de agencias para cronograma
            const agenciaProcesada = (user.agencias[0].agencia === '06' || user.agencias[0].agencia === '07')
                ? '98'
                : user.agencias[0].agencia;
            
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

            console.log('Generando cronograma con datos:', requestData);
            const cronogramaResponse = await fetchObtenerCronogramaSimulado(requestData);
            console.log('Cronograma generado:', cronogramaResponse);

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
            // 🔐 USAR AGENCIA REAL DEL USUARIO para límites de monto
            if (!user || !user.agencias || user.agencias.length === 0) return;
            
            const agenciaProcesada = (user.agencias[0].agencia === '06' || user.agencias[0].agencia === '07')
                ? '98'
                : user.agencias[0].agencia;

            const requestData: Monto_minimo_maximoRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo
            };
            const montoData = await fetchMontoMinimoMaximo(requestData);
            console.log('Respuesta monto min/max:', montoData);
            
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
            // 🔐 USAR AGENCIA REAL DEL USUARIO para límites de plazo
            if (!user || !user.agencias || user.agencias.length === 0) return;
            
            const agenciaProcesada = (user.agencias[0].agencia === '06' || user.agencias[0].agencia === '07')
                ? '98'
                : user.agencias[0].agencia;

            const requestData: Plazo_minimo_maximoRequest = {
                COD_AGE: agenciaProcesada,
                PRES: formData.prestamo_id,
                PROD: formData.producto_codigo,
                FRECU: formData.frecuencia_codigo,
                MONEDA: formData.moneda_codigo,
                MONTO: formData.Monto_solicitado
            };
            const plazoData = await fetchPlazoMinimoMaximo(requestData);
            console.log('Respuesta plazo min/max:', plazoData);
            
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

    // const loadTeaMinMax = async () => {
    //     if (!formData.prestamo_id || !formData.producto_codigo || !formData.frecuencia_codigo || !formData.Monto_solicitado || !formData.Nro_cuotas) return;
    //     try {
    //         const requestData: Tea_minimo_maximoRequest = {
    //             COD_AGE: "01",
    //             PRES: formData.prestamo_id,
    //             PROD: formData.producto_codigo,
    //             FRECU: formData.frecuencia_codigo,
    //             MONEDA: formData.moneda_codigo,
    //             PLAZO: formData.Nro_cuotas,
    //             MONTO: formData.Monto_solicitado
    //         };
    //         const teaData = await fetchTeaMinimoMaximo(requestData);
    //         console.log('Respuesta TEA min/max:', teaData);
            
    //         // Manejar respuesta como array o objeto
    //         const teaResponse = Array.isArray(teaData) ? teaData[0] : teaData;
    //         setFormData(prev => ({
    //             ...prev,
    //             TEM_minimo: teaResponse.TEM_MIN || '0',
    //             TEM_maximo: teaResponse.TEM_MAX || '0'
    //         }));
    //     } catch (error) {
    //         Notification.error('Error al cargar TEM mínimo y máximo');
    //     }
    // };

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
        formData.pago_tipo, formData.moneda_codigo, formData.desde, formData.fecha_1er_pago,
        formData.tipoCalendario_codigo, montoError, plazoError]);

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

    // Carga de préstamos al presionar Enter en DNI
    const handleDNIEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && formData.dni.trim()) {
            await loadPrestamos();
        }
    };

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

    // Manejo de selección de préstamo, producto y frecuencia
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
            if (formData.prestamo_id) {
                await loadFrecuencias(formData.prestamo_id, productoCodigo);
            }
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

    const handleFrecuenciaChange = (frecuenciaCodigo: string) => {
        const frecuenciaSeleccionada = frecuencias.find(f => f.COD_FREC === frecuenciaCodigo);
        if (frecuenciaSeleccionada) {
            setFormData(prev => ({
                ...prev,
                frecuencia_codigo: frecuenciaSeleccionada.COD_FREC,
                frecuencia_nombre: frecuenciaSeleccionada.DES_FREC
            }));
        }
    };

    const handleSubmit = async () => {
        try {
            Notification.success('Datos guardados correctamente');
        } catch (error) {
            Notification.error('Error al guardar los datos');
        }
    };

    // Clases para inputs y labels
    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const labelClass = "text-sm font-medium";

    // JSX del componente
    return (
        <div className='w-full h-full p-6 bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg rounded-lg overflow-auto'>
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
                        onKeyDown={(e) => { handleDNIEnter(e); handleEnter(e, 2); }}
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
                        onChange={(e) => handlePrestamoChange(e.target.value)}
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
                        onChange={(e) => handleProductoChange(e.target.value)}
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
                    <select
                        ref={(el) => inputRefs.current[6] = el}
                        value={formData.cuota_tipo}
                        onChange={(e) => {
                            const cuotaSeleccionada = cuotas.find(c => c.TIPO_CUOTA === e.target.value);
                            if (cuotaSeleccionada) {
                                setFormData(prev => ({
                                    ...prev,
                                    cuota_tipo: cuotaSeleccionada.TIPO_CUOTA,
                                    cuota_nombre: cuotaSeleccionada.NOM_CUOTA
                                }));
                            }
                        }}
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
                        onChange={(e) => handleFrecuenciaChange(e.target.value)}
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
                    <select
                        ref={(el) => inputRefs.current[8] = el}
                        value={formData.pago_tipo}
                        onChange={(e) => {
                            const pagoSeleccionado = condicionesPago.find(p => p.TIPO_CONDIPAGO === e.target.value);
                            if (pagoSeleccionado) {
                                setFormData(prev => ({
                                    ...prev,
                                    pago_tipo: pagoSeleccionado.TIPO_CONDIPAGO,
                                    pago_nombre: pagoSeleccionado.NOM_CONDIPAGO
                                }));
                            }
                        }}
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
                        onChange={(e) => handleInputChange('desde', e.target.value)}
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
