// API para funcionalidades de Geodile
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL_GEODILE}/api-mongo/api`;

//importamos  la variable de entorno
const RENIEC_API_URL = import.meta.env.VITE_API_BASE_URL_CLIENTES;
const RENIEC_TOKEN = `Bearer ${import.meta.env.VITE_API_BASE_URL_CLIENTES_TOKEN}`;

// Importar AGENCIAS para convertir ID de agencia a código
import { AGENCIAS } from '../types';

// Tipos e interfaces
export interface Coordenada {
    lat: number;
    lng: number;
    tipo_ubicacion: string;
    nom_socio: string;
    suministro?: string;
    direccion?: string;
    fecha_cap?: string;
    hora_cap?: string;
}

export interface SocioReniec {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
}

export interface SocioReporte {
    tipo_ubicacion: string;
    suministro: string;
    direccion: string;
    lat: number;
    lng: number;
    fecha_cap: string;
    hora_cap: string;
}

export interface ReporteInfoData {
    COMPLETO: string;
    user: string;
    periodo: string;
    tipo_ubicacion: string;
    condicion_negocio: string;
    suministro: string;
    direccion: string;
    ref_vehiculo: string;
    ref_paradero: string;
    ref_adicional: string;
    lat: string;
    lng: string;
    fecha_cap: string;
    hora_cap: string;
}

export interface PrepareInfoReportResponse {
    status: boolean;
    count: number;
    dni_socio: string;
    socio: string;
    GENERAR: boolean;
    data: ReporteInfoData[];
}

export interface SuministroData {
    status: boolean;
    responsable?: string;
    agencia?: string;
    socio?: string;
    fecha_re?: any; // Puede ser string, Date, o objeto complejo de MongoDB
    hora_re?: string;
    suministro?: string;
}

export interface VerificacionData {
    user: string;
    dni_socio: string;
    agencia?: string;
    responsable?: string;
    socio: string;
    tipo_ubicacion: string;
    latitud: number;
    longitud: number;
    suministro?: string;
    direccion?: string;
    ref_vehiculo?: string;
    ref_paradero?: string;
    ref_adicional?: string;
    condicion_negocio?: string;
}

// Headers comunes
const getCommonHeaders = () => ({
    "ngrok-skip-browser-warning": "69420"
});

const getReniecHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': RENIEC_TOKEN
});

/**
 * Función helper para obtener NOMBRE de agencia por ID (igual que en verificacionUbicacion.tsx)
 */
const obtenerNombreAgencia = (idAgencia: string): string => {
    if (!idAgencia) return 'SIN AGENCIA ASIGNADA';
    
    // Buscar directamente en el objeto AGENCIAS usando el ID
    const agenciasEntries = Object.entries(AGENCIAS);
    const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === idAgencia);
    
    if (agenciaEncontrada) {
        return agenciaEncontrada[0]; // Retornar el NOMBRE (clave)
    }
    
    return `AGENCIA ID: ${idAgencia}`; // Fallback igual que verificacionUbicacion
};

/**
 * API para cargar coordenadas basadas en usuario, agencia y cargo
 */
export const cargarCoordenadas = async (userData: { dni?: string; cargo?: string; id_age?: string }) => {
    try {
        // Usar la misma lógica que verificacionUbicacion.tsx para obtener la agencia
        const nombreAgencia = obtenerNombreAgencia(userData.id_age || ''); 
        const response = await fetch(`${API_BASE_URL}/coordenadas_cargo_user`, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: JSON.stringify({
                user: userData.dni,
                agencia: nombreAgencia, // ✅ CORREGIDO: enviar NOMBRE de agencia, no código
                cargo: userData.cargo
            })
        });
        const data = await response.json();
        return data.status === true ? data.data : [];
    } catch (error) {
        throw error;
    }
};

/**
 * API para verificar socio en RENIEC
 */
export const verificarSocioReniec = async (dni: string): Promise<SocioReniec | null> => {
    try {
        const response = await fetch(`${RENIEC_API_URL}/${dni}`, {
            headers: getReniecHeaders()
        });
        const socioRe = await response.json();
        
        if (socioRe.status === 'error') {
            throw new Error('DNI incorrecto');
        }
        
        return socioRe.data;
    } catch (error) {
        throw error;
    }
};

/**
 * API para verificar suministro
 */
export const verificarSuministro = async (suministro: string): Promise<SuministroData | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/revisar_suministro`, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: JSON.stringify({ suministro })
        });
        const suministroRe = await response.json();
        return suministroRe.status ? suministroRe : null;
    } catch (error) {
        throw error;
    }
};

/**
 * API para comprobar si el socio ya existe en BD
 */
