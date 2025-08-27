import { SessionManager } from '../utils/sessionManager';



export interface DatosReniec {
    "numero": string
    "nombres": string,
    "apellido_paterno": string,
    "apellido_materno": string,
    "nombre_completo": string,
    "departamento": string,
    "provincia": string,
    "distrito": string,
    "direccion": string,
    "direccion_completa": string,
    "ubigeo_reniec": string,
    "ubigeo_sunat": string
}

const apiUrl = import.meta.env.VITE_API_BASE_URL;
// configuracion de la api

export const fetchDatosReniec = async (dni: string) => {
    try{
        const token = SessionManager.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${apiUrl}/registro-clientes/renice/${dni}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            throw new Error(`Error al obtener datos de RENIEC: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data) {
            throw new Error(`Error al obtener datos de RENIEC: ${response.statusText}`);
        }
        return data

    }catch(error){

        throw new Error("Error al obtener datos de reniec");
    }
}