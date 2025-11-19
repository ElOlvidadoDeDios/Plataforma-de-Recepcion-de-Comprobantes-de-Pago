export interface desembolsosRealizados {
    DNI: string;
    CUENTA: string;
    RAZON_SOCIAL: string;
    PAGARE: string;
    OTORGA: string;
    MONTO_NETO: string;
    PRODUCTO: string;
    AGENCIA: string;
    RESPONSABLE: string;
    ENLACE: string;
    ENLACE_FIRM: string;
}

// Alias para compatibilidad (singular)
export type DesembolsoRealizado = desembolsosRealizados;

export interface responseDesembolsosRealizados {
    status: boolean;
    message: string;
    data: desembolsosRealizados[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
const API_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

export const fetchDesembolsosRealizados = async (FECHA: string): Promise<responseDesembolsosRealizados> => {
    try {
        // Validar variables de entorno
        if (!API_BASE_URL) {
            throw new Error('VITE_API_BASE_URL_GEODILE no está configurada');
        }
        if (!API_TOKEN) {
            throw new Error('VITE_API_BASE_URL_GEODILE_TOKEN no está configurada');
        }

        const url = `${API_BASE_URL}/api_app_dile_v1_1/api/listDesembolsoDigitalFecha`;
        

        const requestBody = { FECHA };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `${API_TOKEN}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' // Para ngrok si lo usas
            },
            body: JSON.stringify(requestBody)
        });

  

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        // Manejar diferentes estructuras de respuesta
        let desembolsos = [];
        if (data.data && Array.isArray(data.data)) {
            desembolsos = data.data;
        } else if (Array.isArray(data)) {
            desembolsos = data;
        } else if (data.desembolsos && Array.isArray(data.desembolsos)) {
            desembolsos = data.desembolsos;
        }

        return {
            status: true,
            message: 'Desembolsos recuperados exitosamente',
            data: desembolsos
        };
    } catch (error) {
        console.error('💥 Error en fetchDesembolsosRealizados:', error);
        return {
            status: false,
            message: 'Error al obtener desembolsos: ' + (error instanceof Error ? error.message : String(error)),
            data: []
        };
    }
};