export const comprobarSocioEnBD = async (dni: string, tipoUbicacion: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/revisar_ingresos_geodile`, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: JSON.stringify({ dni_socio: dni, tipo_ubicacion: tipoUbicacion })
        });
        const result = await response.json();
        return result[0]?.status === true;
    } catch (error) {
        throw error;
    }
};

/**
 * API para verificar pre-desembolso (enviar verificación de ubicación)
 */
export const verificarPreDesembolso = async (formDataWithFiles: FormData) => {
    try {
        // Validar que FormData no esté vacío
        if (!formDataWithFiles.entries().next().value) {
            return {
                status: false,
                message: 'No se enviaron datos al servidor'
            };
        }
        
        for (const [, value] of formDataWithFiles.entries()) {
            if (value instanceof File) {
            } else {
            }
        }
        // Agregar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos - mejor para conexiones de campo

        const response = await fetch(`${API_BASE_URL}/verificar_pre_desembolso`, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: formDataWithFiles,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textResponse = await response.text();

        // Manejar respuestas vacías
        if (!textResponse || textResponse.trim() === '') {
            return {
                status: true,
                message: '✅ Verificación enviada al servidor\n⚠️ El servidor procesó la solicitud pero no devolvió confirmación detallada',
                rawResponse: '[RESPUESTA VACÍA]'
            };
        }

        // Verificar si la respuesta parece JSON
        if (!textResponse.startsWith('{') && !textResponse.startsWith('[')) {
            return {
                status: false,
                message: '⚠️ Respuesta del servidor no es JSON válido',
                rawResponse: textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : '')
            };
        }

        try {
            const result = JSON.parse(textResponse);
            
            // Si es un array, tomar el primer elemento
            const finalResult = Array.isArray(result) ? result[0] : result;
            
            // Asegurar que tenga estructura esperada
            return {
                status: finalResult?.status || true,
                message: finalResult?.message || 'Verificación procesada exitosamente',
                ...finalResult
            };
        } catch (parseError) {
            return {
                status: false,
                message: '⚠️ El servidor devolvió una respuesta no válida',
                rawResponse: textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : '')
            };
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                status: false,
                message: '⏳ La solicitud al servidor tomó demasiado tiempo'
            };
        }

        return {
            status: false,
            message: `❌ Error al procesar la verificación: ${error instanceof Error ? error.message : String(error)}`,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

/**
 * API para generar PDF de GPS
 */
export const generarPdfGps = async (userDni: string, dniSocio: string) => {
    try {
        
        const response = await fetch(`${API_BASE_URL}/genera_pdf_gps`, {
            method: 'POST',
            headers: {
                ...getCommonHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user: userDni,
                dni_socio: dniSocio
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const textResponse = await response.text();
        
        // Verificar si hay errores PHP en la respuesta
        if (textResponse.includes('<b>Warning</b>') || textResponse.includes('<b>Error</b>')) {
        }
        
        try {
            return JSON.parse(textResponse);
        } catch (parseError) {
            
            // Si hay errores pero también hay JSON válido (como en tu caso)
            const jsonMatch = textResponse.match(/\{"url":"[^"]+"\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            throw new Error('Respuesta del servidor no es JSON válido');
        }
    } catch (error) {
        throw error;
    }
};

/**
 * API para verificar GPS y obtener reportes disponibles
 */
export const verificarGps = async (userDni: string, dniSocio: string): Promise<{ status: boolean; data?: SocioReporte[]; socio?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_verifica_gps`, {
            method: 'POST',
            headers: getCommonHeaders(),
            body: JSON.stringify({ user: userDni, dni_socio: dniSocio })
        });
        const socioData = await response.json();
        return socioData;
    } catch (error) {
        throw error;
    }
};

/**
 * API para preparar información del reporte y obtener datos incompletos
 */
export const prepareInfoReport = async (dniSocio: string): Promise<PrepareInfoReportResponse> => {
    try {
        
        const response = await fetch(`${API_BASE_URL}/prepare_info_report`, {
            method: 'POST',
            headers: {
                ...getCommonHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ DNI: dniSocio })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * API para actualizar datos incompletos del reporte
 */
export const updateReportData = async (
    datosCompletos: {[key: number]: ReporteInfoData},
    userDni: string,
    socioName: string,
    dniSocio: string
): Promise<{status: boolean, message: string}> => {
    try {
        // Convertir al formato requerido por la API - UN OBJETO único (no array)
        const primerItem = Object.values(datosCompletos)[0]; // Tomar solo el primer/único elemento
        
        const datosParaEnviar = {
            user: userDni,
            socio: socioName,
            dni_socio: dniSocio,
            tipo_ubicacion: primerItem.tipo_ubicacion,
            condicion_negocio: primerItem.condicion_negocio,
            suministro: primerItem.suministro,
            direccion: primerItem.direccion,
            ref_vehiculo: primerItem.ref_vehiculo,
            ref_paradero: primerItem.ref_paradero,
            ref_adicional: primerItem.ref_adicional
        };
        
        const response = await fetch(`${API_BASE_URL}/updateVerificador`, {
            method: 'POST',
            headers: {
                ...getCommonHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datosParaEnviar)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * Función helper para crear FormData con verificación de ubicación
 */
export const crearFormDataVerificacion = (
    verificacionData: VerificacionData,
    imagenes: { [key: string]: File | null }
): FormData => {
    const formDataWithFiles = new FormData();
    
    // Agrega los campos comunes
    Object.entries(verificacionData).forEach(([key, value]) => {
        formDataWithFiles.append(key, String(value || ''));
    });
    
    // Agrega los archivos de imágenes
    Object.entries(imagenes).forEach(([key, file]) => {
        if (file) {
            formDataWithFiles.append(key, file);
        }
    });
    
    return formDataWithFiles;
};

/** 
 * Función helper para abrir reporte en nueva ventana
 */
export const abrirReporte = (url: string) => {
    window.open(`${API_BASE_URL.replace(/\/api$/, '')}${url}`);
};

export default {
    cargarCoordenadas,
    verificarSocioReniec,
    verificarSuministro,
    comprobarSocioEnBD,
    verificarPreDesembolso,
    generarPdfGps,
    verificarGps,
    prepareInfoReport,
    updateReportData,
    crearFormDataVerificacion,
    abrirReporte
};