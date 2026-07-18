import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import InputImageCamera from "./InputImageCamera";
import { AuthContext } from "../../contexts/AuthContext";
import { AGENCIAS } from "../../types";
import {
    verificarSocioReniec,
    comprobarSocioEnBD,
    verificarPreDesembolso,
    crearFormDataVerificacion,
    type VerificacionData
} from "../../api/geodileApi";
import { useNotifications } from "../../hooks/useNotifications";
const Notification=useNotifications();
export default function ModalVerificarUbicacion({ isOpen, onClose, coord }: { isOpen: boolean; onClose: () => void; coord: { lat: number; lng: number } }) {
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutos en milisegundos

    // Función para verificar si la ubicación ha expirado
    const isLocationExpired = useCallback((timestamp: number | null): boolean => {
        if (!timestamp) return true;
        return (Date.now() - timestamp) > FIVE_MINUTES;
    }, []);

    // Función para obtener el tiempo restante de la ubicación
    const getLocationTimeRemaining = useCallback((timestamp: number | null): string => {
        if (!timestamp) return '0:00';
        const elapsed = Date.now() - timestamp;
        const remaining = Math.max(0, FIVE_MINUTES - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const [positionTimestamp, setPositionTimestamp] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('0:00');

    // Effect para obtener el timestamp y limpiar formulario al abrir
    useEffect(() => {
        if (isOpen) {
            // ✅ LIMPIEZA TOTAL AL ABRIR EL MODAL
            setFormData(initialFormData);
            setDatos(null);
            setOptions({ selectedOption: '' });
            setImage({
                a_image_foto_fachada: null,
                a_image_selfie_fachada: null,
                a_image_negocio_fachada: null,
                a_image_selfie_negocio_fachada: null
            });
            setIsLoading(false);
            setIsVerifyingDNI(false);
            setEnviandoFormulario(false);
            setUltimoEnvio(0);
            
            // ✅ Obtener timestamp de ubicación
            const timestamp = sessionStorage.getItem('gps_timestamp');
            if (timestamp) {
                const parsedTimestamp = parseInt(timestamp);
                setPositionTimestamp(parsedTimestamp);
                setTimeRemaining(getLocationTimeRemaining(parsedTimestamp));
            } else {
                setPositionTimestamp(null);
                setTimeRemaining('0:00');
            }
            
            // ✅ Limpiar elementos DOM después de un pequeño delay
            setTimeout(() => {
                document.querySelectorAll('input[type="file"]').forEach((input: Element) => {
                    (input as HTMLInputElement).value = "";
                });
                document.querySelectorAll('input[type="radio"]').forEach((input: Element) => {
                    (input as HTMLInputElement).checked = false;
                });
                document.querySelectorAll('input[type="text"], input[type="number"]').forEach((input: Element) => {
                    if (!(input as HTMLInputElement).disabled) {
                        (input as HTMLInputElement).value = "";
                    }
                });
            }, 100);
        }
    }, [isOpen, getLocationTimeRemaining]);

    // Effect para actualizar el contador cada segundo
    useEffect(() => {
        if (positionTimestamp && isOpen && !isLocationExpired(positionTimestamp)) {
            const interval = setInterval(() => {
                setTimeRemaining(getLocationTimeRemaining(positionTimestamp));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [positionTimestamp, isOpen, getLocationTimeRemaining, isLocationExpired]);

    const { user } = useContext(AuthContext);
    const userData = user; // Usar el usuario del contexto
    const [datos, setDatos] = useState<boolean | null>(null);
    const [image, setImage] = useState({
        a_image_foto_fachada: null,
        a_image_selfie_fachada: null,
        a_image_negocio_fachada: null,
        a_image_selfie_negocio_fachada: null
    });

    // Estados para controlar la carga
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingDNI, setIsVerifyingDNI] = useState(false);
    
    // Protección contra múltiples envíos
    const [ultimoEnvio, setUltimoEnvio] = useState(0);
    const [enviandoFormulario, setEnviandoFormulario] = useState(false);

    const initialFormData = {
        dni: "",
        socio: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [options, setOptions] = useState({ selectedOption: '' });

    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(initialFormData);
        setDatos(null);
        setOptions({ selectedOption: event.target.value });
    };

    const handleImageChangeIn = (id: string, file: File) => {
        setImage(prevFiles => ({ ...prevFiles, [id]: file }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        if (id === 'dni' && value.length > 8) return; // Limitar a 8 dígitos
        setFormData(prevFormData => ({ ...prevFormData, [id]: value }));
    };

    const VerificarSocioReniec = async () => {
        if (isVerifyingDNI) return;
        if (formData.dni.length !== 8) {
            Notification.validation('El DNI debe tener exactamente', ['8 dígitos']);
            return;
        }

        setIsVerifyingDNI(true);
        try {
            const socioData = await verificarSocioReniec(formData.dni);
            if (socioData) {
                const socio = `${socioData.nombres} ${socioData.apellido_paterno} ${socioData.apellido_materno}`;
                setFormData(prevFormData => ({ ...prevFormData, socio }));
                await ComprobarSocioEnBD();
            } else {
                throw new Error('No se encontraron datos del socio');
            }
        } catch (error) {
            Notification.validation('Ingrese un DNI correcto', ['El DNI debe tener 8 dígitos o es inválido']);
            setFormData(prevFormData => ({ ...prevFormData, socio: '' }));
        } finally {
            setIsVerifyingDNI(false);
        }
    };

    const ComprobarSocioEnBD = async () => {
        try {
            const existe = await comprobarSocioEnBD(formData.dni, options.selectedOption);
            setDatos(existe);
        } catch (error) {
            setDatos(false);
        }
    };

    // Validar coordenadas de Perú
    const esCoordenadaValida = (lat: number, lng: number): boolean => {
        const enPeru = lat >= -18.5 && lat <= -0.5 && lng >= -81.5 && lng <= -68.5;
        const noEsCero = !(lat === 0 && lng === 0);
        return enPeru && noEsCero;
    };

    const abortControllerRef = useRef<AbortController | null>(null);

    const validateLocation = () => {
        if (!coord || !coord.lat || !coord.lng) {
            Notification.error('❌ ERROR: No se detectaron coordenadas GPS válidas.\n\n📍 Asegúrate de activar la ubicación primero.');
            return false;
        }

        if (!esCoordenadaValida(coord.lat, coord.lng)) {
            Notification.error('❌ COORDENADAS INVÁLIDAS\n\n🗺️ Las coordenadas detectadas no corresponden a una ubicación válida en Perú.\n\nLatitud: ' + coord.lat.toFixed(6) + '\nLongitud: ' + coord.lng.toFixed(6) + '\n\n🔄 Por favor, obtén una nueva ubicación GPS.');
            return false;
        }

        const timestampStr = sessionStorage.getItem('gps_timestamp');
        if (!timestampStr || isLocationExpired(parseInt(timestampStr))) {
            Notification.info('⏰ UBICACIÓN EXPIRADA\n\n🔄 Tu ubicación GPS ha expirado. Obtén una nueva ubicación antes de continuar.');
            return false;
        }

        return true;
    };

    const prepareVerificacionData = (): VerificacionData | null => {
        if (!userData?.dni) {
            Notification.error('❌ Usuario no encontrado en el sistema');
            return null;
        }

        const obtenerNombreAgencia = (idAgencia: string): string => {
            if (!idAgencia) return 'SIN AGENCIA ASIGNADA';
            const agenciasEntries = Object.entries(AGENCIAS);
            const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === idAgencia);
            if (agenciaEncontrada) return agenciaEncontrada[0];
            if (userData.agencias && userData.agencias.length > 0) {
                return userData.agencias[0].agencia || `ID: ${idAgencia}`;
            }
            return `AGENCIA ID: ${idAgencia}`;
        };

        const verificacionData: VerificacionData = {
            user: userData.dni,
            dni_socio: formData.dni,
            socio: formData.socio,
            tipo_ubicacion: options.selectedOption,
            latitud: coord.lat,
            longitud: coord.lng,
            responsable: userData.razon || userData.user || userData.email || 'Usuario sin nombre',
            agencia: obtenerNombreAgencia(userData.id_age || '')
        };

        return verificacionData;
    };

    const handleSuccess = (result: any) => {
        if (result?.status === true) {
            Notification.success(`✅ VERIFICACIÓN ENVIADA CORRECTAMENTE\n${result?.message || 'Datos procesados exitosamente'}`);
            resetForm();
            onClose();
        } else {
            const errorMsg = result?.message || result?.rawResponse || 'Error desconocido al procesar la verificación';
            Notification.error(`❌ ERROR EN LA VERIFICACIÓN:\n${errorMsg}\n\n💡 SUGERENCIA: Verifica tu conexión a internet e intenta nuevamente.`);
        }
    };

    const handleError = (error: any) => {
        let mensajeError = '❌ ERROR AL ENVIAR VERIFICACIÓN\n\n';
        if (error.name === 'AbortError') {
            mensajeError += '🚫 Operación cancelada.';
        } else if (error.message === 'TIMEOUT_PERSONALIZADO') {
            mensajeError += '⏰ TIEMPO AGOTADO: El servidor tardó demasiado en responder.\n\n💡 SUGERENCIAS:\n• Verifica tu conexión a internet\n• Reduce el tamaño de las imágenes\n• Intenta nuevamente en unos minutos';
        } else if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
            mensajeError += '🌐 ERROR DE CONEXIÓN: No se pudo conectar con el servidor.\n\n💡 SUGERENCIAS:\n• Verifica tu conexión a internet\n• Intenta nuevamente cuando tengas mejor señal';
        } else if (error.message?.includes('413') || error.message?.includes('too large')) {
            mensajeError += '📸 ARCHIVOS MUY GRANDES: Las imágenes exceden el tamaño permitido.\n\n💡 SUGERENCIAS:\n• Toma fotos de menor resolución\n• Comprime las imágenes antes de subirlas';
        } else if (error.message?.includes('500')) {
            mensajeError += '🔧 ERROR DEL SERVIDOR: Problema interno del sistema.\n\n💡 SUGERENCIA: Contacta al soporte técnico con el código: SRV-500';
        } else {
            mensajeError += `🤔 ERROR DESCONOCIDO: ${error.message || 'Error no identificado'}\n\n💡 SUGERENCIA: Contacta al soporte técnico`;
        }
        Notification.error(mensajeError);
        setUltimoEnvio(0); // Permitir reintento
    };

    const resetForm = () => {
        // ✅ Resetear todos los estados principales
        setFormData(initialFormData);
        setDatos(null);
        setOptions({ selectedOption: '' });
        
        // ✅ LIBERAR MEMORIA: Limpiar referencias a archivos de imagen
        setImage({
            a_image_foto_fachada: null,
            a_image_selfie_fachada: null,
            a_image_negocio_fachada: null,
            a_image_selfie_negocio_fachada: null
        });
        
        // ✅ Resetear estados de carga y verificación
        setIsLoading(false);
        setIsVerifyingDNI(false);
        setEnviandoFormulario(false);
        
        // ✅ Resetear estados de ubicación
        setPositionTimestamp(null);
        setTimeRemaining('0:00');
        
        // ✅ Resetear control de múltiples envíos
        setUltimoEnvio(0);
        
        // ✅ Limpiar elementos del DOM
        setTimeout(() => {
            document.querySelectorAll('input[type="file"]').forEach((input: Element) => {
                (input as HTMLInputElement).value = "";
            });
            document.querySelectorAll('input[type="radio"]').forEach((input: Element) => {
                (input as HTMLInputElement).checked = false;
            });
            document.querySelectorAll('input[type="text"], input[type="number"]').forEach((input: Element) => {
                if (!(input as HTMLInputElement).disabled) {
                    (input as HTMLInputElement).value = "";
                }
            });
        }, 100);
        
        // ✅ Limpiar storage
        sessionStorage.removeItem('gps_timestamp');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (isLoading || enviandoFormulario) return;

        const tiempoActual = Date.now();
        if (tiempoActual - ultimoEnvio < 30000) {
            const segundosRestantes = Math.ceil((30000 - (tiempoActual - ultimoEnvio)) / 1000);
            Notification.info(`⏳ Espera ${segundosRestantes} segundos antes de enviar otra verificación`);
            return;
        }

        if (!validateLocation()) return;

        setIsLoading(true);
        setEnviandoFormulario(true);
        setUltimoEnvio(tiempoActual);

        abortControllerRef.current = new AbortController();

        try {
            // Permitir envío en ambos casos (datos === false o datos === true)
            const verificacionData = prepareVerificacionData();
            if (!verificacionData) return;

            const formDataWithFiles = crearFormDataVerificacion(verificacionData, image);
            
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT_PERSONALIZADO')), 45000)
            );
            
            const result = await Promise.race([
                verificarPreDesembolso(formDataWithFiles),
                timeoutPromise
            ]);
            
            handleSuccess(result);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                handleError(error);
            }
        } finally {
            setIsLoading(false);
            setEnviandoFormulario(false);
            abortControllerRef.current = null;
        }
    };

    // Limpieza al cerrar modal
    useEffect(() => {
        if (!isOpen) {
            // ✅ LIMPIEZA TOTAL AL CERRAR EL MODAL
            resetForm();
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;
    if (!coord) return <div>Cargando...</div>;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
                    <h2 id="modal-title" className="text-lg font-semibold uppercase">Verificar Ubicación</h2>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:text-gray-200"
                        disabled={isLoading}
                        aria-label="Cerrar modal"
                    >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm7.707-3.707a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12l-2.293 2.293a1 1 0 001.414 1.414L12 13.414l2.293 2.293a1 1 0 001.414-1.414L13.414 12l2.293-2.293a1 1 0 00-1.414-1.414L12 10.586 9.707 8.293z"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <form className="w-full" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 mb-4">
                            <span className="col-span-2 text-[10px] text-blue-800">¿QUÉ VERIFICACIÓN DESEA AGREGAR?</span>
                            <div className="grid grid-cols-5 items-center gap-4">
                                <div className="col-span-3 inline-flex gap-4">
                                    <label className="flex items-center gap-2 text-[10px] text-blue-800">
                                        <input
                                            type="radio"
                                            id="option-domicilio"
                                            name="selectedOption"
                                            value="DOMICILIO"
                                            checked={options.selectedOption === 'DOMICILIO'}
                                            onChange={handleOptionChange}
                                            className="my-1"
                                            disabled={isLoading}
                                        />
                                        DOMICILIO
                                    </label>
                                    <label className="flex items-center gap-2 text-[10px] text-blue-800">
                                        <input
                                            type="radio"
                                            id="option-negocio"
                                            name="selectedOption"
                                            value="NEGOCIO"
                                            checked={options.selectedOption === 'NEGOCIO'}
                                            onChange={handleOptionChange}
                                            className="my-1"
                                            disabled={isLoading}
                                        />
                                        NEGOCIO
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="w-full mb-4">
                            <label htmlFor="dni" className="block mb-1 text-[12px] font-medium text-blue-900">
                                DNI
                            </label>
                            <div className="flex">
                                <input
                                    type="number"
                                    id="dni"
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    className="flex-1 bg-blue-50 border border-blue-300 text-blue-900 text-sm rounded-l-lg focus:ring-2 focus:ring-blue-500 p-2.5"
                                    placeholder="DNI (8 dígitos)"
                                    disabled={isLoading || isVerifyingDNI}
                                    maxLength={8}
                                    pattern="\d{8}"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={VerificarSocioReniec}
                                    className="bg-blue-600 text-white px-4 py-2.5 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                                    disabled={isLoading || isVerifyingDNI}
                                    aria-label="Verificar DNI"
                                >
                                    {isVerifyingDNI ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="socio" className="block mb-1 text-sm font-medium text-blue-900">
                                SOCIO
                            </label>
                            <input
                                type="text"
                                id="socio"
                                name="socio"
                                value={formData.socio}
                                className="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg w-full p-2.5 cursor-not-allowed"
                                placeholder="NOMBRE Y APELLIDOS"
                                required
                                readOnly
                                disabled
                            />
                        </div>

                        {/* COORDENADAS GPS */}
                        <div className="mb-4">
                            <label htmlFor="coordenadas_gps" className="block mb-1 text-[12px] font-medium text-blue-900">
                                📍 TUS COORDENADAS GPS
                            </label>
                            <input
                                disabled
                                type="text"
                                id="coordenadas_gps"
                                name="coordenadas_gps"
                                value={coord && coord.lat && coord.lng ? `${coord.lat.toFixed(6)} ; ${coord.lng.toFixed(6)}` : 'Obteniendo ubicación...'}
                                className="bg-green-50 border border-green-300 text-green-800 text-[12px] font-mono rounded-lg w-full p-2.5"
                                placeholder="COORDENADAS"
                            />
                            
                            {positionTimestamp && (
                                <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] font-medium ${
                                    isLocationExpired(positionTimestamp)
                                        ? 'bg-red-50 border border-red-300 text-red-700'
                                        : 'bg-blue-50 border border-blue-300 text-blue-700'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            isLocationExpired(positionTimestamp) ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></div>
                                        <span>
                                            {isLocationExpired(positionTimestamp)
                                                ? '⏰ UBICACIÓN EXPIRADA - Obtén nueva ubicación'
                                                : `⏱️ Ubicación válida por: ${timeRemaining}`}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <p className="text-[10px] text-gray-600 mt-1">
                                🎯 Estas son las coordenadas de tu ubicación actual que se enviarán con la verificación
                            </p>
                        </div>

                        {options.selectedOption && formData.socio && (
                            <div className="space-y-3">
                                {/* Mostrar notificación informativa si ya existe verificación */}
                                {datos === true && (
                                    <div className="grid grid-cols-1 justify-items-center rounded-lg border-2 border-orange-300 bg-orange-50 p-3 my-2">
                                        <svg xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5 text-orange-600"
                                            fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="13" />
                                            <circle cx="12" cy="17" r="1.5" />
                                        </svg>
                                        <p className="mt-1 text-orange-800 text-[11px] font-medium text-center">
                                            ℹ️ SOCIO YA TIENE UNA VERIFICACIÓN DE {options.selectedOption}
                                        </p>
                                        <p className="text-orange-700 text-[10px] text-center mt-1">
                                            Se actualizará la verificación existente
                                        </p>
                                    </div>
                                )}

                                {/* Formulario siempre visible para ambos casos */}
                                <div className="grid grid-cols-1 rounded-lg border-2 border-blue-300 p-4 my-2">
                                    <h3 className="text-blue-800 text-[12px] mb-2">
                                        {datos === true ? `ACTUALIZAR VERIFICACIÓN DE ${options.selectedOption}` : `INGRESE DATOS DE ${options.selectedOption}`}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <label htmlFor={`coords_${options.selectedOption.toLowerCase()}`} className="block mb-1 text-[12px] font-medium text-blue-900">
                                                TUS COORDENADAS
                                            </label>
                                            <input
                                                disabled
                                                type="text"
                                                id={`coords_${options.selectedOption.toLowerCase()}`}
                                                name={`coords_${options.selectedOption.toLowerCase()}`}
                                                value={`${coord.lat} ; ${coord.lng}`}
                                                className="bg-blue-50 border border-blue-300 text-blue-900 text-[12px] rounded-lg w-full p-2.5"
                                                placeholder="COORDENADAS"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1">
                                        {options.selectedOption === 'DOMICILIO' ? (
                                            <>
                                                <InputImageCamera id="a_image_foto_fachada" title="CAPTURAR FACHADA DE VIVIENDA" handleImageChangeIn={handleImageChangeIn} />
                                                <InputImageCamera id="a_image_selfie_fachada" title="CAPTURAR SELFIE CON VIVIENDA" handleImageChangeIn={handleImageChangeIn} />
                                            </>
                                        ) : (
                                            <>
                                                <InputImageCamera id="a_image_negocio_fachada" title="CAPTURAR FACHADA DE NEGOCIO" handleImageChangeIn={handleImageChangeIn} />
                                                <InputImageCamera id="a_image_selfie_negocio_fachada" title="CAPTURAR SELFIE CON NEGOCIO" handleImageChangeIn={handleImageChangeIn} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t-2 border-blue-200">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg border-2 border-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                                disabled={isLoading}
                                aria-label="Guardar verificación"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        GUARDANDO...
                                    </div>
                                ) : (
                                    'GUARDAR'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg border-2 border-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed"
                                disabled={isLoading}
                                aria-label="Cerrar modal"
                            >
                                CERRAR
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
