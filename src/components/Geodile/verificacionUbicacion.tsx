import React, { useState, useContext, useEffect } from "react";
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

export default function ModalVerificarUbicacion({ isOpen, onClose, coord }: { isOpen: boolean; onClose: () => void; coord: { lat: number; lng: number } }) {
    // Función para verificar si la ubicación ha expirado (máximo 5 minutos)
    const isLocationExpired = (timestamp: number | null): boolean => {
        if (!timestamp) return true;
        const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutos en milisegundos
        return (Date.now() - timestamp) > FIVE_MINUTES;
    };

    // Función para obtener el tiempo restante de la ubicación
    const getLocationTimeRemaining = (timestamp: number | null): string => {
        if (!timestamp) return '0:00';
        const FIVE_MINUTES = 5 * 60 * 1000;
        const elapsed = Date.now() - timestamp;
        const remaining = Math.max(0, FIVE_MINUTES - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Estado para obtener el timestamp de la ubicación desde el localStorage o sessionStorage
    const [positionTimestamp, setPositionTimestamp] = useState<number | null>(null);
    const [, forceUpdate] = useState(0);

    // Effect para obtener el timestamp y actualizar el contador
    useEffect(() => {
        // Obtener el timestamp guardado (asumiendo que se guarda cuando se obtiene la ubicación)
        const timestamp = sessionStorage.getItem('gps_timestamp');
        if (timestamp) {
            setPositionTimestamp(parseInt(timestamp));
        }
    }, [isOpen]);

    // Effect para actualizar el contador cada segundo
    useEffect(() => {
        if (positionTimestamp && isOpen) {
            const interval = setInterval(() => {
                forceUpdate(prev => prev + 1); // Forzar re-render para actualizar el contador
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [positionTimestamp, isOpen]);
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

    const initialFormData = {
        dni: "",
        socio: "",
        suministro: "",
        direccion: "",
        ref_vehiculo: "",
        ref_paradero: "",
        ref_adicional: '',
        suministro_negocio: '',
        direccion_negocio: '',
        ref_vehiculo_negocio: "",
        ref_paradero_negocio: "",
        ref_adicional_negocio: ''
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
        setFormData(prevFormData => ({ ...prevFormData, [id]: value }));
    };

    const VerificarSocioReniec = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isVerifyingDNI) return; // Evitar múltiples consultas

        setIsVerifyingDNI(true);
        try {
            const socioData = await verificarSocioReniec(formData.dni);
            if (socioData) {
                const socio = `${socioData.nombres} ${socioData.apellido_paterno} ${socioData.apellido_materno}`;

                setFormData(prevFormData => ({ ...prevFormData, socio }));
                ComprobarSocioEnBD();
            } else {
                throw new Error('No se encontraron datos del socio');
            }
        } catch (error) {
            alert('Ingrese un DNI correcto');
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return; // Evitar múltiples envíos

        if (!userData?.dni) {
            alert('Usuario no encontrado');
            return;
        }

        setIsLoading(true);
        try {
            if (datos === false) {
                // Función helper para obtener nombre de agencia por ID
                const obtenerNombreAgencia = (idAgencia: string): string => {
                    if (!idAgencia) return 'SIN AGENCIA ASIGNADA';
                    
                    // Buscar directamente en el objeto AGENCIAS
                    const agenciasEntries = Object.entries(AGENCIAS);
                    const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === idAgencia);
                    
                    if (agenciaEncontrada) {
                        return agenciaEncontrada[0];
                    }
                    
                    // Fallback: buscar también en userData.agencias si existe
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
                    // Nuevos campos del usuario
                    responsable: userData.razon || userData.user || userData.email || 'Usuario sin nombre',
                    agencia: (() => {
                        const nombreAgencia = obtenerNombreAgencia(userData.id_age || '');
                        return nombreAgencia;
                    })()
                };

                if (options.selectedOption === 'DOMICILIO') {
                    Object.assign(verificacionData, {
                        // Campos opcionales comentados - no se usan en la versión simplificada
                        // suministro: formData.suministro || '',
                        // direccion: formData.direccion || '',
                        // ref_vehiculo: formData.ref_vehiculo || '',
                        // ref_paradero: formData.ref_paradero || '',
                        // ref_adicional: formData.ref_adicional || '',
                        // condicion_negocio: ''
                    });
                } else if (options.selectedOption === 'NEGOCIO') {
                    Object.assign(verificacionData, {
                        // Campos opcionales comentados - no se usan en la versión simplificada
                        // suministro: formData.suministro_negocio || '',
                        // direccion: formData.direccion_negocio || '',
                        // ref_vehiculo: formData.ref_vehiculo_negocio || '',
                        // ref_paradero: formData.ref_paradero_negocio || '',
                        // ref_adicional: formData.ref_adicional_negocio || '',
                        // condicion_negocio: "NEGOCIO EN OTRO LUGAR"
                    });
                }

                const formDataWithFiles = crearFormDataVerificacion(verificacionData, image);
                
                // JSON COMPLETO PARA COPIAR
                
                // También mostrar el FormData para debug completo
                const formDataObj: any = {};
                for (let [key, value] of formDataWithFiles.entries()) {
                    if (value instanceof File) {
                        formDataObj[key] = `[ARCHIVO: ${value.name} - ${value.size} bytes]`;
                    } else {
                        formDataObj[key] = value;
                    }
                }
                
                const result = await verificarPreDesembolso(formDataWithFiles);
                
                if (result?.status === true) {
                    alert(`✅ VERIFICACIÓN ENVIADA CORRECTAMENTE\n${result?.message || 'Datos procesados exitosamente'}`);
                    setFormData(initialFormData);
                    document.querySelectorAll('input[type="file"]').forEach((input: Element) => {
                        (input as HTMLInputElement).value = "";
                    });
                    onClose();
                } else {
                    const errorMsg = result?.message || result?.rawResponse || 'Error desconocido al procesar la verificación';
                    alert(`❌ ERROR EN LA VERIFICACIÓN:\n${errorMsg}`);
                }
            } else {
                alert('datos encontrados en BD');
            }
        } catch (error) {
            alert('Error al enviar la verificación');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    if (!coord) return <div>Cargando...</div>;

    return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-semibold uppercase">Verificar Ubicación</h2>
            <button 
                onClick={onClose} 
                className="text-white hover:text-gray-200"
                disabled={isLoading}
            >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm7.707-3.707a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12l-2.293 2.293a1 1 0 001.414 1.414L12 13.414l2.293 2.293a1 1 0 001.414-1.414L13.414 12l2.293-2.293a1 1 0 00-1.414-1.414L12 10.586 9.707 8.293z"
                />
            </svg>
            </button>
        </div>

        <div className="p-4">
            <form className="w-full" onSubmit={(e) => handleSubmit(e)}>
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
                    placeholder="DNI"
                    disabled={isLoading || isVerifyingDNI}
                />
                <button
                    type="button"
                    onClick={() => {
                    const fakeEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>;
                    VerificarSocioReniec(fakeEvent);
                    }}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={isLoading || isVerifyingDNI}
                >
                {isVerifyingDNI ? (
                    <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    </div>
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
                onChange={handleChange}
                className="bg-blue-50 border border-blue-300 text-blue-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 w-full p-2.5"
                placeholder="NOMBRE Y APELLIDOS"
                required
                disabled={isLoading}
                />
            </div>

            {/* COORDENADAS GPS - SIEMPRE VISIBLES */}
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
                
                {/* CONTADOR DE TIEMPO RESTANTE */}
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
                                    : `⏱️ Ubicación válida por: ${getLocationTimeRemaining(positionTimestamp)}`
                                }
                            </span>
                        </div>
                    </div>
                )}
                
                <p className="text-[10px] text-gray-600 mt-1">
                    🎯 Estas son las coordenadas de tu ubicación actual que se enviarán con la verificación
                </p>
            </div>

            {options.selectedOption === 'DOMICILIO' && formData.socio ? (
                datos === true ? (
                    <div className="grid grid-cols-1 justify-items-center rounded-lg border-2 border-blue-300 p-4 my-2">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        className="w-6 h-6 text-orange-500" 
                        fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="13" />
                        <circle cx="12" cy="17" r="1.5" />
                    </svg>

                    <p className="mt-2 text-blue-800 text-[12px]">
                        EL SOCIO YA TIENE UNA VERIFICACIÓN ACTUAL
                    </p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 rounded-lg border-2 border-blue-300 p-4 my-2">
                    <h3 className="text-blue-800 text-[12px] mb-2">INGRESE DATOS DEL DOMICILIO</h3>
                    <div className="grid grid-cols-1 gap-2">
                    <div>
                        <label htmlFor="coords_domicilio" className="block mb-1 text-[12px] font-medium text-blue-900">
                        TUS COORDENADAS
                        </label>
                        <input
                        disabled
                        type="text"
                        id="coords_domicilio"
                        name="coords_domicilio"
                        value={`${coord.lat} ; ${coord.lng}`}
                        className="bg-blue-50 border border-blue-300 text-blue-900 text-[12px] rounded-lg w-full p-2.5"
                        placeholder="COORDENADAS"
                        />
                    </div>
                    {/* Campos ocultos temporalmente - se envían como opcionales vacíos */}
                    </div>
                    <div className="grid grid-cols-1">
                    <InputImageCamera id="a_image_foto_fachada" title="CAPTURAR FACHADA DE VIVIENDA" handleImageChangeIn={handleImageChangeIn} />
                    <InputImageCamera id="a_image_selfie_fachada" title="CAPTURAR SELFIE CON VIVIENDA" handleImageChangeIn={handleImageChangeIn} />
                    </div>
                    {/* Sección de negocio oculta - se envía valor por defecto */}
                </div>
                )
            ) : options.selectedOption === 'NEGOCIO' && formData.socio ? (
                datos === true ? (
                <div className="grid grid-cols-1 justify-items-center rounded-lg border-2 border-blue-300 p-4 my-2">
                    <img src="/icons/icons_advertencia.svg" loading="lazy" className="w-6 h-6" />
                    <p className="mt-2 text-blue-800 text-[12px]">EL SOCIO YA TIENE UNA VERIFICACIÓN ACTUAL</p>
                </div>
                ) : (
                <div className="grid grid-cols-1 rounded-lg border-2 border-blue-300 p-4 my-2">
                    <h3 className="text-blue-800 text-[12px] mb-2">INGRESE DATOS DEL NEGOCIO</h3>
                    <div className="grid grid-cols-1 gap-2">
                    <div>
                        <label htmlFor="coords_negocio" className="block mb-1 text-[12px] font-medium text-blue-900">
                        TUS COORDENADAS
                        </label>
                        <input
                        disabled
                        type="text"
                        id="coords_negocio"
                        name="coords_negocio"
                        value={`${coord.lat} ; ${coord.lng}`}
                        className="bg-blue-50 border border-blue-300 text-blue-900 text-[12px] rounded-lg w-full p-2.5"
                        placeholder="COORDENADAS"
                        />
                    </div>
                    {/* Campos ocultos temporalmente - se envían como opcionales vacíos */}
                    </div>
                    <div className="grid grid-cols-1">
                    <InputImageCamera id="a_image_negocio_fachada" title="CAPTURAR FACHADA DE NEGOCIO" handleImageChangeIn={handleImageChangeIn} />
                    <InputImageCamera id="a_image_selfie_negocio_fachada" title="CAPTURAR SELFIE CON NEGOCIO" handleImageChangeIn={handleImageChangeIn} />
                    </div>
                </div>
                )
            ) : (
                ''
            )}

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-blue-200">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg border-2 border-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                    disabled={isLoading}
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